// Guardian Step Configuration

export const GUARDIAN_STEP_CONFIG = {
  id: "guardian",
  label: "Guardian Information",
  labelAr: "معلومات ولي الأمر",
  description: "Enter parent or guardian details",
  descriptionAr: "أدخل معلومات الوالدين أو ولي الأمر",
}

export const GUARDIAN_RELATION_OPTIONS = [
  { value: "father", label: "Father", labelAr: "الأب" },
  { value: "mother", label: "Mother", labelAr: "الأم" },
  { value: "grandfather", label: "Grandfather", labelAr: "الجد" },
  { value: "grandmother", label: "Grandmother", labelAr: "الجدة" },
  { value: "uncle", label: "Uncle", labelAr: "العم/الخال" },
  { value: "aunt", label: "Aunt", labelAr: "العمة/الخالة" },
  { value: "other", label: "Other", labelAr: "أخرى" },
] as const
