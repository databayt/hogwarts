/**
 * Client-side configuration for onboarding
 * These constants are used in client components
 */

import type { OnboardingStep } from "./types"

// Step navigation map
export const STEP_NAVIGATION: Record<
  OnboardingStep,
  { next?: OnboardingStep; previous?: OnboardingStep }
> = {
  "about-school": {
    next: "title",
  },
  title: {
    next: "description",
    previous: "about-school",
  },
  description: {
    next: "location",
    previous: "title",
  },
  location: {
    next: "stand-out",
    previous: "description",
  },
  "stand-out": {
    next: "capacity",
    previous: "location",
  },
  capacity: {
    next: "schedule",
    previous: "stand-out",
  },
  schedule: {
    next: "branding",
    previous: "capacity",
  },
  branding: {
    next: "import",
    previous: "schedule",
  },
  import: {
    next: "finish-setup",
    previous: "branding",
  },
  "finish-setup": {
    next: "join",
    previous: "import",
  },
  join: {
    next: "visibility",
    previous: "finish-setup",
  },
  visibility: {
    next: "price",
    previous: "join",
  },
  price: {
    next: "discount",
    previous: "visibility",
  },
  discount: {
    next: "legal",
    previous: "price",
  },
  legal: {
    next: "subdomain",
    previous: "discount",
  },
  subdomain: {
    previous: "legal",
  },
}

// Form validation limits
export const FORM_LIMITS = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 500,
  SUBDOMAIN_MIN_LENGTH: 3,
  SUBDOMAIN_MAX_LENGTH: 63,
  SCHOOL_NAME_MIN_LENGTH: 3,
  SCHOOL_NAME_MAX_LENGTH: 100,
} as const

// Error messages for validation
export const ERROR_MESSAGES = {
  TITLE_TOO_SHORT: `School name must be at least ${FORM_LIMITS.TITLE_MIN_LENGTH} characters`,
  TITLE_TOO_LONG: `School name must be no more than ${FORM_LIMITS.TITLE_MAX_LENGTH} characters`,
  DESCRIPTION_TOO_SHORT: `Description must be at least ${FORM_LIMITS.DESCRIPTION_MIN_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be no more than ${FORM_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
  SUBDOMAIN_TOO_SHORT: `Subdomain must be at least ${FORM_LIMITS.SUBDOMAIN_MIN_LENGTH} characters`,
  SUBDOMAIN_TOO_LONG: `Subdomain must be no more than ${FORM_LIMITS.SUBDOMAIN_MAX_LENGTH} characters`,
  SUBDOMAIN_INVALID_FORMAT:
    "Only lowercase letters, numbers, and hyphens allowed",
  SUBDOMAIN_INVALID_START_END: "Cannot start or end with hyphen",
} as const
