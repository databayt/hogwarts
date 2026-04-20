"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { InvoiceStatus } from "@prisma/client"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resend } from "@/components/school-dashboard/finance/invoice/email.config"
import { SendInvoiceEmail } from "@/components/school-dashboard/finance/invoice/send-invoice-email"

import { checkCurrentUserPermission } from "../lib/permissions"
import { InvoiceSchemaZod } from "./validation"

// ============================================================================
// Types
// ============================================================================

interface AddressData {
  name: string
  email?: string
  address1: string
  address2?: string
  address3?: string
}

interface ItemData {
  item_name: string
  quantity: number
  price: number
  total: number
}

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
  status?: InvoiceStatus
}

interface InvoiceSearchParams {
  page?: number
  perPage?: number
  invoice_no?: string
  status?: string
  client_name?: string
  sort?: Array<{ id: string; desc: boolean }>
}

interface SignatureData {
  name?: string
  image?: string
}

interface SettingsFormData {
  invoiceLogo?: string
  signature?: SignatureData
}

interface EnrollmentFeeItem {
  name: string
  amount: number
}

// ============================================================================
// Helpers
// ============================================================================

async function requireAuthAndTenant(): Promise<
  { userId: string; schoolId: string } | ActionResponse<never>
> {
  const session = await auth()
  if (!session?.user?.id) {
    return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return actionError(ACTION_ERRORS.MISSING_SCHOOL)
  }
  return { userId: session.user.id, schoolId }
}

function isAuthError(
  result: { userId: string; schoolId: string } | ActionResponse<never>
): result is ActionResponse<never> {
  return "success" in result && result.success === false
}

// Generate unique invoice number for a school
// Format: prefix + 2-digit year + 3-digit sequence (e.g., I25001, I25002)
// Accepts optional transaction client for atomicity (prevents race conditions)
async function generateUniqueInvoiceNumber(
  schoolId: string,
  prefix: string = "I",
  client: Pick<typeof db, "userInvoice"> = db
): Promise<string> {
  const currentYear = new Date().getFullYear()
  const yearPrefix = currentYear.toString().slice(-2)

  const latestInvoice = await client.userInvoice.findFirst({
    where: {
      schoolId,
      invoice_no: { startsWith: `${prefix}${yearPrefix}` },
    },
    orderBy: { invoice_no: "desc" },
  })

  if (!latestInvoice) {
    return `${prefix}${yearPrefix}001`
  }

  const numericPart = latestInvoice.invoice_no.replace(
    `${prefix}${yearPrefix}`,
    ""
  )
  const nextNumber = parseInt(numericPart, 10) + 1
  return `${prefix}${yearPrefix}${nextNumber.toString().padStart(3, "0")}`
}

// Shared invoice creation logic used by createInvoice and createInvoiceWithAutoNumber
async function createInvoiceCore(
  userId: string,
  schoolId: string,
  invoiceNo: string,
  data: Omit<z.infer<typeof InvoiceSchemaZod>, "invoice_no">
): Promise<ActionResponse> {
  return db.$transaction(async (tx) => {
    // Check for duplicate invoice number
    const existing = await tx.userInvoice.findFirst({
      where: { schoolId, invoice_no: invoiceNo },
    })
    if (existing) {
      return actionError(ACTION_ERRORS.INVOICE_DUPLICATE_NUMBER, invoiceNo)
    }

    const fromAddress = await tx.userInvoiceAddress.create({
      data: {
        name: data.from.name,
        email: data.from.email,
        address1: data.from.address1,
        address2: data.from.address2 || "",
        address3: data.from.address3 || "",
        schoolId,
      },
    })

    const toAddress = await tx.userInvoiceAddress.create({
      data: {
        name: data.to.name,
        email: data.to.email,
        address1: data.to.address1,
        address2: data.to.address2 || "",
        address3: data.to.address3 || "",
        schoolId,
      },
    })

    const invoice = await tx.userInvoice.create({
      data: {
        invoice_no: invoiceNo,
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
        userId,
        schoolId,
        items: {
          create: data.items.map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            schoolId,
          })),
        },
      },
      include: { items: true, from: true, to: true },
    })

    return { success: true, data: invoice }
  })
}

// ============================================================================
// Invoice CRUD
// ============================================================================

export async function createInvoice(
  data: z.infer<typeof InvoiceSchemaZod>
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const canCreate = await checkCurrentUserPermission(
      ctx.schoolId,
      "invoice",
      "create"
    )
    if (!canCreate) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const result = await createInvoiceCore(
      ctx.userId,
      ctx.schoolId,
      data.invoice_no,
      data
    )

    if (result.success) revalidatePath("/finance/invoice")
    return result
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    }
  }
}

export async function getNextInvoiceNumber(): Promise<ActionResponse<string>> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const nextNumber = await generateUniqueInvoiceNumber(ctx.schoolId)
    return { success: true, data: nextNumber }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get next invoice number",
    }
  }
}

export async function createInvoiceWithAutoNumber(
  data: Omit<z.infer<typeof InvoiceSchemaZod>, "invoice_no">
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const canCreate = await checkCurrentUserPermission(
      ctx.schoolId,
      "invoice",
      "create"
    )
    if (!canCreate) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    // Generate number inside transaction to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      const autoInvoiceNo = await generateUniqueInvoiceNumber(
        ctx.schoolId,
        "I",
        tx
      )

      const fromAddress = await tx.userInvoiceAddress.create({
        data: {
          name: data.from.name,
          email: data.from.email,
          address1: data.from.address1,
          address2: data.from.address2 || "",
          address3: data.from.address3 || "",
          schoolId: ctx.schoolId,
        },
      })

      const toAddress = await tx.userInvoiceAddress.create({
        data: {
          name: data.to.name,
          email: data.to.email,
          address1: data.to.address1,
          address2: data.to.address2 || "",
          address3: data.to.address3 || "",
          schoolId: ctx.schoolId,
        },
      })

      const invoice = await tx.userInvoice.create({
        data: {
          invoice_no: autoInvoiceNo,
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
          userId: ctx.userId,
          schoolId: ctx.schoolId,
          items: {
            create: data.items.map((item) => ({
              item_name: item.item_name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              schoolId: ctx.schoolId,
            })),
          },
        },
        include: { items: true, from: true, to: true },
      })

      return { success: true as const, data: invoice }
    })

    if (result.success) revalidatePath("/finance/invoice")
    return result
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    }
  }
}

export async function updateInvoice(
  id: string,
  data: InvoiceFormData
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const canEdit = await checkCurrentUserPermission(
      ctx.schoolId,
      "invoice",
      "edit"
    )
    if (!canEdit) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const invoice = await db.userInvoice.findFirst({
      where: { id, userId: ctx.userId, schoolId: ctx.schoolId },
      include: { items: true },
    })
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    const updatedInvoice = await db.$transaction(async (tx) => {
      await Promise.all([
        tx.userInvoiceAddress.update({
          where: { id: invoice.fromAddressId },
          data: { ...data.from, schoolId: ctx.schoolId },
        }),
        tx.userInvoiceAddress.update({
          where: { id: invoice.toAddressId },
          data: { ...data.to, schoolId: ctx.schoolId },
        }),
      ])

      await tx.userInvoiceItem.deleteMany({
        where: { invoiceId: id, schoolId: ctx.schoolId },
      })

      return tx.userInvoice.update({
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
          items: {
            create: data.items.map((it) => ({ ...it, schoolId: ctx.schoolId })),
          },
        },
        include: { items: true, from: true, to: true },
      })
    })

    revalidatePath("/finance/invoice")
    return { success: true, data: updatedInvoice }
  } catch (error) {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function getInvoices(
  page: number = 1,
  limit: number = 5
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const skip = (page - 1) * limit
    const [invoices, total] = await Promise.all([
      db.userInvoice.findMany({
        where: {
          userId: ctx.userId,
          schoolId: ctx.schoolId,
          wizardStep: null,
        },
        include: { items: true, from: true, to: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.userInvoice.count({
        where: {
          userId: ctx.userId,
          schoolId: ctx.schoolId,
          wizardStep: null,
        },
      }),
    ])

    return {
      success: true,
      data: invoices,
      pagination: { total, pages: Math.ceil(total / limit), page, limit },
    } as ActionResponse & {
      pagination: { total: number; pages: number; page: number; limit: number }
    }
  } catch (error) {
    return actionError(ACTION_ERRORS.INVOICE_CREATE_FAILED)
  }
}

export async function getInvoicesWithFilters(
  searchParams: InvoiceSearchParams
): Promise<ActionResponse & { total?: number }> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const {
      page = 1,
      perPage = 20,
      invoice_no = "",
      status = "",
      client_name = "",
      sort = [],
    } = searchParams

    const where = {
      userId: ctx.userId,
      schoolId: ctx.schoolId,
      wizardStep: null as null,
      ...(invoice_no
        ? {
            invoice_no: {
              contains: invoice_no,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(status ? { status: status as InvoiceStatus } : {}),
      ...(client_name
        ? {
            to: {
              name: { contains: client_name, mode: "insensitive" as const },
            },
          }
        : {}),
    }

    const skip = (page - 1) * perPage
    const take = perPage
    const orderBy =
      sort && Array.isArray(sort) && sort.length
        ? sort.map((s) => ({
            [s.id]: s.desc ? ("desc" as const) : ("asc" as const),
          }))
        : [{ createdAt: "desc" as const }]

    const [invoices, total] = await Promise.all([
      db.userInvoice.findMany({
        where,
        include: { to: true },
        orderBy,
        skip,
        take,
      }),
      db.userInvoice.count({ where }),
    ])

    const data = invoices.map((invoice) => ({
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
    return {
      ...actionError(ACTION_ERRORS.INVOICE_FETCH_FAILED),
      data: [],
      total: 0,
    }
  }
}

export async function getInvoiceById(id: string): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const invoice = await db.userInvoice.findFirst({
      where: { id, userId: ctx.userId, schoolId: ctx.schoolId },
      include: { items: true, from: true, to: true },
    })
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    return {
      success: true,
      data: {
        ...invoice,
        sub_total: Number(invoice.sub_total),
        discount: invoice.discount != null ? Number(invoice.discount) : null,
        tax_percentage:
          invoice.tax_percentage != null
            ? Number(invoice.tax_percentage)
            : null,
        total: Number(invoice.total),
        items: invoice.items.map((item) => ({
          ...item,
          price: Number(item.price),
          total: Number(item.total),
        })),
      },
    }
  } catch (error) {
    return actionError(ACTION_ERRORS.INVOICE_CREATE_FAILED)
  }
}

export async function deleteInvoice({
  id,
}: {
  id: string
}): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const canDelete = await checkCurrentUserPermission(
      ctx.schoolId,
      "invoice",
      "delete"
    )
    if (!canDelete) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const invoice = await db.userInvoice.findFirst({
      where: { id, userId: ctx.userId, schoolId: ctx.schoolId },
      select: { id: true, fromAddressId: true, toAddressId: true },
    })
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    // Items cascade-delete via schema, but addresses become orphans without cleanup
    await db.$transaction(async (tx) => {
      await tx.userInvoice.delete({ where: { id } })
      await tx.userInvoiceAddress.deleteMany({
        where: {
          id: { in: [invoice.fromAddressId, invoice.toAddressId] },
          schoolId: ctx.schoolId,
        },
      })
    })

    revalidatePath("/finance/invoice")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete invoice",
    }
  }
}

// ============================================================================
// Email
// ============================================================================

export async function sendInvoiceEmail(
  invoiceId: string,
  subject: string
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const canExport = await checkCurrentUserPermission(
      ctx.schoolId,
      "invoice",
      "export"
    )
    if (!canExport) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const [invoice, school] = await Promise.all([
      db.userInvoice.findFirst({
        where: { id: invoiceId, userId: ctx.userId, schoolId: ctx.schoolId },
        include: { items: true, from: true, to: true },
      }),
      db.school.findUnique({
        where: { id: ctx.schoolId },
        select: { preferredLanguage: true },
      }),
    ])
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)
    if (!invoice.to.email) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Respect the school's preferred admin language so the invoice email
    // (numbers + dates) renders in the recipient's expected locale.
    const lang = school?.preferredLanguage === "ar" ? "ar" : "en"
    const bcp47 = lang === "ar" ? "ar-SA" : "en-US"
    const dateFnsLocale = lang === "ar" ? ar : enUS

    const totalFormatted = new Intl.NumberFormat(bcp47, {
      style: "currency",
      currency: invoice.currency || "USD",
    }).format(Number(invoice.total))

    const emailContent = SendInvoiceEmail({
      firstName: invoice.to.name,
      invoiceNo: invoice.invoice_no,
      dueDate: format(invoice.due_date, "PPP", { locale: dateFnsLocale }),
      total: totalFormatted,
      invoiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/paid/${invoice.id}`,
    })

    const { error } = await resend.emails.send({
      from: "Invoice <onboarding@resend.dev>",
      to: invoice.to.email,
      subject,
      react: emailContent,
    })
    if (error)
      return actionError(ACTION_ERRORS.EMAIL_SEND_FAILED, error.message)

    return { success: true }
  } catch (error) {
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

// ============================================================================
// User Profile (used by onboarding + user-edit-profile)
// ============================================================================

interface UserUpdateData {
  firstName?: string
  lastName?: string
  currency?: string
}

export async function updateUser(
  data: UserUpdateData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const userData: Record<string, string> = {}
    if (data.firstName !== undefined) userData.firstName = data.firstName
    if (data.lastName !== undefined) userData.lastName = data.lastName
    if (data.currency !== undefined) userData.currency = data.currency

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: userData,
    })
    return { success: true, data: updatedUser }
  } catch (error) {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// ============================================================================
// Settings
// ============================================================================

export async function updateSettings(
  data: SettingsFormData
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const currentSettings = await db.userInvoiceSettings.findUnique({
      where: { userId: ctx.userId },
      include: { signature: true },
    })

    if (currentSettings) {
      const updatedSettings = await db.userInvoiceSettings.update({
        where: { userId: ctx.userId },
        data: {
          invoiceLogo: data.invoiceLogo,
          signature: data.signature
            ? {
                upsert: {
                  create: {
                    name: data.signature.name ?? "",
                    image: data.signature.image ?? "",
                    school: { connect: { id: ctx.schoolId } },
                  },
                  update: {
                    name: data.signature.name ?? "",
                    image: data.signature.image ?? "",
                  },
                },
              }
            : undefined,
        },
        include: { signature: true },
      })
      return { success: true, data: updatedSettings }
    }

    const newSettings = await db.userInvoiceSettings.create({
      data: {
        userId: ctx.userId,
        schoolId: ctx.schoolId,
        invoiceLogo: data.invoiceLogo,
        signature: data.signature
          ? {
              create: {
                name: data.signature.name ?? "",
                image: data.signature.image ?? "",
                school: { connect: { id: ctx.schoolId } },
              },
            }
          : undefined,
      },
      include: { signature: true },
    })

    return { success: true, data: newSettings }
  } catch (error) {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function getSettings(): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const settings = await db.userInvoiceSettings.findUnique({
      where: { userId: ctx.userId },
      include: { signature: true },
    })
    return { success: true, data: settings }
  } catch (error) {
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

// ============================================================================
// Dashboard
// ============================================================================

export async function getDashboardStats(): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseWhere = {
      userId: ctx.userId,
      schoolId: ctx.schoolId,
      invoice_date: { gte: thirtyDaysAgo },
    } as const

    const [
      invoices,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      recentInvoices,
    ] = await Promise.all([
      db.userInvoice.findMany({
        where: baseWhere,
        select: { invoice_date: true, total: true, status: true },
      }),
      db.userInvoice.count({ where: baseWhere }),
      db.userInvoice.count({
        where: { ...baseWhere, status: InvoiceStatus.PAID },
      }),
      db.userInvoice.count({
        where: { ...baseWhere, status: InvoiceStatus.UNPAID },
      }),
      db.userInvoice.findMany({
        where: { userId: ctx.userId, schoolId: ctx.schoolId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { from: true, to: true },
      }),
    ])

    const totalRevenue = invoices.reduce(
      (prev: number, curr) => prev + Number(curr.total),
      0
    )
    const chartData = invoices.map((invoice) => ({
      date: invoice.invoice_date.toISOString().split("T")[0],
      totalRevenue: Number(invoice.total),
      paidRevenue:
        invoice.status === InvoiceStatus.PAID ? Number(invoice.total) : 0,
    }))

    return {
      success: true,
      data: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        recentInvoices,
        chartData,
      },
    }
  } catch (error) {
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

// ============================================================================
// Enrollment Invoice Generation (called from admission actions)
// ============================================================================

/**
 * Create an invoice from enrollment fee assignments.
 * Called by confirmEnrollment() — does NOT require auth (runs within the enrollment transaction context).
 */
export async function createInvoiceFromEnrollment(params: {
  schoolId: string
  userId: string
  studentName: string
  studentEmail: string
  schoolName: string
  schoolAddress: string
  currency: string
  items: EnrollmentFeeItem[]
  dueDate?: Date
  feeAssignmentId?: string
  tx?: Parameters<Parameters<typeof db.$transaction>[0]>[0]
}): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const {
      schoolId,
      userId,
      studentName,
      studentEmail,
      schoolName,
      schoolAddress,
      currency,
      items,
      tx,
    } = params

    if (items.length === 0) {
      return { success: true }
    }

    const invoiceNumber = await generateUniqueInvoiceNumber(schoolId, "ENR")
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0)
    const dueDate =
      params.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // If a transaction client is provided, use it directly (caller manages atomicity).
    // Otherwise, create our own transaction.
    const createInvoice = async (
      client: Pick<typeof db, "userInvoiceAddress" | "userInvoice">
    ) => {
      const fromAddress = await client.userInvoiceAddress.create({
        data: {
          name: schoolName,
          address1: schoolAddress || "School Address",
          schoolId,
        },
      })

      const toAddress = await client.userInvoiceAddress.create({
        data: {
          name: studentName,
          email: studentEmail,
          address1: "Student",
          schoolId,
        },
      })

      return client.userInvoice.create({
        data: {
          invoice_no: invoiceNumber,
          invoice_date: new Date(),
          due_date: dueDate,
          currency,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          sub_total: subTotal,
          total: subTotal,
          status: "UNPAID",
          userId,
          schoolId,
          feeAssignmentId: params.feeAssignmentId || null,
          notes: "Auto-generated from enrollment",
          items: {
            create: items.map((item) => ({
              item_name: item.name,
              quantity: 1,
              price: item.amount,
              total: item.amount,
              schoolId,
            })),
          },
        },
      })
    }

    const invoice = tx
      ? await createInvoice(tx)
      : await db.$transaction((txClient) => createInvoice(txClient))

    return { success: true, invoiceId: invoice.id }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    }
  }
}
