// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import {
  buildPagination,
  buildResultOrderBy,
  buildResultWhere,
  calculateGrade,
  formatResultRow,
  formatStudentName,
} from "../queries"

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
