// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration for Grades module
 *
 * Static options (GRADE_OPTIONS, STEPS etc.) are kept for non-UI contexts
 * (e.g., Zod enums, server-side logic). For UI display, use the dictionary-based
 * factory functions that accept a grades dictionary section.
 */

// Steps are now translated via dictionary.school.grades.studentAssignmentInfo and dictionary.school.grades.gradingInfo
// Kept here for reference but should use dictionary in components
export const STEPS = {
  1: "studentAssignmentInfo",
  2: "gradingInfo",
} as const

export const STEP_FIELDS = {
  1: ["studentId", "assignmentId", "classId"] as const,
  2: ["score", "maxScore", "grade", "feedback"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length

export const GRADE_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A", value: "A" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B", value: "B" },
  { label: "B-", value: "B-" },
  { label: "C+", value: "C+" },
  { label: "C", value: "C" },
  { label: "C-", value: "C-" },
  { label: "D+", value: "D+" },
  { label: "D", value: "D" },
  { label: "D-", value: "D-" },
  { label: "F", value: "F" },
] as const

// --- Dictionary-based factory functions ---
// These accept the grades dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.
// Expected dictionary path: dictionary.school.grades.*

type GradesDict = Record<string, any> | undefined

/** Grade letter options -- labels are universal (A+, A, etc.) so no translation
 *  needed, but the factory keeps the pattern consistent and allows future
 *  locales that use different grading labels. */
export const getGradeOptions = (d?: GradesDict) => {
  const g = d?.gradeOptions as Record<string, string> | undefined
  return [
    { label: g?.aPlus || "A+", value: "A+" },
    { label: g?.a || "A", value: "A" },
    { label: g?.aMinus || "A-", value: "A-" },
    { label: g?.bPlus || "B+", value: "B+" },
    { label: g?.b || "B", value: "B" },
    { label: g?.bMinus || "B-", value: "B-" },
    { label: g?.cPlus || "C+", value: "C+" },
    { label: g?.c || "C", value: "C" },
    { label: g?.cMinus || "C-", value: "C-" },
    { label: g?.dPlus || "D+", value: "D+" },
    { label: g?.d || "D", value: "D" },
    { label: g?.dMinus || "D-", value: "D-" },
    { label: g?.f || "F", value: "F" },
  ]
}

/** Dictionary-based step labels for the wizard */
export const getStepLabels = (d?: GradesDict) => ({
  1: d?.wizardSelectionTitle || "Student & Assignment Information",
  2: d?.wizardScoringTitle || "Grading Information",
})

/** Grade labels map for column/detail display */
export const getGradeLabels = (d?: GradesDict): Record<string, string> => {
  const g = d?.gradeOptions as Record<string, string> | undefined
  return {
    "A+": g?.aPlus || "A+",
    A: g?.a || "A",
    "A-": g?.aMinus || "A-",
    "B+": g?.bPlus || "B+",
    B: g?.b || "B",
    "B-": g?.bMinus || "B-",
    "C+": g?.cPlus || "C+",
    C: g?.c || "C",
    "C-": g?.cMinus || "C-",
    "D+": g?.dPlus || "D+",
    D: g?.d || "D",
    "D-": g?.dMinus || "D-",
    F: g?.f || "F",
  }
}
