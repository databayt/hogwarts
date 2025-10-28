/**
 * Fees Sub-Block Configuration
 *
 * Static configuration and constants
 */

export const FEE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const

export const FEE_ASSIGNMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  WAIVED: 'WAIVED',
} as const

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_MONEY: 'MOBILE_MONEY',
  CHECK: 'CHECK',
  OTHER: 'OTHER',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const

export const SCHOLARSHIP_TYPE = {
  FULL: 'FULL',
  PARTIAL: 'PARTIAL',
  MERIT_BASED: 'MERIT_BASED',
  NEED_BASED: 'NEED_BASED',
  SPORTS: 'SPORTS',
  ACADEMIC: 'ACADEMIC',
} as const

export const SCHOLARSHIP_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CLOSED: 'CLOSED',
} as const

export const SCHOLARSHIP_APPLICATION_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export const FINE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  WAIVED: 'WAIVED',
  OVERDUE: 'OVERDUE',
} as const

export const REFUND_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const

// Status badge colors
export const STATUS_COLORS = {
  ACTIVE: 'bg-green-500/10 text-green-500',
  INACTIVE: 'bg-gray-500/10 text-gray-500',
  ARCHIVED: 'bg-gray-500/10 text-gray-500',
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  PAID: 'bg-green-500/10 text-green-500',
  PARTIALLY_PAID: 'bg-blue-500/10 text-blue-500',
  OVERDUE: 'bg-red-500/10 text-red-500',
  WAIVED: 'bg-purple-500/10 text-purple-500',
  PROCESSING: 'bg-blue-500/10 text-blue-500',
  COMPLETED: 'bg-green-500/10 text-green-500',
  FAILED: 'bg-red-500/10 text-red-500',
  REFUNDED: 'bg-orange-500/10 text-orange-500',
  UNDER_REVIEW: 'bg-blue-500/10 text-blue-500',
  APPROVED: 'bg-green-500/10 text-green-500',
  REJECTED: 'bg-red-500/10 text-red-500',
  CLOSED: 'bg-gray-500/10 text-gray-500',
} as const

// Default pagination
export const DEFAULT_PAGE_SIZE = 20

// Fee categories
export const FEE_CATEGORIES = [
  'TUITION',
  'REGISTRATION',
  'LIBRARY',
  'LABORATORY',
  'SPORTS',
  'TRANSPORT',
  'EXAMINATION',
  'UNIFORM',
  'TEXTBOOK',
  'ACTIVITY',
  'OTHER',
] as const
