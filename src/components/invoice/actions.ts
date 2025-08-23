"use server"

import { db } from "@/lib/db"
import { auth, signOut } from "@/auth"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"
import { resend } from "@/components/invoice/email.config"
import { SendInvoiceEmail } from "@/components/invoice/SendInvoiceEmail"
import { format } from "date-fns"
import { InvoiceSchemaZod } from "./validation"
import { z } from "zod"

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
};

// Extended session type
type ExtendedSession = {
  user: ExtendedUser;
};

// Test function to check database connection and auth
export async function testInvoiceConnection() {
  try {
    const session = await auth() as ExtendedSession | null
    
    if (!session?.user?.id) {
      return { success: false, error: "No active session" }
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, schoolId: true }
    })
    
    if (!user) {
      return { success: false, error: "User not found in database" }
    }
    
    const schools = await db.school.findMany({
      select: { id: true, name: true }
    })
    
    return {
      success: true,
      data: {
        userId: user.id,
        userEmail: user.email,
        userSchoolId: user.schoolId,
        availableSchools: schools,
        sessionActive: true
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Database connection failed" 
    }
  }
}

// Function to associate user with a school by name
export async function associateUserWithSchool(schoolName: string) {
  try {
    const session = await auth() as ExtendedSession | null
    
    if (!session?.user?.id) {
      return { success: false, error: "No active session" }
    }
    
    const school = await db.school.findFirst({
      where: {
        name: {
          contains: schoolName,
          mode: 'insensitive'
        }
      },
      select: { id: true, name: true }
    })
    
    if (!school) {
      return { success: false, error: `School not found with name containing: ${schoolName}` }
    }
    
    await db.user.update({
      where: { id: session.user.id },
      data: { schoolId: school.id }
    })
    
    return { 
      success: true, 
      message: `Successfully associated with school: ${school.name}`,
      schoolId: school.id 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to associate with school" 
    }
  }
}

// Invoice CRUD
interface AddressData { name: string; email?: string; address1: string; address2?: string; address3?: string }
interface ItemData { item_name: string; quantity: number; price: number; total: number }
interface InvoiceFormData {
  invoice_no: string
  invoice_date: Date
  due_date: Date
  currency?: string
  from: AddressData
  to: AddressData
  items: ItemData[]
  sub_total: number
  discount?: number
  tax_percentage?: number
  total: number
  notes?: string
  status?: Status
}

// Generate unique invoice number for a school
// Format: I + 2-digit year + 3-digit sequence (e.g., I25001, I25002, etc.)
async function generateUniqueInvoiceNumber(schoolId: string, prefix: string = "I"): Promise<string> {
  const currentYear = new Date().getFullYear()
  const yearPrefix = currentYear.toString().slice(-2) // Last 2 digits of year
  
  // Find the highest invoice number for this school and year
  const latestInvoice = await db.userInvoice.findFirst({
    where: {
      schoolId: schoolId,
      invoice_no: {
        startsWith: `${prefix}${yearPrefix}`
      }
    },
    orderBy: {
      invoice_no: 'desc'
      }
    })

  if (!latestInvoice) {
    // First invoice for this school and year
    return `${prefix}${yearPrefix}001`
  }

  // Extract the numeric part and increment
  const numericPart = latestInvoice.invoice_no.replace(`${prefix}${yearPrefix}`, '')
  const nextNumber = parseInt(numericPart, 10) + 1
  
  // Format with leading zeros (e.g., 001, 002, etc.) - reduced from 4 to 3 digits
  return `${prefix}${yearPrefix}${nextNumber.toString().padStart(3, '0')}`
}

export async function createInvoice(data: z.infer<typeof InvoiceSchemaZod>) {
  try {
    const session = await auth() as ExtendedSession | null
    
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }
    
    const userId = session.user.id
    const schoolId = session.user.schoolId
    
    if (!userId || !schoolId) {
      throw new Error("Unauthorized - Missing userId or schoolId")
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, schoolId: true }
    })
    
    if (!user) {
      throw new Error("User not found")
    }
    
    if (!user.schoolId) {
      throw new Error("User not associated with any school. Please complete the school onboarding process first.")
    }

    // Check if invoice number already exists for this school
    const existingInvoice = await db.userInvoice.findFirst({
      where: {
        schoolId: schoolId,
        invoice_no: data.invoice_no
      }
    })

    if (existingInvoice) {
      throw new Error(`Invoice number "${data.invoice_no}" already exists. Please use a different invoice number.`)
    }
    
    // Create addresses first
    const fromAddress = await db.userInvoiceAddress.create({
      data: {
        name: data.from.name,
        email: data.from.email,
        address1: data.from.address1,
        address2: data.from.address2 || "",
        address3: data.from.address3 || "",
        schoolId: schoolId,
      },
    })
    
    const toAddress = await db.userInvoiceAddress.create({
      data: {
        name: data.to.name,
        email: data.to.email,
        address1: data.to.address1,
        address2: data.to.address2 || "",
        address3: data.to.address3 || "",
        schoolId: schoolId,
      },
    })
    
    // Create invoice
    const invoice = await db.userInvoice.create({
      data: {
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency,
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: data.sub_total,
        discount: data.discount,
        tax_percentage: data.tax_percentage,
        total: data.total,
        notes: data.notes || "",
        status: data.status,
        userId: userId,
        schoolId: schoolId,
        items: {
          create: data.items.map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            schoolId: schoolId,
          })),
        },
      },
      include: {
        items: true,
        from: true,
        to: true,
      },
    })
    
    return { success: true, data: invoice }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create invoice" }
  }
}

// Get next available invoice number for a school
export async function getNextInvoiceNumber() {
  try {
    const session = await auth() as ExtendedSession | null
    
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }
    
    const schoolId = session.user.schoolId
    
    if (!schoolId) {
      throw new Error("User not associated with any school")
    }

    const nextNumber = await generateUniqueInvoiceNumber(schoolId)
    return { success: true, data: nextNumber }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to get next invoice number" }
  }
}

// Create invoice with auto-generated invoice number
export async function createInvoiceWithAutoNumber(data: Omit<z.infer<typeof InvoiceSchemaZod>, 'invoice_no'>) {
  try {
    const session = await auth() as ExtendedSession | null
    
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }
    
    const userId = session.user.id
    const schoolId = session.user.schoolId
    
    if (!userId || !schoolId) {
      throw new Error("Unauthorized - Missing userId or schoolId")
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, schoolId: true }
    })
    
    if (!user) {
      throw new Error("User not found")
    }
    
    if (!user.schoolId) {
      throw new Error("User not associated with any school. Please complete the school onboarding process first.")
    }

    // Generate unique invoice number
    const autoInvoiceNo = await generateUniqueInvoiceNumber(schoolId)
    
    // Create addresses first
    const fromAddress = await db.userInvoiceAddress.create({
      data: {
        name: data.from.name,
        email: data.from.email,
        address1: data.from.address1,
        address2: data.from.address2 || "",
        address3: data.from.address3 || "",
        schoolId: schoolId,
      },
    })
    
    const toAddress = await db.userInvoiceAddress.create({
      data: {
        name: data.to.name,
        email: data.to.email,
        address1: data.to.address1,
        address2: data.to.address2 || "",
        address3: data.to.address3 || "",
        schoolId: schoolId,
      },
    })
    
    // Create invoice with auto-generated number
    const invoice = await db.userInvoice.create({
      data: {
        invoice_no: autoInvoiceNo,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency,
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: data.sub_total,
        discount: data.discount,
        total: data.total,
        notes: data.notes || "",
        status: data.status,
        userId: userId,
        schoolId: schoolId,
        items: {
          create: data.items.map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            schoolId: schoolId,
          })),
        },
      },
      include: {
        items: true,
        from: true,
        to: true,
      },
    })
    
    return { success: true, data: invoice }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create invoice" }
  }
}

export async function updateInvoice(id: string, data: InvoiceFormData) {
  try {
    const session = await auth() as ExtendedSession | null
    const userId = session?.user?.id
    const schoolId = session?.user?.schoolId
    if (!userId || !schoolId) throw new Error("Unauthorized")

    const invoice = await db.userInvoice.findFirst({ where: { id, userId, schoolId }, include: { items: true } })
    if (!invoice) throw new Error("Invoice not found or unauthorized")

    await Promise.all([
      db.userInvoiceAddress.update({ where: { id: invoice.fromAddressId }, data: { ...data.from, schoolId } }),
      db.userInvoiceAddress.update({ where: { id: invoice.toAddressId }, data: { ...data.to, schoolId } })
    ])

    await db.userInvoiceItem.deleteMany({ where: { invoiceId: id, schoolId } })

    const updatedInvoice = await db.userInvoice.update({
      where: { id },
      data: {
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency,
        sub_total: data.sub_total,
        discount: data.discount,
        tax_percentage: data.tax_percentage,
        total: data.total,
        notes: data.notes,
        status: data.status,
        items: { create: data.items.map((it) => ({ ...it, schoolId })) }
      },
      include: { items: true, from: true, to: true }
    })

    revalidatePath("/invoice")
    return { success: true, data: updatedInvoice }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update invoice" }
  }
}

export async function getInvoices(page: number = 1, limit: number = 5) {
  try {
    const session = await auth() as ExtendedSession | null
    const userId = session?.user?.id
    const schoolId = session?.user?.schoolId
    if (!userId || !schoolId) throw new Error("Unauthorized")

    const skip = (page - 1) * limit
    const [invoices, total] = await Promise.all([
      db.userInvoice.findMany({
        where: { userId, schoolId },
        include: { items: true, from: true, to: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.userInvoice.count({ where: { userId, schoolId } })
    ])

    return { success: true, data: invoices, pagination: { total, pages: Math.ceil(total / limit), page, limit } }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch invoices" }
  }
}

export async function getInvoicesWithFilters(searchParams: any) {
  try {
    const session = await auth() as ExtendedSession | null
    const userId = session?.user?.id
    const schoolId = session?.user?.schoolId
    if (!userId || !schoolId) throw new Error("Unauthorized")

    const { page = 1, perPage = 20, invoice_no = '', status = '', client_name = '', sort = [] } = searchParams

    const where: any = {
      userId,
      schoolId,
      ...(invoice_no ? { invoice_no: { contains: invoice_no, mode: 'insensitive' } } : {}),
      ...(status ? { status: status as any } : {}),
      ...(client_name ? { 
        to: { 
          name: { contains: client_name, mode: 'insensitive' } 
        } 
      } : {}),
    }

    const skip = (page - 1) * perPage
    const take = perPage
    const orderBy = (sort && Array.isArray(sort) && sort.length)
      ? sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ createdAt: 'desc' as const }]

    const [invoices, total] = await Promise.all([
      db.userInvoice.findMany({
        where,
        include: { to: true },
        orderBy,
        skip,
        take,
      }),
      db.userInvoice.count({ where })
    ])

    const data = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoice_no: invoice.invoice_no,
      client_name: invoice.to.name,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      due_date: invoice.due_date.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
    }))

    return { success: true, data, total }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch invoices", data: [], total: 0 }
  }
}

export async function getInvoiceById(id: string) {
  try {
    const session = await auth() as ExtendedSession | null
    const userId = session?.user?.id
    const schoolId = session?.user?.schoolId
    if (!userId || !schoolId) throw new Error("Unauthorized")

    const invoice = await db.userInvoice.findFirst({ where: { id, userId, schoolId }, include: { items: true, from: true, to: true } })
    if (!invoice) return { success: false, error: "Invoice not found" }
    return { success: true, data: invoice }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch invoice" }
  }
}

// Email
export async function sendInvoiceEmail(invoiceId: string, subject: string) {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, userId: session.user.id, schoolId: session.user.schoolId! },
      include: { items: true, from: true, to: true }
    })
    if (!invoice) return { success: false, error: "Invoice not found" }
    if (!invoice.to.email) return { success: false, error: "Client email not found" }

    const totalFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(invoice.total)
    const emailContent = SendInvoiceEmail({
      firstName: invoice.to.name,
      invoiceNo: invoice.invoice_no,
      dueDate: format(invoice.due_date, 'PPP'),
      total: totalFormatted,
      invoiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/paid/${invoice.id}`
    })

    const { error } = await resend.emails.send({ from: 'Invoice App <onboarding@resend.dev>', to: invoice.to.email, subject, react: emailContent })
    if (error) return { success: false, error: error.message || "Failed to send email" }
    return { success: true, message: "Email sent successfully" }
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

// Onboarding
interface UserUpdateData { firstName?: string; lastName?: string; currency?: string }

export async function updateUser(data: UserUpdateData) {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id) throw new Error("Unauthorized")

    const userData: any = {}
    if (data.firstName !== undefined) userData.firstName = data.firstName
    if (data.lastName !== undefined) userData.lastName = data.lastName
    if (data.currency !== undefined) userData.currency = data.currency

    const updatedUser = await db.user.update({ where: { id: session.user.id }, data: userData })
    return { success: true, data: updatedUser }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update user" }
  }
}

export async function getCurrentUser() {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id) return { success: false, error: "Unauthorized" }

    const user = await db.user.findUnique({ where: { id: session.user.id } })
    return { success: true, data: user }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch user" }
  }
}

// Settings
interface SignatureData { name?: string; image?: string }
interface SettingsFormData { invoiceLogo?: string; signature?: SignatureData }

export async function updateSettings(data: SettingsFormData) {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id) throw new Error("Unauthorized")

    const currentSettings = await db.userInvoiceSettings.findUnique({
      where: { userId: session.user.id },
      include: { signature: true }
    })

    if (currentSettings) {
      const updatedSettings = await db.userInvoiceSettings.update({
        where: { userId: session.user.id },
        data: {
          invoiceLogo: data.invoiceLogo,
          signature: data.signature ? {
            upsert: {
              create: { name: data.signature.name ?? "", image: data.signature.image ?? "", school: { connect: { id: session.user.schoolId! } } },
              update: { name: data.signature.name ?? "", image: data.signature.image ?? "" }
            }
          } : undefined
        },
        include: { signature: true }
      })
      return { success: true, data: updatedSettings }
    }

    const newSettings = await db.userInvoiceSettings.create({
      data: {
        userId: session.user.id,
        schoolId: session.user.schoolId!,
        invoiceLogo: data.invoiceLogo,
        signature: data.signature ? {
          create: { name: data.signature.name ?? "", image: data.signature.image ?? "", school: { connect: { id: session.user.schoolId! } } }
        } : undefined
      },
      include: { signature: true }
    })

    return { success: true, data: newSettings }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to update settings" }
  }
}

export async function getSettings() {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id) throw new Error("Unauthorized")

    const settings = await db.userInvoiceSettings.findUnique({
      where: { userId: session.user.id },
      include: { signature: true }
    })
    return { success: true, data: settings }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch settings" }
  }
}

// Dashboard
export async function getDashboardStats() {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id) throw new Error("Unauthorized")

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseWhere = {
      userId: session.user.id,
      schoolId: session.user.schoolId!,
      invoice_date: { gte: thirtyDaysAgo }
    } as const

    const [invoices, totalInvoices, paidInvoices, unpaidInvoices, recentInvoices] = await Promise.all([
      db.userInvoice.findMany({ where: baseWhere, select: { invoice_date: true, total: true, status: true } }),
      db.userInvoice.count({ where: baseWhere }),
      db.userInvoice.count({ where: { ...baseWhere, status: Status.PAID } }),
      db.userInvoice.count({ where: { ...baseWhere, status: Status.UNPAID } }),
      db.userInvoice.findMany({
        where: { userId: session.user.id, schoolId: session.user.schoolId! },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { from: true, to: true }
      })
    ])

    const totalRevenue = invoices.reduce((prev: number, curr: { total: number }) => prev + curr.total, 0)
    const chartData = invoices.map((invoice: { invoice_date: Date; total: number; status: Status }) => ({
      date: invoice.invoice_date.toISOString().split('T')[0],
      totalRevenue: invoice.total,
      paidRevenue: invoice.status === Status.PAID ? invoice.total : 0
    }))

    return { success: true, data: { totalRevenue, totalInvoices, paidInvoices, unpaidInvoices, recentInvoices, chartData } }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch dashboard stats" }
  }
}

// Delete invoice
export async function deleteInvoice({ id }: { id: string }) {
  try {
    const session = await auth() as ExtendedSession | null
    if (!session?.user?.id || !session.user.schoolId) {
      throw new Error("Unauthorized")
    }

    const invoice = await db.userInvoice.findFirst({
      where: { id, userId: session.user.id, schoolId: session.user.schoolId }
    })

    if (!invoice) {
      throw new Error("Invoice not found")
    }

    // Delete the invoice (cascade will delete related items and addresses)
    await db.userInvoice.delete({
      where: { id }
    })

    revalidatePath('/invoice')
    return { success: true }
  } catch (error) {
    console.error(error)
    throw new Error(error instanceof Error ? error.message : "Failed to delete invoice")
  }
}

// Auth
export async function logout() {
  await signOut()
}


