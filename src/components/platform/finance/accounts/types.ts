/**
 * Accounts Module - Type Definitions
 * Core accounting system types for chart of accounts, journal entries, and ledger
 */

import type { AccountType } from "@prisma/client"
import type { z } from "zod"

import type {
  accountSchema,
  journalEntrySchema,
  ledgerEntrySchema,
} from "./validation"

// Inferred types from Zod schemas
export type AccountInput = z.infer<typeof accountSchema>
export type JournalEntryInput = z.infer<typeof journalEntrySchema>
export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>

// Extended types with relations
export interface AccountWithBalance {
  id: string
  code: string
  name: string
  type: AccountType
  balance: number
  debitTotal: number
  creditTotal: number
  parentAccountId: string | null
  schoolId: string
  children?: AccountWithBalance[]
}

export interface JournalEntryWithEntries {
  id: string
  entryNumber: string
  entryDate: Date
  description: string
  isPosted: boolean
  sourceModule: string | null
  sourceId: string | null
  fiscalYearId: string
  schoolId: string
  ledgerEntries: LedgerEntryWithAccount[]
  createdAt: Date
  postedAt: Date | null
  postedBy: string | null
  isReversed: boolean
  reversedAt: Date | null
  reversalEntryId: string | null
}

export interface LedgerEntryWithAccount {
  id: string
  journalEntryId: string
  accountId: string
  debit: number
  credit: number
  description: string | null
  account: {
    code: string
    name: string
    type: AccountType
  }
}

// Dashboard stats
export interface AccountsDashboardStats {
  totalAccounts: number
  activeAccounts: number
  journalEntriesCount: number
  unpostedEntriesCount: number
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalRevenue: number
  totalExpenses: number
}

// Report types
export interface TrialBalanceEntry {
  accountCode: string
  accountName: string
  accountType: AccountType
  debitBalance: number
  creditBalance: number
}

export interface BalanceSheetData {
  assets: AccountWithBalance[]
  liabilities: AccountWithBalance[]
  equity: AccountWithBalance[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  balances: boolean // Should equal true
}

export interface IncomeStatementData {
  revenue: AccountWithBalance[]
  expenses: AccountWithBalance[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
}

// Action result types
export interface AccountActionResult {
  success: boolean
  data?: AccountWithBalance
  error?: string
}

export interface JournalEntryActionResult {
  success: boolean
  data?: JournalEntryWithEntries
  error?: string
}
