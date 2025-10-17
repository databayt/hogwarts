/**
 * Server Action Type Definitions
 * Type-safe server action interfaces with proper error handling
 */

import type {
  BankAccount,
  BankAccountWithTransactions,
  Transaction,
  Transfer,
  AccountOverview,
  TransactionFilters,
  PaginationOptions,
  PaginatedResponse,
  PlaidLinkMetadata,
  CreateBankAccountInput,
  BankInstitution,
  TransferWithBanks,
} from './bank.types'

// ============================================================================
// Result Types for Better Error Handling
// ============================================================================

/**
 * Generic result type for server actions
 */
export type ActionResult<T, E = ActionError> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Standard error structure for actions
 */
export interface ActionError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

/**
 * Field-level validation errors
 */
export interface ValidationError extends ActionError {
  code: 'VALIDATION_ERROR'
  fieldErrors?: Record<string, string[]>
}

// ============================================================================
// Bank Account Actions
// ============================================================================

export interface GetAccountsParams {
  userId: string
}

export interface GetAccountsResult {
  data: BankAccountWithTransactions[]
  totalBanks: number
  totalCurrentBalance: number
  totalAvailableBalance: number
}

export interface GetAccountParams {
  accountId: string
}

export interface GetAccountByPlaidIdParams {
  accountId: string // Plaid account ID
}

export interface CreateBankAccountParams extends CreateBankAccountInput {}

export interface CreateBankAccountResult extends BankAccount {}

export interface SyncTransactionsParams {
  accountId: string
}

export interface SyncTransactionsResult {
  synced: number
  updated: number
  errors: string[]
}

export interface GetBankInfoParams {
  accountId: string
}

export interface GetBankInfoResult extends BankInstitution {}

export interface DeleteBankAccountParams {
  accountId: string
  userId: string
}

// ============================================================================
// Transaction Actions
// ============================================================================

export interface GetTransactionsParams extends TransactionFilters, PaginationOptions {
  userId: string
}

export interface GetTransactionsResult extends PaginatedResponse<Transaction> {}

export interface GetTransactionParams {
  transactionId: string
  userId: string
}

export interface GetRecentTransactionsParams {
  userId: string
  limit?: number
}

export interface GetTransactionCategoriesParams {
  userId: string
}

export interface GetTransactionCategoriesResult {
  categories: Array<{
    category: string
    count: number
    totalAmount: number
  }>
}

export interface GetTransactionStatsParams {
  userId: string
  startDate?: Date
  endDate?: Date
}

export interface GetTransactionStatsResult {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  transactionCount: number
  averageTransactionAmount: number
  largestExpense: Transaction | null
  categorySummary: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

// ============================================================================
// Transfer Actions
// ============================================================================

export interface CreateTransferParams {
  senderBankId: string
  recipientEmail: string
  amount: number
  note?: string
  userId: string
}

export interface CreateTransferResult extends Transfer {}

export interface GetTransfersParams extends PaginationOptions {
  userId: string
  type?: 'sent' | 'received' | 'all'
  status?: Transfer['status']
}

export interface GetTransfersResult extends PaginatedResponse<TransferWithBanks> {}

export interface GetTransferParams {
  transferId: string
  userId: string
}

export interface UpdateTransferStatusParams {
  transferId: string
  status: Transfer['status']
  userId: string
}

// ============================================================================
// Plaid Actions
// ============================================================================

export interface CreatePlaidLinkTokenParams {
  userId: string
  userEmail: string
}

export interface CreatePlaidLinkTokenResult {
  linkToken: string
  expiration: string
}

export interface ExchangePublicTokenParams {
  publicToken: string
  metadata: PlaidLinkMetadata
  userId: string
}

export interface ExchangePublicTokenResult {
  accountId: string
  success: boolean
}

export interface UpdatePlaidAccountParams {
  accountId: string
  userId: string
}

// ============================================================================
// Analytics Actions
// ============================================================================

export interface GetSpendingAnalyticsParams {
  userId: string
  period: 'week' | 'month' | 'quarter' | 'year'
  accountId?: string
}

export interface SpendingAnalytics {
  period: {
    start: Date
    end: Date
    label: string
  }
  spending: Array<{
    date: string
    amount: number
    category: string
  }>
  comparison: {
    current: number
    previous: number
    change: number
    changePercentage: number
  }
  topCategories: Array<{
    category: string
    amount: number
    percentage: number
    transactionCount: number
  }>
  insights: Array<{
    type: 'warning' | 'info' | 'success'
    message: string
    data?: Record<string, unknown>
  }>
}

// ============================================================================
// Type Guards for Action Results
// ============================================================================

export function isActionSuccess<T>(
  result: ActionResult<T>
): result is { success: true; data: T } {
  return result.success === true
}

export function isActionError<E = ActionError>(
  result: ActionResult<unknown, E>
): result is { success: false; error: E } {
  return result.success === false
}

export function isValidationError(
  error: ActionError
): error is ValidationError {
  return error.code === 'VALIDATION_ERROR'
}

// ============================================================================
// Action Type Definitions for Server Components
// ============================================================================

export type BankActions = {
  getAccounts: (params: GetAccountsParams) => Promise<ActionResult<GetAccountsResult>>
  getAccount: (params: GetAccountParams) => Promise<ActionResult<BankAccountWithTransactions>>
  getAccountByPlaidId: (params: GetAccountByPlaidIdParams) => Promise<ActionResult<BankAccountWithTransactions>>
  createBankAccount: (params: CreateBankAccountParams) => Promise<ActionResult<CreateBankAccountResult>>
  syncTransactions: (params: SyncTransactionsParams) => Promise<ActionResult<SyncTransactionsResult>>
  getBankInfo: (params: GetBankInfoParams) => Promise<ActionResult<GetBankInfoResult>>
  deleteBankAccount: (params: DeleteBankAccountParams) => Promise<ActionResult<void>>
}

export type TransactionActions = {
  getTransactions: (params: GetTransactionsParams) => Promise<ActionResult<GetTransactionsResult>>
  getTransaction: (params: GetTransactionParams) => Promise<ActionResult<Transaction>>
  getRecentTransactions: (params: GetRecentTransactionsParams) => Promise<ActionResult<Transaction[]>>
  getTransactionCategories: (params: GetTransactionCategoriesParams) => Promise<ActionResult<GetTransactionCategoriesResult>>
  getTransactionStats: (params: GetTransactionStatsParams) => Promise<ActionResult<GetTransactionStatsResult>>
}

export type TransferActions = {
  createTransfer: (params: CreateTransferParams) => Promise<ActionResult<CreateTransferResult>>
  getTransfers: (params: GetTransfersParams) => Promise<ActionResult<GetTransfersResult>>
  getTransfer: (params: GetTransferParams) => Promise<ActionResult<TransferWithBanks>>
  updateTransferStatus: (params: UpdateTransferStatusParams) => Promise<ActionResult<Transfer>>
}

export type PlaidActions = {
  createLinkToken: (params: CreatePlaidLinkTokenParams) => Promise<ActionResult<CreatePlaidLinkTokenResult>>
  exchangePublicToken: (params: ExchangePublicTokenParams) => Promise<ActionResult<ExchangePublicTokenResult>>
  updateAccount: (params: UpdatePlaidAccountParams) => Promise<ActionResult<void>>
}