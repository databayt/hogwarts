// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"

import { canAccessStudent } from "@/app/api/mobile/lib/student-access"
import { GET } from "@/app/api/parent/report-cards/[id]/download/route"

// Mock all external deps. The route's behavior is composition; we
// drive each branch by toggling these mocks.
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    reportCard: { findFirst: vi.fn() },
  },
}))
vi.mock("@/components/file/providers/factory", () => ({
  getProvider: vi.fn(),
}))
vi.mock("@/app/api/mobile/lib/student-access", () => ({
  canAccessStudent: vi.fn(),
}))
vi.mock("@/app/api/mobile/auth/jwt", () => ({
  verifyToken: vi.fn(),
}))

const SCHOOL = "school-1"
const USER = "user-1"
const RC_ID = "rc-1"
const STUDENT = "stu-1"

function newReq(headers: Record<string, string> = {}) {
  // Path doesn't matter; the handler reads `params`, not the URL path.
  return new NextRequest(
    `http://localhost/api/parent/report-cards/${RC_ID}/download`,
    { headers }
  )
}

const params = Promise.resolve({ id: RC_ID })

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/parent/report-cards/[id]/download", () => {
  it("401 when no session and no Bearer token", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const res = await GET(newReq(), { params })
    expect(res.status).toBe(401)
  })

  it("404 when ReportCard id is missing in caller's school", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "GUARDIAN" },
    } as any)
    vi.mocked(db.reportCard.findFirst).mockResolvedValue(null as any)

    const res = await GET(newReq(), { params })
    expect(res.status).toBe(404)
    // Sanity: the where clause must include schoolId so cross-tenant
    // ids leak as 404, not 403 (which would confirm existence).
    expect(db.reportCard.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: RC_ID, schoolId: SCHOOL },
      })
    )
  })

  it("403 when ReportCard exists but is not yet published", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "GUARDIAN" },
    } as any)
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: RC_ID,
      studentId: STUDENT,
      pdfUrl: "https://s3.../foo.pdf",
      isPublished: false,
    } as any)

    const res = await GET(newReq(), { params })
    expect(res.status).toBe(403)
  })

  it("403 when caller is not linked to the student (canAccessStudent → false)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "GUARDIAN" },
    } as any)
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: RC_ID,
      studentId: STUDENT,
      pdfUrl: "https://s3.../foo.pdf",
      isPublished: true,
    } as any)
    vi.mocked(canAccessStudent).mockResolvedValue(false)

    const res = await GET(newReq(), { params })
    expect(res.status).toBe(403)
  })

  it("425 Too Early when PDF cron hasn't rendered yet", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "GUARDIAN" },
    } as any)
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: RC_ID,
      studentId: STUDENT,
      pdfUrl: null,
      isPublished: true,
    } as any)
    vi.mocked(canAccessStudent).mockResolvedValue(true)

    const res = await GET(newReq(), { params })
    expect(res.status).toBe(425)
    expect(res.headers.get("Retry-After")).toBe("60")
  })

  it("302 redirect to signed URL on the happy path", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "GUARDIAN" },
    } as any)
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: RC_ID,
      studentId: STUDENT,
      pdfUrl: "https://s3.amazonaws.com/bucket/report-cards/x.pdf",
      isPublished: true,
    } as any)
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    vi.mocked(getProvider).mockReturnValue({
      getName: () => "aws_s3" as const,
      upload: vi.fn(),
      delete: vi.fn(),
      supports: () => true,
      getSignedUrl: vi.fn().mockResolvedValue("https://signed-url.example/x"),
    } as any)

    const res = await GET(newReq(), { params })
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://signed-url.example/x")
  })

  it("falls back to raw pdfUrl when provider exposes no getSignedUrl", async () => {
    // Documents the graceful-degradation contract — if the signer
    // is unavailable (e.g. CloudflareR2 provider in the future) we
    // still serve the file, just without the expiry benefit.
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "GUARDIAN" },
    } as any)
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: RC_ID,
      studentId: STUDENT,
      pdfUrl: "https://s3.amazonaws.com/bucket/x.pdf",
      isPublished: true,
    } as any)
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    vi.mocked(getProvider).mockReturnValue({
      getName: () => "aws_s3" as const,
      upload: vi.fn(),
      delete: vi.fn(),
      supports: () => false,
      // No getSignedUrl on this stub
    } as any)

    const res = await GET(newReq(), { params })
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe(
      "https://s3.amazonaws.com/bucket/x.pdf"
    )
  })
})
