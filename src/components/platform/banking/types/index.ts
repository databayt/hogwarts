/**
 * Banking Component Type Definitions
 * Provides comprehensive type safety for all banking-related components
 */

export interface BankAccount {
  id: string
  name: string
  officialName?: string
  mask?: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other'
  subtype?: string
  currentBalance: number
  availableBalance: number
  limit?: number
  currency?: string
  institutionId?: string
  institutionName?: string
  lastUpdated?: Date | string
  status?: 'active' | 'inactive' | 'frozen' | 'closed'
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
  type: 'credit' | 'debit'
  pending: boolean
  paymentChannel?: 'online' | 'in_store' | 'other'
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
  date?: string
  description?: string
  account?: string
  category?: string
  status?: string
  amount?: string
  pending?: string
  completed?: string
  viewDetails?: string

  // Transfer related
  sendTransfer?: string
  recipientEmail?: string
  note?: string
  notePlaceholder?: string
  processing?: string
  transferSuccess?: string
  transferFailed?: string

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