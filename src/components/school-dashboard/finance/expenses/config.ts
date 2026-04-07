// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Expenses Module - Configuration
 * Labels are dictionary-backed via getter functions.
 */

import { ExpenseStatus } from "@prisma/client"

type Dict = Record<string, any> | undefined

const DEFAULT_EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
}

/** Get localized expense status labels from dictionary (finance.expensesConfig.statusLabels) */
export const getExpenseStatusLabels = (
  d?: Dict
): Record<ExpenseStatus, string> => {
  const s = d?.statusLabels as Record<string, string> | undefined
  return {
    PENDING: s?.PENDING || DEFAULT_EXPENSE_STATUS_LABELS.PENDING,
    APPROVED: s?.APPROVED || DEFAULT_EXPENSE_STATUS_LABELS.APPROVED,
    REJECTED: s?.REJECTED || DEFAULT_EXPENSE_STATUS_LABELS.REJECTED,
    PAID: s?.PAID || DEFAULT_EXPENSE_STATUS_LABELS.PAID,
    CANCELLED: s?.CANCELLED || DEFAULT_EXPENSE_STATUS_LABELS.CANCELLED,
  }
}

/** For backward compat -- static fallback */
export const ExpenseStatusLabels = DEFAULT_EXPENSE_STATUS_LABELS

export const ExpenseStatusColors: Record<ExpenseStatus, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PAID: "secondary",
  CANCELLED: "secondary",
}

export const DefaultExpenseCategories = [
  "OFFICE_SUPPLIES",
  "TRAVEL",
  "MEALS",
  "UTILITIES",
  "MAINTENANCE",
  "EQUIPMENT",
  "SOFTWARE",
  "PROFESSIONAL_SERVICES",
  "MARKETING",
  "OTHER",
] as const

export type DefaultExpenseCategory = (typeof DefaultExpenseCategories)[number]

const DEFAULT_EXPENSE_CATEGORY_LABELS: Record<DefaultExpenseCategory, string> =
  {
    OFFICE_SUPPLIES: "Office Supplies",
    TRAVEL: "Travel & Transportation",
    MEALS: "Meals & Entertainment",
    UTILITIES: "Utilities",
    MAINTENANCE: "Maintenance & Repairs",
    EQUIPMENT: "Equipment",
    SOFTWARE: "Software & Subscriptions",
    PROFESSIONAL_SERVICES: "Professional Services",
    MARKETING: "Marketing & Advertising",
    OTHER: "Other",
  }

/** Get localized expense category labels from dictionary (finance.expensesConfig.categoryLabels) */
export const getExpenseCategoryLabels = (
  d?: Dict
): Record<DefaultExpenseCategory, string> => {
  const result = { ...DEFAULT_EXPENSE_CATEGORY_LABELS }
  const c = d?.categoryLabels as Record<string, string> | undefined
  if (c) {
    for (const key of DefaultExpenseCategories) {
      if (c[key]) result[key] = c[key]
    }
  }
  return result
}

/** For backward compat -- static fallback */
export const DefaultExpenseCategoryLabels = DEFAULT_EXPENSE_CATEGORY_LABELS

export const EXPENSE_LIMITS = {
  MAX_AMOUNT_WITHOUT_RECEIPT: 5000, // $50.00 in cents
  MAX_AMOUNT_WITHOUT_APPROVAL: 10000, // $100.00 in cents
  MAX_AMOUNT_GENERAL: 1000000, // $10,000.00 in cents
} as const

export const RECEIPT_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
} as const
