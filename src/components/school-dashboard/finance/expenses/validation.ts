// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Expenses Module - Validation Schemas
 */

import { ExpenseStatus } from "@prisma/client"
import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export const createExpenseSchema = (v: ValidationHelper) =>
  z.object({
    amount: z.number().min(0.01, v.positive()),
    description: z.string().min(1, v.required()).max(500),
    expenseDate: z.coerce.date(),
    categoryId: z.string().min(1, v.required()),
    receiptUrl: z.string().url().optional().nullable(),
    notes: z.string().max(1000).optional(),
  })

export const createExpenseCategorySchema = (v: ValidationHelper) =>
  z.object({
    name: z.string().min(1, v.required()).max(100),
    description: z.string().max(500).optional(),
    isActive: z.boolean().default(true),
  })

export const createExpenseApprovalSchema = (v: ValidationHelper) =>
  z.object({
    expenseId: z.string().min(1, v.required()),
    status: z.enum(["APPROVED", "REJECTED"]),
    notes: z.string().max(500).optional(),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

export const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required").max(500),
  expenseDate: z.coerce.date(),
  categoryId: z.string().min(1, "Category is required"),
  receiptUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional(),
})

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
})

export const expenseApprovalSchema = z.object({
  expenseId: z.string().min(1, "Expense ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(500).optional(),
})

export const expenseFilterSchema = z.object({
  status: z.nativeEnum(ExpenseStatus).optional(),
  categoryId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
})
