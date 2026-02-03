/**
 * Payroll Sub-Block Configuration
 *
 * Static configuration and constants
 */

export const PAYROLL_RUN_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const

export const SALARY_SLIP_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
} as const

export const PAYMENT_METHOD = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
  CHECK: "CHECK",
  MOBILE_MONEY: "MOBILE_MONEY",
} as const

// Status badge colors
export const STATUS_COLORS = {
  DRAFT: "bg-gray-500/10 text-gray-500",
  PENDING: "bg-yellow-500/10 text-yellow-500",
  PROCESSING: "bg-blue-500/10 text-blue-500",
  APPROVED: "bg-green-500/10 text-green-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  PAID: "bg-green-500/10 text-green-500",
  FAILED: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-red-500/10 text-red-500",
} as const

// Tax brackets (progressive tax system - can be customized per school)
export const TAX_BRACKETS = [
  { from: 0, to: 20000, rate: 0 }, // Tax-free up to $200
  { from: 20000, to: 50000, rate: 10 }, // 10% for $200 - $500
  { from: 50000, to: 100000, rate: 15 }, // 15% for $500 - $1000
  { from: 100000, to: 200000, rate: 20 }, // 20% for $1000 - $2000
  { from: 200000, to: null, rate: 25 }, // 25% for above $2000
] as const

// Social security rates
export const SOCIAL_SECURITY_RATE = 7 // 7%
export const EMPLOYER_SOCIAL_SECURITY_RATE = 12 // 12%

// Standard working days per month
export const STANDARD_WORKING_DAYS = 22

// Overtime multipliers
export const OVERTIME_MULTIPLIERS = {
  REGULAR: 1.5, // 150% for regular overtime
  WEEKEND: 2.0, // 200% for weekend work
  HOLIDAY: 2.5, // 250% for holiday work
} as const

// Payroll frequencies
export const PAYROLL_FREQUENCIES = [
  { value: "MONTHLY", label: "Monthly", daysPerPeriod: 30 },
  { value: "BI_WEEKLY", label: "Bi-Weekly", daysPerPeriod: 14 },
  { value: "WEEKLY", label: "Weekly", daysPerPeriod: 7 },
] as const

// Slip number format
export const SLIP_NUMBER_PREFIX = "SLIP"
export const RUN_NUMBER_PREFIX = "PR"

// Default pagination
export const DEFAULT_PAGE_SIZE = 20

// Payroll period types
export const PERIOD_TYPES = {
  CURRENT_MONTH: "CURRENT_MONTH",
  LAST_MONTH: "LAST_MONTH",
  CUSTOM: "CUSTOM",
  YEAR_TO_DATE: "YEAR_TO_DATE",
} as const
