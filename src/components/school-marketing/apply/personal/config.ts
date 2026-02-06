// Personal Step Configuration

export const PERSONAL_STEP_CONFIG = {
  id: "personal",
  label: "المعلومات الشخصية",
  description: "أدخل المعلومات الشخصية للطالب",
}

export const GENDER_OPTIONS = [
  { value: "MALE", label: "ذكر" },
  { value: "FEMALE", label: "أنثى" },
  { value: "OTHER", label: "أخرى" },
] as const

export const NATIONALITY_OPTIONS = [
  { value: "SD", label: "سوداني" },
  { value: "EG", label: "مصري" },
  { value: "SA", label: "سعودي" },
  { value: "AE", label: "إماراتي" },
  { value: "JO", label: "أردني" },
  { value: "OTHER", label: "أخرى" },
] as const

export const RELIGION_OPTIONS = [
  { value: "islam", label: "الإسلام" },
  { value: "christianity", label: "المسيحية" },
  { value: "other", label: "أخرى" },
] as const

export const CATEGORY_OPTIONS = [
  { value: "general", label: "عام" },
  {
    value: "special_needs",
    label: "ذوي الاحتياجات الخاصة",
  },
  { value: "scholarship", label: "منحة دراسية" },
] as const
