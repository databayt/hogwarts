export const STEPS = {
  1: "Basic Information",
} as const

export const STEP_FIELDS = {
  1: ["subjectName", "departmentId"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1]].length
