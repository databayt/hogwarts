// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Banking Component Type Definitions
 * Provides comprehensive type safety for all banking-related components
 */

// Re-export all action types
export * from "./actions.types"
export * from "./bank.types"
export * from "./component.types"
export * from "./utils.types"

export interface BankAccount {
  id: string
  name: string
  officialName?: string
  mask?: string
  type: "checking" | "savings" | "credit" | "investment" | "loan" | "other"
  subtype?: string
  currentBalance: number
  availableBalance: number
  limit?: number
  currency?: string
  institutionId?: string
  institutionName?: string
  lastUpdated?: Date | string
  status?: "active" | "inactive" | "frozen" | "closed"
}

export interface Transaction {
  id: string
  bankAccountId: string
  amount: number
  date: Date | string
  name: string
  merchantName?: string
  category: string
  subcategory?: string[]
  type: "credit" | "debit"
  pending: boolean
  paymentChannel?: "online" | "in_store" | "other"
  location?: TransactionLocation
  personalFinanceCategory?: string
  accountOwner?: string
  logoUrl?: string
}

export interface TransactionLocation {
  address?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  lat?: number
  lon?: number
}

export interface TransferFormData {
  sourceAccountId: string
  recipientEmail: string
  amount: number
  note?: string
}

export interface TransferResult {
  success: boolean
  error?: string
  message?: string
  transactionId?: string
}

export interface BankingDictionary {
  // Common
  loading?: string
  error?: string
  retry?: string
  noDataAvailable?: string

  // Account related
  totalBalance?: string
  currentBalance?: string
  availableBalance?: string
  accountHolder?: string
  accountType?: string
  bankAccounts?: string
  selectAccount?: string
  sourceAccount?: string

  // Transaction related
  transactions?: string
  searchTransactions?: string
  noTransactionsFound?: string
  noMatchingTransactions?: string
  date?: string
  description?: string
  account?: string
  category?: string
  status?: string
  amount?: string
  type?: string
  pending?: string
  completed?: string
  credit?: string
  debit?: string
  merchant?: string
  viewDetails?: string

  // Transfer related
  sendTransfer?: string
  recipientEmail?: string
  note?: string
  notePlaceholder?: string
  processing?: string
  transferSuccess?: string
  transferFailed?: string

  // UI
  columns?: string
  toggleColumns?: string
  allTypes?: string
  allStatus?: string
  transactionDetails?: string
  completeInformation?: string
  location?: string

  // Table toolbar + pagination (read as flat keys by transaction-history/table.tsx)
  export?: string
  exportCSV?: string
  exportPDF?: string
  allAccounts?: string
  selectAll?: string
  showing?: string
  to?: string
  of?: string
  previous?: string
  page?: string
  next?: string

  // Chart related
  chartTitle?: string
  chartNoData?: string
}

export interface ChartData {
  name: string
  value: number
  color?: string
  percentage?: number
}
