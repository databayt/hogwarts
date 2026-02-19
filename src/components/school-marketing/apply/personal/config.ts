// Personal Step Configuration

export const PERSONAL_STEP_CONFIG = {
  id: "personal",
  label: (isRTL: boolean) =>
    isRTL ? "المعلومات الشخصية" : "Personal Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "أدخل المعلومات الشخصية للطالب"
      : "Enter the student's personal information",
}

export const GENDER_OPTIONS = (isRTL: boolean) =>
  [
    { value: "MALE", label: isRTL ? "ذكر" : "Male" },
    { value: "FEMALE", label: isRTL ? "أنثى" : "Female" },
    { value: "OTHER", label: isRTL ? "أخرى" : "Other" },
  ] as const

export const NATIONALITY_OPTIONS = (isRTL: boolean) =>
  [
    { value: "SD", label: isRTL ? "سوداني" : "Sudanese" },
    { value: "EG", label: isRTL ? "مصري" : "Egyptian" },
    { value: "SA", label: isRTL ? "سعودي" : "Saudi" },
    { value: "AE", label: isRTL ? "إماراتي" : "Emirati" },
    { value: "JO", label: isRTL ? "أردني" : "Jordanian" },
    { value: "OTHER", label: isRTL ? "أخرى" : "Other" },
  ] as const

export const RELIGION_OPTIONS = (isRTL: boolean) =>
  [
    { value: "islam", label: isRTL ? "الإسلام" : "Islam" },
    { value: "christianity", label: isRTL ? "المسيحية" : "Christianity" },
    { value: "other", label: isRTL ? "أخرى" : "Other" },
  ] as const

export const CATEGORY_OPTIONS = (isRTL: boolean) =>
  [
    { value: "general", label: isRTL ? "عام" : "General" },
    {
      value: "special_needs",
      label: isRTL ? "ذوي الاحتياجات الخاصة" : "Special Needs",
    },
    { value: "scholarship", label: isRTL ? "منحة دراسية" : "Scholarship" },
  ] as const
