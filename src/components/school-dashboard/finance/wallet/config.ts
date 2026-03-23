// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Wallet Module - Configuration
 * Labels are dictionary-backed via getter functions.
 */

import { TransactionType, WalletType } from "@prisma/client"

const DEFAULT_WALLET_TYPE_LABELS: Record<WalletType, string> = {
  SCHOOL: "School Wallet",
  PARENT: "Parent Wallet",
  STUDENT: "Student Wallet",
}

/** Get localized wallet type labels from dictionary */
export const getWalletTypeLabels = (
  d?: Record<string, string>
): Record<WalletType, string> => ({
  SCHOOL: d?.SCHOOL || DEFAULT_WALLET_TYPE_LABELS.SCHOOL,
  PARENT: d?.PARENT || DEFAULT_WALLET_TYPE_LABELS.PARENT,
  STUDENT: d?.STUDENT || DEFAULT_WALLET_TYPE_LABELS.STUDENT,
})

/** For backward compat -- static fallback */
export const WalletTypeLabels = DEFAULT_WALLET_TYPE_LABELS

const DEFAULT_TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  CREDIT: "Credit (Top-up)",
  DEBIT: "Debit (Payment)",
  TRANSFER: "Transfer",
}

/** Get localized transaction type labels from dictionary */
export const getTransactionTypeLabels = (
  d?: Record<string, string>
): Record<TransactionType, string> => ({
  CREDIT: d?.CREDIT || DEFAULT_TRANSACTION_TYPE_LABELS.CREDIT,
  DEBIT: d?.DEBIT || DEFAULT_TRANSACTION_TYPE_LABELS.DEBIT,
  TRANSFER: d?.TRANSFER || DEFAULT_TRANSACTION_TYPE_LABELS.TRANSFER,
})

/** For backward compat -- static fallback */
export const WalletTransactionTypeLabels = DEFAULT_TRANSACTION_TYPE_LABELS

export const PaymentMethods = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "WALLET",
  "OTHER",
] as const

export type PaymentMethod = (typeof PaymentMethods)[number]

const DEFAULT_PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Credit/Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  WALLET: "Wallet",
  OTHER: "Other",
}

/** Get localized payment method labels from dictionary */
export const getPaymentMethodLabels = (
  d?: Record<string, string>
): Record<PaymentMethod, string> => {
  const result = { ...DEFAULT_PAYMENT_METHOD_LABELS }
  if (d) {
    for (const key of PaymentMethods) {
      if (d[key]) result[key] = d[key]
    }
  }
  return result
}

/** For backward compat -- static fallback */
export const PaymentMethodLabels = DEFAULT_PAYMENT_METHOD_LABELS

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
