export const STEPS = {
  1: "Basic Information",
  2: "Schedule & Location",
  3: "Details & Attendees"
} as const;

export const STEP_FIELDS = {
  1: ['title', 'description', 'eventType'] as const,
  2: ['eventDate', 'startTime', 'endTime', 'location'] as const,
  3: ['organizer', 'targetAudience', 'maxAttendees', 'isPublic', 'registrationRequired', 'notes'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3]].length;

export const EVENT_STATUSES = [
  { label: "Planned", value: "PLANNED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" }
] as const;

export const EVENT_TYPES = [
  { label: "Academic", value: "ACADEMIC" },
  { label: "Sports", value: "SPORTS" },
  { label: "Cultural", value: "CULTURAL" },
  { label: "Parent Meeting", value: "PARENT_MEETING" },
  { label: "Celebration", value: "CELEBRATION" },
  { label: "Workshop", value: "WORKSHOP" },
  { label: "Other", value: "OTHER" }
] as const;

export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30"
] as const;

export const TARGET_AUDIENCES = [
  "All Students",
  "Primary Students",
  "Secondary Students",
  "Teachers Only",
  "Parents Only",
  "Staff Only",
  "Public",
  "Specific Class",
  "Other"
] as const;
