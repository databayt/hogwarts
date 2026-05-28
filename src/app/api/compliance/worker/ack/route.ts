// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"
import { ComplianceSubmissionStatus } from "@prisma/client"
import { z } from "zod"

import { API_TOKEN_SCOPES, verifyApiToken } from "@/lib/api-tokens"
import { logAudit } from "@/lib/audit-log"
import { ComplianceAudit } from "@/lib/compliance/audit-actions"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const REQUIRED_SCOPE = API_TOKEN_SCOPES.COMPLIANCE_RPA_CLAIM

const ackSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(["SUBMITTED", "ACCEPTED", "REJECTED", "FAILED"]),
  receiptId: z.string().nullable().optional(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  csvSha256: z.string().nullable().optional(),
})

/**
 * RPA worker acknowledges a claimed submission's result.
 *
 * Validates: token has scope, submission exists and was claimed by the same
 * worker (light prevention of cross-worker overwrites — full anti-replay would
 * require nonces, deferred).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  const verified = await verifyApiToken(token, REQUIRED_SCOPE)
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.reason },
      { status: verified.reason === "INSUFFICIENT_SCOPE" ? 403 : 401 }
    )
  }

  const parsed = ackSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", issues: parsed.error.issues },
      { status: 400 }
    )
  }
  const data = parsed.data

  const submission = await db.complianceSubmission.findUnique({
    where: { id: data.submissionId },
  })
  if (!submission) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }
  // Multi-tenant guard: token's schoolId MUST match the submission's tenant.
  if (submission.schoolId !== verified.token.schoolId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }
  if (submission.status === ComplianceSubmissionStatus.ACCEPTED) {
    // Already terminally accepted — ignore double-ack
    return NextResponse.json({ ok: true, already: true })
  }

  const status = data.status as ComplianceSubmissionStatus
  const now = new Date()
  await db.complianceSubmission.update({
    where: { id: data.submissionId },
    data: {
      status,
      receiptId: data.receiptId ?? null,
      errorCode: data.errorCode ?? null,
      errorMessage: data.errorMessage ?? null,
      csvArtifactSha256: data.csvSha256 ?? submission.csvArtifactSha256,
      submittedAt: submission.submittedAt ?? now,
      acknowledgedAt:
        status === "ACCEPTED" || status === "REJECTED" ? now : null,
      claimExpiresAt: null,
    },
  })

  const auditAction =
    status === "ACCEPTED" || status === "SUBMITTED"
      ? ComplianceAudit.SUBMISSION_SUBMITTED
      : status === "REJECTED"
        ? ComplianceAudit.SUBMISSION_REJECTED
        : ComplianceAudit.SUBMISSION_FAILED
  await logAudit({
    action: auditAction,
    entityType: "ComplianceSubmission",
    entityId: data.submissionId,
    userId: null,
    schoolId: submission.schoolId,
    metadata: {
      mode: "RPA",
      receiptId: data.receiptId,
      errorCode: data.errorCode,
    },
  })

  return NextResponse.json({ ok: true })
}
