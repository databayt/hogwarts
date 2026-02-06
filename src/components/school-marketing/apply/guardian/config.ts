// Guardian Step Configuration

export const GUARDIAN_STEP_CONFIG = {
  id: "guardian",
  label: "معلومات ولي الأمر",
  description: "أدخل معلومات الوالدين أو ولي الأمر",
}

export const GUARDIAN_RELATION_OPTIONS = [
  { value: "father", label: "الأب" },
  { value: "mother", label: "الأم" },
  { value: "grandfather", label: "الجد" },
  { value: "grandmother", label: "الجدة" },
  { value: "uncle", label: "العم/الخال" },
  { value: "aunt", label: "العمة/الخالة" },
  { value: "other", label: "أخرى" },
] as const
