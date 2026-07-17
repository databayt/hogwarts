// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const STEP_FIELDS = {
  1: ["title", "description", "eventType"] as const,
  2: ["eventDate", "startTime", "endTime", "location"] as const,
  3: [
    "organizer",
    "targetAudience",
    "maxAttendees",
    "isPublic",
    "registrationRequired",
    "notes",
  ] as const,
} as const

export const TOTAL_FIELDS = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3],
].length

/** Event status values — must mirror the Prisma `EventStatus` enum exactly. */
export const EVENT_STATUS_VALUES = [
  "PLANNED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED",
] as const

/** Event type values */
export const EVENT_TYPE_VALUES = [
  "ACADEMIC",
  "SPORTS",
  "CULTURAL",
  "PARENT_MEETING",
  "CELEBRATION",
  "WORKSHOP",
  "OTHER",
] as const

/** Target audience values */
export const TARGET_AUDIENCE_VALUES = [
  "All Students",
  "Primary Students",
  "Secondary Students",
  "Teachers Only",
  "Parents Only",
  "Staff Only",
  "Public",
  "Specific Class",
  "Other",
] as const

export const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
] as const

// --- Dictionary-based factory functions ---

type EventsDictionary = Record<string, any>

export const getEventStatuses = (d?: EventsDictionary) => {
  const s = d?.statuses as Record<string, string> | undefined
  return [
    { value: "PLANNED", label: s?.PLANNED || "Planned" },
    { value: "ONGOING", label: s?.ONGOING || "In Progress" },
    { value: "COMPLETED", label: s?.COMPLETED || "Completed" },
    { value: "CANCELLED", label: s?.CANCELLED || "Cancelled" },
    { value: "POSTPONED", label: s?.POSTPONED || "Postponed" },
  ]
}

export const getEventTypes = (d?: EventsDictionary) => {
  const t = d?.types as Record<string, string> | undefined
  return [
    { value: "ACADEMIC", label: t?.ACADEMIC || "Academic" },
    { value: "SPORTS", label: t?.SPORTS || "Sports" },
    { value: "CULTURAL", label: t?.CULTURAL || "Cultural" },
    { value: "PARENT_MEETING", label: t?.PARENT_MEETING || "Parent Meeting" },
    { value: "CELEBRATION", label: t?.CELEBRATION || "Celebration" },
    { value: "WORKSHOP", label: t?.WORKSHOP || "Workshop" },
    { value: "OTHER", label: t?.OTHER || "Other" },
  ]
}

export const getTargetAudiences = (d?: EventsDictionary) => {
  const a = d?.targetAudiences as Record<string, string> | undefined
  return [
    { value: "All Students", label: a?.allStudents || "All Students" },
    {
      value: "Primary Students",
      label: a?.primaryStudents || "Elementary Students",
    },
    {
      value: "Secondary Students",
      label: a?.secondaryStudents || "Secondary Students",
    },
    { value: "Teachers Only", label: a?.teachersOnly || "Teachers Only" },
    { value: "Parents Only", label: a?.parentsOnly || "Parents Only" },
    { value: "Staff Only", label: a?.staffOnly || "Staff Only" },
    { value: "Public", label: a?.public || "Public" },
    { value: "Specific Class", label: a?.specificClass || "Specific Class" },
    { value: "Other", label: a?.other || "Other" },
  ]
}
