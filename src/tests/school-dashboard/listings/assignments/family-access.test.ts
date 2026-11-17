// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"
import { resolveFamilyStudent } from "@/components/school-dashboard/listings/assignments/access"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
    schoolAssignment: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/lib/school-name-format", () => ({
  schoolNameDisplay: vi.fn(async () => "full"),
}))

const scopes = [{ studentId: "st1", sectionId: "sec1", gradeId: "g1" }]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getStudentScopes).mockResolvedValue(scopes as never)
})

describe("resolveFamilyStudent — a family opens only what reaches their section or grade", () => {
  it("lets a student open an assignment set for them, scoped by school, never a draft", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "st1" } as never)
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue({
      id: "a1",
    } as never)
    const out = await resolveFamilyStudent({
      schoolId: "school1",
      userId: "u1",
      role: "STUDENT",
      assignmentId: "a1",
    })
    expect(out).toEqual({ studentId: "st1" })
    const where = vi.mocked(db.schoolAssignment.findFirst).mock.calls[0][0]!
      .where as Record<string, unknown>
    expect(where).toMatchObject({
      id: "a1",
      schoolId: "school1",
      status: { not: "DRAFT" },
    })
    expect(where).toHaveProperty("OR")
  })

  it("refuses an assignment that does not reach the student", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "st1" } as never)
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue(null)
    expect(
      await resolveFamilyStudent({
        schoolId: "school1",
        userId: "u1",
        role: "STUDENT",
        assignmentId: "other-section",
      })
    ).toBeNull()
  })

  it("refuses a user with no student record", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    expect(
      await resolveFamilyStudent({
        schoolId: "school1",
        userId: "u1",
        role: "STUDENT",
        assignmentId: "a1",
      })
    ).toBeNull()
  })

  it("a guardian can ask only for their own children", async () => {
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { student: { id: "st1", firstName: "A", middleName: null, lastName: "B" } },
    ] as never)
    vi.mocked(db.schoolAssignment.findFirst).mockResolvedValue({
      id: "a1",
    } as never)
    expect(
      await resolveFamilyStudent({
        schoolId: "school1",
        userId: "g1",
        role: "GUARDIAN",
        assignmentId: "a1",
        childId: "someone-elses-child",
      })
    ).toBeNull()
    expect(db.schoolAssignment.findFirst).not.toHaveBeenCalled()

    const own = await resolveFamilyStudent({
      schoolId: "school1",
      userId: "g1",
      role: "GUARDIAN",
      assignmentId: "a1",
      childId: "st1",
    })
    expect(own?.studentId).toBe("st1")
  })
})
