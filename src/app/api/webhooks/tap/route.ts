// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tap Payments webhook
 *
 * Tap POSTs the final Charge object to the URL we set as `post.url` on charge
 * creation (see `src/lib/payment/providers/tap.ts`) — for captured or failed
 * charges only, never INITIATED/ABANDONED — and retries twice when the URL is
 * unreachable.
 *
 * TRUST MODEL — the posted body is a hint, Tap's API is the truth:
 *   1. Parse the body only for `charge.id` (+ status/amount for the hash).
 *   2. Verify Tap's `hashstring` header (HMAC-SHA256 over the documented
 *      field string, keyed with the SECRET API KEY — see `tap-api.ts`). A
 *      mismatch is logged loudly; it does not by itself decide anything.
 *   3. `GET /v2/charges/{id}` with our secret key and act ONLY on the fetched
 *      charge — its status, amount, currency AND metadata. The hashstring
 *      does not cover metadata, so a posted body could otherwise pick which
 *      fee gets marked paid; and a charge belonging to another merchant is a
 *      404 under our key. Fetch failure → release the dedupe row + 503 so
 *      Tap retries (the payer's return page also verifies independently).
 *   Outside production, with no TAP_SECRET_KEY, the posted body is used as-is
 *   so sandbox/unit tests can exercise the handler.
 *
 * ROUTING — on `metadata.type` (what our checkout callers stamp):
 *   - fee_payment      → `recordGatewayFeePayment` (idempotent on charge.id)
 *   - registration_fee → `settleRegistrationFee`
 *   - application_fee  → legacy in-flight apps: applicationFeePaid + notify
 *   Falls back to `metadata.context` for charges created before `type` was
 *   stamped (`school_fee` → fee_payment, `admission_fee` → registration_fee).
 *   The old handler routed on `context` alone, and the registration-fee
 *   checkout stamps `context: "admission_fee"` — so a captured registration
 *   fee fell through to "no handler" and was never recorded.
 *
 * IDEMPOTENCY — `ProcessedWebhookEvent` keyed on `${charge.id}:${status}`,
 * plus the data-layer guards inside each recorder. A handler failure releases
 * the dedupe row and returns 500 so a retry / manual resend is reprocessed.
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import {
  fetchTapCharge,
  getTapSecretKey,
  TAP_CAPTURED_STATUSES,
  TAP_FAILED_STATUSES,
  verifyTapHashstring,
  type TapCharge,
} from "@/lib/payment/tap-api"

type PaymentType = "fee_payment" | "registration_fee" | "application_fee"

function resolvePaymentType(
  metadata: TapCharge["metadata"]
): PaymentType | null {
  const type = metadata?.type
  if (
    type === "fee_payment" ||
    type === "registration_fee" ||
    type === "application_fee"
  ) {
    return type
  }
  switch (metadata?.context) {
    case "school_fee":
    case "tuition_fee":
      return "fee_payment"
    case "admission_fee":
      return "registration_fee"
    case "application_fee":
      return "application_fee"
    default:
      return null
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const postedHash = req.headers.get("hashstring")

  let posted: TapCharge
  try {
    posted = JSON.parse(body) as TapCharge
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }
  if (!posted || typeof posted !== "object" || !posted.id || !posted.status) {
    return new Response("Missing charge id or status", { status: 400 })
  }

  // ---- authenticate + resolve the authoritative charge ---------------------
  const secretKey = getTapSecretKey()
  let charge: TapCharge
  if (secretKey) {
    const signatureOk = verifyTapHashstring(posted, postedHash, secretKey)
    if (!signatureOk) {
      // Loud, but not fatal: the API read below is what we act on. If this
      // fires for genuine deliveries, our hash recipe has drifted from Tap's
      // — fix the recipe, but don't lose the payment meanwhile.
      console.warn(
        `[Tap webhook] hashstring ${postedHash ? "mismatch" : "missing"} for charge ${posted.id} — verifying via API`
      )
      // Cheap pre-filter for junk: only Tap-shaped ids get an API round-trip.
      if (!/^(chg|auth|ref)_[A-Za-z0-9]+$/.test(posted.id)) {
        return new Response("Invalid Tap signature", { status: 400 })
      }
    }

    const fetched = await fetchTapCharge(posted.id)
    if (!fetched.ok) {
      if (fetched.reason === "not_found") {
        console.warn(
          `[Tap webhook] charge ${posted.id} not found under our key — ignoring`
        )
        return new Response("Unknown charge", { status: 400 })
      }
      console.error(
        `[Tap webhook] could not read charge ${posted.id} back from Tap (${fetched.reason}${fetched.status ? ` ${fetched.status}` : ""}) — asking Tap to retry`
      )
      return new Response("Tap unavailable, retry", { status: 503 })
    }
    charge = fetched.charge
  } else {
    if (process.env.NODE_ENV === "production") {
      // Fail CLOSED: an unsigned, unverifiable body must never mark fees paid.
      console.error(
        "[Tap webhook] TAP_SECRET_KEY not set in production — rejecting"
      )
      return new Response("Tap not configured", { status: 503 })
    }
    console.warn(
      "[Tap webhook] TAP_SECRET_KEY not set — trusting posted body (non-production only)"
    )
    charge = posted
  }

  const schoolId =
    typeof charge.metadata?.schoolId === "string"
      ? charge.metadata.schoolId
      : null
  const dedupeId = `${charge.id}:${charge.status}`

  // ---- event-level dedupe --------------------------------------------------
  try {
    await db.processedWebhookEvent.create({
      data: {
        provider: "tap",
        providerEventId: dedupeId,
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
        `[Tap webhook] Duplicate ${dedupeId} — skipping (already processed)`
      )
      return new Response(null, { status: 200 })
    }
    console.error(
      "[Tap webhook] ProcessedWebhookEvent insert failed (continuing):",
      err
    )
  }

  async function releaseDedupeAndFail(
    context: string,
    error: unknown
  ): Promise<Response> {
    console.error(
      `[Tap webhook] ${context} failed — releasing dedupe for retry:`,
      error
    )
    try {
      await db.processedWebhookEvent.delete({
        where: {
          provider_providerEventId: {
            provider: "tap",
            providerEventId: dedupeId,
          },
        },
      })
    } catch (delErr) {
      console.error("[Tap webhook] Failed to release dedupe row:", delErr)
    }
    return new Response(`Webhook handler error: ${context}`, { status: 500 })
  }

  const paymentType = resolvePaymentType(charge.metadata)
  const captured = TAP_CAPTURED_STATUSES.has(charge.status)
  const failed = TAP_FAILED_STATUSES.has(charge.status)

  if (!captured && !failed) {
    console.log(
      `[Tap webhook] Charge ${charge.id} status=${charge.status} — no side-effect`
    )
    return new Response(null, { status: 200 })
  }

  // ==========================================================================
  // fee_payment — a tuition/school fee against a FeeAssignment
  // ==========================================================================
  if (paymentType === "fee_payment") {
    const feeAssignmentId = charge.metadata?.feeAssignmentId
    if (!feeAssignmentId || !schoolId) {
      console.error(
        `[Tap webhook] Charge ${charge.id} fee_payment missing feeAssignmentId/schoolId`
      )
      return new Response(null, { status: 200 })
    }

    if (failed) {
      // Not an accounting event — tell the family so they retry.
      try {
        const studentId =
          charge.metadata?.studentId ??
          (
            await db.feeAssignment.findFirst({
              where: { id: feeAssignmentId, schoolId },
              select: { studentId: true },
            })
          )?.studentId
        if (studentId) {
          const { notifyFeePaymentFailed } =
            await import("@/components/school-dashboard/finance/lib/payment-notify")
          await notifyFeePaymentFailed({
            schoolId,
            studentId,
            feeAssignmentId,
            reason: charge.response?.message ?? charge.status,
            transactionId: charge.id,
          })
        }
      } catch (err) {
        console.error("[Tap webhook] failed-payment notification threw:", err)
      }
      return new Response(null, { status: 200 })
    }

    try {
      const { recordGatewayFeePayment, mapGatewayMethod } =
        await import("@/components/school-dashboard/finance/lib/gateway-payment")
      const rail = charge.source?.payment_method ?? charge.card?.brand ?? null
      const result = await recordGatewayFeePayment({
        schoolId,
        feeAssignmentId,
        transactionId: charge.id,
        amount: typeof charge.amount === "number" ? charge.amount : 0,
        currency: charge.currency ?? null,
        paymentMethod: mapGatewayMethod(rail),
        gatewayMethod: rail,
        actor: "system:tap-webhook",
      })
      console.log(
        `[Tap webhook] fee_payment ${charge.id} → ${result.outcome}${"paymentId" in result ? ` (${result.paymentId})` : ""}`
      )
    } catch (err) {
      return releaseDedupeAndFail("fee payment", err)
    }
    return new Response(null, { status: 200 })
  }

  // ==========================================================================
  // registration_fee — offer acceptance fee on an Application
  // ==========================================================================
  if (paymentType === "registration_fee") {
    const applicationId = charge.metadata?.applicationId
    if (!applicationId || !schoolId) {
      console.error(
        `[Tap webhook] Charge ${charge.id} registration_fee missing applicationId/schoolId`
      )
      return new Response(null, { status: 200 })
    }
    if (failed) {
      console.log(
        `[Tap webhook] registration_fee ${charge.id} ${charge.status} — nothing recorded`
      )
      return new Response(null, { status: 200 })
    }
    try {
      const { settleRegistrationFee } =
        await import("@/components/school-marketing/application/offer/settle")
      const outcome = await settleRegistrationFee({
        applicationId,
        schoolId,
        method: "tap",
        reference: charge.id,
        amount: typeof charge.amount === "number" ? charge.amount : null,
      })
      console.log(
        `[Tap webhook] registration_fee ${charge.id} → ${outcome} (application ${applicationId})`
      )
    } catch (err) {
      return releaseDedupeAndFail("registration fee", err)
    }
    return new Response(null, { status: 200 })
  }

  // ==========================================================================
  // Legacy application_fee — tolerated for apps in flight (applying is free)
  // ==========================================================================
  if (paymentType === "application_fee") {
    const applicationId = charge.metadata?.applicationId
    if (!applicationId || !schoolId || failed) {
      return new Response(null, { status: 200 })
    }
    try {
      const { count } = await db.application.updateMany({
        where: { id: applicationId, schoolId, applicationFeePaid: false },
        data: {
          applicationFeePaid: true,
          paymentId: charge.id,
          paymentDate: new Date(),
        },
      })
      if (count === 0) {
        console.log(
          `[Tap webhook] applicationFeePaid already true for ${applicationId} — skipping`
        )
        return new Response(null, { status: 200 })
      }
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
      return releaseDedupeAndFail("application fee", err)
    }
    return new Response(null, { status: 200 })
  }

  console.log(
    `[Tap webhook] Charge ${charge.id} type=${charge.metadata?.type ?? "none"} context=${charge.metadata?.context ?? "none"} — no handler`
  )
  return new Response(null, { status: 200 })
}
