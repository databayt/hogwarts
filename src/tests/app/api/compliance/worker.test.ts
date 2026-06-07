// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  ComplianceProvider,
  ComplianceSubmissionStatus,
  ConnectorMode,
} from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { verifyApiToken } from "@/lib/api-tokens"
import { buildPayloadForDay } from "@/lib/compliance/orchestrator"
import { db } from "@/lib/db"

import { POST as claimRoute } from "@/app/api/compliance/worker/claim/route"

vi.mock("@/lib/api-tokens", () => ({
  API_TOKEN_SCOPES: { COMPLIANCE_RPA_CLAIM: "compliance.rpa_claim" },
  verifyApiToken: vi.fn(),
}))
vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/compliance/audit-actions", () => ({
  ComplianceAudit: {
    SUBMISSION_CLAIMED: "compliance.submission.claimed",
    SUBMISSION_SUBMITTED: "compliance.submission.submitted",
    SUBMISSION_ACCEPTED: "compliance.submission.accepted",
    SUBMISSION_REJECTED: "compliance.submission.rejected",
    SUBMISSION_FAILED: "compliance.submission.failed",
  },
}))
vi.mock("@/lib/compliance/encryption", () => ({
  decryptSecret: vi.fn(() => '{"apiKey":"x"}'),
}))
vi.mock("@/lib/compliance/orchestrator", () => ({
  buildPayloadForDay: vi.fn(),
}))
vi.mock("@/lib/compliance/providers/adek/dry-run", () => ({
  buildAdekArtifact: vi.fn(() => ({
    csv: "csv-data",
    sha: "sha256-hash",
    studentCount: 1,
    absentCount: 0,
    categorized: {},
  })),
}))
vi.mock("@/lib/db", () => ({
  db: {
    complianceSubmission: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    schoolComplianceConfig: { findUnique: vi.fn() },
    sharedComplianceCredentialGroup: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock("next/server", async () => {
  const real =
    await vi.importActual<typeof import("next/server")>("next/server")
  return {
    ...real,
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) =>
        new Response(JSON.stringify(data), { status: init?.status ?? 200 }),
    },
  }
})

const TOKEN_SCHOOL = "school-1"

function bearer(
  token = "valid-token",
  body: object = { workerId: "worker-1" }
) {
  return new Request("http://x", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

describe("POST /api/compliance/worker/claim (RPA worker)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifyApiToken).mockResolvedValue({
      ok: true,
      token: { schoolId: TOKEN_SCHOOL, id: "tok-1" },
    } as any)
    vi.mocked(buildPayloadForDay).mockResolvedValue({
      schoolId: TOKEN_SCHOOL,
      schoolName: "Yasmina BA",
      schoolExternalRef: null,
      submissionDate: new Date("2026-05-28"),
      records: [],
    } as any)
  })

  it("returns 401 when token verification fails", async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({
      ok: false,
      reason: "INVALID_TOKEN",
    } as any)

    const res = await claimRoute(bearer())

    expect(res.status).toBe(401)
  })

  it("returns 403 when scope is insufficient", async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({
      ok: false,
      reason: "INSUFFICIENT_SCOPE",
    } as any)

    const res = await claimRoute(bearer())

    expect(res.status).toBe(403)
  })

  it("returns null submission when no candidates", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue(null)

    const res = await claimRoute(bearer())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.submission).toBeNull()
  })

  it("CRITICAL: scopes candidate query by token's schoolId only", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue(null)

    await claimRoute(bearer())

    const call = vi.mocked(db.complianceSubmission.findFirst).mock.calls[0]?.[0]
    expect((call?.where as any)?.schoolId).toBe(TOKEN_SCHOOL)
    expect((call?.where as any)?.status).toBe(ComplianceSubmissionStatus.QUEUED)
    expect((call?.where as any)?.mode).toBe(ConnectorMode.RPA)
  })

  it("returns null when claim race lost (count=0)", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
      id: "sub-1",
      schoolId: TOKEN_SCHOOL,
      provider: ComplianceProvider.ADEK_ESIS,
      submissionDate: new Date("2026-05-28"),
    } as any)
    vi.mocked(db.complianceSubmission.updateMany).mockResolvedValue({
      count: 0,
    } as any)

    const res = await claimRoute(bearer())
    const body = await res.json()

    expect(body.submission).toBeNull()
  })

  it("returns submission + lease when claim succeeds", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
      id: "sub-1",
      schoolId: TOKEN_SCHOOL,
      provider: ComplianceProvider.ADEK_ESIS,
      submissionDate: new Date("2026-05-28"),
    } as any)
    vi.mocked(db.complianceSubmission.updateMany).mockResolvedValue({
      count: 1,
    } as any)
    vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
      sharedGroupId: null,
    } as any)
    vi.mocked(db.complianceSubmission.update).mockResolvedValue({} as any)

    const res = await claimRoute(bearer())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.submission?.id).toBe("sub-1")
    expect(body.submission?.leaseExpiresAt).toBeDefined()
    expect(body.submission?.csv).toBe("csv-data")
  })

  it("does NOT decrypt creds when no sharedGroup", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
      id: "sub-1",
      schoolId: TOKEN_SCHOOL,
      provider: ComplianceProvider.ADEK_ESIS,
      submissionDate: new Date("2026-05-28"),
    } as any)
    vi.mocked(db.complianceSubmission.updateMany).mockResolvedValue({
      count: 1,
    } as any)
    vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
      sharedGroupId: null,
    } as any)

    const res = await claimRoute(bearer())
    const body = await res.json()

    expect(body.credentials).toBeNull()
  })

  it("does NOT decrypt creds when circuit breaker is OPEN", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
      id: "sub-1",
      schoolId: TOKEN_SCHOOL,
      provider: ComplianceProvider.ADEK_ESIS,
      submissionDate: new Date("2026-05-28"),
    } as any)
    vi.mocked(db.complianceSubmission.updateMany).mockResolvedValue({
      count: 1,
    } as any)
    vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
      sharedGroupId: "grp-1",
    } as any)
    vi.mocked(db.sharedComplianceCredentialGroup.findUnique).mockResolvedValue({
      encryptedSecret: "enc",
      keyVersion: 1,
      circuitBreakerState: "OPEN",
    } as any)

    const res = await claimRoute(bearer())
    const body = await res.json()

    expect(body.credentials).toBeNull()
  })

  it("decrypts and returns credentials when sharedGroup CLOSED", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
      id: "sub-1",
      schoolId: TOKEN_SCHOOL,
      provider: ComplianceProvider.ADEK_ESIS,
      submissionDate: new Date("2026-05-28"),
    } as any)
    vi.mocked(db.complianceSubmission.updateMany).mockResolvedValue({
      count: 1,
    } as any)
    vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
      sharedGroupId: "grp-1",
    } as any)
    vi.mocked(db.sharedComplianceCredentialGroup.findUnique).mockResolvedValue({
      encryptedSecret: "enc-data",
      keyVersion: 1,
      circuitBreakerState: "CLOSED",
    } as any)

    const res = await claimRoute(bearer())
    const body = await res.json()

    expect(body.credentials).toBe('{"apiKey":"x"}')
  })

  it("uses 10-minute lease", async () => {
    vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
      id: "sub-1",
      schoolId: TOKEN_SCHOOL,
      provider: ComplianceProvider.ADEK_ESIS,
      submissionDate: new Date("2026-05-28"),
    } as any)
    vi.mocked(db.complianceSubmission.updateMany).mockResolvedValue({
      count: 1,
    } as any)
    vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
      sharedGroupId: null,
    } as any)

    await claimRoute(bearer())

    const updateCall = vi.mocked(db.complianceSubmission.updateMany).mock
      .calls[0]?.[0]
    const data = updateCall?.data as any
    const claimedAt = data?.claimedAt as Date
    const expiresAt = data?.claimExpiresAt as Date
    const diffMin = (expiresAt.getTime() - claimedAt.getTime()) / 1000 / 60

    expect(diffMin).toBe(10)
  })
})
