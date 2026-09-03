// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { authenticate } from "@/app/api/mobile/lib/authenticate"
import { canAccessStudent } from "@/app/api/mobile/lib/student-access"
import { GET } from "@/app/api/mobile/timetable/[userId]/route"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    studentClass: { findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))
vi.mock("@/app/api/mobile/lib/student-access", () => ({
  canAccessStudent: vi.fn(),
}))
// The live-class tier is best-effort and irrelevant to access control; stub the
// term resolver so the route's try-block short-circuits without a DB shape.
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn(async () => ({ term: null, source: "none" })),
}))

const SCHOOL = "school-1"
const CALLER = "user-caller"
const TARGET = "user-target"

function req() {
  return new NextRequest(`http://x/api/mobile/timetable/${TARGET}`)
}
const params = Promise.resolve({ userId: TARGET })

function asStudent(role = "STUDENT", userId = CALLER) {
  vi.mocked(authenticate).mockResolvedValue({
    userId,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.timetable.findMany).mockResolvedValue([] as never)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "UTC",
  } as never)
  vi.mocked(db.studentClass.findMany).mockResolvedValue([] as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue(null as never)
})

describe("GET /api/mobile/timetable/[userId] — access control", () => {
  it("403s when a student asks for another student's timetable", async () => {
    asStudent()
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-other",
      sectionId: "sec-1",
    } as never)
    vi.mocked(canAccessStudent).mockResolvedValue(false)

    const res = await GET(req(), { params })

    expect(res.status).toBe(403)
    // The whole point: no slot query is ever issued for a denied caller.
    expect(db.timetable.findMany).not.toHaveBeenCalled()
  })

  it("serves a student their own timetable", async () => {
    asStudent()
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-self",
      sectionId: "sec-1",
    } as never)
    vi.mocked(canAccessStudent).mockResolvedValue(true)

    const res = await GET(req(), { params })

    expect(res.status).toBe(200)
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: CALLER, schoolId: SCHOOL }),
      "stu-self"
    )
  })

  it("403s when a student asks for a teacher's schedule", async () => {
    asStudent()
    vi.mocked(db.student.findFirst).mockResolvedValue(null as never)
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "tea-1" } as never)

    const res = await GET(req(), { params })

    expect(res.status).toBe(403)
    expect(db.timetable.findMany).not.toHaveBeenCalled()
  })

  it("lets an ADMIN read a teacher's schedule", async () => {
    asStudent("ADMIN")
    vi.mocked(db.student.findFirst).mockResolvedValue(null as never)
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "tea-1" } as never)

    const res = await GET(req(), { params })

    expect(res.status).toBe(200)
    expect(db.timetable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teacherId: "tea-1" }),
      })
    )
  })

  it("lets a teacher read their own schedule", async () => {
    asStudent("TEACHER", TARGET) // caller IS the target
    vi.mocked(db.student.findFirst).mockResolvedValue(null as never)
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "tea-1" } as never)

    const res = await GET(req(), { params })

    expect(res.status).toBe(200)
  })
})

describe("GET /api/mobile/timetable/[userId] — both slot axes", () => {
  beforeEach(() => {
    asStudent()
    vi.mocked(canAccessStudent).mockResolvedValue(true)
  })

  it("reads a legacy student with classes but NO section", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-legacy",
      sectionId: null,
    } as never)
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { classId: "cls-1" },
      { classId: "cls-2" },
    ] as never)

    const res = await GET(req(), { params })

    expect(res.status).toBe(200)
    // Before the fix this student's week came back empty — no sectionId meant
    // no query at all.
    expect(db.timetable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ classId: { in: ["cls-1", "cls-2"] } }],
        }),
      })
    )
  })

  it("ORs both axes when the student has a section AND enrollments", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-both",
      sectionId: "sec-9",
    } as never)
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { classId: "cls-1" },
    ] as never)

    await GET(req(), { params })

    expect(db.timetable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ sectionId: "sec-9" }, { classId: { in: ["cls-1"] } }],
        }),
      })
    )
  })

  it("returns empty when the student has neither axis", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-empty",
      sectionId: null,
    } as never)

    const res = await GET(req(), { params })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [] })
    expect(db.timetable.findMany).not.toHaveBeenCalled()
  })
})
