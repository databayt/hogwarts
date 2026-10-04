// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { updateTeacherExpertise } from "@/components/school-dashboard/listings/teachers/wizard/expertise/actions"

vi.mock("@/lib/db", () => {
  const db = {
    teacher: { findFirst: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    teacherSubjectExpertise: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  }
  db.$transaction.mockImplementation((fn: (tx: typeof db) => unknown) => fn(db))
  return { db }
})

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => undefined }),
}))

const SCHOOL_ID = "school-1"
const TEACHER = { id: "teacher-1", userId: "teacher-user" }
const MATH = { subjectId: "subject-math", expertiseLevel: "PRIMARY" as const }

function session(role: string, userId = "admin-user") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, role, schoolId: SCHOOL_ID },
  } as never)
}

describe("updateTeacherExpertise", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
    } as never)
    vi.mocked(db.teacher.findFirst).mockResolvedValue(TEACHER as never)
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
      { catalogSubjectId: MATH.subjectId },
    ] as never)
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([])
  })

  it("refuses an unauthenticated caller", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await updateTeacherExpertise(TEACHER.id, {
      subjectExpertise: [MATH],
    })
    expect(res).toMatchObject({ success: false, error: "NOT_AUTHENTICATED" })
    expect(db.teacherSubjectExpertise.deleteMany).not.toHaveBeenCalled()
  })

  it("refuses a teacher of another school", async () => {
    session("ADMIN")
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const res = await updateTeacherExpertise("foreign-teacher", {
      subjectExpertise: [MATH],
    })
    expect(res).toMatchObject({ success: false, error: "TEACHER_NOT_FOUND" })
    expect(db.teacher.findFirst).toHaveBeenCalledWith({
      where: { id: "foreign-teacher", schoolId: SCHOOL_ID },
      select: { id: true, userId: true },
    })
  })

  it("refuses a read-only role", async () => {
    session("STAFF")
    const res = await updateTeacherExpertise(TEACHER.id, {
      subjectExpertise: [MATH],
    })
    expect(res).toMatchObject({ success: false, error: "UNAUTHORIZED" })
  })

  it("refuses a subject the school does not teach", async () => {
    session("ADMIN")
    const res = await updateTeacherExpertise(TEACHER.id, {
      subjectExpertise: [
        MATH,
        { subjectId: "subject-unknown", expertiseLevel: "SECONDARY" },
      ],
    })
    expect(res).toMatchObject({ success: false, error: "VALIDATION_ERROR" })
    expect(db.teacherSubjectExpertise.createMany).not.toHaveBeenCalled()
  })

  it("keeps a subject the teacher already holds even if the school switched it off", async () => {
    session("ADMIN")
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([])
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([
      { subjectId: MATH.subjectId },
    ] as never)
    const res = await updateTeacherExpertise(TEACHER.id, {
      subjectExpertise: [MATH],
    })
    expect(res.success).toBe(true)
  })

  it("replaces the admin's selection, scoped to the school", async () => {
    session("ADMIN")
    const res = await updateTeacherExpertise(TEACHER.id, {
      subjectExpertise: [MATH],
    })
    expect(res.success).toBe(true)
    expect(db.teacherSubjectExpertise.deleteMany).toHaveBeenCalledWith({
      where: { teacherId: TEACHER.id, schoolId: SCHOOL_ID },
    })
    expect(db.teacherSubjectExpertise.createMany).toHaveBeenCalledWith({
      data: [
        {
          schoolId: SCHOOL_ID,
          teacherId: TEACHER.id,
          subjectId: MATH.subjectId,
          expertiseLevel: "PRIMARY",
        },
      ],
    })
  })

  it("lets a teacher edit their own subjects", async () => {
    session("TEACHER", TEACHER.userId)
    const res = await updateTeacherExpertise(TEACHER.id, {
      subjectExpertise: [MATH],
    })
    expect(res.success).toBe(true)
  })
})
