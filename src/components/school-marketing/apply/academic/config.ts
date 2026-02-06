// Academic Step Configuration

export const ACADEMIC_STEP_CONFIG = {
  id: "academic",
  label: "المعلومات الأكاديمية",
  description: "أدخل معلومات التعليم السابق والصف المتقدم إليه",
}

export const STREAM_OPTIONS = [
  { value: "science", label: "علمي" },
  { value: "arts", label: "أدبي" },
  { value: "commerce", label: "تجاري" },
  { value: "general", label: "عام" },
] as const

export const LANGUAGE_OPTIONS = [
  { value: "arabic", label: "العربية" },
  { value: "english", label: "الإنجليزية" },
  { value: "french", label: "الفرنسية" },
  { value: "quran", label: "القرآن الكريم" },
] as const
