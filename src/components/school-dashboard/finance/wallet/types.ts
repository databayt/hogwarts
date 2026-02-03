/**
 * Wallet Module - Type Definitions
 */

import type { TransactionType, WalletType } from "@prisma/client"
import type { z } from "zod"

import type { walletSchema, walletTransactionSchema } from "./validation"

export type WalletInput = z.infer<typeof walletSchema>
export type WalletTransactionInput = z.infer<typeof walletTransactionSchema>

export interface WalletWithTransactions {
  id: string
  balance: number
  type: WalletType
  isActive: boolean
  userId: string | null
  schoolId: string
  transactions: WalletTransactionWithDetails[]
  user?: { id: string; name: string | null; email: string | null }
}

export interface WalletTransactionWithDetails {
  id: string
  walletId: string
  amount: number
  type: TransactionType
  description: string | null
  referenceId: string | null
  createdAt: Date
}

export interface WalletDashboardStats {
  walletsCount: number
  transactionsCount: number
  totalBalance: number
  totalTopups: number
}

export interface WalletActionResult {
  success: boolean
  data?: WalletWithTransactions
  error?: string
}
