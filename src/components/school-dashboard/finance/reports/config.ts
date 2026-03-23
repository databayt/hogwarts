// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reports Module - Configuration
 * Labels are dictionary-backed via getter functions.
 */

import type { ReportType } from "./types"

const DEFAULT_REPORT_TYPE_LABELS: Record<ReportType, string> = {
  BALANCE_SHEET: "Balance Sheet",
  INCOME_STATEMENT: "Income Statement (P&L)",
  CASH_FLOW: "Cash Flow Statement",
  TRIAL_BALANCE: "Trial Balance",
  GENERAL_LEDGER: "General Ledger",
  EXPENSE_ANALYSIS: "Expense Analysis",
  REVENUE_ANALYSIS: "Revenue Analysis",
  BUDGET_VARIANCE: "Budget Variance Report",
}

/** Get localized report type labels from dictionary */
export const getReportTypeLabels = (
  d?: Record<string, string>
): Record<ReportType, string> => {
  const result = { ...DEFAULT_REPORT_TYPE_LABELS }
  if (d) {
    for (const key of Object.keys(result) as ReportType[]) {
      if (d[key]) result[key] = d[key]
    }
  }
  return result
}

/** For backward compat -- static fallback */
export const ReportTypeLabels = DEFAULT_REPORT_TYPE_LABELS

const DEFAULT_REPORT_DESCRIPTIONS: Record<ReportType, string> = {
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

/** Get localized report descriptions from dictionary */
export const getReportDescriptions = (
  d?: Record<string, string>
): Record<ReportType, string> => {
  const result = { ...DEFAULT_REPORT_DESCRIPTIONS }
  if (d) {
    for (const key of Object.keys(result) as ReportType[]) {
      if (d[key]) result[key] = d[key]
    }
  }
  return result
}

/** For backward compat -- static fallback */
export const ReportDescriptions = DEFAULT_REPORT_DESCRIPTIONS

export const ReportCategories = {
  FINANCIAL_STATEMENTS: ["BALANCE_SHEET", "INCOME_STATEMENT", "CASH_FLOW"],
  ACCOUNTING: ["TRIAL_BALANCE", "GENERAL_LEDGER"],
  ANALYSIS: ["EXPENSE_ANALYSIS", "REVENUE_ANALYSIS", "BUDGET_VARIANCE"],
} as const

export const ExportFormats = ["PDF", "EXCEL", "CSV"] as const
export type ExportFormat = (typeof ExportFormats)[number]

const DEFAULT_EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  PDF: "PDF Document",
  EXCEL: "Excel Spreadsheet",
  CSV: "CSV File",
}

/** Get localized export format labels from dictionary */
export const getExportFormatLabels = (
  d?: Record<string, string>
): Record<ExportFormat, string> => ({
  PDF: d?.PDF || DEFAULT_EXPORT_FORMAT_LABELS.PDF,
  EXCEL: d?.EXCEL || DEFAULT_EXPORT_FORMAT_LABELS.EXCEL,
  CSV: d?.CSV || DEFAULT_EXPORT_FORMAT_LABELS.CSV,
})

/** For backward compat -- static fallback */
export const ExportFormatLabels = DEFAULT_EXPORT_FORMAT_LABELS

export const REPORT_CONFIG = {
  MAX_RECORDS_PER_REPORT: 10000,
  DEFAULT_PAGE_SIZE: 100,
  CACHE_DURATION_MINUTES: 15,
  ASYNC_THRESHOLD_RECORDS: 1000,
} as const

const DATE_RANGE_KEYS = [
  "THIS_MONTH",
  "LAST_MONTH",
  "THIS_QUARTER",
  "LAST_QUARTER",
  "THIS_YEAR",
  "LAST_YEAR",
  "CUSTOM",
] as const

const DEFAULT_DATE_RANGE_LABELS: Record<string, string> = {
  THIS_MONTH: "This Month",
  LAST_MONTH: "Last Month",
  THIS_QUARTER: "This Quarter",
  LAST_QUARTER: "Last Quarter",
  THIS_YEAR: "This Year",
  LAST_YEAR: "Last Year",
  CUSTOM: "Custom Range",
}

/** Get localized date range options from dictionary */
export const getReportDateRanges = (d?: Record<string, string>) =>
  DATE_RANGE_KEYS.map((key) => ({
    label: d?.[key] || DEFAULT_DATE_RANGE_LABELS[key] || key,
    key,
  }))

/** For backward compat -- static fallback */
export const REPORT_DATE_RANGES = DATE_RANGE_KEYS.map((key) => ({
  label: DEFAULT_DATE_RANGE_LABELS[key],
  key,
}))
