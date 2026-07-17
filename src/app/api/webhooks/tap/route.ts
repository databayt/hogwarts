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
 *
 * Contexts handled:
 *   - school_fee:        fee_payment — creates Payment, syncs invoices, ledger, notify
 *   - registration_fee:  sets registrationFeePaid on Application, notifies
 *   - application_fee:   legacy in-flight tolerated; sets applicationFeePaid, notifies
 */
import crypto, { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import type { PaymentMethod } from "@prisma/client"

import { db } from "@/lib/db"

interface TapChargePayload {
  id: string
  status: string
  amount?: number
  currency?: string
  // Tap reports the actual rail it used (MADA / APPLE_PAY / KNET / VISA / ...).
  // We preserve it as Payment.gatewayMethod so the finance reports keep Tap
  // provenance even though paymentMethod maps to a coarse enum.
  source?: { id?: string; payment_method?: string }
  reference?: { transaction?: string }
  metadata?: Record<string, string | undefined> & {
    context?: string
    feeAssignmentId?: string
    studentId?: string
    schoolId?: string
    applicationId?: string
    type?: string
  }
}

// Map Tap's source.payment_method to our PaymentMethod enum. Anything we don't
// recognise falls back to CREDIT_CARD (Tap charges are card/wallet rails, not
// "OTHER" — using OTHER misclassified all Gulf card revenue in reports).
function mapTapMethod(raw?: string): PaymentMethod {
  switch ((raw ?? "").toUpperCase()) {
    case "MADA":
      return "MADA"
    case "KNET":
      return "KNET"
    case "APPLE_PAY":
    case "APPLEPAY":
      return "APPLE_PAY"
    case "GOOGLE_PAY":
    case "GOOGLEPAY":
      return "GOOGLE_PAY"
    default:
      return "CREDIT_CARD"
  }
}

/**
 * Generate a collision-safe, human-scannable receipt number.
 * crypto.randomUUID() provides 122 bits of entropy; we take the first 8 hex
 * chars (32 bits) — sufficient for human-facing IDs while keeping strings short.
 * Format: RCP-XXXXXXXX (uppercase).
 */
function generateReceiptNumber(): string {
  const hex = randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
  return `RCP-${hex}`
}

/**
 * Generate a collision-safe payment number. Format: PAY-XXXXXXXX.
 */
function generatePaymentNumber(): string {
  const hex = randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
  return `PAY-${hex}`
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

  const context = charge.metadata?.context

  // ============================================================
  // school_fee context — fee_payment (existing + INV-002 multi-
  // installment sync)
  // ============================================================
  if (context === "school_fee") {
    const feeAssignmentId = charge.metadata?.feeAssignmentId
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
        currency:
          typeof charge.currency === "string" ? charge.currency : undefined,
        gatewayMethod: charge.source?.payment_method,
      })
    } catch (handlerErr) {
      // Tap does not retry — we already deduped via ProcessedWebhookEvent.
      // Operator must reconcile manually if this branch fires.
      console.error(
        `[Tap webhook] Failed to record fee payment for charge ${charge.id}:`,
        handlerErr
      )
    }

    return new Response(null, { status: 200 })
  }

  // ============================================================
  // TAP-ADMISSION-NO-HANDLER fix: registration_fee context
  // Mirror of Stripe's handler: set registrationFeePaid on the
  // Application, notify. Payment materialization into Payment table
  // happens at enrollment (not here).
  // ============================================================
  if (context === "registration_fee") {
    const applicationId = charge.metadata?.applicationId
    if (!applicationId || !schoolId) {
      console.error(
        `[Tap webhook] Charge ${charge.id} registration_fee context missing applicationId/schoolId`
      )
      return new Response(null, { status: 200 })
    }

    try {
      // Idempotency: skip if already marked paid
      const existing = await db.application.findFirst({
        where: { id: applicationId, schoolId },
        select: { registrationFeePaid: true },
      })
      if (existing?.registrationFeePaid) {
        console.log(
          `[Tap webhook] registrationFeePaid already true for ${applicationId} — skipping`
        )
        return new Response(null, { status: 200 })
      }

      const amountValue =
        typeof charge.amount === "number" ? charge.amount : null

      await db.application.update({
        where: { id: applicationId, schoolId },
        data: {
          registrationFeePaid: true,
          registrationFeeAmount: amountValue,
          registrationFeeMethod: "tap",
          registrationFeeReference: charge.id,
          registrationFeeDate: new Date(),
        },
      })

      console.log(
        `[Tap webhook] Registration fee paid (Tap): applicationId=${applicationId}`
      )

      // Send payment confirmation notification (non-fatal)
      try {
        const app = await db.application.findFirst({
          where: { id: applicationId, schoolId },
          select: { userId: true, applicationNumber: true },
        })
        if (app?.userId) {
          const { dispatchNotification, resolveSchoolLang } =
            await import("@/lib/dispatch-notification")
          const lang = await resolveSchoolLang(schoolId)
          const isAr = lang === "ar"
          await dispatchNotification({
            schoolId,
            userId: app.userId,
            type: "fee_paid",
            title: isAr
              ? "تم استلام رسوم التسجيل"
              : "Registration Fee Received",
            body: isAr
              ? `تم تأكيد دفع رسوم التسجيل للطلب ${app.applicationNumber} بنجاح`
              : `Registration fee for application ${app.applicationNumber} confirmed.`,
            lang,
            priority: "normal",
            channels: ["in_app", "email"],
            metadata: {
              applicationId,
              paymentType: "registration_fee",
              chargeId: charge.id,
            },
          })
        }
      } catch (notifErr) {
        console.error(
          "[Tap webhook] Registration fee notification failed:",
          notifErr
        )
      }
    } catch (err) {
      console.error(
        `[Tap webhook] Failed to record registration fee for charge ${charge.id}:`,
        err
      )
    }

    return new Response(null, { status: 200 })
  }

  // ============================================================
  // Legacy application_fee context — tolerated for apps in flight.
  // Minimal: set applicationFeePaid + notify.
  // ============================================================
  if (context === "application_fee") {
    const applicationId = charge.metadata?.applicationId
    if (!applicationId || !schoolId) {
      console.error(
        `[Tap webhook] Charge ${charge.id} application_fee context missing applicationId/schoolId`
      )
      return new Response(null, { status: 200 })
    }

    try {
      // Idempotency: skip if already marked paid
      const existing = await db.application.findFirst({
        where: { id: applicationId, schoolId },
        select: { applicationFeePaid: true },
      })
      if (existing?.applicationFeePaid) {
        console.log(
          `[Tap webhook] applicationFeePaid already true for ${applicationId} — skipping`
        )
        return new Response(null, { status: 200 })
      }

      await db.application.update({
        where: { id: applicationId, schoolId },
        data: {
          applicationFeePaid: true,
          paymentId: charge.id,
          paymentDate: new Date(),
        },
      })

      console.log(
        `[Tap webhook] Application fee paid (Tap, legacy): applicationId=${applicationId}`
      )

      // Send confirmation notification (non-fatal)
      try {
        const app = await db.application.findFirst({
          where: { id: applicationId, schoolId },
          select: { userId: true, applicationNumber: true },
        })
        if (app?.userId) {
          const { dispatchNotification, resolveSchoolLang } =
            await import("@/lib/dispatch-notification")
          const lang = await resolveSchoolLang(schoolId)
          const isAr = lang === "ar"
          await dispatchNotification({
            schoolId,
            userId: app.userId,
            type: "fee_paid",
            title: isAr ? "تم استلام الدفع" : "Payment Received",
            body: isAr
              ? `تم تأكيد دفع رسوم الطلب ${app.applicationNumber} بنجاح`
              : `Application fee payment for ${app.applicationNumber} confirmed.`,
            lang,
            priority: "normal",
            channels: ["in_app", "email"],
            metadata: {
              applicationId,
              paymentType: "application_fee",
              chargeId: charge.id,
            },
          })
        }
      } catch (notifErr) {
        console.error(
          "[Tap webhook] Application fee notification failed:",
          notifErr
        )
      }
    } catch (err) {
      console.error(
        `[Tap webhook] Failed to record application fee for charge ${charge.id}:`,
        err
      )
    }

    return new Response(null, { status: 200 })
  }

  // Unknown / future context — log and ack
  console.log(
    `[Tap webhook] Charge ${charge.id} context=${context ?? "none"} — no handler`
  )
  return new Response(null, { status: 200 })
}

async function recordTapFeePayment(args: {
  chargeId: string
  feeAssignmentId: string
  schoolId: string
  amount: number
  currency?: string
  gatewayMethod?: string
}): Promise<void> {
  const {
    chargeId,
    feeAssignmentId,
    schoolId,
    amount,
    currency,
    gatewayMethod,
  } = args

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
      paymentNumber: generatePaymentNumber(),
      amount: paymentAmount,
      // P1.1/P1.3 — snapshot currency + preserve the Tap rail. paymentMethod
      // maps to a coarse enum; gatewayMethod keeps MADA/Apple Pay/KNET fidelity.
      currency: assignment.currency ?? currency ?? null,
      paymentMethod: mapTapMethod(gatewayMethod),
      gatewayMethod: gatewayMethod ?? null,
      paymentDate: new Date(),
      status: "SUCCESS",
      receiptNumber: generateReceiptNumber(),
      transactionId: chargeId,
    },
  })

  const newTotalPaid = totalPaid + paymentAmount
  const newStatus = newTotalPaid >= finalAmount ? "PAID" : "PARTIAL"
  await db.feeAssignment.update({
    where: { id: feeAssignmentId },
    data: { status: newStatus },
  })

  // Sync ALL linked UserInvoices, allocating this payment oldest-first via the
  // shared allocator (finance/lib/invoice-allocation.ts) so every payment path
  // — recordPayment, markPaymentCleared, Stripe, Tap — uses identical logic.
  try {
    const { allocatePaymentToInvoices } =
      await import("@/components/school-dashboard/finance/lib/invoice-allocation")
    await allocatePaymentToInvoices(
      assignment.schoolId,
      feeAssignmentId,
      paymentAmount
    )
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
        paymentMethod: payment.paymentMethod,
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
      const { dispatchNotification, resolveSchoolLang } =
        await import("@/lib/dispatch-notification")
      const lang = await resolveSchoolLang(assignment.schoolId)
      const isAr = lang === "ar"
      await dispatchNotification({
        schoolId: assignment.schoolId,
        userId: assignment.student.userId,
        type: "fee_paid",
        title: isAr ? "تم استلام الدفعة" : "Payment Received",
        body: isAr
          ? `تم تأكيد الدفع عبر Tap بنجاح. ${newStatus === "PAID" ? "تم سداد الرسوم بالكامل." : ""}`
          : `Payment via Tap confirmed. ${newStatus === "PAID" ? "The fee is fully paid." : ""}`,
        lang,
        priority: "normal",
        channels: ["in_app", "email", "whatsapp"],
        metadata: {
          paymentId: payment.id,
          feeAssignmentId,
          amount: paymentAmount,
          status: newStatus,
          receiptNumber: payment.receiptNumber,
          gateway: "tap",
          url: `/api/payment/${payment.id}/receipt`,
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
    // Fail CLOSED in production. The Tap charge body (schoolId, feeAssignmentId,
    // amount, status=CAPTURED) is fully attacker-controllable, so an unsigned
    // accept lets anyone POST a forged capture and mark fees PAID without money.
    // Only the dev/sandbox convenience path may accept-without-verification.
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[Tap webhook] TAP_WEBHOOK_SECRET not set in production — rejecting unsigned webhook"
      )
      return false
    }
    console.warn(
      "[Tap webhook] TAP_WEBHOOK_SECRET not set — accepting without verification (non-production only)"
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
