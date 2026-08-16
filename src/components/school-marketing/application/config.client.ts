// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Apply Block - Client Configuration
// Following student wizard pattern

import type { StepConfig } from "@/components/form/footer"

export type ApplyStep =
  | "attachments"
  | "personal"
  | "location"
  | "academic"
  | "fees"

// Step order for the application flow (guardian merged into personal)
export const APPLY_STEPS: ApplyStep[] = [
  "attachments",
  "personal",
  "location",
  "academic",
  "fees",
]

// Step navigation map
export const STEP_NAVIGATION: Record<
  ApplyStep,
  { next?: ApplyStep; previous?: ApplyStep }
> = {
  attachments: { next: "personal" },
  personal: { next: "location", previous: "attachments" },
  location: { next: "academic", previous: "personal" },
  academic: { next: "fees", previous: "location" },
  fees: { previous: "academic" },
}

// Group steps into 3 phases for progress bars
export const STEP_GROUPS = {
  1: ["attachments", "personal"] as ApplyStep[],
  2: ["location"] as ApplyStep[],
  3: ["academic", "fees"] as ApplyStep[],
}

// Group labels
export const STEP_GROUP_LABELS = {
  1: { en: "Basic Information", ar: "المعلومات الأساسية" },
  2: { en: "Address", ar: "العنوان" },
  3: { en: "Academic", ar: "الأكاديمية" },
}

// `getStepMeta` / `getGroupLabel` used to live here as "dictionary-first
// accessors". Both had ZERO callers: every step's content.tsx reads its copy
// through `getApplyDict` (utils.ts) instead, which resolves the same
// `admission.apply.*` subtree. Two mechanisms for one job, one of them dead —
// removed rather than left to look load-bearing.

/**
 * Footer/progress config for the application flow — DERIVED from the step
 * definitions above, not hand-written.
 *
 * This used to be a fourth independent declaration of the same step order,
 * hardcoded in `@/components/form/footer.tsx` alongside `APPLY_STEPS`,
 * `STEP_NAVIGATION` and `STEP_GROUPS` here, with nothing keeping the four in
 * sync — adding or reordering a step (as the guardian-step removal did) meant
 * editing all four in lockstep or shipping a progress bar that disagreed with
 * the wizard. Now there is one source of truth.
 *
 * `groupLabels` is intentionally the English array: `FormFooter` consumes it
 * only for `.length` (progress-bar segment count) and never renders the
 * strings — see the note in `form/footer.tsx`. Localized group labels come
 * from `admission.apply.groups` via `getApplyDict`.
 */
export const ADMISSION_STEP_CONFIG: StepConfig = {
  steps: APPLY_STEPS,
  groups: STEP_GROUPS,
  groupLabels: Object.values(STEP_GROUP_LABELS).map((g) => g.en),
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
      isRTL
        ? "المعلومات الشخصية للطالب وولي الأمر"
        : "Student and guardian personal details",
  },
  location: {
    label: (isRTL) => (isRTL ? "العنوان" : "Address"),
    description: (isRTL) => (isRTL ? "عنوان الإقامة" : "Residential address"),
  },
  academic: {
    label: (isRTL) => (isRTL ? "المعلومات الأكاديمية" : "Academic Information"),
    description: (isRTL) =>
      isRTL
        ? "التعليم السابق والصف المتقدم إليه"
        : "Previous education and applying class",
  },
  fees: {
    label: (isRTL) => (isRTL ? "الرسوم الدراسية" : "School Fees"),
    description: (isRTL) =>
      isRTL
        ? "الرسوم وطرق الدفع حسب الصف الدراسي"
        : "Fees and payment options by grade",
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
