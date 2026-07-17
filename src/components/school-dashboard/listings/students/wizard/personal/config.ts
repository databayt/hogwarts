// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Personal Step Configuration (student wizard)
//
// Fallback labels used when the dictionary is unavailable. Mirrors the
// application/personal/config.ts pattern so both flows stay in sync.
export const PERSONAL_STEP_CONFIG = {
  id: "personal",
  label: (isRTL: boolean) =>
    isRTL ? "المعلومات الشخصية" : "Personal Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "المعلومات الشخصية للطالب وولي الأمر"
      : "Student and guardian personal details",
}
