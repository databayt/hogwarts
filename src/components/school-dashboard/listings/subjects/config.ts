// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const STEPS = {
  1: "Basic Information",
} as const

export const STEP_FIELDS = {
  1: ["subjectName", "departmentId"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1]].length
