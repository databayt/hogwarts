// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Wallet Module - Server Actions
 */

"use server"

import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../guard"
import type { WalletActionResult } from "./types"
import {
  walletRefundSchema,
  walletSchema,
  walletTopupSchema,
} from "./validation"

export async function createWallet(
  formData: FormData
): Promise<WalletActionResult> {
  try {
    const ctx = await requireFinanceActor("wallet", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const data = {
      type: formData.get("type"),
      userId: formData.get("userId") || null,
      isActive: formData.get("isActive") === "true",
    }

    const validated = walletSchema.parse(data)

    const wallet = await db.wallet.create({
      data: {
        walletType: validated.type,
        ownerId: validated.userId || schoolId,
        isActive: validated.isActive,
        schoolId: schoolId,
        balance: 0,
      },
      include: {
        transactions: true,
      },
    })

    revalidatePath("/finance/wallet")
    return { success: true, data: wallet as any }
  } catch (error) {
    console.error("Error creating wallet:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function topupWallet(formData: FormData) {
  try {
    const ctx = await requireFinanceActor("wallet", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const data = {
      walletId: formData.get("walletId"),
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("paymentMethod"),
      description: formData.get("description") || undefined,
    }

    const validated = walletTopupSchema.parse(data)

    const result = await db.$transaction(async (tx) => {
      // Update wallet balance
      const wallet = await tx.wallet.update({
        where: {
          id: validated.walletId,
          schoolId: schoolId,
        },
        data: {
          balance: {
            increment: validated.amount,
          },
        },
      })

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: validated.walletId,
          amount: validated.amount,
          type: "CREDIT",
          description:
            validated.description || `Top-up via ${validated.paymentMethod}`,
          schoolId: schoolId,
          balanceAfter: wallet.balance,
          createdBy: userId,
        },
      })

      return { wallet, transaction }
    })

    // Post to double-entry ledger so cash + unearned-revenue accounts move.
    // Mirrors fees/actions.ts postFeePayment wiring; fire-and-forget by design
    // (per umbrella finance/ISSUE.md the rollback story is shared P0 work,
    // tracked separately from wiring the orphan posters).
    try {
      const { postWalletTopup } = await import("../lib/accounting/actions")
      const postResult = await postWalletTopup(schoolId, {
        transactionId: result.transaction.id,
        amount: validated.amount,
        topupDate: result.transaction.createdAt,
      })
      if (!postResult.success) {
        console.error(
          "[topupWallet] postWalletTopup failed:",
          postResult.errors
        )
      }
    } catch (postingErr) {
      console.error(
        "[topupWallet] Ledger posting threw (continuing):",
        postingErr
      )
    }

    revalidatePath("/finance/wallet")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error topping up wallet:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function refundWallet(formData: FormData) {
  try {
    const ctx = await requireFinanceActor("wallet", "approve")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const data = {
      walletId: formData.get("walletId"),
      amount: Number(formData.get("amount")),
      reason: formData.get("reason"),
    }

    const validated = walletRefundSchema.parse(data)

    // Check wallet balance
    const wallet = await db.wallet.findUnique({
      where: {
        id: validated.walletId,
        schoolId: schoolId,
      },
    })

    if (!wallet) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    if (Number(wallet.balance) < validated.amount) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    const result = await db.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: validated.walletId },
        data: {
          balance: {
            decrement: validated.amount,
          },
        },
      })

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: validated.walletId,
          amount: validated.amount,
          type: "DEBIT",
          description: `Refund: ${validated.reason}`,
          schoolId: schoolId,
          balanceAfter: updatedWallet.balance,
          createdBy: userId,
        },
      })

      return { wallet: updatedWallet, transaction }
    })

    revalidatePath("/finance/wallet")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error refunding wallet:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function getWallets(filters?: {
  type?: string
  isActive?: boolean
}) {
  try {
    const ctx = await requireFinanceActor("wallet", "view")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const wallets = await db.wallet.findMany({
      where: {
        schoolId: schoolId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return { success: true, data: wallets }
  } catch (error) {
    console.error("Error fetching wallets:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
