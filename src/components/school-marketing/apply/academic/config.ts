// Academic Step Configuration

export const ACADEMIC_STEP_CONFIG = {
  id: "academic",
  label: (isRTL: boolean) =>
    isRTL ? "المعلومات الأكاديمية" : "Academic Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "أدخل معلومات التعليم السابق والصف المتقدم إليه"
      : "Enter previous education and applying class information",
}

export const STREAM_OPTIONS = (isRTL: boolean) =>
  [
    { value: "science", label: isRTL ? "علمي" : "Science" },
    { value: "arts", label: isRTL ? "أدبي" : "Arts" },
    { value: "commerce", label: isRTL ? "تجاري" : "Commerce" },
    { value: "general", label: isRTL ? "عام" : "General" },
  ] as const

export const LANGUAGE_OPTIONS = (isRTL: boolean) =>
  [
    { value: "arabic", label: isRTL ? "العربية" : "Arabic" },
    { value: "english", label: isRTL ? "الإنجليزية" : "English" },
    { value: "french", label: isRTL ? "الفرنسية" : "French" },
    { value: "quran", label: isRTL ? "القرآن الكريم" : "Quran" },
  ] as const
