// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Fee Due Soon Reminders
 *
 * Sends reminders for:
 *  A) FeeAssignments / UserInvoices with a due date within the next 7 days
 *     (not yet PAID or CANCELLED).
 *  B) Applications with status SELECTED and an offerExpiryDate within 3 days.
 *
 * TRIGGER: Daily at 8:00 AM (0 8 * * *)
 * Path:    /api/cron/fee-due
 *
 * AUTH: Bearer CRON_SECRET (same pattern as fee-overdue).
 *
 * IDEMPOTENCY: Before dispatching, check whether a `fee_due` notification for
 * the same (feeAssignmentId, calendar day) already exists. For offer expiry,
 * check for a `system_alert` with matching (applicationId, day). This prevents
 * double-sending when the cron fires more than once in a day.
 *
 * TARGETING:
 *  - FeeAssignment  → student userId + guardian userIds (same helper as fee-overdue)
 *  - UserInvoice    → invoice.userId directly (already the payer)
 *  - Offer expiry   → application.userId if set; directEmail fallback to
 *                     application.email for guest applicants (BUG-3 support).
 */

import { NextRequest, NextResponse } from "next/server"

import { verifyCronSecret } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

// ── Constants ────────────────────────────────────────────────────────────────

/** Fee assignments due within this many days trigger a reminder. */
const FEE_DUE_WINDOW_DAYS = 7

/** Offer expiry reminders fire when expiry is within this many days. */
const OFFER_EXPIRY_WINDOW_DAYS = 3

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the calendar-day string (YYYY-MM-DD) for a Date.
 * Used as the idempotency key suffix so the same reminder is only sent once
 * per day per entity.
 */
function calendarDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Build the start-of-day and end-of-day boundaries for today (UTC).
 * Notifications created within this window are considered "already sent today".
 */
function todayBounds(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}

/**
 * Cached school language lookup (per cron run).
 */
async function getSchoolLang(
  schoolId: string,
  cache: Map<string, string>
): Promise<string> {
  if (cache.has(schoolId)) return cache.get(schoolId)!
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const lang = school?.preferredLanguage ?? "ar"
  cache.set(schoolId, lang)
  return lang
}

/**
 * Resolve student + guardian userIds for a given studentId.
 * Reuses the same resolution logic as fee-overdue.
 */
async function getRecipientIds(studentId: string): Promise<string[]> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      userId: true,
      studentGuardians: {
        select: { guardian: { select: { userId: true } } },
      },
    },
  })
  if (!student) return []
  const ids: string[] = []
  if (student.userId) ids.push(student.userId)
  for (const sg of student.studentGuardians) {
    if (sg.guardian.userId) ids.push(sg.guardian.userId)
  }
  return ids
}

/**
 * Check idempotency: has a fee_due notification already been dispatched today
 * for this feeAssignmentId?
 */
async function feeDueAlreadySentToday(
  schoolId: string,
  feeAssignmentId: string,
  todayStart: Date,
  todayEnd: Date
): Promise<boolean> {
  const existing = await db.notification.findFirst({
    where: {
      schoolId,
      type: "fee_due",
      createdAt: { gte: todayStart, lte: todayEnd },
      metadata: { path: ["feeAssignmentId"], equals: feeAssignmentId },
    },
    select: { id: true },
  })
  return !!existing
}

/**
 * Check idempotency: has an offer-expiry alert already been sent today
 * for this applicationId?
 */
async function offerExpiryAlreadySentToday(
  schoolId: string,
  applicationId: string,
  todayStart: Date,
  todayEnd: Date
): Promise<boolean> {
  const existing = await db.notification.findFirst({
    where: {
      schoolId,
      type: "system_alert",
      createdAt: { gte: todayStart, lte: todayEnd },
      metadata: {
        path: ["applicationId"],
        equals: applicationId,
      },
    },
    select: { id: true },
  })
  return !!existing
}

// ── Per-school processor ──────────────────────────────────────────────────────

interface SchoolCounts {
  feeAssignmentReminders: number
  invoiceReminders: number
  offerExpiryReminders: number
  offersExpired: number
  notificationsCreated: number
}

async function processSchool(
  schoolId: string,
  now: Date,
  windowEnd: Date,
  offerWindowEnd: Date,
  todayStart: Date,
  todayEnd: Date,
  schoolLangCache: Map<string, string>
): Promise<SchoolCounts> {
  const lang = await getSchoolLang(schoolId, schoolLangCache)
  const isAr = lang === "ar"

  let feeAssignmentReminders = 0
  let invoiceReminders = 0
  let offerExpiryReminders = 0
  let offersExpired = 0
  let notificationsCreated = 0

  // ── A1: FeeAssignments due within the window ──────────────────────────────
  // We check the feeStructure.paymentSchedule JSON for upcoming dueDate entries.
  // PENDING and PARTIAL statuses are eligible (PAID/CANCELLED/OVERDUE are not).
  const feeAssignments = await db.feeAssignment.findMany({
    where: {
      schoolId,
      status: { in: ["PENDING", "PARTIAL"] },
    },
    select: {
      id: true,
      studentId: true,
      finalAmount: true,
      feeStructure: {
        select: {
          name: true,
          paymentSchedule: true,
        },
      },
    },
  })

  for (const assignment of feeAssignments) {
    // Find any schedule entry whose dueDate falls in [now, windowEnd].
    const schedule = assignment.feeStructure.paymentSchedule
    if (!Array.isArray(schedule)) continue
    const hasDueSoon = (schedule as Array<{ dueDate?: string }>).some(
      (entry) => {
        if (!entry?.dueDate) return false
        const d = new Date(entry.dueDate)
        return d >= now && d <= windowEnd
      }
    )
    if (!hasDueSoon) continue

    // Idempotency check.
    if (
      await feeDueAlreadySentToday(
        schoolId,
        assignment.id,
        todayStart,
        todayEnd
      )
    )
      continue

    feeAssignmentReminders++

    const recipientIds = await getRecipientIds(assignment.studentId)
    const amount = assignment.finalAmount.toString()
    const feeName = assignment.feeStructure.name

    for (const userId of recipientIds) {
      const result = await dispatchNotification({
        schoolId,
        userId,
        type: "fee_due",
        title: isAr ? "تذكير: رسوم مستحقة قريباً" : "Reminder: Fee Due Soon",
        body: isAr
          ? `دفعة ${amount} لـ "${feeName}" مستحقة خلال ${FEE_DUE_WINDOW_DAYS} أيام.`
          : `Fee payment of ${amount} for "${feeName}" is due within ${FEE_DUE_WINDOW_DAYS} days.`,
        priority: "high",
        channels: ["in_app", "email"],
        lang,
        metadata: {
          feeAssignmentId: assignment.id,
          url: "/finance/fees",
        },
      })
      if (result) notificationsCreated++
    }
  }

  // ── A2: UserInvoices due within the window ────────────────────────────────
  // Scoped by schoolId; targets the invoice's direct userId (the payer).
  const dueInvoices = await db.userInvoice.findMany({
    where: {
      schoolId,
      status: { in: ["UNPAID", "PARTIAL"] },
      due_date: { gte: now, lte: windowEnd },
    },
    select: {
      id: true,
      invoice_no: true,
      due_date: true,
      total: true,
      userId: true,
      feeAssignmentId: true,
    },
  })

  for (const invoice of dueInvoices) {
    // Skip invoices that belong to a FeeAssignment already handled above
    // (to avoid double-notifying the same student).
    if (invoice.feeAssignmentId) {
      const alreadyHandled = feeAssignments.some(
        (fa) => fa.id === invoice.feeAssignmentId
      )
      if (alreadyHandled) continue
    }

    // Idempotency: use the invoice id as the entity key in metadata.
    const existingToday = await db.notification.findFirst({
      where: {
        schoolId,
        type: "fee_due",
        createdAt: { gte: todayStart, lte: todayEnd },
        metadata: { path: ["invoiceId"], equals: invoice.id },
      },
      select: { id: true },
    })
    if (existingToday) continue

    invoiceReminders++

    const daysUntilDue = Math.ceil(
      (invoice.due_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const amount = invoice.total.toString()

    const result = await dispatchNotification({
      schoolId,
      userId: invoice.userId,
      type: "fee_due",
      title: isAr
        ? "تذكير: فاتورة مستحقة قريباً"
        : "Reminder: Invoice Due Soon",
      body: isAr
        ? `فاتورة رقم ${invoice.invoice_no} بمبلغ ${amount} مستحقة خلال ${daysUntilDue} يوم.`
        : `Invoice #${invoice.invoice_no} for ${amount} is due in ${daysUntilDue} day(s).`,
      priority: "high",
      channels: ["in_app", "email"],
      lang,
      metadata: {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoice_no,
        url: "/finance/invoice",
      },
    })
    if (result) notificationsCreated++
  }

  // ── B: Offer expiry reminders ─────────────────────────────────────────────
  // Applications with status SELECTED and offerExpiryDate within 3 days.
  const expiringOffers = await db.application.findMany({
    where: {
      schoolId,
      status: "SELECTED",
      offerExpiryDate: { gte: now, lte: offerWindowEnd },
    },
    select: {
      id: true,
      applicationNumber: true,
      firstName: true,
      lastName: true,
      email: true,
      userId: true,
      accessToken: true,
      offerExpiryDate: true,
    },
  })

  for (const application of expiringOffers) {
    // Idempotency check for offer-expiry alerts.
    if (
      await offerExpiryAlreadySentToday(
        schoolId,
        application.id,
        todayStart,
        todayEnd
      )
    )
      continue

    offerExpiryReminders++

    const expiryDate = application.offerExpiryDate
      ? calendarDay(application.offerExpiryDate)
      : "—"
    const studentName = `${application.firstName} ${application.lastName}`
    const daysUntilExpiry = application.offerExpiryDate
      ? Math.ceil(
          (application.offerExpiryDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : OFFER_EXPIRY_WINDOW_DAYS

    const offerUrl = application.accessToken
      ? `/application/${application.id}/offer?token=${encodeURIComponent(application.accessToken)}`
      : "/application"

    const title = isAr
      ? "تنبيه: ينتهي عرض القبول قريباً"
      : "Reminder: Admission Offer Expiring Soon"
    const body = isAr
      ? `عرض القبول لـ "${studentName}" سينتهي بتاريخ ${expiryDate} (خلال ${daysUntilExpiry} يوم). يرجى قبول العرض قبل انتهاء المهلة.`
      : `The admission offer for "${studentName}" expires on ${expiryDate} (in ${daysUntilExpiry} day(s)). Please accept the offer before the deadline.`

    if (application.userId) {
      // Linked user account — normal in-app + email dispatch.
      const result = await dispatchNotification({
        schoolId,
        userId: application.userId,
        type: "system_alert",
        title,
        body,
        priority: "high",
        channels: ["in_app", "email"],
        lang,
        metadata: {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          action: "offer_expiry_reminder",
          url: offerUrl,
        },
      })
      if (result) notificationsCreated++
    } else if (application.email) {
      // BUG-3 support: guest applicant with no userId — directEmail fallback.
      await dispatchNotification({
        schoolId,
        userId: "", // unused when directEmail is set
        type: "system_alert",
        title,
        body,
        priority: "high",
        channels: ["email"],
        lang,
        directEmail: application.email,
        metadata: {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          action: "offer_expiry_reminder",
          url: offerUrl,
        },
      })
      // directEmail path returns null (no row created) — count the attempt
      notificationsCreated++
    }
  }

  // ── C: Auto-expire lapsed offers ───────────────────────────────────────────
  // SELECTED applications whose offerExpiryDate has passed flip to EXPIRED
  // (the enum's cron-only status; admins can re-offer via EXPIRED → SELECTED).
  // The offer actions' own status !== "SELECTED" guards already reject
  // mutations post-flip; their date-based OFFER_EXPIRED check remains the
  // safety net for the up-to-24h lag between lapse and this run.
  const expired = await db.application.updateMany({
    where: {
      schoolId,
      status: "SELECTED",
      offerExpiryDate: { lt: now },
    },
    data: { status: "EXPIRED" },
  })
  offersExpired = expired.count

  return {
    feeAssignmentReminders,
    invoiceReminders,
    offerExpiryReminders,
    offersExpired,
    notificationsCreated,
  }
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    const now = new Date()
    const windowEnd = new Date(
      now.getTime() + FEE_DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000
    )
    const offerWindowEnd = new Date(
      now.getTime() + OFFER_EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000
    )
    const { start: todayStart, end: todayEnd } = todayBounds()
    const schoolLangCache = new Map<string, string>()

    let totalFeeAssignmentReminders = 0
    let totalInvoiceReminders = 0
    let totalOfferExpiryReminders = 0
    let totalOffersExpired = 0
    let totalNotificationsCreated = 0
    let schoolsProcessed = 0

    // Iterate per school — bounds memory and keeps every query schoolId-scoped.
    const schoolRows = await db.feeAssignment.groupBy({
      by: ["schoolId"],
      where: { status: { in: ["PENDING", "PARTIAL"] } },
    })

    // Also include schools that have expiring offers but no active fee assignments.
    const offerSchoolRows = await db.application.groupBy({
      by: ["schoolId"],
      where: {
        status: "SELECTED",
        offerExpiryDate: { gte: now, lte: offerWindowEnd },
      },
    })

    // And schools with already-lapsed SELECTED offers awaiting the EXPIRED
    // flip (part C) — they may have no pending fees and no upcoming expiries,
    // so neither set above would visit them.
    const lapsedOfferSchoolRows = await db.application.groupBy({
      by: ["schoolId"],
      where: { status: "SELECTED", offerExpiryDate: { lt: now } },
    })

    const allSchoolIds = [
      ...new Set([
        ...schoolRows.map((r) => r.schoolId),
        ...offerSchoolRows.map((r) => r.schoolId),
        ...lapsedOfferSchoolRows.map((r) => r.schoolId),
      ]),
    ]

    for (const schoolId of allSchoolIds) {
      const counts = await processSchool(
        schoolId,
        now,
        windowEnd,
        offerWindowEnd,
        todayStart,
        todayEnd,
        schoolLangCache
      )
      totalFeeAssignmentReminders += counts.feeAssignmentReminders
      totalInvoiceReminders += counts.invoiceReminders
      totalOfferExpiryReminders += counts.offerExpiryReminders
      totalOffersExpired += counts.offersExpired
      totalNotificationsCreated += counts.notificationsCreated
      schoolsProcessed++
    }

    return NextResponse.json({
      success: true,
      schoolsProcessed,
      feeAssignmentReminders: totalFeeAssignmentReminders,
      invoiceReminders: totalInvoiceReminders,
      offerExpiryReminders: totalOfferExpiryReminders,
      offersExpired: totalOffersExpired,
      notificationsCreated: totalNotificationsCreated,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[fee-due] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
