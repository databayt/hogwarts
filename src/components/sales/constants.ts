/**
 * Constants for the Sales/Leads feature
 * Contains static data, enums, and configuration values
 */

// Lead status options (matching Prisma enum)
export const LEAD_STATUS = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  PROPOSAL: "PROPOSAL",
  NEGOTIATION: "NEGOTIATION",
  CLOSED_WON: "CLOSED_WON",
  CLOSED_LOST: "CLOSED_LOST",
  ARCHIVED: "ARCHIVED",
} as const

export type LeadStatusKey = keyof typeof LEAD_STATUS

// Lead source options (matching Prisma enum)
export const LEAD_SOURCE = {
  MANUAL: "MANUAL",
  IMPORT: "IMPORT",
  WEBSITE: "WEBSITE",
  REFERRAL: "REFERRAL",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  EMAIL_CAMPAIGN: "EMAIL_CAMPAIGN",
  COLD_CALL: "COLD_CALL",
  CONFERENCE: "CONFERENCE",
  PARTNER: "PARTNER",
} as const

export type LeadSourceKey = keyof typeof LEAD_SOURCE

// Lead priority options (matching Prisma enum)
export const LEAD_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const

export type LeadPriorityKey = keyof typeof LEAD_PRIORITY

// Lead type options (matching Prisma enum)
export const LEAD_TYPE = {
  SCHOOL: "SCHOOL",
  PARTNERSHIP: "PARTNERSHIP",
  OTHER: "OTHER",
} as const

export type LeadTypeKey = keyof typeof LEAD_TYPE

// Lead score ranges for display
export const LEAD_SCORE_RANGES = {
  HOT: { min: 80, max: 100, label: "Hot", color: "destructive" },
  WARM: { min: 60, max: 79, label: "Warm", color: "warning" },
  COOL: { min: 40, max: 59, label: "Cool", color: "secondary" },
  COLD: { min: 0, max: 39, label: "Cold", color: "muted" },
} as const

// Status badge colors (using semantic tokens)
export const STATUS_COLORS: Record<LeadStatusKey, string> = {
  NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CONTACTED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  QUALIFIED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PROPOSAL:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  NEGOTIATION:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  CLOSED_WON:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  CLOSED_LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

// Priority badge colors
export const PRIORITY_COLORS: Record<LeadPriorityKey, string> = {
  LOW: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

// Table pagination options
export const PAGINATION_OPTIONS = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

// Field visibility defaults
export const DEFAULT_VISIBLE_FIELDS = [
  "name",
  "email",
  "company",
  "title",
  "score",
  "status",
  "createdAt",
] as const

// Bulk operation limits
export const BULK_OPERATION_LIMITS = {
  MAX_SELECTION: 100,
  MAX_EXPORT: 5000,
  MAX_IMPORT: 1000,
} as const

// Activity types
export const ACTIVITY_TYPES = {
  EMAIL_SENT: "email_sent",
  CALL: "call",
  MEETING: "meeting",
  NOTE: "note",
  STATUS_CHANGE: "status_change",
} as const

// Feature flags
export const FEATURE_FLAGS = {
  AI_EXTRACTION: true, // Enable AI Extraction tab
  BULK_OPERATIONS: true,
  EMAIL_INTEGRATION: false, // TODO: Enable when email is configured
} as const
