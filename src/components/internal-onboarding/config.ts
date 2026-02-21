import type { StepConfig } from "@/components/form/footer"

// =============================================================================
// STEP CONFIGURATION
// =============================================================================

export const INTERNAL_ONBOARDING_STEPS = [
  "personal",
  "contact",
  "role-details",
  "documents",
  "review",
] as const

export type OnboardingStep = (typeof INTERNAL_ONBOARDING_STEPS)[number]

export const INTERNAL_ONBOARDING_CONFIG: StepConfig = {
  steps: [...INTERNAL_ONBOARDING_STEPS],
  groups: {
    1: ["personal", "contact"],
    2: ["role-details", "documents"],
    3: ["review"],
  },
  groupLabels: ["Personal Information", "Role & Documents", "Review & Submit"],
}

// =============================================================================
// ROLE CONFIGURATION
// =============================================================================

export const ONBOARDING_ROLES = [
  {
    value: "teacher" as const,
    label: "Teacher",
    description: "I teach classes at this school",
  },
  {
    value: "staff" as const,
    label: "Staff",
    description: "I work in administration or support",
  },
  {
    value: "admin" as const,
    label: "Admin",
    description: "I manage school administration",
  },
  {
    value: "student" as const,
    label: "Student",
    description: "I am joining as a student",
  },
] as const

export type OnboardingRole = (typeof ONBOARDING_ROLES)[number]["value"]

// =============================================================================
// OPTIONS
// =============================================================================

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
]

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
]

export const STUDENT_TYPES = [
  { value: "REGULAR", label: "Regular" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "INTERNATIONAL", label: "International" },
]

export const ADMIN_AREAS = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "operations", label: "Operations" },
  { value: "academics", label: "Academics" },
  { value: "it", label: "IT" },
  { value: "other", label: "Other" },
]

export const STEP_META: Record<
  OnboardingStep,
  { title: string; description: string }
> = {
  personal: {
    title: "Personal Information",
    description: "Tell us about yourself",
  },
  contact: {
    title: "Contact Information",
    description: "How can we reach you?",
  },
  "role-details": {
    title: "Role Details",
    description: "Information specific to your role",
  },
  documents: {
    title: "Documents",
    description: "Upload required documents",
  },
  review: {
    title: "Review & Submit",
    description: "Review your information and submit",
  },
}
