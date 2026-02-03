/**
 * Accounts Module - Validation Schemas
 * Zod schemas for chart of accounts, journal entries, and ledger entries
 */

import { AccountType } from "@prisma/client"
import { z } from "zod"

/**
 * Account Schema
 * For creating/updating chart of accounts
 */
export const accountSchema = z.object({
  code: z.string().min(1, "Account code is required").max(20),
  name: z.string().min(1, "Account name is required").max(200),
  type: z.nativeEnum(AccountType),
  description: z.string().optional(),
  parentAccountId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

/**
 * Journal Entry Schema
 * For manual journal entry creation
 */
export const journalEntrySchema = z
  .object({
    entryDate: z.coerce.date(),
    description: z.string().min(1, "Description is required").max(500),
    fiscalYearId: z.string().min(1, "Fiscal year is required"),
    entries: z
      .array(
        z.object({
          accountId: z.string().min(1, "Account is required"),
          debit: z.number().min(0).default(0),
          credit: z.number().min(0).default(0),
          description: z.string().optional(),
        })
      )
      .min(2, "Journal entry must have at least 2 ledger entries"),
  })
  .refine(
    (data) => {
      // Validate that debits equal credits
      const totalDebits = data.entries.reduce(
        (sum, entry) => sum + entry.debit,
        0
      )
      const totalCredits = data.entries.reduce(
        (sum, entry) => sum + entry.credit,
        0
      )
      return Math.abs(totalDebits - totalCredits) < 0.01 // Allow for floating point errors
    },
    {
      message:
        "Total debits must equal total credits (double-entry bookkeeping)",
    }
  )

/**
 * Ledger Entry Schema
 * For individual ledger entries within a journal entry
 */
export const ledgerEntrySchema = z
  .object({
    accountId: z.string().min(1, "Account is required"),
    debit: z.number().min(0, "Debit must be non-negative").default(0),
    credit: z.number().min(0, "Credit must be non-negative").default(0),
    description: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      // Either debit or credit must be > 0, but not both
      return (
        (data.debit > 0 && data.credit === 0) ||
        (data.credit > 0 && data.debit === 0)
      )
    },
    {
      message: "Either debit or credit must be greater than 0, but not both",
    }
  )

/**
 * Fiscal Year Schema
 * For creating fiscal years
 */
export const fiscalYearSchema = z
  .object({
    name: z.string().min(1, "Fiscal year name is required").max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
  })

/**
 * Account Filter Schema
 * For filtering accounts in queries
 */
export const accountFilterSchema = z.object({
  type: z.nativeEnum(AccountType).optional(),
  isActive: z.boolean().optional(),
  parentAccountId: z.string().optional().nullable(),
  search: z.string().optional(),
})

/**
 * Journal Entry Filter Schema
 * For filtering journal entries
 */
export const journalEntryFilterSchema = z.object({
  isPosted: z.boolean().optional(),
  fiscalYearId: z.string().optional(),
  sourceModule: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
})

/**
 * Date Range Schema
 * For report generation
 */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    fiscalYearId: z.string().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
  })
