// Apply Block - Client Configuration
// Following onboarding pattern

export type ApplyStep =
  | "personal"
  | "contact"
  | "guardian"
  | "academic"
  | "documents"
  | "review"

// Step order for the application flow
export const APPLY_STEPS: ApplyStep[] = [
  "personal",
  "contact",
  "guardian",
  "academic",
  "documents",
  "review",
]

// Step navigation map
export const STEP_NAVIGATION: Record<
  ApplyStep,
  { next?: ApplyStep; previous?: ApplyStep }
> = {
  personal: { next: "contact" },
  contact: { next: "guardian", previous: "personal" },
  guardian: { next: "academic", previous: "contact" },
  academic: { next: "documents", previous: "guardian" },
  documents: { next: "review", previous: "academic" },
  review: { previous: "documents" },
}

// Group steps into 3 phases for progress bars
export const STEP_GROUPS = {
  1: ["personal", "contact"] as ApplyStep[],
  2: ["guardian", "academic"] as ApplyStep[],
  3: ["documents", "review"] as ApplyStep[],
}

// Group labels
export const STEP_GROUP_LABELS = {
  1: { en: "Basic Information", ar: "المعلومات الأساسية" },
  2: { en: "Family & Education", ar: "العائلة والتعليم" },
  3: { en: "Finalize", ar: "إتمام الطلب" },
}

// Step metadata
export const STEP_METADATA: Record<
  ApplyStep,
  {
    label: string
    description: string
  }
> = {
  personal: {
    label: "المعلومات الشخصية",
    description: "المعلومات الشخصية للطالب",
  },
  contact: {
    label: "معلومات الاتصال",
    description: "تفاصيل الاتصال والعنوان",
  },
  guardian: {
    label: "معلومات ولي الأمر",
    description: "معلومات الوالدين أو ولي الأمر",
  },
  academic: {
    label: "المعلومات الأكاديمية",
    description: "التعليم السابق والصف المتقدم إليه",
  },
  documents: {
    label: "المستندات",
    description: "رفع المستندات المطلوبة",
  },
  review: {
    label: "المراجعة والتقديم",
    description: "مراجعة وتقديم طلبك",
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
