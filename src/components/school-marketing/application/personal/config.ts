// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Personal Step Configuration

// Fallback labels (used when dictionary is unavailable)
export const PERSONAL_STEP_CONFIG = {
  id: "personal",
  label: (isRTL: boolean) =>
    isRTL ? "المعلومات الشخصية" : "Personal Information",
  description: (isRTL: boolean) =>
    isRTL
      ? "المعلومات الشخصية للطالب وولي الأمر"
      : "Student and guardian personal details",
}

type OptionDict = Record<string, string>

export const getGenderOptions = (d: OptionDict) => [
  { value: "MALE", label: d.MALE || "Male" },
  { value: "FEMALE", label: d.FEMALE || "Female" },
]

export const getNationalityOptions = (d: OptionDict) => [
  { value: "SD", label: d.SD || "Sudanese" },
  { value: "EG", label: d.EG || "Egyptian" },
  { value: "SA", label: d.SA || "Saudi" },
  { value: "AE", label: d.AE || "Emirati" },
  { value: "JO", label: d.JO || "Jordanian" },
  { value: "OTHER", label: d.OTHER || "Other" },
]

export const getReligionOptions = (d: OptionDict) => [
  { value: "islam", label: d.islam || "Islam" },
  { value: "christianity", label: d.christianity || "Christianity" },
  { value: "other", label: d.other || "Other" },
]

export const getCategoryOptions = (d: OptionDict) => [
  { value: "general", label: d.general || "General" },
  { value: "special_needs", label: d.special_needs || "Special Needs" },
  { value: "scholarship", label: d.scholarship || "Scholarship" },
]
