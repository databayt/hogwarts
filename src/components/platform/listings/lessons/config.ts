export const STEPS = {
  1: "Basic Information",
  2: "Schedule & Details",
  3: "Content & Assessment",
} as const

export const STEP_FIELDS = {
  1: ["title", "description", "classId"] as const,
  2: ["lessonDate", "startTime", "endTime"] as const,
  3: ["objectives", "materials", "activities", "assessment", "notes"] as const,
} as const

export const TOTAL_FIELDS = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3],
].length

export const LESSON_STATUSES = [
  { label: "Planned", value: "PLANNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
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
] as const
