// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"
import { canAccessStudent } from "@/app/api/mobile/lib/student-access"

vi.mock("@/lib/db", () => ({
  db: { reportCard: { findFirst: vi.fn() } },
}))
vi.mock("@/components/file/providers/factory", () => ({
  getProvider: vi.fn(),
}))
vi.mock("@/app/api/mobile/lib/student-access", () => ({
  canAccessStudent: vi.fn(),
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const params = { params: Promise.resolve({ id: "rc-1" }) }
const req = () =>
  new NextRequest("http://localhost/api/mobile/report-cards/rc-1/pdf", {
    headers: { Authorization: "Bearer test" },
  })

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "user-1",
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/mobile/report-cards/:id/pdf", () => {
  it("401 when unauthenticated (revoked or missing token)", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Token revoked" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/report-cards/[id]/pdf/route")
    expect((await GET(req(), params)).status).toBe(401)
  })

  it("404 for a card outside the caller's school", async () => {
    await authAs("GUARDIAN")
    vi.mocked(db.reportCard.findFirst).mockResolvedValue(null)
    const { GET } = await import("@/app/api/mobile/report-cards/[id]/pdf/route")
    expect((await GET(req(), params)).status).toBe(404)
    expect(db.reportCard.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rc-1", schoolId: SCHOOL } })
    )
  })

  it("403 when the student is not the caller's", async () => {
    await authAs("GUARDIAN")
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: "rc-1",
      studentId: "stu-9",
      pdfUrl: "https://b.s3.amazonaws.com/rc.pdf",
      isPublished: true,
    } as never)
    vi.mocked(canAccessStudent).mockResolvedValue(false)
    const { GET } = await import("@/app/api/mobile/report-cards/[id]/pdf/route")
    expect((await GET(req(), params)).status).toBe(403)
  })

  it("425 while the PDF is not rendered yet", async () => {
    await authAs("STUDENT")
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: "rc-1",
      studentId: "stu-1",
      pdfUrl: null,
      isPublished: true,
    } as never)
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    const { GET } = await import("@/app/api/mobile/report-cards/[id]/pdf/route")
    const res = await GET(req(), params)
    expect(res.status).toBe(425)
    expect(res.headers.get("Retry-After")).toBe("60")
  })

  it("302 to a signed URL", async () => {
    await authAs("STUDENT")
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: "rc-1",
      studentId: "stu-1",
      pdfUrl: "https://b.s3.amazonaws.com/rc.pdf",
      isPublished: true,
    } as never)
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    vi.mocked(getProvider).mockReturnValue({
      getSignedUrl: vi.fn().mockResolvedValue("https://signed.example/rc.pdf"),
    } as never)
    const { GET } = await import("@/app/api/mobile/report-cards/[id]/pdf/route")
    const res = await GET(req(), params)
    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("https://signed.example/rc.pdf")
  })
})
