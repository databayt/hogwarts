// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { GradeBoundary } from "@prisma/client"
import { describe, expect, it } from "vitest"

import type { StudentResultDTO } from "@/components/school-dashboard/exams/results/types"
import {
  calculateClassAverage,
  calculateClassAveragePercentage,
  calculateCumulativeGPA,
  calculateGPA,
  calculateGrade,
  calculateGradeDistribution,
  calculateHighestMarks,
  calculateImprovement,
  calculateLowestMarks,
  calculateMarkSummation,
  calculatePassFailStats,
  calculatePercentileRank,
  calculateRanks,
  calculateStandardDeviation,
  calculateZScore,
  formatGPA,
  formatMarks,
  getPerformanceLevel,
  identifyNeedsAttention,
  identifyTopPerformers,
} from "@/components/school-dashboard/exams/results/lib/calculator"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// A standard grade boundary set spanning [0, 100]. Boundaries are inclusive
// at both ends per the calculator's `percentage >= min && percentage <= max`.
const STANDARD_BOUNDARIES: GradeBoundary[] = [
  buildBoundary({ grade: "A+", min: 90, max: 100, gpa: 4.0 }),
  buildBoundary({ grade: "A", min: 80, max: 89.99, gpa: 3.7 }),
  buildBoundary({ grade: "B+", min: 70, max: 79.99, gpa: 3.3 }),
  buildBoundary({ grade: "B", min: 60, max: 69.99, gpa: 3.0 }),
  buildBoundary({ grade: "C+", min: 50, max: 59.99, gpa: 2.5 }),
  buildBoundary({ grade: "C", min: 40, max: 49.99, gpa: 2.0 }),
  buildBoundary({ grade: "D", min: 30, max: 39.99, gpa: 1.0 }),
  buildBoundary({ grade: "F", min: 0, max: 29.99, gpa: 0.0 }),
]

function buildBoundary(opts: {
  grade: string
  min: number
  max: number
  gpa: number
}): GradeBoundary {
  // The calculator only reads grade/minScore/maxScore/gpaValue. Cast through
  // unknown because the real Prisma row carries id/schoolId/timestamps we
  // don't exercise here.
  return {
    grade: opts.grade,
    minScore: opts.min as never,
    maxScore: opts.max as never,
    gpaValue: opts.gpa as never,
  } as unknown as GradeBoundary
}

function buildResult(opts: Partial<StudentResultDTO> = {}): StudentResultDTO {
  return {
    id: "r-1",
    studentId: "stu-1",
    studentName: "Ada Lovelace",
    marksObtained: 80,
    totalMarks: 100,
    percentage: 80,
    grade: "A",
    gpa: 3.7,
    rank: 0,
    isAbsent: false,
    remarks: null,
    ...opts,
  }
}

// ---------------------------------------------------------------------------
// calculateGrade
// ---------------------------------------------------------------------------

describe("calculateGrade", () => {
  it("maps a percentage to the matching boundary", () => {
    const out = calculateGrade(85, STANDARD_BOUNDARIES)
    expect(out.grade).toBe("A")
    expect(out.gpaValue).toBe(3.7)
    expect(out.color).toBeTruthy()
    expect(out.description).toBeTruthy()
  })

  it("hits the top boundary at exactly 100%", () => {
    expect(calculateGrade(100, STANDARD_BOUNDARIES).grade).toBe("A+")
  })

  it("hits the bottom boundary at exactly 0%", () => {
    expect(calculateGrade(0, STANDARD_BOUNDARIES).grade).toBe("F")
  })

  it("hits A+ exactly at its minimum (90)", () => {
    expect(calculateGrade(90, STANDARD_BOUNDARIES).grade).toBe("A+")
  })

  it("returns F with gpa=0 when nothing matches (e.g. percentage > 100)", () => {
    const out = calculateGrade(150, STANDARD_BOUNDARIES)
    expect(out.grade).toBe("F")
    expect(out.gpaValue).toBe(0)
  })

  it("returns F when boundaries array is empty", () => {
    expect(calculateGrade(50, []).grade).toBe("F")
  })
})

// ---------------------------------------------------------------------------
// calculateMarkSummation
// ---------------------------------------------------------------------------

describe("calculateMarkSummation", () => {
  it("rounds percentage to 2 decimals and maps the grade", () => {
    const out = calculateMarkSummation(85, 100, 50, STANDARD_BOUNDARIES)
    expect(out.percentage).toBe(85)
    expect(out.grade).toBe("A")
    expect(out.passFail).toBe("Pass")
  })

  it("rounds percentage to 2 decimals (1/3 case)", () => {
    const out = calculateMarkSummation(1, 3, 1, STANDARD_BOUNDARIES)
    expect(out.percentage).toBe(33.33)
  })

  it("returns Fail when marksObtained < passingMarks", () => {
    const out = calculateMarkSummation(20, 100, 40, STANDARD_BOUNDARIES)
    expect(out.passFail).toBe("Fail")
  })

  it("treats exactly-at-passingMarks as Pass (inclusive)", () => {
    const out = calculateMarkSummation(40, 100, 40, STANDARD_BOUNDARIES)
    expect(out.passFail).toBe("Pass")
  })
})

// ---------------------------------------------------------------------------
// calculateClassAverage / calculateClassAveragePercentage
// ---------------------------------------------------------------------------

describe("calculateClassAverage", () => {
  it("returns 0 for an empty roster", () => {
    expect(calculateClassAverage([])).toBe(0)
  })

  it("returns 0 when every student is absent", () => {
    expect(
      calculateClassAverage([
        buildResult({ marksObtained: 90, isAbsent: true }),
        buildResult({ marksObtained: 80, isAbsent: true }),
      ])
    ).toBe(0)
  })

  it("excludes absent students from the divisor (was the audit's silent miscalc risk)", () => {
    const avg = calculateClassAverage([
      buildResult({ marksObtained: 60, isAbsent: false }),
      buildResult({ marksObtained: 80, isAbsent: false }),
      buildResult({ marksObtained: 0, isAbsent: true }),
    ])
    expect(avg).toBe(70)
  })
})

describe("calculateClassAveragePercentage", () => {
  it("returns 0 for an empty roster", () => {
    expect(calculateClassAveragePercentage([])).toBe(0)
  })

  it("returns 0 when every student is absent", () => {
    expect(
      calculateClassAveragePercentage([
        buildResult({ percentage: 90, isAbsent: true }),
      ])
    ).toBe(0)
  })

  it("averages over present students only", () => {
    const avg = calculateClassAveragePercentage([
      buildResult({ percentage: 60, isAbsent: false }),
      buildResult({ percentage: 80, isAbsent: false }),
      buildResult({ percentage: 0, isAbsent: true }),
    ])
    expect(avg).toBe(70)
  })
})

// ---------------------------------------------------------------------------
// highest / lowest
// ---------------------------------------------------------------------------

describe("calculateHighestMarks", () => {
  it("returns 0 for an all-absent class", () => {
    expect(
      calculateHighestMarks([
        buildResult({ marksObtained: 95, isAbsent: true }),
      ])
    ).toBe(0)
  })

  it("returns the max among present students", () => {
    expect(
      calculateHighestMarks([
        buildResult({ marksObtained: 50 }),
        buildResult({ marksObtained: 100 }),
        buildResult({ marksObtained: 999, isAbsent: true }),
      ])
    ).toBe(100)
  })
})

describe("calculateLowestMarks", () => {
  it("returns 0 for an all-absent class", () => {
    expect(
      calculateLowestMarks([buildResult({ marksObtained: 10, isAbsent: true })])
    ).toBe(0)
  })

  it("returns the min among present students (absent excluded)", () => {
    expect(
      calculateLowestMarks([
        buildResult({ marksObtained: 50 }),
        buildResult({ marksObtained: 30 }),
        buildResult({ marksObtained: 0, isAbsent: true }),
      ])
    ).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// distribution + pass/fail
// ---------------------------------------------------------------------------

describe("calculateGradeDistribution", () => {
  it("tallies grades and skips absent rows", () => {
    const dist = calculateGradeDistribution([
      buildResult({ grade: "A" }),
      buildResult({ grade: "A" }),
      buildResult({ grade: "B" }),
      buildResult({ grade: "C", isAbsent: true }),
    ])
    expect(dist).toEqual({ A: 2, B: 1 })
  })

  it("skips rows with null grade", () => {
    expect(calculateGradeDistribution([buildResult({ grade: null })])).toEqual(
      {}
    )
  })
})

describe("calculatePassFailStats", () => {
  it("returns zero passPercentage when every student is absent (no divide-by-zero)", () => {
    const stats = calculatePassFailStats(
      [buildResult({ marksObtained: 90, isAbsent: true })],
      40
    )
    expect(stats.total).toBe(0)
    expect(stats.passPercentage).toBe(0)
  })

  it("splits passed vs failed at the passingMarks boundary (inclusive pass)", () => {
    const stats = calculatePassFailStats(
      [
        buildResult({ marksObtained: 39 }),
        buildResult({ marksObtained: 40 }),
        buildResult({ marksObtained: 100 }),
      ],
      40
    )
    expect(stats.passed).toBe(2)
    expect(stats.failed).toBe(1)
    expect(stats.passPercentage).toBeCloseTo(66.67, 1)
  })
})

// ---------------------------------------------------------------------------
// ranks
// ---------------------------------------------------------------------------

describe("calculateRanks", () => {
  it("assigns shared rank for tied marks and skips ranks after a tie", () => {
    const ranked = calculateRanks([
      buildResult({ id: "a", marksObtained: 90 }),
      buildResult({ id: "b", marksObtained: 90 }),
      buildResult({ id: "c", marksObtained: 80 }),
    ])
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([
      ["a", 1],
      ["b", 1],
      ["c", 3],
    ])
  })

  it("excludes absent students entirely from the ranked output", () => {
    const ranked = calculateRanks([
      buildResult({ id: "a", marksObtained: 90 }),
      buildResult({ id: "b", marksObtained: 50, isAbsent: true }),
    ])
    expect(ranked).toHaveLength(1)
    expect(ranked[0].id).toBe("a")
  })

  it("returns an empty array for an empty input", () => {
    expect(calculateRanks([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GPA
// ---------------------------------------------------------------------------

describe("calculateGPA", () => {
  it("delegates to calculateGrade for the GPA value", () => {
    expect(calculateGPA(85, STANDARD_BOUNDARIES)).toBe(3.7)
  })

  it("returns 0 when no boundary matches", () => {
    expect(calculateGPA(85, [])).toBe(0)
  })
})

describe("calculateCumulativeGPA", () => {
  it("returns 0 for an empty exam list", () => {
    expect(calculateCumulativeGPA([], STANDARD_BOUNDARIES)).toBe(0)
  })

  it("returns 0 when every exam has 0 credits (no divide-by-zero)", () => {
    expect(
      calculateCumulativeGPA(
        [{ percentage: 90, credits: 0 }],
        STANDARD_BOUNDARIES
      )
    ).toBe(0)
  })

  it("weights GPA by credits and rounds to 2 decimals", () => {
    // Exam A: 90% → 4.0 GPA, 3 credits → 12
    // Exam B: 70% → 3.3 GPA, 1 credit  → 3.3
    // Sum 15.3 / 4 credits = 3.825 → rounds to 3.83
    const gpa = calculateCumulativeGPA(
      [
        { percentage: 95, credits: 3 },
        { percentage: 75, credits: 1 },
      ],
      STANDARD_BOUNDARIES
    )
    expect(gpa).toBeCloseTo(3.83, 2)
  })
})

// ---------------------------------------------------------------------------
// percentile + stddev + z-score
// ---------------------------------------------------------------------------

describe("calculatePercentileRank", () => {
  it("returns the percentage of students below the given score", () => {
    expect(calculatePercentileRank(80, [50, 60, 70, 80, 90])).toBe(60) // 3 of 5 strictly below
  })

  it("returns 0 when no one scored below (lowest)", () => {
    expect(calculatePercentileRank(10, [10, 20, 30])).toBe(0)
  })

  it("returns NaN when the distribution is empty (documented behavior — caller should guard)", () => {
    // The fn divides by sortedMarks.length; empty → 0/0 → NaN. Encoded so a
    // future contributor changing to guard-and-return-0 sees the test fail.
    expect(Number.isNaN(calculatePercentileRank(50, []))).toBe(true)
  })
})

describe("calculateStandardDeviation", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateStandardDeviation([])).toBe(0)
  })

  it("returns 0 when every mark is identical", () => {
    expect(calculateStandardDeviation([50, 50, 50])).toBe(0)
  })

  it("computes a population stddev for a known set", () => {
    // Population stddev of [2,4,4,4,5,5,7,9] = 2 exactly
    expect(calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
  })
})

describe("calculateZScore", () => {
  it("returns 0 for an empty distribution", () => {
    expect(calculateZScore(50, [])).toBe(0)
  })

  it("returns 0 when the distribution has zero stddev (avoids NaN)", () => {
    expect(calculateZScore(50, [50, 50, 50])).toBe(0)
  })

  it("returns a positive z for above-mean marks", () => {
    expect(calculateZScore(9, [2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// performers / attention / improvement
// ---------------------------------------------------------------------------

describe("identifyTopPerformers", () => {
  it("returns up to `count` ranked results, default 5", () => {
    const results = Array.from({ length: 7 }, (_, i) =>
      buildResult({ id: `s${i}`, marksObtained: 100 - i })
    )
    const top = identifyTopPerformers(results)
    expect(top).toHaveLength(5)
    expect(top[0].marksObtained).toBe(100)
  })

  it("honors a custom count", () => {
    const top = identifyTopPerformers(
      [
        buildResult({ id: "a", marksObtained: 90 }),
        buildResult({ id: "b", marksObtained: 80 }),
      ],
      1
    )
    expect(top).toHaveLength(1)
    expect(top[0].id).toBe("a")
  })

  it("returns [] for an empty roster", () => {
    expect(identifyTopPerformers([])).toEqual([])
  })
})

describe("identifyNeedsAttention", () => {
  it("returns students below threshold, sorted ascending by percentage", () => {
    const out = identifyNeedsAttention(
      [
        buildResult({ id: "a", percentage: 30 }),
        buildResult({ id: "b", percentage: 49.9 }),
        buildResult({ id: "c", percentage: 60 }),
        buildResult({ id: "d", percentage: 20 }),
      ],
      50
    )
    expect(out.map((r) => r.id)).toEqual(["d", "a", "b"])
  })

  it("excludes absent students even if their percentage is below threshold", () => {
    const out = identifyNeedsAttention(
      [
        buildResult({ id: "a", percentage: 10, isAbsent: true }),
        buildResult({ id: "b", percentage: 40 }),
      ],
      50
    )
    expect(out.map((r) => r.id)).toEqual(["b"])
  })

  it("caps the result at `count`", () => {
    const out = identifyNeedsAttention(
      Array.from({ length: 8 }, (_, i) =>
        buildResult({ id: `s${i}`, percentage: i })
      ),
      50,
      3
    )
    expect(out).toHaveLength(3)
  })
})

describe("calculateImprovement", () => {
  it("returns a positive difference for an improvement", () => {
    const out = calculateImprovement(80, 60)
    expect(out.difference).toBe(20)
    expect(out.percentageChange).toBeCloseTo(33.33, 1)
    expect(out.improved).toBe(true)
  })

  it("returns a negative difference for a regression", () => {
    const out = calculateImprovement(60, 80)
    expect(out.difference).toBe(-20)
    expect(out.improved).toBe(false)
  })

  it("returns 0% change when previous is 0 (no divide-by-zero)", () => {
    const out = calculateImprovement(50, 0)
    expect(out.percentageChange).toBe(0)
    expect(out.improved).toBe(true) // current > previous still counts
  })
})

// ---------------------------------------------------------------------------
// formatters + performance level
// ---------------------------------------------------------------------------

describe("formatMarks", () => {
  it("formats with percentage by default", () => {
    expect(formatMarks(80, 100)).toBe("80/100 (80%)")
  })

  it("rounds the percentage to 2 decimals", () => {
    expect(formatMarks(1, 3)).toBe("1/3 (33.33%)")
  })

  it("omits the percentage when asked", () => {
    expect(formatMarks(80, 100, false)).toBe("80/100")
  })
})

describe("formatGPA", () => {
  it("defaults to 2 decimals", () => {
    expect(formatGPA(3.456)).toBe("3.46")
  })

  it("honors a custom decimal count", () => {
    expect(formatGPA(3.456, 3)).toBe("3.456")
  })
})

describe("getPerformanceLevel", () => {
  it("returns Excellent at exactly 90%", () => {
    expect(getPerformanceLevel(90).level).toBe("Excellent")
  })

  it("returns Very Good at exactly 80%", () => {
    expect(getPerformanceLevel(80).level).toBe("Very Good")
  })

  it("returns Good at exactly 70%", () => {
    expect(getPerformanceLevel(70).level).toBe("Good")
  })

  it("returns Satisfactory at exactly 60%", () => {
    expect(getPerformanceLevel(60).level).toBe("Satisfactory")
  })

  it("returns Pass at exactly 50%", () => {
    expect(getPerformanceLevel(50).level).toBe("Pass")
  })

  it("returns Needs Improvement below 50%", () => {
    expect(getPerformanceLevel(49.99).level).toBe("Needs Improvement")
  })
})
