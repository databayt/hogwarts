// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Wallet Module - Validation Schemas
 */

import { TransactionType, WalletType } from "@prisma/client"
import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export const createWalletTransactionSchema = (v: ValidationHelper) =>
  z.object({
    walletId: z.string().min(1, v.required()),
    amount: z.number().min(0.01, v.positive()),
    type: z.nativeEnum(TransactionType),
    description: z.string().max(500).optional(),
    referenceId: z.string().optional(),
  })

export const createWalletTopupSchema = (v: ValidationHelper) =>
  z.object({
    walletId: z.string().min(1, v.required()),
    amount: z.number().min(0.01, v.positive()),
    paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]),
    description: z.string().max(500).optional(),
  })

export const createWalletRefundSchema = (v: ValidationHelper) =>
  z.object({
    walletId: z.string().min(1, v.required()),
    amount: z.number().min(0.01, v.positive()),
    reason: z.string().min(1, v.required()).max(500),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

export const walletSchema = z.object({
  type: z.nativeEnum(WalletType),
  userId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const walletTransactionSchema = z.object({
  walletId: z.string().min(1, "Wallet is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.nativeEnum(TransactionType),
  description: z.string().max(500).optional(),
  referenceId: z.string().optional(),
})

export const walletTopupSchema = z.object({
  walletId: z.string().min(1, "Wallet is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "OTHER"]),
  description: z.string().max(500).optional(),
})

export const walletRefundSchema = z.object({
  walletId: z.string().min(1, "Wallet is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required").max(500),
})

export const walletFilterSchema = z.object({
  type: z.nativeEnum(WalletType).optional(),
  isActive: z.boolean().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
})
