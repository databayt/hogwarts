/**
 * Salary Sub-Block Configuration
 *
 * Static configuration and constants
 */

export const SALARY_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const

export const PAYMENT_FREQUENCY = {
  MONTHLY: 'MONTHLY',
  BI_WEEKLY: 'BI_WEEKLY',
  WEEKLY: 'WEEKLY',
} as const

export const COMPONENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const

// Common allowance types
export const ALLOWANCE_TYPES = [
  { value: 'HOUSING', label: 'Housing Allowance' },
  { value: 'TRANSPORT', label: 'Transport Allowance' },
  { value: 'MEDICAL', label: 'Medical Allowance' },
  { value: 'EDUCATION', label: 'Education Allowance' },
  { value: 'MEAL', label: 'Meal Allowance' },
  { value: 'MOBILE', label: 'Mobile Allowance' },
  { value: 'PERFORMANCE', label: 'Performance Bonus' },
  { value: 'OVERTIME', label: 'Overtime Pay' },
  { value: 'SPECIAL', label: 'Special Allowance' },
  { value: 'OTHER', label: 'Other' },
] as const

// Common deduction types
export const DEDUCTION_TYPES = [
  { value: 'TAX', label: 'Income Tax' },
  { value: 'SOCIAL_SECURITY', label: 'Social Security' },
  { value: 'PENSION', label: 'Pension Contribution' },
  { value: 'HEALTH_INSURANCE', label: 'Health Insurance' },
  { value: 'LIFE_INSURANCE', label: 'Life Insurance' },
  { value: 'LOAN', label: 'Loan Repayment' },
  { value: 'ADVANCE', label: 'Salary Advance' },
  { value: 'ABSENCE', label: 'Absence Deduction' },
  { value: 'DISCIPLINARY', label: 'Disciplinary Fine' },
  { value: 'OTHER', label: 'Other' },
] as const

// Status badge colors
export const STATUS_COLORS = {
  ACTIVE: 'bg-green-500/10 text-green-500',
  INACTIVE: 'bg-gray-500/10 text-gray-500',
  SUSPENDED: 'bg-red-500/10 text-red-500',
} as const

// Default tax rates (can be overridden per school)
export const DEFAULT_TAX_RATE = 15 // 15%
export const DEFAULT_SOCIAL_SECURITY_RATE = 5 // 5%

// Salary ranges for analytics
export const SALARY_RANGES = [
  { min: 0, max: 1000, label: '$0 - $1,000' },
  { min: 1000, max: 2000, label: '$1,000 - $2,000' },
  { min: 2000, max: 3000, label: '$2,000 - $3,000' },
  { min: 3000, max: 5000, label: '$3,000 - $5,000' },
  { min: 5000, max: 10000, label: '$5,000 - $10,000' },
  { min: 10000, max: Infinity, label: '$10,000+' },
] as const

// Default pagination
export const DEFAULT_PAGE_SIZE = 20

// Currency options
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'SDG', label: 'Sudanese Pound', symbol: 'SDG' },
] as const
