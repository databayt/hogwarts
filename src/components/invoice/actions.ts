"use server"

import { db } from "@/lib/db"
import { auth, signOut } from "@/auth"
import { revalidatePath } from "next/cache"
import { Status } from "@prisma/client"
import { resend } from "@/components/invoice/email.config"
import { SendInvoiceEmail } from "@/components/invoice/SendInvoiceEmail"
import { format } from "date-fns"

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

export async function createInvoice(data: InvoiceFormData) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const schoolId = session?.user?.schoolId
    if (!userId || !schoolId) throw new Error("Unauthorized")

    const [fromAddress, toAddress] = await Promise.all([
      db.userInvoiceAddress.create({ data: { ...data.from, schoolId } }),
      db.userInvoiceAddress.create({ data: { ...data.to, schoolId } })
    ])

    const invoice = await db.userInvoice.create({
      data: {
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        currency: data.currency || "USD",
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: data.sub_total,
        discount: data.discount,
        tax_percentage: data.tax_percentage,
        total: data.total,
        notes: data.notes,
        status: data.status || "UNPAID",
        userId,
        schoolId,
        items: { create: data.items.map((it) => ({ ...it, schoolId })) }
      },
      include: { items: true, from: true, to: true }
    })

    revalidatePath("/invoice")
    return { success: true, data: invoice }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to create invoice" }
  }
}

export async function updateInvoice(id: string, data: InvoiceFormData) {
  try {
    const session = await auth()
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
    const session = await auth()
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

export async function getInvoiceById(id: string) {
  try {
    const session = await auth()
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
    const session = await auth()
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
    const session = await auth()
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
    const session = await auth()
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
    const session = await auth()
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
    const session = await auth()
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
    const session = await auth()
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

// Auth
export async function logout() {
  await signOut()
}


