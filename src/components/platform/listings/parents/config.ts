export const STEPS = {
  1: "Basic Information",
  2: "Contact Details",
} as const

export const STEP_FIELDS = {
  1: ["givenName", "surname"] as const,
  2: ["emailAddress", "userId"] as const,
} as const

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length
