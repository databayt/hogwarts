// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { authenticate } from "@/app/api/mobile/lib/authenticate"
import { POST } from "@/app/api/mobile/attendance/mark/route"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    section: { findFirst: vi.fn() },
    attendance: { upsert: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))

const SCHOOL = "school-1"
const USER = "user-1"

function makeReq(body: unknown = {}) {
  return new NextRequest("http://x/api/mobile/attendance/mark", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("POST /api/mobile/attendance/mark", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authenticate).mockResolvedValue({
      userId: USER,
      email: "t@e.com",
      schoolId: SCHOOL,
      role: "TEACHER",
    })
  })

  it("returns auth error response when authenticate fails", async () => {
    const errResp = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
    vi.mocked(authenticate).mockResolvedValue(errResp)

    const res = await POST(makeReq({ student_id: "s1", status: "PRESENT" }))

    expect(res.status).toBe(401)
  })

  it("rejects STUDENT role (403)", async () => {
    vi.mocked(authenticate).mockResolvedValue({
      userId: USER,
      email: "x",
      schoolId: SCHOOL,
      role: "STUDENT",
    })

    const res = await POST(makeReq({ student_id: "s1", status: "PRESENT" }))

    expect(res.status).toBe(403)
  })

  it("rejects GUARDIAN role (403)", async () => {
    vi.mocked(authenticate).mockResolvedValue({
      userId: USER,
      email: "x",
      schoolId: SCHOOL,
      role: "GUARDIAN",
    })

    const res = await POST(makeReq({ student_id: "s1", status: "PRESENT" }))

    expect(res.status).toBe(403)
  })

  it("accepts TEACHER, ADMIN, STAFF, DEVELOPER", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
    vi.mocked(db.attendance.upsert).mockResolvedValue({} as any)

    for (const role of ["TEACHER", "ADMIN", "STAFF", "DEVELOPER"]) {
      vi.mocked(authenticate).mockResolvedValue({
        userId: USER,
        email: "x",
        schoolId: SCHOOL,
        role,
      })

      const res = await POST(makeReq({ student_id: "s1", status: "PRESENT" }))

      expect(res.status).not.toBe(403)
    }
  })

  it("returns 400 when student_id missing", async () => {
    const res = await POST(makeReq({ status: "PRESENT" }))

    expect(res.status).toBe(400)
  })

  it("returns 400 when status missing", async () => {
    const res = await POST(makeReq({ student_id: "s1" }))

    expect(res.status).toBe(400)
  })

  it("returns 404 when student is not in this school (cross-tenant attempt)", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null)

    const res = await POST(
      makeReq({ student_id: "s-other", status: "PRESENT" })
    )

    expect(res.status).toBe(404)
  })

  it("scopes student lookup by schoolId from token", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null)

    await POST(makeReq({ student_id: "s1", status: "PRESENT" }))

    expect(db.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "s1", schoolId: SCHOOL },
        select: { id: true },
      })
    )
  })

  it("upserts attendance with schoolId from token (not from request body)", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
    vi.mocked(db.attendance.upsert).mockResolvedValue({} as any)

    await POST(makeReq({ student_id: "s1", status: "PRESENT" }))

    const call = vi.mocked(db.attendance.upsert).mock.calls[0]?.[0]
    expect((call?.create as any)?.schoolId).toBe(SCHOOL)
    expect((call?.create as any)?.studentId).toBe("s1")
    expect((call?.create as any)?.markedBy).toBe(USER)
  })
})
