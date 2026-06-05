// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { authenticate } from "../../../lib/authenticate"
import { POST } from "../route"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: { findFirst: vi.fn() },
    attendanceExcuse: { findUnique: vi.fn(), create: vi.fn() },
    studentGuardian: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}))
vi.mock("../../../lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))

const SCHOOL = "school-1"

function makeReq(body: unknown = {}) {
  return new NextRequest("http://x/api/mobile/attendance/excuses", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

function asGuardian(userId = "g-user") {
  vi.mocked(authenticate).mockResolvedValue({
    userId,
    email: "g@e.com",
    schoolId: SCHOOL,
    role: "GUARDIAN",
  })
}

describe("POST /api/mobile/attendance/excuses — guardian gate (P1)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    asGuardian()
    vi.mocked(db.attendance.findFirst).mockResolvedValue({
      id: "att-1",
      studentId: "stu-1",
    } as never)
    vi.mocked(db.attendanceExcuse.findUnique).mockResolvedValue(null as never)
    vi.mocked(db.attendanceExcuse.create).mockResolvedValue({
      id: "exc-1",
      attendanceId: "att-1",
      reason: "MEDICAL",
      description: null,
      attachments: [],
      status: "PENDING",
      submittedBy: "g-user",
      submittedAt: new Date(),
    } as never)
  })

  it("400 on invalid body (Zod: bad reason)", async () => {
    const res = await POST(
      makeReq({ attendance_id: "att-1", reason: "NOT_A_REASON" })
    )
    expect(res.status).toBe(400)
    expect(db.attendanceExcuse.create).not.toHaveBeenCalled()
  })

  it("403 when the guardian is NOT linked to the student", async () => {
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValue(null as never) // no link
    const res = await POST(
      makeReq({ attendance_id: "att-1", reason: "MEDICAL" })
    )
    expect(res.status).toBe(403)
    // Must not write an excuse for a student the caller isn't linked to.
    expect(db.attendanceExcuse.create).not.toHaveBeenCalled()
  })

  it("201 when the guardian IS linked to the student", async () => {
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValue({
      id: "link-1",
    } as never)
    const res = await POST(
      makeReq({ attendance_id: "att-1", reason: "MEDICAL" })
    )
    expect(res.status).toBe(201)
    expect(db.attendanceExcuse.create).toHaveBeenCalled()
  })

  it("404 when the attendance row is not in the caller's school", async () => {
    vi.mocked(db.attendance.findFirst).mockResolvedValue(null as never)
    const res = await POST(
      makeReq({ attendance_id: "missing", reason: "MEDICAL" })
    )
    expect(res.status).toBe(404)
    expect(db.attendanceExcuse.create).not.toHaveBeenCalled()
  })
})
