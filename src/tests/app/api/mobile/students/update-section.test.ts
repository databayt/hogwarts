// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { syncStudentSubjectEnrollments } from "@/lib/enrollment-sync"
import { PUT } from "@/app/api/mobile/students/[studentId]/route"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn(), update: vi.fn() },
    section: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/enrollment-sync", () => ({
  syncStudentSubjectEnrollments: vi
    .fn()
    .mockResolvedValue({ subjectIds: [], created: 0 }),
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "user-1",
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const put = (body: unknown) =>
  PUT(
    new NextRequest("http://localhost/api/mobile/students/student-1", {
      method: "PUT",
      headers: { Authorization: "Bearer test" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ studentId: "student-1" }) }
  )

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.student.findFirst).mockResolvedValue({
    id: "student-1",
  } as never)
  vi.mocked(db.student.update).mockResolvedValue({
    id: "student-1",
    firstName: "A",
    lastName: "B",
    status: "ACTIVE",
  } as never)
})

describe("PUT /api/mobile/students/[studentId] — section placement", () => {
  it("rejects another school's section", async () => {
    await authAs("ADMIN")
    vi.mocked(db.section.findFirst).mockResolvedValue(null)

    const res = await put({ section_id: "foreign-section" })

    expect(res.status).toBe(400)
    expect(db.section.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign-section", schoolId: SCHOOL },
      select: { id: true },
    })
    expect(db.student.update).not.toHaveBeenCalled()
  })

  it("places the student in one of this school's sections", async () => {
    await authAs("ADMIN")
    vi.mocked(db.section.findFirst).mockResolvedValue({ id: "sec-1" } as never)

    const res = await put({ section_id: "sec-1" })

    expect(res.status).toBe(200)
    expect(db.student.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "student-1", schoolId: SCHOOL },
        data: { sectionId: "sec-1" },
      })
    )
    // The section's grade subjects reach the LMS
    expect(syncStudentSubjectEnrollments).toHaveBeenCalledWith(
      SCHOOL,
      "student-1"
    )
  })

  it("accepts null to unplace", async () => {
    await authAs("ADMIN")

    const res = await put({ section_id: null })

    expect(res.status).toBe(200)
    expect(db.section.findFirst).not.toHaveBeenCalled()
    expect(db.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sectionId: null } })
    )
    expect(syncStudentSubjectEnrollments).not.toHaveBeenCalled()
  })
})
