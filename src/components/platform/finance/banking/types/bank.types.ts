/**
 * Banking Domain Type Definitions
 * Following TypeScript 5.x best practices with strict typing
 */

import type { Decimal } from '@prisma/client/runtime/library'
import type { BankAccount as PrismaBankAccount, Transaction as PrismaTransaction, Transfer as PrismaTransfer } from '@prisma/client'

// ============================================================================
// Base Types & Enums
// ============================================================================

export const BankAccountType = {
  DEPOSITORY: 'depository',
  CREDIT: 'credit',
  LOAN: 'loan',
  INVESTMENT: 'investment',
} as const

export type BankAccountType = typeof BankAccountType[keyof typeof BankAccountType]

export const TransactionType = {
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const

export type TransactionType = typeof TransactionType[keyof typeof TransactionType]

export const PaymentChannel = {
  ONLINE: 'online',
  IN_STORE: 'in_store',
  OTHER: 'other',
} as const

export type PaymentChannel = typeof PaymentChannel[keyof typeof PaymentChannel]

export const TransferStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const

export type TransferStatus = typeof TransferStatus[keyof typeof TransferStatus]

// ============================================================================
// Domain Models
// ============================================================================

/**
 * Bank Account model with proper Decimal handling
 */
export interface BankAccount {
  id: string
  userId: string
  bankId: string
  accountId: string
  accessToken: string
  fundingSourceUrl: string | null
  shareableId: string | null
  institutionId: string
  name: string
  officialName: string | null
  mask: string | null
  currentBalance: number
  availableBalance: number
  type: BankAccountType
  subtype: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Transaction model
 */
export interface Transaction {
  id: string
  accountId: string
  bankAccountId: string
  name: string
  amount: number
  date: Date
  paymentChannel: PaymentChannel | null
  category: string
  subcategory: string | null
  type: TransactionType
  pending: boolean
  merchantName: string | null
  merchantId: string | null
  locationAddress: string | null
  locationCity: string | null
  locationState: string | null
  locationZip: string | null
  locationCountry: string | null
  isoCurrencyCode: string
  createdAt: Date
}

/**
 * Transfer model
 */
export interface Transfer {
  id: string
  senderBankId: string
  receiverBankId: string
  amount: number
  note: string | null
  status: TransferStatus
  transferDate: Date
  dwollaTransferId: string | null
  dwollaTransferUrl: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Bank Institution information from Plaid
 */
export interface BankInstitution {
  id: string
  name: string
  logo: string | null
  primaryColor: string | null
  url: string | null
  oauth: boolean
}

// ============================================================================
// Aggregated Types
// ============================================================================

/**
 * Bank Account with related transactions
 */
export interface BankAccountWithTransactions extends BankAccount {
  transactions: Transaction[]
  _count?: {
    transactions: number
  }
}

/**
 * Bank Account with institution details
 */
export interface BankAccountWithInstitution extends BankAccount {
  institution: BankInstitution
}

/**
 * Account overview for lab
 */
export interface AccountOverview {
  data: BankAccountWithTransactions[]
  totalBanks: number
  totalCurrentBalance: number
  totalAvailableBalance: number
}

/**
 * Transaction with bank account details
 */
export interface TransactionWithAccount extends Transaction {
  bankAccount: Pick<BankAccount, 'id' | 'name' | 'mask' | 'type'>
}

/**
 * Transfer with bank details
 */
export interface TransferWithBanks extends Transfer {
  senderBank: Pick<BankAccount, 'id' | 'name' | 'mask'>
  receiverBank: Pick<BankAccount, 'id' | 'name' | 'mask'>
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Converts Prisma Decimal fields to numbers
 */
export type SerializedBankAccount = Omit<PrismaBankAccount, 'currentBalance' | 'availableBalance'> & {
  currentBalance: number
  availableBalance: number
}

export type SerializedTransaction = Omit<PrismaTransaction, 'amount'> & {
  amount: number
}

export type SerializedTransfer = Omit<PrismaTransfer, 'amount'> & {
  amount: number
}

/**
 * Plaid Link metadata
 */
export interface PlaidLinkMetadata {
  publicToken: string
  institutionId: string
  institutionName: string
  accountId: string
  accountName: string
  accountMask: string | null
  accountType: BankAccountType
  accountSubtype: string
}

/**
 * Account creation input
 */
export interface CreateBankAccountInput {
  userId: string
  bankId: string
  accountId: string
  accessToken: string
  fundingSourceUrl?: string
  shareableId?: string
}

/**
 * Transaction filters
 */
export interface TransactionFilters {
  accountId?: string
  startDate?: Date
  endDate?: Date
  category?: string
  type?: TransactionType
  pending?: boolean
  minAmount?: number
  maxAmount?: number
  searchTerm?: string
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isBankAccount(value: unknown): value is BankAccount {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'accountId' in value &&
    'currentBalance' in value
  )
}

export function isTransaction(value: unknown): value is Transaction {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'bankAccountId' in value &&
    'amount' in value &&
    'type' in value
  )
}

export function isTransfer(value: unknown): value is Transfer {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'senderBankId' in value &&
    'receiverBankId' in value &&
    'status' in value
  )
}

// ============================================================================
// Branded Types for Domain Safety
// ============================================================================

export type AccountId = string & { readonly __brand: 'AccountId' }
export type UserId = string & { readonly __brand: 'UserId' }
export type TransactionId = string & { readonly __brand: 'TransactionId' }
export type TransferId = string & { readonly __brand: 'TransferId' }

export function createAccountId(id: string): AccountId {
  return id as AccountId
}

export function createUserId(id: string): UserId {
  return id as UserId
}

export function createTransactionId(id: string): TransactionId {
  return id as TransactionId
}

export function createTransferId(id: string): TransferId {
  return id as TransferId
}