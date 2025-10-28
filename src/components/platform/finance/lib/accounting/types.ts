/**
 * Accounting Integration Types
 *
 * Core types for double-entry bookkeeping integration
 */

// Account types for chart of accounts
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

// Account subtypes for classification
export enum AccountSubtype {
  // Assets
  CURRENT_ASSET = 'CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  CASH = 'CASH',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  INVENTORY = 'INVENTORY',

  // Liabilities
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',

  // Equity
  OWNERS_EQUITY = 'OWNERS_EQUITY',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',

  // Revenue
  OPERATING_REVENUE = 'OPERATING_REVENUE',
  NON_OPERATING_REVENUE = 'NON_OPERATING_REVENUE',

  // Expenses
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  COST_OF_GOODS_SOLD = 'COST_OF_GOODS_SOLD',
}

// Source modules for journal entries
export enum SourceModule {
  FEES = 'fees',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  BANKING = 'banking',
  SALARY = 'salary',
  PAYROLL = 'payroll',
  TIMESHEET = 'timesheet',
  WALLET = 'wallet',
  BUDGET = 'budget',
  EXPENSES = 'expenses',
  MANUAL = 'manual',
}

// Journal entry line item
export interface JournalEntryLine {
  accountId: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  description?: string
}

// Journal entry creation input
export interface JournalEntryInput {
  entryDate: Date
  description: string
  reference?: string
  sourceModule: SourceModule
  sourceRecordId?: string
  lines: JournalEntryLine[]
  fiscalYearId?: string
  autoPost?: boolean
}

// Posting result
export interface PostingResult {
  success: boolean
  journalEntryId?: string
  errors?: string[]
  warnings?: string[]
}

// Account balance calculation
export interface AccountBalance {
  accountId: string
  accountCode: string
  accountName: string
  debitBalance: number
  creditBalance: number
  netBalance: number
  isDebitNormal: boolean
}

// Financial statement data
export interface FinancialStatementData {
  periodStart: Date
  periodEnd: Date
  assets: {
    current: AccountBalance[]
    fixed: AccountBalance[]
    total: number
  }
  liabilities: {
    current: AccountBalance[]
    longTerm: AccountBalance[]
    total: number
  }
  equity: {
    items: AccountBalance[]
    total: number
  }
  revenue: {
    items: AccountBalance[]
    total: number
  }
  expenses: {
    items: AccountBalance[]
    total: number
  }
  netIncome: number
}
