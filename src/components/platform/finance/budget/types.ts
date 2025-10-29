/**
 * Budget Module - Type Definitions
 */

import type { BudgetStatus } from '@prisma/client'
import type { budgetSchema, budgetAllocationSchema } from './validation'
import type { z } from 'zod'

export type BudgetInput = z.infer<typeof budgetSchema>
export type BudgetAllocationInput = z.infer<typeof budgetAllocationSchema>

export interface BudgetWithAllocations {
  id: string
  name: string
  fiscalYearId: string
  totalAmount: number
  startDate: Date
  endDate: Date
  status: BudgetStatus
  allocations: BudgetAllocationWithDetails[]
  schoolId: string
}

export interface BudgetAllocationWithDetails {
  id: string
  budgetId: string
  departmentId: string | null
  categoryId: string | null
  allocatedAmount: number
  spent: number
  remaining: number
  department?: { id: string; name: string }
  category?: { id: string; name: string }
}

export interface BudgetDashboardStats {
  budgetsCount: number
  allocationsCount: number
  totalBudget: number
  totalSpent: number
  variance: number
  utilizationRate: number
}

export interface BudgetActionResult {
  success: boolean
  data?: BudgetWithAllocations
  error?: string
}
