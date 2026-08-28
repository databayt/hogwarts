// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * "Payment received" — one fan-out for every rail.
 *
 * A fee payment can land three ways: the Stripe webhook, the Tap webhook, or
 * an admin recording cash / bank transfer (`recordPayment`). Only the last of
 * those told the family properly: it notified the student AND every linked
 * guardian, in the school's language, with the receipt attached. Both
 * webhooks — the rails a parent actually uses to self-serve — notified the
 * student alone, in an inline `isAr ? … : …` ternary. So the parent who had
 * just paid online got nothing, and the guardian who pays for a child with
 * no login of their own got nothing either.
 *
 * Copy comes from `finance.notifications.*` via `getFinanceNotificationCopy`
 * (the same keys `recordPayment` reads), so all three rails say the same thing.
 *
 * Fire-and-forget by design: a notification must never roll back or fail a
 * payment that has already settled. Every dispatch is individually caught.
 */

import "server-only"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

import { getFinanceNotificationCopy, interp } from "./notification-copy"

export interface FeePaymentNotifyInput {
  schoolId: string
  studentId: string
  paymentId: string
  receiptNumber: string | null
  feeAssignmentId: string
  amount: number
  /** finalAmount − totalPaid after this payment; 0 when fully settled. */
  remaining: number
  status: "PAID" | "PARTIAL" | string
  /** Language to write in. Defaults to the school's preferred language. */
  lang?: string | null
  actorId?: string
}

/**
 * Notify the student and every guardian linked to them that a payment was
 * received. Resolves recipients itself so callers (webhooks in particular)
 * don't each re-implement the guardian join.
 */
export async function notifyFeePaymentReceived(
  input: FeePaymentNotifyInput
): Promise<void> {
  const {
    schoolId,
    studentId,
    paymentId,
    receiptNumber,
    feeAssignmentId,
    amount,
    remaining,
    status,
    actorId,
  } = input

  const [school, student, guardianLinks] = await Promise.all([
    input.lang
      ? Promise.resolve(null)
      : db.school.findUnique({
          where: { id: schoolId },
          select: { preferredLanguage: true },
        }),
    db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { userId: true },
    }),
    db.studentGuardian.findMany({
      where: { studentId, schoolId },
      select: { guardian: { select: { userId: true } } },
    }),
  ])

  const lang = input.lang ?? school?.preferredLanguage ?? "ar"
  const copy = await getFinanceNotificationCopy(lang)
  const isFull = status === "PAID"
  const params = {
    amount: amount.toLocaleString(),
    remaining: remaining.toLocaleString(),
  }

  const title = copy.paymentReceivedTitle || "Payment Received"
  const studentBody = interp(
    (isFull
      ? copy.paymentRecordedStudentFull
      : copy.paymentRecordedStudentPartial) ||
      (isFull
        ? "Payment of {amount} recorded. Fee fully paid."
        : "Payment of {amount} recorded. Remaining: {remaining}"),
    params
  )
  const guardianBody = interp(
    (isFull
      ? copy.paymentRecordedGuardianFull
      : copy.paymentRecordedGuardianPartial) ||
      (isFull
        ? "Payment of {amount} recorded for student. Fee fully paid."
        : "Payment of {amount} recorded for student. Remaining: {remaining}"),
    params
  )

  // The receipt route authorizes the student, their guardians and finance
  // admins itself, so linking it here adds no exposure.
  const metadata = {
    paymentId,
    receiptNumber,
    feeAssignmentId,
    amount,
    status,
    url: `/api/payment/${paymentId}/receipt`,
  }

  const sends: Promise<unknown>[] = []

  if (student?.userId) {
    sends.push(
      dispatchNotification({
        schoolId,
        userId: student.userId,
        type: "fee_paid",
        title,
        body: studentBody,
        lang,
        priority: "normal",
        channels: ["in_app", "email"],
        metadata,
        actorId,
      }).catch((err) =>
        console.error("[notifyFeePaymentReceived] student:", err)
      )
    )
  }

  // Dedupe — two guardian rows can share one login, and a guardian can also
  // BE the student's login (self-paying adult learners).
  const seen = new Set<string>(student?.userId ? [student.userId] : [])
  for (const link of guardianLinks) {
    const uid = link.guardian?.userId
    if (!uid || seen.has(uid)) continue
    seen.add(uid)
    sends.push(
      dispatchNotification({
        schoolId,
        userId: uid,
        type: "fee_paid",
        title,
        body: guardianBody,
        lang,
        priority: "normal",
        channels: ["in_app", "email"],
        metadata,
        actorId,
      }).catch((err) =>
        console.error("[notifyFeePaymentReceived] guardian:", err)
      )
    )
  }

  await Promise.all(sends)
}

export interface FeePaymentFailedNotifyInput {
  schoolId: string
  studentId: string
  feeAssignmentId: string
  /** Gateway's own reason text/code, if it gave one. */
  reason?: string | null
  /** Gateway charge / payment-intent id, for support lookups. */
  transactionId?: string | null
  lang?: string | null
}

/**
 * "Payment failed — please retry" for a declined/abandoned online charge.
 * Same audience as {@link notifyFeePaymentReceived}: the student AND every
 * linked guardian, since it is usually the guardian who was holding the card.
 * High priority, links back to the family portal where a retry is one click.
 * No Payment row is written for a failed charge — it is not an accounting
 * event; the gateway dashboard is the audit trail.
 */
export async function notifyFeePaymentFailed(
  input: FeePaymentFailedNotifyInput
): Promise<void> {
  const { schoolId, studentId, feeAssignmentId, reason, transactionId } = input

  const [school, student, guardianLinks] = await Promise.all([
    input.lang
      ? Promise.resolve(null)
      : db.school.findUnique({
          where: { id: schoolId },
          select: { preferredLanguage: true },
        }),
    db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { userId: true },
    }),
    db.studentGuardian.findMany({
      where: { studentId, schoolId },
      select: { guardian: { select: { userId: true } } },
    }),
  ])

  const lang = input.lang ?? school?.preferredLanguage ?? "ar"
  const copy = await getFinanceNotificationCopy(lang)
  const title = copy.paymentFailedTitle || "Payment failed"
  const body = interp(
    copy.paymentFailedBody ||
      "Your online payment did not go through ({reason}). Please try again or use another payment method.",
    { reason: reason || "—" }
  )
  const metadata = {
    feeAssignmentId,
    transactionId: transactionId ?? null,
    url: "/finance/fees/my",
  }

  const recipients = new Set<string>()
  if (student?.userId) recipients.add(student.userId)
  for (const link of guardianLinks) {
    if (link.guardian?.userId) recipients.add(link.guardian.userId)
  }

  await Promise.all(
    [...recipients].map((userId) =>
      dispatchNotification({
        schoolId,
        userId,
        type: "fee_due",
        title,
        body,
        lang,
        priority: "high",
        channels: ["in_app", "email"],
        metadata,
      }).catch((err) => console.error("[notifyFeePaymentFailed]:", err))
    )
  )
}
