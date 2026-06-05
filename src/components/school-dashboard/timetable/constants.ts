// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timetable Constants
 *
 * Shared constants for timetable components and actions.
 */

/**
 * Sentinel term id for the display-only fallback grid.
 *
 * When a school has no real `Term` row yet, the timetable still renders an
 * empty grid built from the school's timetable structure instead of hard-
 * blocking with "No term configured". This id flows through getActiveTerm →
 * getPersonalizedTimetable as a marker that the grid is a non-persisted draft;
 * nothing is ever written to the database for it. An admin clicks "Set up
 * timetable" to provision a real term and unlock editing.
 */
export const DRAFT_TERM_ID = "__draft__"

// Working day presets for quick configuration
export const WORKING_DAY_PRESETS = {
  "sun-thu": {
    label: "أحد–خميس",
    days: [0, 1, 2, 3, 4], // Sun, Mon, Tue, Wed, Thu
  },
  "mon-fri": {
    label: "اثنين–جمعة",
    days: [1, 2, 3, 4, 5], // Mon, Tue, Wed, Thu, Fri
  },
  "mon-sat": {
    label: "اثنين–سبت",
    days: [1, 2, 3, 4, 5, 6], // Mon through Sat
  },
  custom: {
    label: "مخصص",
    days: [], // User-defined
  },
} as const

/**
 * Absence types with human-readable labels
 */
export const ABSENCE_TYPES = {
  SICK: { label: "إجازة مرضية" },
  PERSONAL: { label: "إجازة شخصية" },
  TRAINING: { label: "تدريب/تطوير مهني" },
  EMERGENCY: { label: "طوارئ" },
  OTHER: { label: "أخرى" },
} as const

/**
 * Substitution status values
 */
export const SUBSTITUTION_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  DECLINED: "DECLINED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const
