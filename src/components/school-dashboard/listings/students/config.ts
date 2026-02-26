// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const STEPS = {
  1: "Basic Information",
  2: "Enrollment Details",
} as const

export const STEP_FIELDS = {
  1: ["givenName", "middleName", "surname", "dateOfBirth", "gender"] as const,
  2: ["enrollmentDate", "userId"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
] as const
