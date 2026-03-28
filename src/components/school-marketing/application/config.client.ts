// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Apply Block - Client Configuration
// Following student wizard pattern

export type ApplyStep =
  | "attachments"
  | "personal"
  | "contact"
  | "location"
  | "guardian"
  | "academic"

// Step order for the application flow
export const APPLY_STEPS: ApplyStep[] = [
  "attachments",
  "personal",
  "contact",
  "location",
  "guardian",
  "academic",
]

// Step navigation map
export const STEP_NAVIGATION: Record<
  ApplyStep,
  { next?: ApplyStep; previous?: ApplyStep }
> = {
  attachments: { next: "personal" },
  personal: { next: "contact", previous: "attachments" },
  contact: { next: "location", previous: "personal" },
  location: { next: "guardian", previous: "contact" },
  guardian: { next: "academic", previous: "location" },
  academic: { previous: "guardian" },
}

// Group steps into 3 phases for progress bars
export const STEP_GROUPS = {
  1: ["attachments", "personal"] as ApplyStep[],
  2: ["contact", "location"] as ApplyStep[],
  3: ["guardian", "academic"] as ApplyStep[],
}

// Group labels
export const STEP_GROUP_LABELS = {
  1: { en: "Basic Information", ar: "المعلومات الأساسية" },
  2: { en: "Details", ar: "التفاصيل" },
  3: { en: "Family & Education", ar: "العائلة والتعليم" },
}

// ---------------------------------------------------------------------------
// Dictionary-first accessors
// These provide i18n-correct labels when dictionary is available,
// falling back to the hardcoded STEP_METADATA / STEP_GROUP_LABELS below.
// ---------------------------------------------------------------------------

/** Minimal shape expected from dictionary.school.admission.apply.steps */
type StepDict = Record<string, Record<string, string>>

/** Minimal shape expected from dictionary.school.admission.apply.groups */
type GroupsDict = Record<string, string>

/**
 * Get step label + description from dictionary, falling back to STEP_METADATA.
 *
 * Usage:
 *   const meta = getStepMeta(dictionary.school.admission.apply.steps, "personal")
 */
export function getStepMeta(stepsDict: StepDict | undefined, step: ApplyStep) {
  const s = stepsDict?.[step]
  return {
    label: s?.label || STEP_METADATA[step].label(false),
    description: s?.description || STEP_METADATA[step].description(false),
  }
}

/**
 * Group label mapping: group number → dictionary key
 */
const GROUP_KEY_MAP: Record<number, string> = {
  1: "basicInfo",
  2: "details",
  3: "familyEducation",
}

/**
 * Get group label from dictionary, falling back to STEP_GROUP_LABELS.
 *
 * Usage:
 *   const label = getGroupLabel(dictionary.school.admission.apply.groups, 1, isRTL)
 */
export function getGroupLabel(
  groupsDict: GroupsDict | undefined,
  group: number,
  isRTL: boolean
) {
  const key = GROUP_KEY_MAP[group]
  if (key && groupsDict?.[key]) {
    return groupsDict[key]
  }
  const fallback = STEP_GROUP_LABELS[group as keyof typeof STEP_GROUP_LABELS]
  return fallback ? (isRTL ? fallback.ar : fallback.en) : ""
}

// ---------------------------------------------------------------------------
// Fallback metadata (used when dictionary is not available)
// ---------------------------------------------------------------------------

// Step metadata (bilingual)
export const STEP_METADATA: Record<
  ApplyStep,
  {
    label: (isRTL: boolean) => string
    description: (isRTL: boolean) => string
  }
> = {
  attachments: {
    label: (isRTL) => (isRTL ? "المرفقات" : "Attachments"),
    description: (isRTL) =>
      isRTL ? "الصورة الشخصية والمستندات" : "Upload photo and documents",
  },
  personal: {
    label: (isRTL) => (isRTL ? "المعلومات الشخصية" : "Personal Information"),
    description: (isRTL) =>
      isRTL ? "المعلومات الشخصية للطالب" : "Student's personal details",
  },
  contact: {
    label: (isRTL) => (isRTL ? "معلومات الاتصال" : "Contact Information"),
    description: (isRTL) =>
      isRTL ? "البريد الإلكتروني ورقم الهاتف" : "Email and phone number",
  },
  location: {
    label: (isRTL) => (isRTL ? "العنوان" : "Address"),
    description: (isRTL) => (isRTL ? "عنوان الإقامة" : "Residential address"),
  },
  guardian: {
    label: (isRTL) => (isRTL ? "معلومات ولي الأمر" : "Guardian Information"),
    description: (isRTL) =>
      isRTL ? "معلومات الوالدين أو ولي الأمر" : "Parent or guardian details",
  },
  academic: {
    label: (isRTL) => (isRTL ? "المعلومات الأكاديمية" : "Academic Information"),
    description: (isRTL) =>
      isRTL
        ? "التعليم السابق والصف المتقدم إليه"
        : "Previous education and applying class",
  },
}

// Form validation limits
export const FORM_LIMITS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 20,
  ADDRESS_MAX_LENGTH: 200,
  ACHIEVEMENTS_MAX_LENGTH: 500,
  EMAIL_MAX_LENGTH: 100,
  CITY_MAX_LENGTH: 100,
  STATE_MAX_LENGTH: 100,
  POSTAL_CODE_MAX_LENGTH: 20,
} as const

// Auto-save interval in milliseconds
export const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

// Session expiry in days
export const SESSION_EXPIRY_DAYS = 7
