// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import type { MobileAuthContext } from "../authenticate"
import { canAccessStudent } from "../student-access"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    studentGuardian: { findFirst: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const OTHER_SCHOOL = "school-2"
const USER = "user-1"
const STUDENT = "stu-1"

function ctx(role: string, schoolId = SCHOOL): MobileAuthContext {
  return { userId: USER, email: "u@e.com", schoolId, role }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("canAccessStudent — staff roles", () => {
  it.each(["DEVELOPER", "ADMIN", "TEACHER", "STAFF"])(
    "%s sees students inside their school",
    async (role) => {
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: STUDENT } as any)
      expect(await canAccessStudent(ctx(role), STUDENT)).toBe(true)
    }
  )

  it.each(["DEVELOPER", "ADMIN", "TEACHER", "STAFF"])(
    "%s blocked when student is in a different school",
    async (role) => {
      // The query includes schoolId — when scoped to the other school
      // the row isn't found and we return false.
      vi.mocked(db.student.findFirst).mockResolvedValue(null as any)
      expect(await canAccessStudent(ctx(role), STUDENT)).toBe(false)
      expect(db.student.findFirst).toHaveBeenCalledWith({
        where: { id: STUDENT, schoolId: SCHOOL },
        select: { id: true },
      })
    }
  )

  it("staff lookup is school-scoped (prevents cross-tenant)", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null as any)
    await canAccessStudent(ctx("TEACHER", OTHER_SCHOOL), STUDENT)
    expect(db.student.findFirst).toHaveBeenCalledWith({
      where: { id: STUDENT, schoolId: OTHER_SCHOOL },
      select: { id: true },
    })
  })
})

describe("canAccessStudent — STUDENT", () => {
  it("allows access to own record only", async () => {
    // The query keys off Student.userId = caller.userId, so a row
    // means the caller IS this student.
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: STUDENT } as any)
    expect(await canAccessStudent(ctx("STUDENT"), STUDENT)).toBe(true)
    expect(db.student.findFirst).toHaveBeenCalledWith({
      where: { id: STUDENT, schoolId: SCHOOL, userId: USER },
      select: { id: true },
    })
  })

  it("denies when student is not the caller", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null as any)
    expect(await canAccessStudent(ctx("STUDENT"), "other-stu")).toBe(false)
  })
})

describe("canAccessStudent — GUARDIAN", () => {
  it("allows when StudentGuardian link exists for this user", async () => {
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValue({
      id: "sg-1",
    } as any)
    expect(await canAccessStudent(ctx("GUARDIAN"), STUDENT)).toBe(true)
    expect(db.studentGuardian.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL,
        studentId: STUDENT,
        guardian: { userId: USER },
      },
      select: { id: true },
    })
  })

  it("denies when no link exists (parent of a different child)", async () => {
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValue(null as any)
    expect(await canAccessStudent(ctx("GUARDIAN"), "other-stu")).toBe(false)
  })

  it("denies cross-tenant access even if the link existed elsewhere", async () => {
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValue(null as any)
    await canAccessStudent(ctx("GUARDIAN", OTHER_SCHOOL), STUDENT)
    expect(db.studentGuardian.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: OTHER_SCHOOL,
        studentId: STUDENT,
        guardian: { userId: USER },
      },
      select: { id: true },
    })
  })
})

describe("canAccessStudent — unsupported roles", () => {
  it.each(["USER", "ACCOUNTANT", "", "WAT"])(
    "%s gets a clean false (no DB hit)",
    async (role) => {
      const result = await canAccessStudent(ctx(role), STUDENT)
      expect(result).toBe(false)
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.studentGuardian.findFirst).not.toHaveBeenCalled()
    }
  )
})
