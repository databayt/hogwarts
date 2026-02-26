// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Expenses Module - Type Definitions
 */

import type { ExpenseStatus } from "@prisma/client"
import type { z } from "zod"

import type { expenseCategorySchema, expenseSchema } from "./validation"

export type ExpenseInput = z.infer<typeof expenseSchema>
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>

export interface ExpenseWithDetails {
  id: string
  amount: number
  description: string
  expenseDate: Date
  status: ExpenseStatus
  categoryId: string
  submittedById: string
  approvedById: string | null
  approvedAt: Date | null
  receiptUrl: string | null
  category: { id: string; name: string }
  submittedBy: { id: string; name: string | null }
  schoolId: string
}

export interface ExpenseDashboardStats {
  categoriesCount: number
  expensesCount: number
  pendingExpensesCount: number
  approvedExpensesCount: number
  totalExpenses: number
}

export interface ExpenseActionResult {
  success: boolean
  data?: ExpenseWithDetails
  error?: string
}
