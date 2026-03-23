// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timesheet Module - Configuration
 * Labels are dictionary-backed via getter functions.
 */

import { EntryStatus, PeriodStatus } from "@prisma/client"

/** Default fallback labels (used when dictionary is not available) */
const DEFAULT_PERIOD_STATUS: Record<PeriodStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  LOCKED: "Locked",
}

const DEFAULT_ENTRY_STATUS: Record<EntryStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

/** Get localized period status labels from dictionary */
export const getPeriodStatusLabels = (
  d?: Record<string, string>
): Record<PeriodStatus, string> => ({
  OPEN: d?.OPEN || DEFAULT_PERIOD_STATUS.OPEN,
  CLOSED: d?.CLOSED || DEFAULT_PERIOD_STATUS.CLOSED,
  LOCKED: d?.LOCKED || DEFAULT_PERIOD_STATUS.LOCKED,
})

/** For backward compat -- static fallback */
export const PeriodStatusLabels = DEFAULT_PERIOD_STATUS

/** Get localized entry status labels from dictionary */
export const getEntryStatusLabels = (
  d?: Record<string, string>
): Record<EntryStatus, string> => ({
  DRAFT: d?.DRAFT || DEFAULT_ENTRY_STATUS.DRAFT,
  SUBMITTED: d?.SUBMITTED || DEFAULT_ENTRY_STATUS.SUBMITTED,
  APPROVED: d?.APPROVED || DEFAULT_ENTRY_STATUS.APPROVED,
  REJECTED: d?.REJECTED || DEFAULT_ENTRY_STATUS.REJECTED,
})

/** For backward compat -- static fallback */
export const EntryStatusLabels = DEFAULT_ENTRY_STATUS

export const TaskTypes = [
  "TEACHING",
  "ADMINISTRATION",
  "MEETINGS",
  "PREPARATION",
  "GRADING",
  "PROFESSIONAL_DEVELOPMENT",
  "SUPERVISION",
  "OTHER",
] as const

export type TaskType = (typeof TaskTypes)[number]

const DEFAULT_TASK_TYPE_LABELS: Record<TaskType, string> = {
  TEACHING: "Teaching",
  ADMINISTRATION: "Administration",
  MEETINGS: "Meetings",
  PREPARATION: "Lesson Preparation",
  GRADING: "Grading & Assessment",
  PROFESSIONAL_DEVELOPMENT: "Professional Development",
  SUPERVISION: "Student Supervision",
  OTHER: "Other",
}

/** Get localized task type labels from dictionary */
export const getTaskTypeLabels = (
  d?: Record<string, string>
): Record<TaskType, string> => {
  const result = { ...DEFAULT_TASK_TYPE_LABELS }
  if (d) {
    for (const key of TaskTypes) {
      if (d[key]) result[key] = d[key]
    }
  }
  return result
}

/** For backward compat -- static fallback */
export const TaskTypeLabels = DEFAULT_TASK_TYPE_LABELS

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
