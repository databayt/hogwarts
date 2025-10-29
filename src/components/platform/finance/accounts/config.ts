/**
 * Accounts Module - Configuration
 * Constants, enums, and default values for the accounting system
 */

import { AccountType } from '@prisma/client'

/**
 * Standard Account Codes
 * Following the standard chart of accounts structure
 */
export const StandardAccountCodes = {
  // Assets (1000-1999)
  CASH: '1000',
  BANK_ACCOUNT: '1010',
  PETTY_CASH: '1020',
  ACCOUNTS_RECEIVABLE: '1100',
  STUDENT_FEES_RECEIVABLE: '1110',
  PREPAID_EXPENSES: '1200',
  INVENTORY: '1300',
  FIXED_ASSETS: '1500',
  ACCUMULATED_DEPRECIATION: '1590',

  // Liabilities (2000-2999)
  ACCOUNTS_PAYABLE: '2000',
  SALARY_PAYABLE: '2100',
  TAX_PAYABLE: '2200',
  SOCIAL_SECURITY_PAYABLE: '2210',
  UNEARNED_REVENUE: '2300',
  LOANS_PAYABLE: '2500',

  // Equity (3000-3999)
  RETAINED_EARNINGS: '3000',
  CURRENT_YEAR_EARNINGS: '3100',

  // Revenue (4000-4999)
  TUITION_REVENUE: '4000',
  REGISTRATION_FEES: '4100',
  EXAM_FEES: '4200',
  LIBRARY_FEES: '4300',
  TRANSPORTATION_FEES: '4400',
  OTHER_INCOME: '4900',

  // Expenses (5000-9999)
  SALARY_EXPENSE: '5000',
  PAYROLL_TAX_EXPENSE: '5100',
  RENT_EXPENSE: '6000',
  UTILITIES_EXPENSE: '6100',
  SUPPLIES_EXPENSE: '6200',
  MAINTENANCE_EXPENSE: '6300',
  DEPRECIATION_EXPENSE: '7000',
  ADMINISTRATIVE_EXPENSE: '8000',
  OTHER_EXPENSE: '9000',
} as const

/**
 * Account Type Ranges
 * Defines the code ranges for each account type
 */
export const AccountTypeRanges: Record<AccountType, { min: number; max: number }> = {
  ASSET: { min: 1000, max: 1999 },
  LIABILITY: { min: 2000, max: 2999 },
  EQUITY: { min: 3000, max: 3999 },
  REVENUE: { min: 4000, max: 4999 },
  EXPENSE: { min: 5000, max: 9999 },
}

/**
 * Account Type Labels
 * Human-readable labels for account types
 */
export const AccountTypeLabels: Record<AccountType, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expense',
}

/**
 * Normal Balance for Each Account Type
 * Determines whether accounts normally have debit or credit balances
 */
export const NormalBalance: Record<AccountType, 'DEBIT' | 'CREDIT'> = {
  ASSET: 'DEBIT',
  EXPENSE: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  REVENUE: 'CREDIT',
}

/**
 * Source Modules
 * Modules that can post to the accounting system
 */
export const SourceModules = [
  'FEES',
  'PAYROLL',
  'EXPENSES',
  'INVOICE',
  'WALLET',
  'BANKING',
  'MANUAL',
] as const

export type SourceModule = typeof SourceModules[number]

/**
 * Source Module Labels
 */
export const SourceModuleLabels: Record<SourceModule, string> = {
  FEES: 'Student Fees',
  PAYROLL: 'Payroll',
  EXPENSES: 'Expenses',
  INVOICE: 'Invoices',
  WALLET: 'Wallet',
  BANKING: 'Banking',
  MANUAL: 'Manual Entry',
}

/**
 * Financial Statement Types
 */
export const FinancialStatementTypes = [
  'BALANCE_SHEET',
  'INCOME_STATEMENT',
  'CASH_FLOW',
  'TRIAL_BALANCE',
  'GENERAL_LEDGER',
] as const

export type FinancialStatementType = typeof FinancialStatementTypes[number]

/**
 * Financial Statement Labels
 */
export const FinancialStatementLabels: Record<FinancialStatementType, string> = {
  BALANCE_SHEET: 'Balance Sheet',
  INCOME_STATEMENT: 'Income Statement',
  CASH_FLOW: 'Cash Flow Statement',
  TRIAL_BALANCE: 'Trial Balance',
  GENERAL_LEDGER: 'General Ledger',
}

/**
 * Default Fiscal Year Configuration
 */
export const DEFAULT_FISCAL_YEAR_SETTINGS = {
  startMonth: 9, // September
  startDay: 1,
  durationMonths: 12,
} as const

/**
 * Pagination Defaults
 */
export const PAGINATION_DEFAULTS = {
  journalEntries: 50,
  ledgerEntries: 100,
  accounts: 100,
} as const

/**
 * Amount Formatting
 */
export const AMOUNT_FORMATTING = {
  decimalPlaces: 2,
  currency: 'USD',
  locale: 'en-US',
} as const

/**
 * Journal Entry Number Format
 * Format: JE-YYYY-MM-####
 */
export const JOURNAL_ENTRY_NUMBER_FORMAT = {
  prefix: 'JE',
  dateFormat: 'YYYY-MM',
  sequenceLength: 4,
} as const

/**
 * Validation Constants
 */
export const VALIDATION_CONSTANTS = {
  MAX_ACCOUNT_CODE_LENGTH: 20,
  MAX_ACCOUNT_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_LEDGER_ENTRIES: 2,
  MAX_LEDGER_ENTRIES_PER_JOURNAL: 100,
  DECIMAL_PRECISION: 0.01, // For floating point comparison
} as const
