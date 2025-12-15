export const TITLE_LIMITS = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 40,
} as const

export const TITLE_MESSAGES = {
  TOO_SHORT: `School name must be at least ${TITLE_LIMITS.MIN_LENGTH} characters`,
  TOO_LONG: `School name must be no more than ${TITLE_LIMITS.MAX_LENGTH} characters`,
} as const
