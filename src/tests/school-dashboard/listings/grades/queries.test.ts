// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  buildPagination,
  buildResultOrderBy,
  buildResultWhere,
  calculateGrade,
  formatResultRow,
  formatStudentName,
  getChildrenIdsForGuardian,
} from "@/components/school-dashboard/listings/grades/queries"

vi.mock("@/lib/db", () => ({
  db: {
    result: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    gradeBoundary: { findMany: vi.fn() },
    guardian: { findFirst: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
  },
}))

describe("buildResultWhere", () => {
  it("always scopes by schoolId and excludes wizard drafts", () => {
    const where = buildResultWhere("school-1")
    expect(where).toMatchObject({ schoolId: "school-1", wizardStep: null })
  })

  it("applies all id filters", () => {
    const where = buildResultWhere("s1", {
      studentId: "stu1",
      classId: "cl1",
      assignmentId: "a1",
      examId: "ex1",
      subjectId: "sub1",
      yearLevelId: "y1",
      grade: "A",
    })
    expect(where).toMatchObject({
      schoolId: "s1",
      studentId: "stu1",
      classId: "cl1",
      assignmentId: "a1",
      examId: "ex1",
      subjectId: "sub1",
      yearLevelId: "y1",
      grade: "A",
    })
  })

  it("omits filters that are empty/undefined", () => {
    const where = buildResultWhere("s1", {
      studentId: "",
      classId: undefined,
    })
    expect(where).not.toHaveProperty("studentId")
    expect(where).not.toHaveProperty("classId")
  })

  it("builds OR clause for free-text search across student/assignment/exam", () => {
    const where = buildResultWhere("s1", { search: "alice" })
    expect(Array.isArray(where.OR)).toBe(true)
    expect(where.OR?.length).toBeGreaterThan(0)
    // Sanity-check at least one branch references each searchable relation
    const serialized = JSON.stringify(where.OR)
    expect(serialized).toContain("firstName")
    expect(serialized).toContain("lastName")
    expect(serialized).toContain("assignment")
    expect(serialized).toContain("exam")
  })

  it("scopes by studentIds when no single studentId is supplied", () => {
    const where = buildResultWhere("s1", {
      studentIds: ["stu1", "stu2", "stu3"],
    })
    expect(where.studentId).toEqual({ in: ["stu1", "stu2", "stu3"] })
  })

  it("empty studentIds produces a match-nothing filter (Prisma `in: []`)", () => {
    const where = buildResultWhere("s1", { studentIds: [] })
    expect(where.studentId).toEqual({ in: [] })
  })

  it("prefers an explicit single studentId over the studentIds set", () => {
    const where = buildResultWhere("s1", {
      studentId: "stu-priority",
      studentIds: ["other-1", "other-2"],
    })
    // The single-id filter wins; the set is ignored.
    expect(where.studentId).toBe("stu-priority")
  })
})

describe("buildResultOrderBy", () => {
  it("defaults to gradedAt desc", () => {
    expect(buildResultOrderBy()).toEqual([{ gradedAt: "desc" }])
  })

  it("maps explicit sort params", () => {
    expect(
      buildResultOrderBy([
        { id: "score", desc: true },
        { id: "createdAt", desc: false },
      ])
    ).toEqual([{ score: "desc" }, { createdAt: "asc" }])
  })

  it("treats undefined desc as asc", () => {
    expect(buildResultOrderBy([{ id: "score" }])).toEqual([{ score: "asc" }])
  })

  it("falls back to default when array is empty", () => {
    expect(buildResultOrderBy([])).toEqual([{ gradedAt: "desc" }])
  })
})

describe("buildPagination", () => {
  it("computes skip/take from page+perPage", () => {
    expect(buildPagination(1, 20)).toEqual({ skip: 0, take: 20 })
    expect(buildPagination(2, 20)).toEqual({ skip: 20, take: 20 })
    expect(buildPagination(5, 50)).toEqual({ skip: 200, take: 50 })
  })
})

describe("calculateGrade — default scale", () => {
  it.each([
    [95, "A+"],
    [90, "A+"],
    [89, "A"],
    [85, "A"],
    [80, "B+"],
    [75, "B"],
    [70, "C+"],
    [65, "C"],
    [60, "D+"],
    [50, "D"],
    [49, "F"],
    [0, "F"],
  ])("percentage %i → %s", (pct, expected) => {
    expect(calculateGrade(pct)).toBe(expected)
  })
})

describe("calculateGrade — school-specific boundaries", () => {
  it("uses school boundaries when provided", () => {
    const boundaries = [
      { grade: "Excellent", minScore: 90, maxScore: 100 },
      { grade: "Good", minScore: 70, maxScore: 89.99 },
      { grade: "Average", minScore: 50, maxScore: 69.99 },
    ]
    expect(calculateGrade(95, boundaries)).toBe("Excellent")
    expect(calculateGrade(72, boundaries)).toBe("Good")
    expect(calculateGrade(55, boundaries)).toBe("Average")
  })

  it("returns 'F' when no boundary matches", () => {
    const boundaries = [{ grade: "Pass", minScore: 50, maxScore: 100 }]
    expect(calculateGrade(40, boundaries)).toBe("F")
  })

  it("handles Decimal-like objects with toNumber()", () => {
    const dec = (n: number) => ({ toNumber: () => n })
    const boundaries = [
      // Cast through unknown to satisfy the structural Decimal shape
      {
        grade: "B",
        minScore: dec(70) as unknown as number,
        maxScore: dec(89) as unknown as number,
      },
    ]
    expect(calculateGrade(75, boundaries)).toBe("B")
  })

  it("falls back to default when boundary list is empty", () => {
    expect(calculateGrade(85, [])).toBe("A")
  })
})

describe("formatStudentName", () => {
  it("joins first and last name", () => {
    expect(
      formatStudentName({ student: { firstName: "Ada", lastName: "Lovelace" } })
    ).toBe("Ada Lovelace")
  })

  it("returns 'Unknown' when student is null", () => {
    expect(formatStudentName({ student: null })).toBe("Unknown")
  })
})

describe("getChildrenIdsForGuardian", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns linked child IDs when the user is a guardian in this school", async () => {
    vi.mocked(db.guardian.findFirst).mockResolvedValue({
      id: "guardian-1",
    } as any)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { studentId: "child-a" },
      { studentId: "child-b" },
    ] as any)

    const ids = await getChildrenIdsForGuardian("user-1", "school-1")
    expect(ids).toEqual(["child-a", "child-b"])
    expect(db.guardian.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", schoolId: "school-1" },
      select: { id: true },
    })
    expect(db.studentGuardian.findMany).toHaveBeenCalledWith({
      where: { schoolId: "school-1", guardianId: "guardian-1" },
      select: { studentId: true },
    })
  })

  it("returns [] when the user has no guardian record in this school", async () => {
    vi.mocked(db.guardian.findFirst).mockResolvedValue(null as any)

    const ids = await getChildrenIdsForGuardian("user-not-guardian", "school-1")
    expect(ids).toEqual([])
    // Do not even attempt the second query.
    expect(db.studentGuardian.findMany).not.toHaveBeenCalled()
  })

  it("returns [] when the guardian exists but has no linked children", async () => {
    vi.mocked(db.guardian.findFirst).mockResolvedValue({
      id: "guardian-2",
    } as any)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([] as any)

    const ids = await getChildrenIdsForGuardian("user-2", "school-1")
    expect(ids).toEqual([])
  })

  it("guardian lookup is school-scoped (prevents cross-tenant leak)", async () => {
    vi.mocked(db.guardian.findFirst).mockResolvedValue(null as any)
    await getChildrenIdsForGuardian("user-1", "other-school")
    expect(db.guardian.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", schoolId: "other-school" },
      select: { id: true },
    })
  })
})

describe("formatResultRow", () => {
  const baseRow = {
    id: "r1",
    score: 85 as unknown as number,
    maxScore: 100 as unknown as number,
    percentage: 85,
    grade: "A",
    createdAt: new Date("2026-01-15T12:00:00Z"),
    student: { firstName: "Ada", lastName: "Lovelace" },
    class: { name: "Math 101" },
    assignment: { title: "Homework 1" },
    exam: null,
  }

  it("formats a complete row", () => {
    // Cast to relax the Prisma return-type to test format-only logic
    const row = formatResultRow(
      baseRow as unknown as Parameters<typeof formatResultRow>[0]
    )
    expect(row).toMatchObject({
      id: "r1",
      studentName: "Ada Lovelace",
      assignmentTitle: "Homework 1",
      className: "Math 101",
      score: 85,
      maxScore: 100,
      percentage: 85,
      grade: "A",
    })
    expect(row.createdAt).toBe("2026-01-15T12:00:00.000Z")
  })

  it("falls back to exam title when assignment is missing", () => {
    const row = formatResultRow({
      ...baseRow,
      assignment: null,
      exam: { title: "Final Exam" },
    } as unknown as Parameters<typeof formatResultRow>[0])
    expect(row.assignmentTitle).toBe("Final Exam")
  })

  it("returns 'Unknown' when both assignment and exam missing", () => {
    const row = formatResultRow({
      ...baseRow,
      assignment: null,
      exam: null,
    } as unknown as Parameters<typeof formatResultRow>[0])
    expect(row.assignmentTitle).toBe("Unknown")
  })

  it("returns 'Unknown' for missing class", () => {
    const row = formatResultRow({
      ...baseRow,
      class: null,
    } as unknown as Parameters<typeof formatResultRow>[0])
    expect(row.className).toBe("Unknown")
  })
})
