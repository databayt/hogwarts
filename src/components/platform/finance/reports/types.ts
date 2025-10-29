/**
 * Reports Module - Type Definitions
 */

import type { AccountType } from '@prisma/client'
import type { reportRequestSchema } from './validation'
import type { z } from 'zod'

export type ReportRequestInput = z.infer<typeof reportRequestSchema>

export type ReportType =
  | 'BALANCE_SHEET'
  | 'INCOME_STATEMENT'
  | 'CASH_FLOW'
  | 'TRIAL_BALANCE'
  | 'GENERAL_LEDGER'
  | 'EXPENSE_ANALYSIS'
  | 'REVENUE_ANALYSIS'
  | 'BUDGET_VARIANCE'

export interface ReportRequest {
  type: ReportType
  startDate: Date
  endDate: Date
  fiscalYearId?: string
  format: 'PDF' | 'EXCEL' | 'CSV'
  parameters?: Record<string, any>
}

export interface BalanceSheetData {
  assets: AccountSummary[]
  liabilities: AccountSummary[]
  equity: AccountSummary[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  asOfDate: Date
  isBalanced: boolean
}

export interface IncomeStatementData {
  revenue: AccountSummary[]
  expenses: AccountSummary[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  startDate: Date
  endDate: Date
}

export interface CashFlowData {
  operating: CashFlowItem[]
  investing: CashFlowItem[]
  financing: CashFlowItem[]
  netOperating: number
  netInvesting: number
  netFinancing: number
  netCashFlow: number
  startDate: Date
  endDate: Date
}

export interface TrialBalanceData {
  accounts: TrialBalanceEntry[]
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
  asOfDate: Date
}

export interface AccountSummary {
  accountCode: string
  accountName: string
  accountType: AccountType
  balance: number
  debitTotal: number
  creditTotal: number
}

export interface TrialBalanceEntry {
  accountCode: string
  accountName: string
  accountType: AccountType
  debitBalance: number
  creditBalance: number
}

export interface CashFlowItem {
  description: string
  amount: number
  type: 'INFLOW' | 'OUTFLOW'
}

export interface ReportActionResult {
  success: boolean
  data?: any
  error?: string
}
