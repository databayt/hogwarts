// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ADEK eSIS async-receipt webhook.
 *
 * When ADEK eventually publishes a developer contract, this is the endpoint
 * they POST to when a previously-SUBMITTED submission moves to ACCEPTED or
 * REJECTED. Idempotency via `ProcessedWebhookEvent.(provider, providerEventId)`.
 *
 * Signature: HMAC-SHA256 over raw body, expected header `x-adek-signature`,
 * constant-time compare. `ADEK_WEBHOOK_SECRET` env var. If unset in production
 * we refuse; in dev we accept with a warning.
 *
 * Body shape is provisional — refine when ADEK shares the contract.
 */

import crypto, { timingSafeEqual } from "node:crypto"
import { ComplianceSubmissionStatus, Prisma } from "@prisma/client"

import { logAudit } from "@/lib/audit-log"
import { ComplianceAudit } from "@/lib/compliance/audit-actions"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

interface AdekWebhookPayload {
  eventId: string
  type: "submission.accepted" | "submission.rejected" | string
  submissionRef: string // matches our ComplianceSubmission.id OR a value we sent in payload
  receiptId?: string | null
  errorCode?: string | null
  errorMessage?: string | null
}

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.ADEK_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[webhooks/adek] ADEK_WEBHOOK_SECRET unset in production — refusing"
      )
      return false
    }
    console.warn("[webhooks/adek] ADEK_WEBHOOK_SECRET unset — accepting (dev)")
    return true
  }
  if (!signature) return false

  const computed = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("hex")
  const provided = signature.toLowerCase().replace(/^sha256=/, "")
  if (provided.length !== computed.length) return false
  try {
    return timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(computed, "utf8")
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature =
    request.headers.get("x-adek-signature") ??
    request.headers.get("X-Adek-Signature")
  if (!verifySignature(body, signature)) {
    return new Response("Invalid ADEK signature", { status: 400 })
  }

  let payload: AdekWebhookPayload
  try {
    payload = JSON.parse(body) as AdekWebhookPayload
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }
  if (!payload.eventId || !payload.submissionRef || !payload.type) {
    return new Response("Missing eventId / submissionRef / type", {
      status: 400,
    })
  }

  // Idempotency
  try {
    await db.processedWebhookEvent.create({
      data: {
        provider: "adek",
        providerEventId: payload.eventId,
        eventType: payload.type,
        schoolId: null,
        payload: payload as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      // Already processed — ack
      return new Response(null, { status: 200 })
    }
    console.error("[webhooks/adek] dedupe insert failed (continuing):", error)
  }

  const submission = await db.complianceSubmission.findUnique({
    where: { id: payload.submissionRef },
  })
  if (!submission) {
    // Unknown ref — ack anyway, alert by log
    console.error(
      "[webhooks/adek] Unknown submissionRef:",
      payload.submissionRef
    )
    return new Response(null, { status: 200 })
  }

  let nextStatus: ComplianceSubmissionStatus
  let auditAction: string
  if (payload.type === "submission.accepted") {
    nextStatus = ComplianceSubmissionStatus.ACCEPTED
    auditAction = ComplianceAudit.SUBMISSION_ACCEPTED
  } else if (payload.type === "submission.rejected") {
    nextStatus = ComplianceSubmissionStatus.REJECTED
    auditAction = ComplianceAudit.SUBMISSION_REJECTED
  } else {
    return new Response(null, { status: 200 })
  }

  await db.complianceSubmission.update({
    where: { id: submission.id },
    data: {
      status: nextStatus,
      receiptId: payload.receiptId ?? submission.receiptId,
      errorCode: payload.errorCode ?? submission.errorCode,
      errorMessage: payload.errorMessage ?? submission.errorMessage,
      acknowledgedAt: new Date(),
    },
  })

  await logAudit({
    action: auditAction,
    entityType: "ComplianceSubmission",
    entityId: submission.id,
    userId: null,
    schoolId: submission.schoolId,
    metadata: {
      receiptId: payload.receiptId,
      errorCode: payload.errorCode,
      type: payload.type,
    },
  })

  return new Response(null, { status: 200 })
}
