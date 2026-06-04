// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"

import { canAccessStudent } from "../../../../mobile/lib/student-access"
import { GET } from "../route"

vi.mock("@/lib/db", () => ({
  db: { examCertificate: { findFirst: vi.fn() } },
}))
vi.mock("@/components/file/providers/factory", () => ({ getProvider: vi.fn() }))
vi.mock("../../../../mobile/auth/jwt", () => ({ verifyToken: vi.fn() }))
vi.mock("../../../../mobile/lib/student-access", () => ({
  canAccessStudent: vi.fn(),
}))

const SCHOOL = "test-school-id" // matches the global auth mock

function req() {
  return new NextRequest("http://localhost/api/certificates/cert-1/download")
}
function ctx(id = "cert-1") {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Global auth mock already returns an ADMIN session for this school.
  vi.mocked(canAccessStudent).mockResolvedValue(true)
  vi.mocked(getProvider).mockReturnValue({
    upload: vi.fn(),
    // no getSignedUrl → route falls back to a raw-URL redirect
  } as never)
})

describe("GET /api/certificates/:id/download", () => {
  it("401 when there is no session and no bearer token", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const res = await GET(req(), ctx())
    expect(res.status).toBe(401)
  })

  it("404 for a cross-tenant / unknown certificate (schoolId-scoped lookup)", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue(null)
    const res = await GET(req(), ctx("cert-x"))
    expect(res.status).toBe(404)
    const where = vi.mocked(db.examCertificate.findFirst).mock.calls[0][0]
    expect((where as { where: Record<string, unknown> }).where).toMatchObject({
      id: "cert-x",
      schoolId: SCHOOL,
    })
  })

  it("403 for a revoked certificate", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      studentId: "stu-1",
      pdfUrl: "https://cdn/x.pdf",
      status: "revoked",
    } as never)
    const res = await GET(req(), ctx())
    expect(res.status).toBe(403)
  })

  it("403 when the caller cannot access the student", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      studentId: "stu-1",
      pdfUrl: "https://cdn/x.pdf",
      status: "active",
    } as never)
    vi.mocked(canAccessStudent).mockResolvedValue(false)
    const res = await GET(req(), ctx())
    expect(res.status).toBe(403)
  })

  it("425 when the PDF has not been rendered yet", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      studentId: "stu-1",
      pdfUrl: null,
      status: "active",
    } as never)
    const res = await GET(req(), ctx())
    expect(res.status).toBe(425)
  })

  it("302 redirects to the PDF for an authorized caller", async () => {
    vi.mocked(db.examCertificate.findFirst).mockResolvedValue({
      id: "cert-1",
      studentId: "stu-1",
      pdfUrl: "https://cdn/x.pdf",
      status: "active",
    } as never)
    const res = await GET(req(), ctx())
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://cdn/x.pdf")
  })
})
