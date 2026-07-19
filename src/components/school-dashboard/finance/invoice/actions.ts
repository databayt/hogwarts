"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { InvoiceStatus } from "@prisma/client"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resend } from "@/components/school-dashboard/finance/invoice/email.config"
import { SendInvoiceEmail } from "@/components/school-dashboard/finance/invoice/send-invoice-email"
import { getText } from "@/components/translation/display"

import { isFinanceAuthError, requireFinanceActor } from "../guard"

// ============================================================================
// Types
// ============================================================================

interface InvoiceSearchParams {
  page?: number
  perPage?: number
  invoice_no?: string
  status?: string
  client_name?: string
  studentId?: string
  sort?: Array<{ id: string; desc: boolean }>
  /** Display locale — names stored in another lang are translated on-demand. */
  lang?: "ar" | "en"
}

interface SignatureData {
  name?: string
  image?: string
}

interface SettingsFormData {
  invoiceLogo?: string
  signature?: SignatureData
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Deliberate deviation from guard.ts's requireFinanceActor: invoice READS and
 * per-user settings are self-service — a STUDENT/GUARDIAN must reach their own
 * invoices (dashboard widget, own-invoice detail/PDF) even though
 * checkFinancePermission denies them the invoice module. Row scoping via
 * canSeeAllSchoolInvoices() is the authorization for these; every MUTATING
 * action below gates through requireFinanceActor instead.
 */
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

// Admin/accountant/staff/developer see all school invoices.
// Students/guardians only see their own (userId-scoped).
async function canSeeAllSchoolInvoices(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return (
    user?.role === "ADMIN" ||
    user?.role === "ACCOUNTANT" ||
    user?.role === "DEVELOPER" ||
    user?.role === "STAFF"
  )
}

// ============================================================================
// Invoice CRUD
// ============================================================================

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
      studentId = "",
      sort = [],
      lang = "ar",
    } = searchParams

    const canSeeAll = await canSeeAllSchoolInvoices(ctx.userId)

    const where = {
      schoolId: ctx.schoolId,
      wizardStep: null as null,
      ...(canSeeAll ? {} : { userId: ctx.userId }),
      ...(studentId && canSeeAll ? { userId: studentId } : {}),
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

    const [invoices, total, school] = await Promise.all([
      db.userInvoice.findMany({
        where,
        include: { to: true },
        orderBy,
        skip,
        take,
      }),
      db.userInvoice.count({ where }),
      // The school's preferred language is the proxy for `to.name`'s storage lang
      // (UserInvoiceAddress has no `lang` column; matches students/actions.ts).
      db.school.findUnique({
        where: { id: ctx.schoolId },
        select: { preferredLanguage: true },
      }),
    ])

    const storageLang = (school?.preferredLanguage as "ar" | "en") || "ar"

    // Dedupe client names so each unique name hits Google Translate at most once
    // per request (Translation covers subsequent requests).
    const uniqueNames = Array.from(new Set(invoices.map((i) => i.to.name)))
    const translations = new Map<string, string>(
      await Promise.all(
        uniqueNames.map(
          async (name) =>
            [
              name,
              await getText(name, storageLang, lang, ctx.schoolId),
            ] as const
        )
      )
    )

    const data = invoices.map((invoice) => ({
      id: invoice.id,
      invoice_no: invoice.invoice_no,
      client_name: translations.get(invoice.to.name) ?? invoice.to.name,
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

export async function getInvoiceById(
  id: string,
  lang?: string
): Promise<ActionResponse> {
  try {
    const ctx = await requireAuthAndTenant()
    if (isAuthError(ctx)) return ctx

    // INV-001: privileged roles see all school invoices; others only their own.
    const canSeeAll = await canSeeAllSchoolInvoices(ctx.userId)
    const where = canSeeAll
      ? { id, schoolId: ctx.schoolId }
      : { id, userId: ctx.userId, schoolId: ctx.schoolId }

    const invoice = await db.userInvoice.findFirst({
      where,
      include: { items: true, from: true, to: true },
    })
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    // Branding for the PDF: the school's logo is the default; the invoice
    // owner's per-user UserInvoiceSettings.invoiceLogo overrides it when set.
    // The PDF template renders data.schoolLogo when present. The buyer lookup
    // feeds the share dialog's WhatsApp channel (best-effort phone).
    const [settings, school, buyer] = await Promise.all([
      db.userInvoiceSettings.findUnique({
        where: { userId: invoice.userId },
        select: { invoiceLogo: true },
      }),
      db.school.findUnique({
        where: { id: ctx.schoolId },
        select: { logoUrl: true, name: true, email: true },
      }),
      db.user.findUnique({
        where: { id: invoice.userId },
        select: {
          student: { select: { mobileNumber: true } },
          guardian: {
            select: {
              phoneNumbers: { select: { phoneNumber: true }, take: 1 },
            },
          },
        },
      }),
    ])

    // INV-007 / spec item 6: linked fee payments when feeAssignmentId is set
    const linkedPayments = invoice.feeAssignmentId
      ? await db.payment.findMany({
          where: {
            feeAssignmentId: invoice.feeAssignmentId,
            schoolId: ctx.schoolId,
          },
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            currency: true,
            paymentDate: true,
            paymentMethod: true,
            status: true,
          },
          orderBy: { paymentDate: "asc" },
        })
      : []

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
        amountPaid: Number(invoice.amountPaid),
        sentAt: invoice.sentAt ?? null,
        schoolLogo: settings?.invoiceLogo ?? school?.logoUrl ?? null,
        schoolName: school?.name ?? null,
        schoolEmail: school?.email ?? null,
        recipientPhone:
          buyer?.student?.mobileNumber ??
          buyer?.guardian?.phoneNumbers[0]?.phoneNumber ??
          null,
        items: invoice.items.map((item) => ({
          ...item,
          price: Number(item.price),
          total: Number(item.total),
        })),
        linkedPayments: linkedPayments.map((p) => ({
          ...p,
          amount: Number(p.amount),
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
    const ctx = await requireFinanceActor("invoice", "delete")
    if (isFinanceAuthError(ctx)) return ctx

    // INV-001: privileged roles see all school invoices; others only their own.
    const canSeeAll = await canSeeAllSchoolInvoices(ctx.userId)
    const invoice = await db.userInvoice.findFirst({
      where: canSeeAll
        ? { id, schoolId: ctx.schoolId }
        : { id, userId: ctx.userId, schoolId: ctx.schoolId },
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
    const ctx = await requireFinanceActor("invoice", "export")
    if (isFinanceAuthError(ctx)) return ctx

    // INV-001: privileged roles see all school invoices; others only their own.
    const canSeeAll = await canSeeAllSchoolInvoices(ctx.userId)
    const [invoice, school] = await Promise.all([
      db.userInvoice.findFirst({
        where: canSeeAll
          ? { id: invoiceId, schoolId: ctx.schoolId }
          : { id: invoiceId, userId: ctx.userId, schoolId: ctx.schoolId },
        include: { items: true, from: true, to: true },
      }),
      db.school.findUnique({
        where: { id: ctx.schoolId },
        select: { preferredLanguage: true, logoUrl: true },
      }),
    ])
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)
    if (!invoice.to.email) return actionError(ACTION_ERRORS.NOT_FOUND)

    // Respect the school's preferred admin language so the invoice email
    // (numbers + dates) renders in the recipient's expected locale.
    const lang = school?.preferredLanguage === "ar" ? "ar" : "en"
    const bcp47 = lang === "ar" ? "ar-SA" : "en-US"
    const dateFnsLocale = lang === "ar" ? ar : enUS
    const currency = invoice.currency || "USD"
    const fmt = (n: number) =>
      new Intl.NumberFormat(bcp47, { style: "currency", currency }).format(n)

    // Branding: the school's logo is the default; the invoice owner's per-user
    // UserInvoiceSettings.invoiceLogo overrides it. Signature stays per-user
    // (keyed by userId, one-to-one relation).
    const settings = await db.userInvoiceSettings.findUnique({
      where: { userId: invoice.userId },
      include: { signature: true },
    })
    const logoUrl = settings?.invoiceLogo ?? school?.logoUrl ?? undefined

    const subTotal = Number(invoice.sub_total)
    const taxPct =
      invoice.tax_percentage != null ? Number(invoice.tax_percentage) : 0
    const discountAmt = invoice.discount != null ? Number(invoice.discount) : 0
    const amountPaid = Number(invoice.amountPaid ?? 0)
    const due = Number(invoice.total) - amountPaid

    // INV-005: client-facing path, no /s/. When the public share link is
    // enabled, prefer it — the recipient (a parent) can open and print it
    // without an account; otherwise fall back to the authed detail route.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
    const invoiceURL =
      invoice.isPublic && invoice.shareToken
        ? `${appUrl}/${lang}/invoice/${invoice.shareToken}`
        : `${appUrl}/${lang}/finance/invoice/invoice/view/${invoice.id}`

    const emailContent = SendInvoiceEmail({
      lang,
      schoolName: invoice.from?.name ?? "",
      logoUrl,
      recipientName: invoice.to.name,
      invoiceNo: invoice.invoice_no,
      dueDate: format(invoice.due_date, "PPP", { locale: dateFnsLocale }),
      items: invoice.items.map((it) => ({
        name: it.item_name,
        quantity: it.quantity,
        price: fmt(Number(it.price)),
        total: fmt(it.quantity * Number(it.price)),
      })),
      subtotal: fmt(subTotal),
      discount: discountAmt > 0 ? fmt(-discountAmt) : undefined,
      tax: taxPct > 0 ? fmt((subTotal * taxPct) / 100) : undefined,
      total: fmt(Number(invoice.total)),
      amountDue: amountPaid > 0 && due > 0 ? fmt(due) : undefined,
      invoiceURL,
      signatureName: settings?.signature?.name,
      signatureImage: settings?.signature?.image,
    })

    // INV-008: use platform sender from env, fall back to verified Resend domain.
    const from =
      process.env.EMAIL_FROM ?? "School Portal <noreply@school.databayt.org>"

    const { error } = await resend.emails.send({
      from,
      to: invoice.to.email,
      subject,
      react: emailContent,
    })
    if (error)
      return actionError(ACTION_ERRORS.EMAIL_SEND_FAILED, error.message)

    // Stamp sentAt so the detail view can show "Sent <date>".
    await db.userInvoice.update({
      where: { id: invoiceId, schoolId: ctx.schoolId },
      data: { sentAt: new Date() },
    })

    revalidatePath(`/s/${invoice.schoolId ?? ctx.schoolId}/finance/invoice`)
    return { success: true }
  } catch (error) {
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Record full payment of a UserInvoice and post it to the double-entry ledger.
 *
 * Sets amountPaid = total and status = PAID, then posts `postInvoicePayment`
 * (DR Cash / CR Accounts Receivable). Posting is fire-and-forget (mirrors fees
 * `recordPayment`) and idempotent by `sourceRecordId=invoiceId`, so re-marking a
 * paid invoice posts once. Partial recording (amountPaid &lt; total with a
 * per-payment ledger entry) is a follow-up: the ledger keys on the invoice id,
 * so partials need a per-payment reference.
 */
export async function markInvoicePaid(
  invoiceId: string
): Promise<ActionResponse> {
  try {
    const ctx = await requireFinanceActor("invoice", "edit")
    if (isFinanceAuthError(ctx)) return ctx

    const canSeeAll = await canSeeAllSchoolInvoices(ctx.userId)
    const invoice = await db.userInvoice.findFirst({
      where: canSeeAll
        ? { id: invoiceId, schoolId: ctx.schoolId }
        : { id: invoiceId, userId: ctx.userId, schoolId: ctx.schoolId },
      select: {
        id: true,
        invoice_no: true,
        total: true,
        amountPaid: true,
        status: true,
        schoolId: true,
      },
    })
    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    const paidAt = new Date()
    // Read the balance-due and flip in ONE transaction so the amount posted to
    // the ledger reflects the balance that existed at the moment of the write.
    // Computing `remaining` from the earlier (pre-permission-check) snapshot was
    // racy: a concurrent webhook partial-payment (amountPaid + PARTIAL) landing
    // in between would make us over-post the already-collected amount to accounts
    // receivable. Re-reading amountPaid inside the transaction collapses that
    // window. Only the winner of a concurrent double-submit flips the row
    // (count 1); losers — and already-PAID/CANCELLED invoices — match no row.
    const flip = await db.$transaction(async (tx) => {
      const fresh = await tx.userInvoice.findFirst({
        where: canSeeAll
          ? { id: invoiceId, schoolId: ctx.schoolId }
          : { id: invoiceId, userId: ctx.userId, schoolId: ctx.schoolId },
        select: { total: true, amountPaid: true, status: true },
      })
      if (!fresh || fresh.status === "PAID" || fresh.status === "CANCELLED") {
        return null
      }
      const freshTotal = Number(fresh.total)
      const freshRemaining = freshTotal - Number(fresh.amountPaid ?? 0)
      if (freshRemaining <= 0) return null
      const flipped = await tx.userInvoice.updateMany({
        where: {
          id: invoiceId,
          schoolId: ctx.schoolId,
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        data: { amountPaid: freshTotal, status: "PAID" },
      })
      if (flipped.count === 0) return null
      return { remaining: freshRemaining }
    })
    if (!flip) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    const remaining = flip.remaining

    // Post the amount actually collected now (the remaining balance) to the
    // double-entry ledger (DR cash / CR accounts receivable). Non-fatal.
    try {
      const { postInvoicePayment } = await import("../lib/accounting/actions")
      const postResult = await postInvoicePayment(ctx.schoolId, {
        invoiceId: invoice.id,
        amount: remaining,
        paymentDate: paidAt,
        invoiceNumber: invoice.invoice_no,
      })
      if (!postResult.success) {
        console.error(
          "[markInvoicePaid] postInvoicePayment failed:",
          postResult.errors
        )
      }
    } catch (postingErr) {
      console.error(
        "[markInvoicePaid] Ledger posting threw (continuing):",
        postingErr
      )
    }

    revalidatePath(`/s/${invoice.schoolId ?? ctx.schoolId}/finance/invoice`)
    return { success: true }
  } catch {
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

    // INV-004: privileged roles see school-wide stats; others see only their own.
    const canSeeAll = await canSeeAllSchoolInvoices(ctx.userId)
    const userScope = canSeeAll ? {} : { userId: ctx.userId }

    const baseWhere = {
      ...userScope,
      schoolId: ctx.schoolId,
      invoice_date: { gte: thirtyDaysAgo },
    }

    const recentWhere = {
      ...userScope,
      schoolId: ctx.schoolId,
    }

    const [
      invoices,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      recentInvoices,
      school,
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
        where: recentWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { from: true, to: true },
      }),
      db.school.findUnique({
        where: { id: ctx.schoolId },
        select: { currency: true },
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
        currency: school?.currency ?? "USD",
      },
    }
  } catch (error) {
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
