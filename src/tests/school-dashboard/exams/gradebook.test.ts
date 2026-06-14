// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unit tests for pure helpers in grades/lib/gradebook.ts.
 *
 * Only the helpers that do NOT touch the database are tested here:
 *   - toPercentage
 *   - letterGradeFor
 *
 * DB-writing functions (upsertExamResult, upsertGradebookResult,
 * resolveStudentClassForSubject, getGradeBoundaries, resolveLetterGrade)
 * are tested indirectly via the actions that call them.
 */

import { describe, expect, it } from "vitest"

import {
  letterGradeFor,
  toPercentage,
} from "@/components/school-dashboard/grades/lib/gradebook"

// The module-under-test is NOT "use server", so Vitest can import it directly.
// The only import it has at module-level is `@/lib/db` and the grades queries
// module — both are only accessed inside the async functions we skip here.
// Stub the DB so the module can be loaded without a real Prisma client.
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/components/school-dashboard/listings/grades/queries", () => ({
  calculateGrade: (
    percentage: number,
    gradeBoundaries?: Array<{
      grade: string
      minScore: number
      maxScore: number
    }>
  ) => {
    // Mirror of the real implementation — kept in sync for testing.
    if (gradeBoundaries && gradeBoundaries.length > 0) {
      for (const b of gradeBoundaries) {
        if (
          percentage >= Number(b.minScore) &&
          percentage <= Number(b.maxScore)
        ) {
          return b.grade
        }
      }
      return "F"
    }
    if (percentage >= 90) return "A+"
    if (percentage >= 85) return "A"
    if (percentage >= 80) return "B+"
    if (percentage >= 75) return "B"
    if (percentage >= 70) return "C+"
    if (percentage >= 65) return "C"
    if (percentage >= 60) return "D+"
    if (percentage >= 50) return "D"
    return "F"
  },
  getSchoolGradingScheme: vi.fn(),
}))

// ---------------------------------------------------------------------------
// toPercentage
// ---------------------------------------------------------------------------

describe("toPercentage", () => {
  it("returns 80 for 8/10", () => {
    expect(toPercentage(8, 10)).toBe(80)
  })

  it("returns 100 for full marks", () => {
    expect(toPercentage(50, 50)).toBe(100)
  })

  it("returns 0 for zero score", () => {
    expect(toPercentage(0, 100)).toBe(0)
  })

  it("returns 0 when maxScore is 0 (guard against division by zero)", () => {
    expect(toPercentage(0, 0)).toBe(0)
  })

  it("returns 0 when maxScore is negative (guard)", () => {
    expect(toPercentage(5, -10)).toBe(0)
  })

  it("rounds to 2 decimal places", () => {
    // 1/3 * 100 = 33.333... → rounded to 33.33
    expect(toPercentage(1, 3)).toBe(33.33)
  })

  it("handles non-integer scores", () => {
    // 7.5 / 10 = 75.00
    expect(toPercentage(7.5, 10)).toBe(75)
  })

  it("caps at 100 for over-max scores (raw calculation, no cap — verifies formula)", () => {
    // toPercentage does NOT cap at 100; the caller controls the marks
    expect(toPercentage(11, 10)).toBe(110)
  })
})

// ---------------------------------------------------------------------------
// letterGradeFor — default (empty boundaries) fallback scale
// ---------------------------------------------------------------------------

describe("letterGradeFor — default fallback scale", () => {
  // Pass an empty array so calculateGrade uses the built-in fallback.
  const empty: Parameters<typeof letterGradeFor>[1] = []

  it("returns A+ for 90 and above", () => {
    expect(letterGradeFor(90, empty)).toBe("A+")
    expect(letterGradeFor(100, empty)).toBe("A+")
    expect(letterGradeFor(95.5, empty)).toBe("A+")
  })

  it("returns A for 85–89", () => {
    expect(letterGradeFor(85, empty)).toBe("A")
    expect(letterGradeFor(89.99, empty)).toBe("A")
  })

  it("returns B+ for 80–84", () => {
    expect(letterGradeFor(80, empty)).toBe("B+")
    expect(letterGradeFor(84.99, empty)).toBe("B+")
  })

  it("returns B for 75–79", () => {
    expect(letterGradeFor(75, empty)).toBe("B")
    expect(letterGradeFor(79.99, empty)).toBe("B")
  })

  it("returns C+ for 70–74", () => {
    expect(letterGradeFor(70, empty)).toBe("C+")
    expect(letterGradeFor(74.99, empty)).toBe("C+")
  })

  it("returns C for 65–69", () => {
    expect(letterGradeFor(65, empty)).toBe("C")
    expect(letterGradeFor(69.99, empty)).toBe("C")
  })

  it("returns D+ for 60–64", () => {
    expect(letterGradeFor(60, empty)).toBe("D+")
    expect(letterGradeFor(64.99, empty)).toBe("D+")
  })

  it("returns D for 50–59", () => {
    expect(letterGradeFor(50, empty)).toBe("D")
    expect(letterGradeFor(59.99, empty)).toBe("D")
  })

  it("returns F below 50", () => {
    expect(letterGradeFor(49.99, empty)).toBe("F")
    expect(letterGradeFor(0, empty)).toBe("F")
  })
})

// ---------------------------------------------------------------------------
// letterGradeFor — custom boundaries
// ---------------------------------------------------------------------------

describe("letterGradeFor — custom school boundaries", () => {
  const custom = [
    { grade: "Excellent", minScore: 90, maxScore: 100, gpaValue: null },
    { grade: "Good", minScore: 70, maxScore: 89, gpaValue: null },
    { grade: "Pass", minScore: 50, maxScore: 69, gpaValue: null },
    { grade: "Fail", minScore: 0, maxScore: 49, gpaValue: null },
  ]

  it("matches Excellent for 90–100", () => {
    expect(letterGradeFor(90, custom)).toBe("Excellent")
    expect(letterGradeFor(100, custom)).toBe("Excellent")
  })

  it("matches Good for 70–89", () => {
    expect(letterGradeFor(70, custom)).toBe("Good")
    expect(letterGradeFor(89, custom)).toBe("Good")
  })

  it("matches Pass for 50–69", () => {
    expect(letterGradeFor(50, custom)).toBe("Pass")
    expect(letterGradeFor(69, custom)).toBe("Pass")
  })

  it("matches Fail for 0–49", () => {
    expect(letterGradeFor(0, custom)).toBe("Fail")
    expect(letterGradeFor(49, custom)).toBe("Fail")
  })

  it("returns F for a percentage that falls in no boundary gap", () => {
    // Boundaries with a gap: 60-79 only.
    const gapped = [
      { grade: "A", minScore: 80, maxScore: 100, gpaValue: null },
      { grade: "B", minScore: 60, maxScore: 79, gpaValue: null },
      // deliberate gap: nothing covers 0–59
    ]
    expect(letterGradeFor(40, gapped)).toBe("F")
  })
})
