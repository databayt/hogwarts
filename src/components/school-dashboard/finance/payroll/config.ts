// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

// Tax brackets — progressive & marginal, customizable per school. Thresholds are
// in WHOLE currency units (the same unit as SalaryStructure.baseSalary / gross),
// NOT cents. Defaults sized for the monthly-salary scale (e.g. SDG 80k–350k).
export const TAX_BRACKETS = [
  { from: 0, to: 20000, rate: 0 }, // tax-free up to 20,000
  { from: 20000, to: 50000, rate: 10 }, // 10% on 20,000–50,000
  { from: 50000, to: 100000, rate: 15 }, // 15% on 50,000–100,000
  { from: 100000, to: 200000, rate: 20 }, // 20% on 100,000–200,000
  { from: 200000, to: null, rate: 25 }, // 25% above 200,000
] as const

/**
 * Progressive (marginal) income tax for one pay period. Each bracket's rate
 * applies only to the portion of `taxableAmount` that falls inside it. The
 * amount and thresholds share the same WHOLE currency unit.
 *
 * `brackets` defaults to the Sudan-shaped {@link TAX_BRACKETS} for callers that
 * predate country rules, but production payroll/salary now pass the brackets
 * from the school's resolved {@link ResolvedPayrollPolicy} so a school is taxed
 * by ITS OWN country's law — not Sudan's for everyone.
 */
export function calculateProgressiveTax(
  taxableAmount: number,
  brackets: ReadonlyArray<{
    from: number
    to: number | null
    rate: number
  }> = TAX_BRACKETS
): number {
  let tax = 0
  for (const bracket of brackets) {
    if (taxableAmount <= bracket.from) continue
    const upper =
      bracket.to === null ? taxableAmount : Math.min(taxableAmount, bracket.to)
    const portion = upper - bracket.from
    if (portion > 0) tax += portion * (bracket.rate / 100)
  }
  return tax
}

/** Employee social-security withholding for a pay period. */
export function calculateSocialSecurity(
  base: number,
  ratePercent: number
): number {
  return Math.round(base * (ratePercent / 100) * 100) / 100
}

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

// Payroll frequency values (labels come from dictionary)
export const PAYROLL_FREQUENCY_VALUES = [
  { value: "MONTHLY", daysPerPeriod: 30 },
  { value: "BI_WEEKLY", daysPerPeriod: 14 },
  { value: "WEEKLY", daysPerPeriod: 7 },
] as const

/** Get localized payroll frequency options from dictionary */
export const getPayrollFrequencyOptions = (d?: Record<string, string>) =>
  PAYROLL_FREQUENCY_VALUES.map((f) => ({
    ...f,
    label: d?.[f.value] || f.value,
  }))

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

// --- Dictionary-based factory functions ---

type Dict = Record<string, any> | undefined

/** Get localized payroll run status labels from dictionary */
export const getPayrollRunStatusLabels = (d?: Dict): Record<string, string> => {
  const s = d?.runStatus as Record<string, string> | undefined
  return {
    DRAFT: s?.draft || "Draft",
    PENDING: s?.pending || "Pending",
    PROCESSING: s?.processing || "Processing",
    COMPLETED: s?.completed || "Completed",
    FAILED: s?.failed || "Failed",
    CANCELLED: s?.cancelled || "Cancelled",
  }
}

/** Get localized salary slip status labels from dictionary */
export const getSalarySlipStatusLabels = (d?: Dict): Record<string, string> => {
  const s = d?.slipStatus as Record<string, string> | undefined
  return {
    DRAFT: s?.draft || "Draft",
    PENDING: s?.pending || "Pending",
    APPROVED: s?.approved || "Approved",
    PAID: s?.paid || "Paid",
    CANCELLED: s?.cancelled || "Cancelled",
  }
}

/** Get localized payment method labels from dictionary */
export const getPaymentMethodLabels = (d?: Dict): Record<string, string> => {
  const m = d?.paymentMethod as Record<string, string> | undefined
  return {
    BANK_TRANSFER: m?.bankTransfer || "Bank Transfer",
    CASH: m?.cash || "Cash",
    CHECK: m?.check || "Check",
    MOBILE_MONEY: m?.mobileMoney || "Mobile Money",
  }
}

/** Get localized period type labels from dictionary */
export const getPeriodTypeLabels = (d?: Dict): Record<string, string> => {
  const p = d?.periodType as Record<string, string> | undefined
  return {
    CURRENT_MONTH: p?.currentMonth || "Current Month",
    LAST_MONTH: p?.lastMonth || "Last Month",
    CUSTOM: p?.custom || "Custom",
    YEAR_TO_DATE: p?.yearToDate || "Year to Date",
  }
}
