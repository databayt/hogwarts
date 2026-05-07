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
 * Signature verification: when `TAP_WEBHOOK_SECRET` is set we compute an
 * HMAC-SHA256 over the raw body and compare to the `tap_signature` header
 * (case-insensitive). When the secret is unset we accept (dev/sandbox
 * convenience) but log a warning so the misconfig is loud.
 */
import crypto from "node:crypto"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

interface TapChargePayload {
  id: string
  status: string
  amount?: number
  currency?: string
  reference?: { transaction?: string }
  metadata?: Record<string, string | undefined> & {
    context?: string
    feeAssignmentId?: string
    studentId?: string
    schoolId?: string
    type?: string
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
}): Promise<void> {
  const { chargeId, feeAssignmentId, schoolId, amount } = args

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

  const payment = await db.payment.create({
    data: {
      schoolId: assignment.schoolId,
      feeAssignmentId,
      studentId: assignment.studentId,
      paymentNumber:
        `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
      amount: paymentAmount,
      paymentMethod: "OTHER",
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
        paymentMethod: "OTHER",
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
 * Verify the `tap_signature` header against an HMAC-SHA256 of the raw body.
 *
 * Tap's official signing format combines header values with the body in a
 * specific order — the exact recipe varies between Tap regions and SDK
 * versions, so we keep the verification minimal: HMAC over the raw body,
 * compared in constant time. If your Tap account uses a different format,
 * extend this function with the headers Tap requires (typically `x_post_*`
 * fields concatenated alphabetically before HMACing).
 *
 * Returns true when:
 *   - secret is unset (dev/sandbox), or
 *   - signature matches the computed HMAC.
 */
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.TAP_WEBHOOK_SECRET
  if (!secret) {
    console.warn(
      "[Tap webhook] TAP_WEBHOOK_SECRET not set — accepting without verification"
    )
    return true
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
