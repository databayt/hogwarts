// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

export const GRADE_OPTIONS = (isRTL: boolean) =>
  [
    { value: "روضة 1", label: isRTL ? "روضة 1" : "KG 1" },
    { value: "روضة 2", label: isRTL ? "روضة 2" : "KG 2" },
    { value: "الصف الأول", label: isRTL ? "الصف الأول" : "Grade 1" },
    { value: "الصف الثاني", label: isRTL ? "الصف الثاني" : "Grade 2" },
    { value: "الصف الثالث", label: isRTL ? "الصف الثالث" : "Grade 3" },
    { value: "الصف الرابع", label: isRTL ? "الصف الرابع" : "Grade 4" },
    { value: "الصف الخامس", label: isRTL ? "الصف الخامس" : "Grade 5" },
    { value: "الصف السادس", label: isRTL ? "الصف السادس" : "Grade 6" },
    { value: "الصف السابع", label: isRTL ? "الصف السابع" : "Grade 7" },
    { value: "الصف الثامن", label: isRTL ? "الصف الثامن" : "Grade 8" },
    { value: "الصف التاسع", label: isRTL ? "الصف التاسع" : "Grade 9" },
    { value: "الصف العاشر", label: isRTL ? "الصف العاشر" : "Grade 10" },
    { value: "الصف الحادي عشر", label: isRTL ? "الصف الحادي عشر" : "Grade 11" },
    { value: "الصف الثاني عشر", label: isRTL ? "الصف الثاني عشر" : "Grade 12" },
  ] as const

export const STREAM_OPTIONS = (isRTL: boolean) =>
  [
    { value: "science", label: isRTL ? "علمي" : "Science" },
    { value: "arts", label: isRTL ? "أدبي" : "Arts" },
    { value: "commerce", label: isRTL ? "تجاري" : "Commerce" },
    { value: "general", label: isRTL ? "عام" : "General" },
  ] as const

export const PERFORMANCE_OPTIONS = (isRTL: boolean) =>
  [
    { value: "excellent", label: isRTL ? "ممتاز (90%+)" : "Excellent (90%+)" },
    {
      value: "very-good",
      label: isRTL ? "جيد جداً (80-89%)" : "Very Good (80-89%)",
    },
    { value: "good", label: isRTL ? "جيد (70-79%)" : "Good (70-79%)" },
    { value: "average", label: isRTL ? "مقبول (60-69%)" : "Average (60-69%)" },
    {
      value: "below-average",
      label: isRTL ? "ضعيف (أقل من 60%)" : "Below Average (<60%)",
    },
  ] as const

export const LANGUAGE_OPTIONS = (isRTL: boolean) =>
  [
    { value: "arabic", label: isRTL ? "العربية" : "Arabic" },
    { value: "english", label: isRTL ? "الإنجليزية" : "English" },
    { value: "french", label: isRTL ? "الفرنسية" : "French" },
    { value: "quran", label: isRTL ? "القرآن الكريم" : "Quran" },
  ] as const
