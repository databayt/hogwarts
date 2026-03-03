"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cache } from "react"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResult, BankAccount } from "../types"

/**
 * Get all bank accounts for a user
 */
export const getAccounts = cache(
  async (params: { userId: string }): Promise<BankAccount[]> => {
    try {
      const { schoolId } = await getTenantContext()
      if (!schoolId) return []

      const accounts = await db.bankAccount.findMany({
        where: {
          userId: params.userId,
          schoolId,
        },
        orderBy: { createdAt: "desc" },
      })

      return accounts.map((account) => ({
        ...account,
        type: account.type as
          | "checking"
          | "savings"
          | "credit"
          | "investment"
          | "loan"
          | "other",
        currentBalance: account.currentBalance.toNumber(),
        availableBalance: account.availableBalance?.toNumber() || 0,
        officialName: account.officialName ?? undefined,
        mask: account.mask ?? undefined,
      }))
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      return []
    }
  }
)

/**
 * Remove a bank account connection
 */
export async function removeBank(params: {
  accountId: string
}): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      }
    }
    const user = session.user

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: {
          code: "NO_SCHOOL_CONTEXT",
          message: "Missing school context",
        },
      }
    }

    // Verify ownership
    const account = await db.bankAccount.findFirst({
      where: {
        id: params.accountId,
        userId: user.id,
        schoolId,
      },
    })

    if (!account) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Account not found" },
      }
    }

    // Hard delete - no soft delete field available
    await db.bankAccount.delete({
      where: { id: params.accountId },
    })

    revalidatePath("/banking/my-banks")
    revalidatePath("/banking")

    return {
      success: true,
      data: { message: "Bank account removed successfully" },
    }
  } catch (error) {
    console.error("Failed to remove bank:", error)
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove bank account",
      },
    }
  }
}

/**
 * Sync bank account data from Plaid
 */
export async function syncBankData(params: {
  accountId: string
}): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      }
    }
    const user = session.user

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: {
          code: "NO_SCHOOL_CONTEXT",
          message: "Missing school context",
        },
      }
    }

    // Verify ownership
    const account = await db.bankAccount.findFirst({
      where: {
        id: params.accountId,
        userId: user.id,
        schoolId,
      },
    })

    if (!account) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Account not found" },
      }
    }

    // TODO: Implement Plaid sync logic
    // const plaidData = await plaidClient.syncAccount(account.plaidAccountId);

    return {
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Bank sync is not yet implemented",
      },
    }
  } catch (error) {
    console.error("Failed to sync bank data:", error)
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sync bank data",
      },
    }
  }
}
