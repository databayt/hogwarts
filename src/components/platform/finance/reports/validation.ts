/**
 * Reports Module - Validation Schemas
 */

import { z } from 'zod'

export const reportRequestSchema = z.object({
  type: z.enum([
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'CASH_FLOW',
    'TRIAL_BALANCE',
    'GENERAL_LEDGER',
    'EXPENSE_ANALYSIS',
    'REVENUE_ANALYSIS',
    'BUDGET_VARIANCE',
  ]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fiscalYearId: z.string().optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV']).default('PDF'),
  parameters: z.record(z.string(), z.any()).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
})

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  fiscalYearId: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
})

export const reportFilterSchema = z.object({
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  departmentId: z.string().optional(),
  categoryId: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
})
