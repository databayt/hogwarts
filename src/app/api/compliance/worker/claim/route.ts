// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"
import { ComplianceSubmissionStatus, ConnectorMode } from "@prisma/client"

import { API_TOKEN_SCOPES, verifyApiToken } from "@/lib/api-tokens"
import { logAudit } from "@/lib/audit-log"
import { ComplianceAudit } from "@/lib/compliance/audit-actions"
import { decryptSecret } from "@/lib/compliance/encryption"
import { buildPayloadForDay } from "@/lib/compliance/orchestrator"
import { buildAdekArtifact } from "@/lib/compliance/providers/adek/dry-run"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

const REQUIRED_SCOPE = API_TOKEN_SCOPES.COMPLIANCE_RPA_CLAIM
const LEASE_MS = 10 * 60 * 1000 // 10 minutes

/**
 * RPA worker claims the next eligible submission.
 *
 * Auth: Bearer SchoolApiToken with scope `compliance.rpa_claim`.
 * Concurrency: optimistic lock — `where { status: QUEUED, claimExpiresAt: lt now }`
 *   then SET claimedByWorkerId/claimedAt/claimExpiresAt. If another worker took
 *   the row first, `updateMany` returns count=0 and we move to the next row.
 *
 * Returns the submission payload (today's attendance + categorization) AND the
 * decrypted credentials needed to submit. The worker never persists creds to
 * disk — they live only in memory of the worker process for the session.
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
  const body = await request.json().catch(() => ({}))
  const workerId =
    typeof body?.workerId === "string" ? body.workerId : "unknown"

  const now = new Date()
  const expiresAt = new Date(now.getTime() + LEASE_MS)

  // Find a row to claim — MUST be scoped to the token's tenant.
  // The token's schoolId is the source of truth — never trust request body.
  const tenantSchoolId = verified.token.schoolId

  const candidate = await db.complianceSubmission.findFirst({
    where: {
      schoolId: tenantSchoolId,
      status: ComplianceSubmissionStatus.QUEUED,
      mode: ConnectorMode.RPA,
      OR: [{ claimExpiresAt: null }, { claimExpiresAt: { lt: now } }],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, schoolId: true, provider: true, submissionDate: true },
  })
  if (!candidate) {
    return NextResponse.json({ submission: null })
  }

  const claim = await db.complianceSubmission.updateMany({
    where: {
      id: candidate.id,
      schoolId: tenantSchoolId,
      status: ComplianceSubmissionStatus.QUEUED,
      OR: [{ claimExpiresAt: null }, { claimExpiresAt: { lt: now } }],
    },
    data: {
      status: ComplianceSubmissionStatus.IN_FLIGHT,
      claimedByWorkerId: workerId,
      claimedAt: now,
      claimExpiresAt: expiresAt,
    },
  })
  if (claim.count === 0) {
    // Lost the race — let the worker try again
    return NextResponse.json({ submission: null })
  }

  await logAudit({
    action: ComplianceAudit.SUBMISSION_CLAIMED,
    entityType: "ComplianceSubmission",
    entityId: candidate.id,
    userId: null,
    schoolId: candidate.schoolId,
    metadata: { workerId, leaseExpiresAt: expiresAt },
  })

  // Resolve credentials — PIGGYBACK uses shared group, OFFICIAL+RPA can use
  // either. RPA in our schema pairs with a sharedGroup (Aldar pilot pattern).
  const config = await db.schoolComplianceConfig.findUnique({
    where: {
      schoolId_provider: {
        schoolId: candidate.schoolId,
        provider: candidate.provider,
      },
    },
    select: { sharedGroupId: true },
  })

  let credentialsJson: string | null = null
  if (config?.sharedGroupId) {
    const group = await db.sharedComplianceCredentialGroup.findUnique({
      where: { id: config.sharedGroupId },
      select: {
        encryptedSecret: true,
        keyVersion: true,
        circuitBreakerState: true,
      },
    })
    if (group && group.circuitBreakerState !== "OPEN") {
      try {
        credentialsJson = decryptSecret(group.encryptedSecret, group.keyVersion)
      } catch (error) {
        console.error("[claim] cred decrypt failed:", error)
      }
    }
  }

  // Build today's payload using the orchestrator's canonical builder —
  // this includes rolling-30d absence% needed for ADEK cause-for-concern.
  const payload = await buildPayloadForDay(
    candidate.schoolId,
    candidate.submissionDate
  )
  const artifact = buildAdekArtifact(payload)

  // Persist the CSV inline so admins can audit-download what was sent.
  await db.complianceSubmission.update({
    where: { id: candidate.id },
    data: {
      csvArtifactContent: artifact.csv,
      csvArtifactSha256: artifact.sha,
      payloadStudentCount: artifact.studentCount,
      payloadAbsentCount: artifact.absentCount,
      payloadCategorized: artifact.categorized as object,
    },
  })

  return NextResponse.json({
    submission: {
      id: candidate.id,
      schoolId: candidate.schoolId,
      provider: candidate.provider,
      submissionDate: payload.submissionDate.toISOString(),
      leaseExpiresAt: expiresAt.toISOString(),
      csv: artifact.csv,
      csvSha256: artifact.sha,
      categorized: artifact.categorized,
    },
    credentials: credentialsJson,
  })
}
