// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Budget Module - Configuration
 * Labels are dictionary-backed via getter functions.
 */

import { BudgetStatus } from "@prisma/client"

type Dict = Record<string, any> | undefined

const DEFAULT_BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ACTIVE: "Active",
  CLOSED: "Closed",
}

/** Get localized budget status labels from dictionary (finance.budgetConfig.statusLabels) */
export const getBudgetStatusLabels = (
  d?: Dict
): Record<BudgetStatus, string> => {
  const s = d?.statusLabels as Record<string, string> | undefined
  return {
    DRAFT: s?.DRAFT || DEFAULT_BUDGET_STATUS_LABELS.DRAFT,
    PENDING_APPROVAL:
      s?.PENDING_APPROVAL || DEFAULT_BUDGET_STATUS_LABELS.PENDING_APPROVAL,
    APPROVED: s?.APPROVED || DEFAULT_BUDGET_STATUS_LABELS.APPROVED,
    ACTIVE: s?.ACTIVE || DEFAULT_BUDGET_STATUS_LABELS.ACTIVE,
    CLOSED: s?.CLOSED || DEFAULT_BUDGET_STATUS_LABELS.CLOSED,
  }
}

/** For backward compat -- static fallback */
export const BudgetStatusLabels = DEFAULT_BUDGET_STATUS_LABELS

export const BudgetCategories = [
  "SALARIES",
  "OPERATIONS",
  "FACILITIES",
  "EQUIPMENT",
  "SUPPLIES",
  "TECHNOLOGY",
  "PROFESSIONAL_DEVELOPMENT",
  "STUDENT_ACTIVITIES",
  "OTHER",
] as const

export type BudgetCategory = (typeof BudgetCategories)[number]

const DEFAULT_BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  SALARIES: "Salaries & Benefits",
  OPERATIONS: "Operations",
  FACILITIES: "Facilities & Maintenance",
  EQUIPMENT: "Equipment",
  SUPPLIES: "Supplies",
  TECHNOLOGY: "Technology",
  PROFESSIONAL_DEVELOPMENT: "Professional Development",
  STUDENT_ACTIVITIES: "Student Activities",
  OTHER: "Other",
}

/** Get localized budget category labels from dictionary (finance.budgetConfig.categoryLabels) */
export const getBudgetCategoryLabels = (
  d?: Dict
): Record<BudgetCategory, string> => {
  const result = { ...DEFAULT_BUDGET_CATEGORY_LABELS }
  const c = d?.categoryLabels as Record<string, string> | undefined
  if (c) {
    for (const key of BudgetCategories) {
      if (c[key]) result[key] = c[key]
    }
  }
  return result
}

/** For backward compat -- static fallback */
export const BudgetCategoryLabels = DEFAULT_BUDGET_CATEGORY_LABELS

export const BUDGET_ALERTS = {
  WARNING_THRESHOLD: 0.8, // 80% utilization
  CRITICAL_THRESHOLD: 0.95, // 95% utilization
} as const
