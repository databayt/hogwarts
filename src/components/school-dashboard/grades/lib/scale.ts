// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

/**
 * The school's grade scale — one source for every letter grade the grades
 * block writes: the gradebook, report cards and their GPA.
 *
 * Stored in `GradeBoundary` (one row per letter), the same table the exam
 * marking screens read. A school that never set one gets DEFAULT_SCALE.
 * Before this, the gradebook and report cards each kept their own default
 * (90+ = A+ in one, 97+ in the other), so a 95% was A+ on the grade and A on
 * the report card.
 */
export interface ScaleBand {
  grade: string
  /** Lowest percentage that earns this grade (inclusive). */
  minScore: number
  maxScore: number
  gpa: number
}

export const DEFAULT_SCALE: ScaleBand[] = [
  { grade: "A+", minScore: 90, maxScore: 100, gpa: 4.0 },
  { grade: "A", minScore: 85, maxScore: 89.99, gpa: 3.7 },
  { grade: "B+", minScore: 80, maxScore: 84.99, gpa: 3.3 },
  { grade: "B", minScore: 75, maxScore: 79.99, gpa: 3.0 },
  { grade: "C+", minScore: 70, maxScore: 74.99, gpa: 2.5 },
  { grade: "C", minScore: 65, maxScore: 69.99, gpa: 2.0 },
  { grade: "D+", minScore: 60, maxScore: 64.99, gpa: 1.5 },
  { grade: "D", minScore: 50, maxScore: 59.99, gpa: 1.0 },
  { grade: "F", minScore: 0, maxScore: 49.99, gpa: 0 },
]

/** The school's own scale, highest band first; DEFAULT_SCALE when unset. */
export async function getSchoolScale(schoolId: string): Promise<ScaleBand[]> {
  const rows = await db.gradeBoundary.findMany({
    where: { schoolId },
    orderBy: { minScore: "desc" },
    select: { grade: true, minScore: true, maxScore: true, gpaValue: true },
  })
  if (rows.length === 0) return DEFAULT_SCALE
  return rows.map((r) => ({
    grade: r.grade,
    minScore: Number(r.minScore),
    maxScore: Number(r.maxScore),
    gpa: Number(r.gpaValue),
  }))
}

/**
 * The band a percentage falls in: the highest band whose minimum it reaches.
 * Matching on the minimum alone means a score between two bands' edges
 * (89.5 against 85–89 and 90–100) still lands in the lower band instead of
 * falling through to F.
 */
export function bandFor(percentage: number, scale: ScaleBand[]): ScaleBand {
  const sorted = [...scale].sort((a, b) => b.minScore - a.minScore)
  // Below every band of a scale that doesn't start at 0: a fail.
  return (
    sorted.find((b) => percentage >= b.minScore) ?? {
      grade: "F",
      minScore: 0,
      maxScore: 0,
      gpa: 0,
    }
  )
}

/**
 * Problems with a scale a school is about to save, as codes the editor
 * translates: bands must be named, within 0–100, not overlap, and the
 * lowest must start at 0 so every score gets a grade.
 */
export function validateScale(scale: ScaleBand[]): string | null {
  if (scale.length === 0) return "SCALE_EMPTY"
  const names = new Set<string>()
  for (const b of scale) {
    const name = b.grade.trim()
    if (!name) return "SCALE_NAME_REQUIRED"
    if (names.has(name)) return "SCALE_DUPLICATE_GRADE"
    names.add(name)
    if (
      b.minScore < 0 ||
      b.maxScore > 100 ||
      b.minScore > b.maxScore ||
      b.gpa < 0 ||
      b.gpa > 5
    )
      return "SCALE_OUT_OF_RANGE"
  }
  const sorted = [...scale].sort((a, b) => a.minScore - b.minScore)
  if (sorted[0].minScore !== 0) return "SCALE_MUST_START_AT_ZERO"
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minScore <= sorted[i - 1].maxScore - 0.001)
      return "SCALE_OVERLAP"
  }
  return null
}
