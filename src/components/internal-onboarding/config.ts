// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { StepConfig } from "@/components/form/footer"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// =============================================================================
// TYPE HELPERS
// =============================================================================

type InternalJoinDict = Dictionary["school"]["onboarding"]["internalJoin"]

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

export function getInternalOnboardingConfig(d?: InternalJoinDict): StepConfig {
  return {
    steps: [...INTERNAL_ONBOARDING_STEPS],
    groups: {
      1: ["personal", "contact"],
      2: ["role-details", "documents"],
      3: ["review"],
    },
    groupLabels: [
      d?.groupLabels?.personalInfo ?? "Personal Information",
      d?.groupLabels?.roleAndDocuments ?? "Role & Documents",
      d?.groupLabels?.reviewAndSubmit ?? "Review & Submit",
    ],
  }
}

/** @deprecated Use getInternalOnboardingConfig(d) instead */
export const INTERNAL_ONBOARDING_CONFIG: StepConfig =
  getInternalOnboardingConfig()

// =============================================================================
// ROLE CONFIGURATION
// =============================================================================

export function getOnboardingRoles(d?: InternalJoinDict) {
  return [
    {
      value: "teacher" as const,
      label: d?.roles?.teacher?.label ?? "Teacher",
      description:
        d?.roles?.teacher?.description ?? "I teach classes at this school",
    },
    {
      value: "staff" as const,
      label: d?.roles?.staff?.label ?? "Staff",
      description:
        d?.roles?.staff?.description ?? "I work in administration or support",
    },
    {
      value: "admin" as const,
      label: d?.roles?.admin?.label ?? "Admin",
      description:
        d?.roles?.admin?.description ?? "I manage school administration",
    },
    {
      value: "student" as const,
      label: d?.roles?.student?.label ?? "Student",
      description:
        d?.roles?.student?.description ?? "I am joining as a student",
    },
  ]
}

/** @deprecated Use getOnboardingRoles(d) instead */
export const ONBOARDING_ROLES = getOnboardingRoles()

export type OnboardingRole = "teacher" | "staff" | "admin" | "student"

// =============================================================================
// OPTIONS (factory functions)
// =============================================================================

export function getGenderOptions(d?: InternalJoinDict) {
  return [
    { value: "Male", label: d?.gender?.male ?? "Male" },
    { value: "Female", label: d?.gender?.female ?? "Female" },
  ]
}

/** @deprecated Use getGenderOptions(d) instead */
export const GENDER_OPTIONS = getGenderOptions()

export function getEmploymentTypes(d?: InternalJoinDict) {
  return [
    { value: "FULL_TIME", label: d?.employmentType?.fullTime ?? "Full-time" },
    { value: "PART_TIME", label: d?.employmentType?.partTime ?? "Part-time" },
    { value: "CONTRACT", label: d?.employmentType?.contract ?? "Contract" },
  ]
}

/** @deprecated Use getEmploymentTypes(d) instead */
export const EMPLOYMENT_TYPES = getEmploymentTypes()

export function getStudentTypes(d?: InternalJoinDict) {
  return [
    { value: "REGULAR", label: d?.studentType?.regular ?? "Regular" },
    { value: "TRANSFER", label: d?.studentType?.transfer ?? "Transfer" },
    {
      value: "INTERNATIONAL",
      label: d?.studentType?.international ?? "International",
    },
  ]
}

/** @deprecated Use getStudentTypes(d) instead */
export const STUDENT_TYPES = getStudentTypes()

export function getAdminAreas(d?: InternalJoinDict) {
  return [
    { value: "finance", label: d?.adminArea?.finance ?? "Finance" },
    { value: "hr", label: d?.adminArea?.hr ?? "Human Resources" },
    { value: "operations", label: d?.adminArea?.operations ?? "Operations" },
    { value: "academics", label: d?.adminArea?.academics ?? "Academics" },
    { value: "it", label: d?.adminArea?.it ?? "IT" },
    { value: "other", label: d?.adminArea?.other ?? "Other" },
  ]
}

/** @deprecated Use getAdminAreas(d) instead */
export const ADMIN_AREAS = getAdminAreas()

// =============================================================================
// STEP META (factory function)
// =============================================================================

export function getStepMeta(
  d?: InternalJoinDict
): Record<OnboardingStep, { title: string; description: string }> {
  return {
    personal: {
      title: d?.steps?.personal?.title ?? "Personal Information",
      description: d?.steps?.personal?.description ?? "Tell us about yourself",
    },
    contact: {
      title: d?.steps?.contact?.title ?? "Contact Information",
      description: d?.steps?.contact?.description ?? "How can we reach you?",
    },
    "role-details": {
      title: d?.steps?.roleDetails?.title ?? "Role Details",
      description:
        d?.steps?.roleDetails?.description ??
        "Information specific to your role",
    },
    documents: {
      title: d?.steps?.documents?.title ?? "Documents",
      description:
        d?.steps?.documents?.description ?? "Upload required documents",
    },
    review: {
      title: d?.steps?.review?.title ?? "Review & Submit",
      description:
        d?.steps?.review?.description ?? "Review your information and submit",
    },
  }
}

/** @deprecated Use getStepMeta(d) instead */
export const STEP_META = getStepMeta()
