// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration for Staff module
 */

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "RETIRED", label: "Retired" },
] as const

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "TEMPORARY", label: "Temporary" },
] as const

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const

export const STAFF_PAGE_SIZE = 20

export const STAFF_SORT_OPTIONS = [
  { value: "createdAt", label: "Date Added" },
  { value: "givenName", label: "First Name" },
  { value: "surname", label: "Last Name" },
  { value: "position", label: "Position" },
] as const

export function getEmploymentStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "green"
    case "ON_LEAVE":
      return "yellow"
    case "TERMINATED":
      return "red"
    case "RETIRED":
      return "gray"
    default:
      return "gray"
  }
}

export function getEmploymentTypeColor(type: string): string {
  switch (type) {
    case "FULL_TIME":
      return "blue"
    case "PART_TIME":
      return "purple"
    case "CONTRACT":
      return "orange"
    case "TEMPORARY":
      return "gray"
    default:
      return "gray"
  }
}

// --- Bilingual factory functions ---

export const getEmploymentStatusOptions = (lang?: string) => [
  { value: "ACTIVE", label: lang === "ar" ? "نشط" : "Active" },
  { value: "ON_LEAVE", label: lang === "ar" ? "في إجازة" : "On Leave" },
  { value: "TERMINATED", label: lang === "ar" ? "منتهي" : "Terminated" },
  { value: "RETIRED", label: lang === "ar" ? "متقاعد" : "Retired" },
]

export const getEmploymentTypeOptions = (lang?: string) => [
  { value: "FULL_TIME", label: lang === "ar" ? "دوام كامل" : "Full Time" },
  { value: "PART_TIME", label: lang === "ar" ? "دوام جزئي" : "Part Time" },
  { value: "CONTRACT", label: lang === "ar" ? "عقد" : "Contract" },
  { value: "TEMPORARY", label: lang === "ar" ? "مؤقت" : "Temporary" },
]

export const getGenderOptions = (lang?: string) => [
  { value: "male", label: lang === "ar" ? "ذكر" : "Male" },
  { value: "female", label: lang === "ar" ? "أنثى" : "Female" },
]

export const getStaffSortOptions = (lang?: string) => [
  { value: "createdAt", label: lang === "ar" ? "تاريخ الإضافة" : "Date Added" },
  { value: "givenName", label: lang === "ar" ? "الاسم الأول" : "First Name" },
  { value: "surname", label: lang === "ar" ? "اسم العائلة" : "Last Name" },
  { value: "position", label: lang === "ar" ? "المنصب" : "Position" },
]
