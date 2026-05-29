// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tap Payments webhook
 *
 * Tap POSTs charge updates to the URL we set as `post.url` on charge
 * creation (see `src/lib/payment/providers/tap.ts`). The body is the full
 * Charge object — we route on its `status` and `metadata.context`.
 *
 * Status values we care about:
 *   - `CAPTURED`  → payment succeeded; create Payment + post to ledger.
 *   - `FAILED` / `DECLINED` / `CANCELLED` / `ABANDONED` / `TIMEDOUT` → log + ack.
 *   - others (`INITIATED`, `IN_PROGRESS`) → ack with no side-effect.
 *
 * Idempotency: ProcessedWebhookEvent dedupe via `(provider, providerEventId)`
 * — a P2002 conflict short-circuits with 200 OK. Mirrors the Stripe handler.
 *
 * Signature verification: we compute HMAC-SHA256 over the raw body and
 * compare it to the `tap_signature` header (case-insensitive). When the
 * secret is unset we FAIL CLOSED (P1.2): every Aldar/production deploy
 * must set `TAP_WEBHOOK_SECRET` or webhooks 400 — silent fallback would
 * let a forged charge write Payment rows + post to the ledger.
 */
import crypto from "node:crypto"
import { Prisma, type PaymentMethod } from "@prisma/client"

import { db } from "@/lib/db"

interface TapChargePayload {
  id: string
  status: string
  amount?: number
  currency?: string
  reference?: { transaction?: string }
  // Tap's `source` object identifies the underlying wallet/instrument:
  //   `source.id` = "src_card" | "src_apple_pay" | "src_mada" | "src_knet" | ...
  //   `source.payment_method` = "APPLE_PAY" | "MADA" | "KNET" | "CARD" | ...
  // We persist the raw value as Payment.gatewayMethod for audit and map it to
  // the PaymentMethod enum for the operational view (P1.3 + P1.4).
  source?: {
    id?: string
    payment_method?: string
    brand?: string
  }
  metadata?: Record<string, string | undefined> & {
    context?: string
    feeAssignmentId?: string
    studentId?: string
    schoolId?: string
    type?: string
  }
}

/**
 * Map Tap's `source.payment_method` (or `source.id`) to a value of the
 * PaymentMethod enum. Unknown values fall back to OTHER but the raw Tap
 * value is still persisted in Payment.gatewayMethod for audit.
 */
function mapTapSourceToPaymentMethod(
  source: TapChargePayload["source"]
): PaymentMethod {
  const raw = (source?.payment_method ?? source?.id ?? "")
    .toString()
    .toUpperCase()
    .replace(/^SRC_/, "")
  switch (raw) {
    case "APPLE_PAY":
    case "APPLEPAY":
      return "APPLE_PAY"
    case "GOOGLE_PAY":
    case "GOOGLEPAY":
      return "GOOGLE_PAY"
    case "MADA":
      return "MADA"
    case "KNET":
      return "KNET"
    case "CARD":
    case "VISA":
    case "MASTERCARD":
    case "AMEX":
      return "CREDIT_CARD"
    case "BANK_TRANSFER":
      return "BANK_TRANSFER"
    default:
      return "OTHER"
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature =
    req.headers.get("tap_signature") ?? req.headers.get("Tap-Signature")

  if (!verifySignature(body, signature)) {
    return new Response("Invalid Tap signature", { status: 400 })
  }

  let charge: TapChargePayload
  try {
    charge = JSON.parse(body) as TapChargePayload
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  if (!charge.id || !charge.status) {
    return new Response("Missing charge id or status", { status: 400 })
  }

  // Event-ID dedupe — Tap uses charge.id as the stable event id (charges are
  // immutable per the docs). If the same charge.id has been processed before
  // we ack with 200 and skip side-effects.
  const schoolId =
    typeof charge.metadata?.schoolId === "string"
      ? charge.metadata.schoolId
      : null
  try {
    await db.processedWebhookEvent.create({
      data: {
        provider: "tap",
        providerEventId: charge.id,
        eventType: charge.status,
        schoolId,
        payload: charge as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      console.log(
        `[Tap webhook] Duplicate charge ${charge.id} — skipping (already processed)`
      )
      return new Response(null, { status: 200 })
    }
    console.error(
      "[Tap webhook] ProcessedWebhookEvent insert failed (continuing):",
      err
    )
  }

  // P3.2 — Surface failed/declined Tap charges to the parent with a retry
  // link instead of silently swallowing them. Previously only logged; this
  // left parents staring at a vanished checkout with no signal.
  const failedStatuses = new Set([
    "FAILED",
    "DECLINED",
    "CANCELLED",
    "ABANDONED",
    "TIMEDOUT",
  ])
  if (
    failedStatuses.has(charge.status) &&
    charge.metadata?.context === "school_fee" &&
    charge.metadata.feeAssignmentId &&
    schoolId
  ) {
    try {
      await notifyTapFailedFeePayment({
        chargeId: charge.id,
        status: charge.status,
        feeAssignmentId: charge.metadata.feeAssignmentId,
        schoolId,
      })
    } catch (notifErr) {
      console.error(
        `[Tap webhook] Failed to notify guardian on charge ${charge.id} status=${charge.status}:`,
        notifErr
      )
    }
    return new Response(null, { status: 200 })
  }

  if (charge.status !== "CAPTURED") {
    console.log(
      `[Tap webhook] Charge ${charge.id} status=${charge.status} — no side-effect`
    )
    return new Response(null, { status: 200 })
  }

  // Route by metadata.context — for the kingfahad pilot the only context we
  // wire today is `school_fee` (set by createFeePaymentCheckout). Other
  // contexts (subscriptions, course purchases) can hook in later by adding
  // their own branches here.
  if (charge.metadata?.context !== "school_fee") {
    console.log(
      `[Tap webhook] Charge ${charge.id} context=${charge.metadata?.context ?? "none"} — no handler`
    )
    return new Response(null, { status: 200 })
  }

  const feeAssignmentId = charge.metadata.feeAssignmentId
  if (!feeAssignmentId || !schoolId) {
    console.error(
      `[Tap webhook] Charge ${charge.id} school_fee context missing feeAssignmentId/schoolId`
    )
    return new Response(null, { status: 200 })
  }

  try {
    await recordTapFeePayment({
      chargeId: charge.id,
      feeAssignmentId,
      schoolId,
      amount: typeof charge.amount === "number" ? charge.amount : 0,
      source: charge.source,
    })
  } catch (handlerErr) {
    // Acknowledge the webhook even on handler failure — Tap will not retry
    // and we already deduped via ProcessedWebhookEvent. Operator must
    // reconcile manually if this branch fires.
    console.error(
      `[Tap webhook] Failed to record fee payment for charge ${charge.id}:`,
      handlerErr
    )
  }

  return new Response(null, { status: 200 })
}

async function recordTapFeePayment(args: {
  chargeId: string
  feeAssignmentId: string
  schoolId: string
  amount: number
  source?: TapChargePayload["source"]
}): Promise<void> {
  const { chargeId, feeAssignmentId, schoolId, amount, source } = args

  const assignment = await db.feeAssignment.findFirst({
    where: { id: feeAssignmentId, schoolId },
    include: {
      payments: {
        where: { status: "SUCCESS" },
        select: { amount: true },
      },
      student: {
        select: { userId: true, firstName: true, lastName: true },
      },
      school: { select: { currency: true } },
    },
  })

  if (!assignment) {
    console.error(`[Tap webhook] FeeAssignment ${feeAssignmentId} not found`)
    return
  }

  const totalPaid = assignment.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const finalAmount = Number(assignment.finalAmount)
  // Trust Tap's amount as the captured charge — but cap at the remaining
  // owed so a misconfigured charge can't write a negative payment row.
  const paymentAmount = Math.min(
    amount || finalAmount - totalPaid,
    finalAmount - totalPaid
  )

  if (paymentAmount <= 0) {
    console.log(
      `[Tap webhook] Charge ${chargeId} — no remaining amount on ${feeAssignmentId}, skipping`
    )
    return
  }

  // P1.1: snapshot currency for receipt fidelity.
  // P1.3: persist Tap's raw source.payment_method as gatewayMethod for audit.
  // P1.4: map Tap source to operational PaymentMethod enum (APPLE_PAY,
  // MADA, KNET, ...) so the admin payment list shows the right wallet badge
  // instead of OTHER.
  const paymentCurrency =
    assignment.currency ?? assignment.school?.currency ?? "USD"
  const mappedMethod = mapTapSourceToPaymentMethod(source)
  const gatewayMethod =
    source?.payment_method ?? source?.id ?? source?.brand ?? null

  const payment = await db.payment.create({
    data: {
      schoolId: assignment.schoolId,
      feeAssignmentId,
      studentId: assignment.studentId,
      paymentNumber:
        `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
      amount: paymentAmount,
      currency: paymentCurrency,
      paymentMethod: mappedMethod,
      gatewayMethod,
      paymentDate: new Date(),
      status: "SUCCESS",
      receiptNumber:
        `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
      transactionId: chargeId,
    },
  })

  const newTotalPaid = totalPaid + paymentAmount
  const newStatus = newTotalPaid >= finalAmount ? "PAID" : "PARTIAL"
  await db.feeAssignment.update({
    where: { id: feeAssignmentId },
    data: { status: newStatus },
  })

  // Sync linked invoice (non-fatal)
  try {
    const linkedInvoice = await db.userInvoice.findFirst({
      where: { feeAssignmentId, schoolId: assignment.schoolId },
    })
    if (linkedInvoice) {
      await db.userInvoice.update({
        where: { id: linkedInvoice.id },
        data: { status: newStatus === "PAID" ? "PAID" : "UNPAID" },
      })
    }
  } catch (invoiceErr) {
    console.error("[Tap webhook] Invoice sync failed:", invoiceErr)
  }

  // Post to double-entry ledger — same call as Stripe webhook so trial
  // balance stays correct regardless of which gateway captured the charge.
  try {
    const { postFeePayment } =
      await import("@/components/school-dashboard/finance/lib/accounting/actions")
    const postResult = await postFeePayment(
      assignment.schoolId,
      {
        paymentId: payment.id,
        studentId: assignment.studentId,
        amount: paymentAmount,
        paymentMethod: mappedMethod,
        paymentDate: payment.paymentDate,
      },
      "system:tap-webhook"
    )
    if (!postResult.success) {
      console.error("[Tap webhook] postFeePayment failed:", postResult.errors)
    }
  } catch (postingErr) {
    console.error("[Tap webhook] Ledger posting threw:", postingErr)
  }

  // Notify the student (non-fatal)
  try {
    if (assignment.student?.userId) {
      const { dispatchNotification } =
        await import("@/lib/dispatch-notification")
      await dispatchNotification({
        schoolId: assignment.schoolId,
        userId: assignment.student.userId,
        type: "fee_paid",
        title: "تم استلام الدفعة",
        body: `تم تأكيد الدفع عبر Tap بنجاح. ${newStatus === "PAID" ? "تم سداد الرسوم بالكامل." : ""}`,
        lang: "ar",
        priority: "normal",
        channels: ["in_app", "email", "whatsapp"],
        metadata: {
          paymentId: payment.id,
          feeAssignmentId,
          amount: paymentAmount,
          status: newStatus,
          receiptNumber: payment.receiptNumber,
          gateway: "tap",
          url: `/finance/fees/payments/${payment.id}`,
        },
      })
    }
  } catch (notifErr) {
    console.error("[Tap webhook] Notification dispatch failed:", notifErr)
  }

  console.log(
    `[Tap webhook] Recorded fee payment ${payment.id} for charge ${chargeId} (status: ${newStatus})`
  )
}

/**
 * P3.2 — Dispatch a "payment failed" notification when Tap reports
 * FAILED/DECLINED/CANCELLED/ABANDONED/TIMEDOUT on a school_fee charge.
 *
 * No Payment row is written — failed charges aren't accounting events and
 * would pollute the reconciliation report. We rely on Tap's dashboard for
 * the audit trail and on the notification's deep link for parent retry.
 */
async function notifyTapFailedFeePayment(args: {
  chargeId: string
  status: string
  feeAssignmentId: string
  schoolId: string
}): Promise<void> {
  const { chargeId, status, feeAssignmentId, schoolId } = args

  const assignment = await db.feeAssignment.findFirst({
    where: { id: feeAssignmentId, schoolId },
    select: {
      student: {
        select: {
          userId: true,
          studentGuardians: {
            select: { guardian: { select: { userId: true } } },
          },
        },
      },
    },
  })
  if (!assignment) {
    console.error(
      `[Tap webhook] FeeAssignment ${feeAssignmentId} not found for failed charge ${chargeId}`
    )
    return
  }

  const { dispatchNotification } = await import("@/lib/dispatch-notification")
  const recipients = new Set<string>()
  if (assignment.student?.userId) recipients.add(assignment.student.userId)
  for (const sg of assignment.student?.studentGuardians ?? []) {
    if (sg.guardian?.userId) recipients.add(sg.guardian.userId)
  }

  const friendlyStatus = status.replace(/_/g, " ").toLowerCase()
  await Promise.all(
    Array.from(recipients).map((userId) =>
      dispatchNotification({
        schoolId,
        userId,
        type: "fee_due",
        title: "Payment Failed",
        body: `Your Tap payment didn't complete (${friendlyStatus}). Please try again or use another payment method.`,
        lang: "ar",
        priority: "high",
        channels: ["in_app", "email"],
        metadata: {
          feeAssignmentId,
          chargeId,
          status,
          gateway: "tap",
          url: `/finance/fees/assignments/${feeAssignmentId}`,
        },
      })
    )
  )

  console.log(
    `[Tap webhook] Notified ${recipients.size} recipient(s) of failed charge ${chargeId} (status: ${status})`
  )
}

/**
 * Verify the `tap_signature` header against an HMAC-SHA256 of the raw body.
 *
 * Tap's official signing format combines header values with the body in a
 * specific order — the exact recipe varies between Tap regions and SDK
 * versions, so we keep the verification minimal: HMAC over the raw body,
 * compared in constant time. If your Tap account uses a different format,
 * extend this function with the headers Tap requires (typically `x_post_*`
 * fields concatenated alphabetically before HMACing).
 *
 * Returns true only when:
 *   - `TAP_WEBHOOK_SECRET` is set, AND
 *   - signature matches the computed HMAC.
 *
 * P1.2 — fail-closed when secret is missing. Earlier dev/sandbox lenience
 * shipped to prod by accident, leaving Aldar's webhook unauthenticated.
 */
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.TAP_WEBHOOK_SECRET
  if (!secret) {
    console.error(
      "[Tap webhook] TAP_WEBHOOK_SECRET not set — rejecting (set the env var to enable Tap webhooks)"
    )
    return false
  }
  if (!signature) {
    return false
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  // Constant-time compare guards against timing attacks
  try {
    const a = Buffer.from(expected, "hex")
    const b = Buffer.from(signature, "hex")
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
