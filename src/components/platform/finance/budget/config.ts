/**
 * Budget Module - Configuration
 */

import { BudgetStatus } from '@prisma/client'

export const BudgetStatusLabels: Record<BudgetStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}

export const BudgetCategories = [
  'SALARIES',
  'OPERATIONS',
  'FACILITIES',
  'EQUIPMENT',
  'SUPPLIES',
  'TECHNOLOGY',
  'PROFESSIONAL_DEVELOPMENT',
  'STUDENT_ACTIVITIES',
  'OTHER',
] as const

export type BudgetCategory = typeof BudgetCategories[number]

export const BudgetCategoryLabels: Record<BudgetCategory, string> = {
  SALARIES: 'Salaries & Benefits',
  OPERATIONS: 'Operations',
  FACILITIES: 'Facilities & Maintenance',
  EQUIPMENT: 'Equipment',
  SUPPLIES: 'Supplies',
  TECHNOLOGY: 'Technology',
  PROFESSIONAL_DEVELOPMENT: 'Professional Development',
  STUDENT_ACTIVITIES: 'Student Activities',
  OTHER: 'Other',
}

export const BUDGET_ALERTS = {
  WARNING_THRESHOLD: 0.8, // 80% utilization
  CRITICAL_THRESHOLD: 0.95, // 95% utilization
} as const
