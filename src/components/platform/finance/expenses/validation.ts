/**
 * Expenses Module - Validation Schemas
 */

import { ExpenseStatus } from "@prisma/client"
import { z } from "zod"

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
