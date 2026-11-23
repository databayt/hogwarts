// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const STEP_FIELDS = {
  1: ["title", "description", "classId"] as const,
  2: ["type", "totalPoints", "weight", "dueDate", "instructions"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length

// --- Dictionary-based factory functions ---
// These accept a dictionary section (`school.assignments`); labels are empty
// until the dictionary is loaded — every string lives in the dictionaries.

type Dict = Record<string, any> | undefined

export const getDictSteps = (d?: Dict) => {
  const w = d?.wizard as Record<string, string> | undefined
  return {
    1: w?.assignmentInfo ?? "",
    2: w?.detailsAndGrading ?? "",
  }
}

export const getDictAssignmentTypes = (d?: Dict) => {
  const t = d?.detail?.types as Record<string, string> | undefined
  return [
    { value: "HOMEWORK", label: t?.homework ?? "" },
    { value: "QUIZ", label: t?.quiz ?? "" },
    { value: "TEST", label: t?.test ?? "" },
    { value: "MIDTERM", label: t?.midterm ?? "" },
    { value: "FINAL_EXAM", label: t?.finalExam ?? "" },
    { value: "PROJECT", label: t?.project ?? "" },
    { value: "LAB_REPORT", label: t?.labReport ?? "" },
    { value: "ESSAY", label: t?.essay ?? "" },
    { value: "PRESENTATION", label: t?.presentation ?? "" },
  ]
}

export const getDictAssignmentStatuses = (d?: Dict) => {
  const s = d?.detail?.statuses as Record<string, string> | undefined
  return [
    { value: "DRAFT", label: s?.draft ?? "" },
    { value: "PUBLISHED", label: s?.published ?? "" },
    { value: "IN_PROGRESS", label: s?.inProgress ?? "" },
    { value: "COMPLETED", label: s?.completed ?? "" },
    { value: "GRADED", label: s?.graded ?? "" },
  ]
}

/** Get assignment type labels map for column display */
export const getAssignmentTypeLabels = (d?: Dict): Record<string, string> => {
  const t = d?.detail?.types as Record<string, string> | undefined
  return {
    HOMEWORK: t?.homework ?? "",
    QUIZ: t?.quiz ?? "",
    TEST: t?.test ?? "",
    MIDTERM: t?.midterm ?? "",
    FINAL_EXAM: t?.finalExam ?? "",
    PROJECT: t?.project ?? "",
    LAB_REPORT: t?.labReport ?? "",
    ESSAY: t?.essay ?? "",
    PRESENTATION: t?.presentation ?? "",
  }
}

/** Get assignment status labels map for column display */
export const getAssignmentStatusLabels = (d?: Dict): Record<string, string> => {
  const s = d?.detail?.statuses as Record<string, string> | undefined
  return {
    DRAFT: s?.draft ?? "",
    PUBLISHED: s?.published ?? "",
    IN_PROGRESS: s?.inProgress ?? "",
    COMPLETED: s?.completed ?? "",
    GRADED: s?.graded ?? "",
  }
}
