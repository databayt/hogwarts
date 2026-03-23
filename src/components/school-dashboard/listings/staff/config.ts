// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Configuration for Staff module
 *
 * Static options (EMPLOYMENT_STATUS_OPTIONS etc.) are kept for non-UI contexts
 * (e.g., Zod enums, server-side logic). For UI display, use the dictionary-based
 * factory functions that accept a staffListing dictionary section.
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

// --- Dictionary-based factory functions ---
// These accept the staffListing dictionary section (Record<string, any>)
// and fall back to English defaults when dictionary is not yet loaded.

type StaffDict = Record<string, any> | undefined

export const getEmploymentStatusOptions = (d?: StaffDict) => {
  const es = d?.employmentStatus as Record<string, string> | undefined
  return [
    { value: "ACTIVE", label: es?.active || "Active" },
    { value: "ON_LEAVE", label: es?.onLeave || "On Leave" },
    { value: "TERMINATED", label: es?.terminated || "Terminated" },
    { value: "RETIRED", label: es?.retired || "Retired" },
  ]
}

export const getEmploymentTypeOptions = (d?: StaffDict) => {
  const et = d?.employmentType as Record<string, string> | undefined
  return [
    { value: "FULL_TIME", label: et?.fullTime || "Full Time" },
    { value: "PART_TIME", label: et?.partTime || "Part Time" },
    { value: "CONTRACT", label: et?.contract || "Contract" },
    { value: "TEMPORARY", label: et?.temporary || "Temporary" },
  ]
}

export const getGenderOptions = (d?: StaffDict) => {
  const g = d?.gender as Record<string, string> | undefined
  return [
    { value: "male", label: g?.male || "Male" },
    { value: "female", label: g?.female || "Female" },
  ]
}

export const getStaffSortOptions = (d?: StaffDict) => {
  const s = d?.sortOptions as Record<string, string> | undefined
  return [
    { value: "createdAt", label: s?.dateAdded || "Date Added" },
    { value: "givenName", label: s?.firstName || "First Name" },
    { value: "surname", label: s?.lastName || "Last Name" },
    { value: "position", label: s?.position || "Position" },
  ]
}

/** Get status labels map for column display */
export const getStatusLabels = (d?: StaffDict): Record<string, string> => {
  const es = d?.employmentStatus as Record<string, string> | undefined
  return {
    ACTIVE: es?.active || "Active",
    ON_LEAVE: es?.onLeave || "On Leave",
    TERMINATED: es?.terminated || "Terminated",
    RETIRED: es?.retired || "Retired",
  }
}

/** Get type labels map for column display */
export const getTypeLabels = (d?: StaffDict): Record<string, string> => {
  const et = d?.employmentType as Record<string, string> | undefined
  return {
    FULL_TIME: et?.fullTime || "Full Time",
    PART_TIME: et?.partTime || "Part Time",
    CONTRACT: et?.contract || "Contract",
    TEMPORARY: et?.temporary || "Temporary",
  }
}
