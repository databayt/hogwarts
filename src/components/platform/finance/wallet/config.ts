/**
 * Wallet Module - Configuration
 */

import { TransactionType, WalletType } from "@prisma/client"

export const WalletTypeLabels: Record<WalletType, string> = {
  SCHOOL: "School Wallet",
  PARENT: "Parent Wallet",
  STUDENT: "Student Wallet",
}

export const WalletTransactionTypeLabels: Record<TransactionType, string> = {
  CREDIT: "Credit (Top-up)",
  DEBIT: "Debit (Payment)",
  TRANSFER: "Transfer",
}

export const PaymentMethods = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "WALLET",
  "OTHER",
] as const

export type PaymentMethod = (typeof PaymentMethods)[number]

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Credit/Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  OTHER: "Other",
}

export const WALLET_LIMITS = {
  MIN_BALANCE: 0,
  MAX_BALANCE: 100000000, // $1,000,000 in cents
  MIN_TOPUP: 100, // $1.00 in cents
  MAX_TOPUP: 10000000, // $100,000 in cents
  MIN_REFUND: 100, // $1.00 in cents
} as const

export const WALLET_CONFIG = {
  AUTO_CREATE_FOR_PARENTS: true,
  AUTO_CREATE_FOR_STUDENTS: false,
  REQUIRE_APPROVAL_FOR_REFUNDS: true,
  ENABLE_OVERDRAFT: false,
} as const
