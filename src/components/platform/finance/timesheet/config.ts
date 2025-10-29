/**
 * Timesheet Module - Configuration
 */

import { TimesheetStatus } from '@prisma/client'

export const TimesheetStatusLabels: Record<TimesheetStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const TaskTypes = [
  'TEACHING',
  'ADMINISTRATION',
  'MEETINGS',
  'PREPARATION',
  'GRADING',
  'PROFESSIONAL_DEVELOPMENT',
  'SUPERVISION',
  'OTHER',
] as const

export type TaskType = typeof TaskTypes[number]

export const TaskTypeLabels: Record<TaskType, string> = {
  TEACHING: 'Teaching',
  ADMINISTRATION: 'Administration',
  MEETINGS: 'Meetings',
  PREPARATION: 'Lesson Preparation',
  GRADING: 'Grading & Assessment',
  PROFESSIONAL_DEVELOPMENT: 'Professional Development',
  SUPERVISION: 'Student Supervision',
  OTHER: 'Other',
}

export const TIMESHEET_CONFIG = {
  PERIOD_DURATION_DAYS: 14, // Bi-weekly
  MIN_HOURS_PER_ENTRY: 0.25, // 15 minutes
  MAX_HOURS_PER_DAY: 24,
  MAX_HOURS_PER_WEEK: 168,
  ROUNDING_INTERVAL: 0.25, // Round to nearest 15 minutes
} as const

export const TIMESHEET_RULES = {
  REQUIRE_APPROVAL: true,
  ALLOW_FUTURE_ENTRIES: false,
  ALLOW_EDITS_AFTER_SUBMISSION: false,
  AUTO_CALCULATE_TOTALS: true,
} as const
