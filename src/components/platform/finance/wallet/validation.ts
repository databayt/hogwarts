/**
 * Wallet Module - Validation Schemas
 */

import { z } from 'zod'
import { WalletType, TransactionType } from '@prisma/client'

export const walletSchema = z.object({
  type: z.nativeEnum(WalletType),
  userId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const walletTransactionSchema = z.object({
  walletId: z.string().min(1, 'Wallet is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.nativeEnum(TransactionType),
  description: z.string().max(500).optional(),
  referenceId: z.string().optional(),
})

export const walletTopupSchema = z.object({
  walletId: z.string().min(1, 'Wallet is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER']),
  description: z.string().max(500).optional(),
})

export const walletRefundSchema = z.object({
  walletId: z.string().min(1, 'Wallet is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required').max(500),
})

export const walletFilterSchema = z.object({
  type: z.nativeEnum(WalletType).optional(),
  isActive: z.boolean().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
})
