// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const GUARDIAN_STEP_CONFIG = {
  id: "guardian",
  label: (isRTL: boolean) =>
    isRTL ? "معلومات ولي الأمر" : "Guardian Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "أدخل معلومات الوالدين أو ولي الأمر"
      : "Enter parent or guardian details",
}

export const GUARDIAN_RELATION_OPTIONS = (isRTL: boolean) =>
  [
    { value: "grandfather", label: isRTL ? "الجد" : "Grandfather" },
    { value: "grandmother", label: isRTL ? "الجدة" : "Grandmother" },
    { value: "uncle", label: isRTL ? "العم/الخال" : "Uncle" },
    { value: "aunt", label: isRTL ? "العمة/الخالة" : "Aunt" },
    { value: "other", label: isRTL ? "أخرى" : "Other" },
  ] as const
