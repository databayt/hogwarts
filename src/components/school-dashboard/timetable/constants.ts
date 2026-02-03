/**
 * Timetable Constants
 *
 * Shared constants for timetable components and actions.
 */

// Working day presets for quick configuration
export const WORKING_DAY_PRESETS = {
  "sun-thu": {
    label: "Sun–Thu (Middle East)",
    labelAr: "أحد–خميس",
    days: [0, 1, 2, 3, 4], // Sun, Mon, Tue, Wed, Thu
  },
  "mon-fri": {
    label: "Mon–Fri (Western)",
    labelAr: "اثنين–جمعة",
    days: [1, 2, 3, 4, 5], // Mon, Tue, Wed, Thu, Fri
  },
  "mon-sat": {
    label: "Mon–Sat (Extended)",
    labelAr: "اثنين–سبت",
    days: [1, 2, 3, 4, 5, 6], // Mon through Sat
  },
  custom: {
    label: "Custom",
    labelAr: "مخصص",
    days: [], // User-defined
  },
} as const

/**
 * Absence types with human-readable labels
 */
export const ABSENCE_TYPES = {
  SICK: { label: "Sick Leave", labelAr: "إجازة مرضية" },
  PERSONAL: { label: "Personal Leave", labelAr: "إجازة شخصية" },
  TRAINING: { label: "Training/PD", labelAr: "تدريب/تطوير مهني" },
  EMERGENCY: { label: "Emergency", labelAr: "طوارئ" },
  OTHER: { label: "Other", labelAr: "أخرى" },
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
