// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Salary Sub-Block Configuration
 *
 * Static configuration and constants
 * Labels are dictionary-backed via getter functions.
 */

export const SALARY_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const

export const PAYMENT_FREQUENCY = {
  MONTHLY: "MONTHLY",
  BI_WEEKLY: "BI_WEEKLY",
  WEEKLY: "WEEKLY",
} as const

export const COMPONENT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const

// Common allowance types (values only, labels come from dictionary)
export const ALLOWANCE_TYPE_VALUES = [
  "HOUSING",
  "TRANSPORT",
  "MEDICAL",
  "EDUCATION",
  "MEAL",
  "MOBILE",
  "PERFORMANCE",
  "OVERTIME",
  "SPECIAL",
  "OTHER",
] as const

/** Get localized allowance type options from dictionary */
export const getAllowanceTypeOptions = (d?: Record<string, string>) =>
  ALLOWANCE_TYPE_VALUES.map((value) => ({
    value,
    label: d?.[value] || value,
  }))

// Common deduction types (values only, labels come from dictionary)
export const DEDUCTION_TYPE_VALUES = [
  "TAX",
  "SOCIAL_SECURITY",
  "PENSION",
  "HEALTH_INSURANCE",
  "LIFE_INSURANCE",
  "LOAN",
  "ADVANCE",
  "ABSENCE",
  "DISCIPLINARY",
  "OTHER",
] as const

/** Get localized deduction type options from dictionary */
export const getDeductionTypeOptions = (d?: Record<string, string>) =>
  DEDUCTION_TYPE_VALUES.map((value) => ({
    value,
    label: d?.[value] || value,
  }))

// Status badge colors
export const STATUS_COLORS = {
  ACTIVE: "bg-green-500/10 text-green-500",
  INACTIVE: "bg-gray-500/10 text-gray-500",
  SUSPENDED: "bg-red-500/10 text-red-500",
} as const

// Default tax rates (can be overridden per school)
export const DEFAULT_TAX_RATE = 15 // 15%
export const DEFAULT_SOCIAL_SECURITY_RATE = 5 // 5%

// Salary range brackets for analytics (amounts in whole currency units, not cents)
export const SALARY_RANGE_BUCKETS = [
  { min: 0, max: 1000 },
  { min: 1000, max: 2000 },
  { min: 2000, max: 3000 },
  { min: 3000, max: 5000 },
  { min: 5000, max: 10000 },
  { min: 10000, max: Infinity },
] as const

/**
 * Get localized salary range buckets with currency-aware labels.
 * Locale controls digit grouping, currency controls symbol/placement.
 */
export const getSalaryRanges = (
  locale: string = "en",
  currency: string = "USD"
) => {
  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  const fmt = new Intl.NumberFormat(bcp47, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  })
  return SALARY_RANGE_BUCKETS.map(({ min, max }) => ({
    min,
    max,
    label:
      max === Infinity
        ? `${fmt.format(min)}+`
        : `${fmt.format(min)} - ${fmt.format(max)}`,
  }))
}

// Default pagination
export const DEFAULT_PAGE_SIZE = 20

// Currency options (values only, labels come from dictionary)
export const CURRENCY_OPTION_VALUES = [
  { value: "USD", symbol: "$" },
  { value: "EUR", symbol: "€" },
  { value: "GBP", symbol: "£" },
  { value: "SDG", symbol: "SDG" },
] as const

/** Get localized currency options from dictionary */
export const getCurrencyOptions = (d?: Record<string, string>) =>
  CURRENCY_OPTION_VALUES.map((c) => ({
    value: c.value,
    label: d?.[c.value] || c.value,
    symbol: c.symbol,
  }))
