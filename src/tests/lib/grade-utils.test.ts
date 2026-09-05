// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `extractGradeNumber` is the one grade resolver behind the intake pipeline:
 * provisionStudent's year-level cascade, the offer's fee preview, the
 * placement dialog's section match and the CSV import all read a free-text
 * grade through it. A wrong answer here places a student in the wrong year.
 */

import { describe, expect, it } from "vitest"

import { extractGradeNumber } from "@/lib/grade-utils"

describe("extractGradeNumber", () => {
  it("reads the Arabic two-word ordinals as 11 and 12, not as 1 and 2", () => {
    // "الثاني عشر" contains "الثاني"; insertion order used to return 2 here.
    expect(extractGradeNumber("الصف الثاني عشر")).toBe(12)
    expect(extractGradeNumber("الصف الحادي عشر")).toBe(11)
    expect(extractGradeNumber("الثاني عشر")).toBe(12)
  })

  it("still reads the single-word Arabic ordinals", () => {
    expect(extractGradeNumber("الصف الأول")).toBe(1)
    expect(extractGradeNumber("الصف الثاني")).toBe(2)
    expect(extractGradeNumber("الصف العاشر")).toBe(10)
  })

  it("reads the English and numeric forms", () => {
    expect(extractGradeNumber("Grade 7")).toBe(7)
    expect(extractGradeNumber("grade-12")).toBe(12)
    expect(extractGradeNumber("9")).toBe(9)
    expect(extractGradeNumber("5th grade")).toBe(5)
    expect(extractGradeNumber("Section 3")).toBe(3)
  })

  it("returns null for text with no grade in it", () => {
    expect(extractGradeNumber("")).toBeNull()
    expect(extractGradeNumber("Science")).toBeNull()
  })
})
