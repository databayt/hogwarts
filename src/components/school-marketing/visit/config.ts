import { Calendar, CheckCircle, Clock, Info } from "lucide-react"

import type {
  FormStep,
  FormStepGroup,
  MultiStepFormConfig,
} from "@/components/form"

import {
  confirmStepSchema,
  dateStepSchema,
  infoStepSchema,
  timeStepSchema,
} from "./validation"

/**
 * Visit Scheduling Configuration
 *
 * 4-step flow for scheduling school visits:
 * 1. Date Selection - Calendar showing available dates
 * 2. Time Selection - Available time slots based on timetable
 * 3. Visitor Info - Name, email, phone, purpose, number of visitors
 * 4. Confirmation - Review details + submit
 */

export const VISIT_PURPOSES = [
  { value: "tour", label: "School Tour" },
  { value: "enrollment", label: "Enrollment Inquiry" },
  { value: "meeting", label: "Parent Meeting" },
  { value: "interview", label: "Student Interview" },
  { value: "event", label: "Open Day / Event" },
  { value: "other", label: "Other" },
] as const

export type VisitPurpose = (typeof VISIT_PURPOSES)[number]["value"]

export const VISIT_STEPS: FormStep[] = [
  {
    id: "date",
    title: "Select Date",
    description: "Choose a date for your visit",
    icon: Calendar,
    fields: ["date"],
  },
  {
    id: "time",
    title: "Select Time",
    description: "Pick an available time slot",
    icon: Clock,
    fields: ["startTime", "endTime"],
  },
  {
    id: "info",
    title: "Visitor Information",
    description: "Tell us about your visit",
    icon: Info,
    fields: ["visitorName", "email", "phone", "purpose", "visitors", "notes"],
  },
  {
    id: "confirm",
    title: "Confirmation",
    description: "Review and confirm your booking",
    icon: CheckCircle,
    optional: true, // No validation needed, just review
  },
]

export const VISIT_STEP_GROUPS: FormStepGroup[] = [
  {
    id: "scheduling",
    label: "Schedule",
    steps: ["date", "time"],
  },
  {
    id: "details",
    label: "Details",
    steps: ["info", "confirm"],
  },
]

export const VISIT_CONFIG: MultiStepFormConfig = {
  steps: VISIT_STEPS,
  groups: VISIT_STEP_GROUPS,
  validation: {
    date: dateStepSchema,
    time: timeStepSchema,
    info: infoStepSchema,
    confirm: confirmStepSchema,
  },
  autoSave: true,
  autoSaveInterval: 30000,
  persistenceKey: "visit-scheduling-draft",
  analyticsFlowType: "visit",
}

export const DEFAULT_VISIT_DURATION = 60 // minutes
export const VISIT_SLOT_DURATION = 30 // minutes for each slot
