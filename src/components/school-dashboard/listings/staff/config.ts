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
