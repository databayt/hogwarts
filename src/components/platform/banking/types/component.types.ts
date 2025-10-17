/**
 * Component Prop Type Definitions
 * Following the 'Props' naming pattern with strict typing
 */

import type { ReactNode } from 'react'
import type {
  BankAccount,
  BankAccountWithTransactions,
  Transaction,
  Transfer,
  TransferWithBanks,
  BankInstitution,
  TransactionType,
  TransferStatus,
  PaymentChannel,
  TransactionFilters,
} from './bank.types'

// ============================================================================
// Common Types
// ============================================================================

/**
 * User type for components
 */
export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

/**
 * Dictionary type for internationalization
 */
export interface BankingDictionary {
  // Common
  loading?: string
  error?: string
  retry?: string
  cancel?: string
  confirm?: string
  save?: string
  delete?: string
  edit?: string
  close?: string
  back?: string
  next?: string
  previous?: string
  search?: string
  filter?: string

  // Dashboard
  welcome?: string
  subtitle?: string
  totalBalance?: string
  connectedBanks?: string
  activeAccounts?: string
  accountStatus?: string
  statusActive?: string
  statusInactive?: string
  recentTransactions?: string
  viewAll?: string
  noTransactions?: string

  // Accounts
  myBanks?: string
  addBank?: string
  accountDetails?: string
  currentBalance?: string
  availableBalance?: string
  accountType?: string
  accountNumber?: string
  routingNumber?: string

  // Transactions
  transactions?: string
  transactionHistory?: string
  amount?: string
  date?: string
  category?: string
  merchant?: string
  status?: string
  pending?: string
  completed?: string
  income?: string
  expense?: string

  // Transfers
  paymentTransfer?: string
  sendMoney?: string
  recipientEmail?: string
  transferAmount?: string
  transferNote?: string
  selectAccount?: string
  transferSuccess?: string
  transferFailed?: string
  insufficientFunds?: string
}

// ============================================================================
// Dashboard Components
// ============================================================================

export interface DashboardHeaderProps {
  user: User
  accounts: BankAccountWithTransactions[]
  totalBanks: number
  totalCurrentBalance: number
  dictionary?: BankingDictionary
}

export interface DashboardContentProps {
  user: User
  accounts: BankAccountWithTransactions[]
  dictionary?: BankingDictionary
}

export interface DashboardSidebarProps {
  user: User
  accounts: BankAccount[]
  selectedAccountId?: string
  onAccountSelect?: (accountId: string) => void
  dictionary?: BankingDictionary
}

export interface AccountTabsProps {
  accounts: BankAccountWithTransactions[]
  selectedAccountId?: string
  onAccountSelect?: (accountId: string) => void
  dictionary?: BankingDictionary
}

export interface RecentTransactionsProps {
  transactions: Transaction[]
  limit?: number
  showViewAll?: boolean
  onViewAll?: () => void
  dictionary?: BankingDictionary
}

// ============================================================================
// Shared Components
// ============================================================================

export interface AnimatedCounterProps {
  amount: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export interface BankCardProps {
  account: BankAccount
  userName: string
  showBalance?: boolean
  isSelected?: boolean
  onClick?: (account: BankAccount) => void
  className?: string
}

export interface BankDropdownProps {
  accounts: BankAccount[]
  selectedAccountId?: string
  onSelect: (accountId: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  dictionary?: BankingDictionary
}

export interface DoughnutChartProps {
  accounts: BankAccount[]
  showLegend?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface TotalBalanceBoxProps {
  accounts: BankAccountWithTransactions[]
  totalBanks: number
  totalCurrentBalance: number
  showAddBank?: boolean
  dictionary?: BankingDictionary
}

export interface PlaidLinkProps {
  userId: string
  userEmail: string
  onSuccess?: (publicToken: string, metadata: any) => void
  onExit?: (error?: any) => void
  buttonText?: string
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  className?: string
}

export interface MobileNavProps {
  user: User
  isOpen: boolean
  onClose: () => void
  dictionary?: BankingDictionary
}

export interface SidebarProps {
  user: User
  dictionary?: BankingDictionary
  className?: string
}

// ============================================================================
// Transaction Components
// ============================================================================

export interface TransactionTableProps {
  transactions: Transaction[]
  accounts?: BankAccount[]
  loading?: boolean
  onTransactionClick?: (transaction: Transaction) => void
  dictionary?: BankingDictionary
}

export interface TransactionHistoryContentProps {
  userId: string
  accounts: BankAccount[]
  initialTransactions?: Transaction[]
  dictionary?: BankingDictionary
}

export interface TransactionFiltersProps {
  filters: TransactionFilters
  onFilterChange: (filters: TransactionFilters) => void
  accounts?: BankAccount[]
  dictionary?: BankingDictionary
}

export interface TransactionDetailsProps {
  transaction: Transaction
  account?: BankAccount
  onClose?: () => void
  dictionary?: BankingDictionary
}

export interface TransactionCategoryIconProps {
  category: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ============================================================================
// Transfer Components
// ============================================================================

export interface PaymentTransferFormProps {
  accounts: BankAccount[]
  recipients?: Array<{ email: string; name?: string }>
  onSubmit: (data: TransferFormData) => Promise<void>
  loading?: boolean
  dictionary?: BankingDictionary
}

export interface TransferFormData {
  senderBankId: string
  recipientEmail: string
  amount: number
  note?: string
}

export interface PaymentTransferContentProps {
  userId: string
  accounts: BankAccount[]
  dictionary?: BankingDictionary
}

export interface TransferHistoryProps {
  transfers: TransferWithBanks[]
  loading?: boolean
  onTransferClick?: (transfer: TransferWithBanks) => void
  dictionary?: BankingDictionary
}

export interface TransferDetailsProps {
  transfer: TransferWithBanks
  onClose?: () => void
  dictionary?: BankingDictionary
}

export interface TransferStatusBadgeProps {
  status: TransferStatus
  size?: 'sm' | 'md' | 'lg'
  dictionary?: BankingDictionary
}

// ============================================================================
// My Banks Components
// ============================================================================

export interface MyBanksContentProps {
  userId: string
  accounts: BankAccountWithTransactions[]
  dictionary?: BankingDictionary
}

export interface BankListProps {
  accounts: BankAccountWithTransactions[]
  onAccountClick?: (account: BankAccount) => void
  onDeleteAccount?: (accountId: string) => void
  dictionary?: BankingDictionary
}

export interface AddBankButtonProps {
  userId: string
  userEmail: string
  onSuccess?: (account: BankAccount) => void
  dictionary?: BankingDictionary
}

// ============================================================================
// Chart Components
// ============================================================================

export interface SpendingChartProps {
  data: Array<{ date: string; amount: number; category?: string }>
  period: 'week' | 'month' | 'quarter' | 'year'
  height?: number
  showCategories?: boolean
  dictionary?: BankingDictionary
}

export interface CategoryBreakdownProps {
  categories: Array<{
    category: string
    amount: number
    percentage: number
    color?: string
  }>
  showPercentage?: boolean
  dictionary?: BankingDictionary
}

export interface BalanceHistoryChartProps {
  data: Array<{ date: string; balance: number }>
  height?: number
  showTrend?: boolean
  dictionary?: BankingDictionary
}

// ============================================================================
// Loading & Error Components
// ============================================================================

export interface BankingSkeletonProps {
  type: 'dashboard' | 'transactions' | 'transfer' | 'banks' | 'card'
  count?: number
  className?: string
}

export interface BankingErrorProps {
  error: Error | string
  onRetry?: () => void
  dictionary?: BankingDictionary
}

export interface EmptyStateProps {
  type: 'no-accounts' | 'no-transactions' | 'no-transfers' | 'no-results'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  dictionary?: BankingDictionary
}

// ============================================================================
// Layout Components
// ============================================================================

export interface BankingLayoutProps {
  children: ReactNode
  user: User
  showSidebar?: boolean
  dictionary?: BankingDictionary
}

export interface BankingPageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  dictionary?: BankingDictionary
}

// ============================================================================
// Modal & Dialog Components
// ============================================================================

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
  loading?: boolean
  dictionary?: BankingDictionary
}

export interface BankAccountModalProps {
  account: BankAccountWithTransactions | null
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary?: BankingDictionary
}

// ============================================================================
// Form Components
// ============================================================================

export interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
  placeholder?: string
  max?: number
  min?: number
  currency?: string
  disabled?: boolean
  className?: string
}

export interface EmailInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
  placeholder?: string
  suggestions?: string[]
  disabled?: boolean
  className?: string
}

// ============================================================================
// Notification Components
// ============================================================================

export interface BankingToastProps {
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// Utility Props
// ============================================================================

export interface WithLoadingProps {
  loading: boolean
  error?: Error | string | null
}

export interface WithPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export interface WithSortingProps<T> {
  sortBy: keyof T
  sortOrder: 'asc' | 'desc'
  onSort: (field: keyof T) => void
}