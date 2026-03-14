// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
] as const

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "On Leave", value: "ON_LEAVE" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Retired", value: "RETIRED" },
] as const

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Full-Time", value: "FULL_TIME" },
  { label: "Part-Time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
  { label: "Substitute", value: "SUBSTITUTE" },
] as const

export const QUALIFICATION_TYPE_OPTIONS = [
  { label: "Degree", value: "DEGREE" },
  { label: "Certification", value: "CERTIFICATION" },
  { label: "License", value: "LICENSE" },
] as const

export const EXPERTISE_LEVEL_OPTIONS = [
  { label: "Primary (Main Subject)", value: "PRIMARY" },
  { label: "Secondary (Can Teach)", value: "SECONDARY" },
  { label: "Certified", value: "CERTIFIED" },
] as const

export const CLASS_TEACHER_ROLE_OPTIONS = [
  { label: "Primary Teacher", value: "PRIMARY" },
  { label: "Co-Teacher", value: "CO_TEACHER" },
  { label: "Assistant", value: "ASSISTANT" },
] as const

// --- Bilingual factory functions ---

export const getGenderOptions = (lang?: string) => [
  { value: "male", label: lang === "ar" ? "ذكر" : "Male" },
  { value: "female", label: lang === "ar" ? "أنثى" : "Female" },
]

export const getEmploymentStatusOptions = (lang?: string) => [
  { value: "ACTIVE", label: lang === "ar" ? "نشط" : "Active" },
  { value: "ON_LEAVE", label: lang === "ar" ? "في إجازة" : "On Leave" },
  { value: "TERMINATED", label: lang === "ar" ? "منتهي" : "Terminated" },
  { value: "RETIRED", label: lang === "ar" ? "متقاعد" : "Retired" },
]

export const getEmploymentTypeOptions = (lang?: string) => [
  { value: "FULL_TIME", label: lang === "ar" ? "دوام كامل" : "Full-Time" },
  { value: "PART_TIME", label: lang === "ar" ? "دوام جزئي" : "Part-Time" },
  { value: "CONTRACT", label: lang === "ar" ? "عقد" : "Contract" },
  { value: "SUBSTITUTE", label: lang === "ar" ? "بديل" : "Substitute" },
]

export const getQualificationTypeOptions = (lang?: string) => [
  { value: "DEGREE", label: lang === "ar" ? "شهادة" : "Degree" },
  { value: "CERTIFICATION", label: lang === "ar" ? "اعتماد" : "Certification" },
  { value: "LICENSE", label: lang === "ar" ? "رخصة" : "License" },
]

export const getExpertiseLevelOptions = (lang?: string) => [
  {
    value: "PRIMARY",
    label: lang === "ar" ? "رئيسي (المادة الأساسية)" : "Primary (Main Subject)",
  },
  {
    value: "SECONDARY",
    label: lang === "ar" ? "ثانوي (يمكن التدريس)" : "Secondary (Can Teach)",
  },
  { value: "CERTIFIED", label: lang === "ar" ? "معتمد" : "Certified" },
]
