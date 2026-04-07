// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Budget Module - Validation Schemas
 */

import { BudgetStatus } from "@prisma/client"
import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export const createBudgetSchema = (v: ValidationHelper) =>
  z
    .object({
      name: z.string().min(1, v.required()).max(200),
      fiscalYearId: z.string().min(1, v.required()),
      totalAmount: z.number().min(0, v.min(0)),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      status: z.nativeEnum(BudgetStatus).default("DRAFT"),
      description: z.string().max(500).optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: "End date must be on or after start date", // TODO: add custom validation key
    })

export const createBudgetAllocationSchema = (v: ValidationHelper) =>
  z.object({
    budgetId: z.string().min(1, v.required()),
    categoryId: z.string().min(1, v.required()),
    allocatedAmount: z.number().min(0.01, v.positive()),
    description: z.string().max(500).optional(),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

export const budgetSchema = z
  .object({
    name: z.string().min(1, "Budget name is required").max(200),
    fiscalYearId: z.string().min(1, "Fiscal year is required"),
    totalAmount: z.number().min(0, "Total amount must be non-negative"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: z.nativeEnum(BudgetStatus).default("DRAFT"),
    description: z.string().max(500).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
  })

export const budgetAllocationSchema = z.object({
  budgetId: z.string().min(1, "Budget is required"),
  categoryId: z.string().min(1, "Category is required"),
  allocatedAmount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().max(500).optional(),
})

export const budgetFilterSchema = z.object({
  status: z.nativeEnum(BudgetStatus).optional(),
  fiscalYearId: z.string().optional(),
  search: z.string().optional(),
})
