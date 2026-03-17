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

// Step metadata
export const STEP_METADATA: Record<
  ApplyStep,
  {
    label: string
    description: string
  }
> = {
  attachments: {
    label: "المرفقات",
    description: "الصورة الشخصية والمستندات",
  },
  personal: {
    label: "المعلومات الشخصية",
    description: "المعلومات الشخصية للطالب",
  },
  contact: {
    label: "معلومات الاتصال",
    description: "البريد الإلكتروني ورقم الهاتف",
  },
  location: {
    label: "العنوان",
    description: "عنوان الإقامة",
  },
  guardian: {
    label: "معلومات ولي الأمر",
    description: "معلومات الوالدين أو ولي الأمر",
  },
  academic: {
    label: "المعلومات الأكاديمية",
    description: "التعليم السابق والصف المتقدم إليه",
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
