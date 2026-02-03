/**
 * Reports Module - Configuration
 */

import type { ReportType } from "./types"

export const ReportTypeLabels: Record<ReportType, string> = {
  BALANCE_SHEET: "Balance Sheet",
  INCOME_STATEMENT: "Income Statement (P&L)",
  CASH_FLOW: "Cash Flow Statement",
  TRIAL_BALANCE: "Trial Balance",
  GENERAL_LEDGER: "General Ledger",
  EXPENSE_ANALYSIS: "Expense Analysis",
  REVENUE_ANALYSIS: "Revenue Analysis",
  BUDGET_VARIANCE: "Budget Variance Report",
}

export const ReportDescriptions: Record<ReportType, string> = {
  BALANCE_SHEET: "Assets, liabilities, and equity at a specific point in time",
  INCOME_STATEMENT: "Revenue and expenses over a period",
  CASH_FLOW:
    "Cash inflows and outflows from operating, investing, and financing activities",
  TRIAL_BALANCE: "List of all accounts with debit and credit balances",
  GENERAL_LEDGER: "Detailed transaction history for all accounts",
  EXPENSE_ANALYSIS: "Detailed breakdown of expenses by category and department",
  REVENUE_ANALYSIS: "Detailed breakdown of revenue by source",
  BUDGET_VARIANCE: "Comparison of actual spending vs budgeted amounts",
}

export const ReportCategories = {
  FINANCIAL_STATEMENTS: ["BALANCE_SHEET", "INCOME_STATEMENT", "CASH_FLOW"],
  ACCOUNTING: ["TRIAL_BALANCE", "GENERAL_LEDGER"],
  ANALYSIS: ["EXPENSE_ANALYSIS", "REVENUE_ANALYSIS", "BUDGET_VARIANCE"],
} as const

export const ExportFormats = ["PDF", "EXCEL", "CSV"] as const
export type ExportFormat = (typeof ExportFormats)[number]

export const ExportFormatLabels: Record<ExportFormat, string> = {
  PDF: "PDF Document",
  EXCEL: "Excel Spreadsheet",
  CSV: "CSV File",
}

export const REPORT_CONFIG = {
  MAX_RECORDS_PER_REPORT: 10000,
  DEFAULT_PAGE_SIZE: 100,
  CACHE_DURATION_MINUTES: 15,
  ASYNC_THRESHOLD_RECORDS: 1000,
} as const

export const REPORT_DATE_RANGES = [
  { label: "This Month", key: "THIS_MONTH" },
  { label: "Last Month", key: "LAST_MONTH" },
  { label: "This Quarter", key: "THIS_QUARTER" },
  { label: "Last Quarter", key: "LAST_QUARTER" },
  { label: "This Year", key: "THIS_YEAR" },
  { label: "Last Year", key: "LAST_YEAR" },
  { label: "Custom Range", key: "CUSTOM" },
] as const
