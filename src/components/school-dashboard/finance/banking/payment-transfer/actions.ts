"use server"

import { cache } from "react"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"

import type { ActionResult, BankAccount } from "../types"
import { transferSchema } from "./validation"

/**
 * Get accounts for transfer selection
 */
export const getAccounts = cache(
  async (params: { userId: string }): Promise<BankAccount[]> => {
    try {
      const accounts = await db.bankAccount.findMany({
        where: {
          userId: params.userId,
        },
        orderBy: { createdAt: "desc" },
      })

      return accounts.map((account) => ({
        id: account.id,
        name: account.name,
        officialName: account.officialName ?? undefined,
        mask: account.mask ?? undefined,
        type: account.type as
          | "checking"
          | "savings"
          | "credit"
          | "investment"
          | "loan"
          | "other",
        subtype: account.subtype,
        currentBalance: account.currentBalance.toNumber(),
        availableBalance:
          account.availableBalance?.toNumber() ||
          account.currentBalance.toNumber(),
        institutionId: account.institutionId,
      }))
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      return []
    }
  }
)

/**
 * Create a transfer between accounts
 */
export async function createTransfer(
  prevState: any,
  formData: FormData
): Promise<ActionResult<{ transactionId: string }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not authenticated" },
      }
    }
    const user = session.user

    // Parse form data
    const rawData = {
      fromAccountId: formData.get("fromAccountId") as string,
      toAccountId: formData.get("toAccountId") as string,
      amount: parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string,
      recipientEmail: formData.get("recipientEmail") as string,
    }

    // Validate with Zod
    const validationResult = transferSchema.safeParse(rawData)
    if (!validationResult.success) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validationResult.error.issues[0].message,
        },
      }
    }

    const data = validationResult.data

    // Verify account ownership
    const fromAccount = await db.bankAccount.findFirst({
      where: {
        id: data.fromAccountId,
        userId: user.id,
      },
    })

    if (!fromAccount) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Source account not found" },
      }
    }

    // Check sufficient balance
    const balance = fromAccount.availableBalance || fromAccount.currentBalance
    if (balance.toNumber() < data.amount) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: "Insufficient balance for transfer",
        },
      }
    }

    // Handle internal vs external transfer
    let toAccount = null
    if (data.toAccountId) {
      // Internal transfer between user's accounts
      toAccount = await db.bankAccount.findFirst({
        where: {
          id: data.toAccountId,
          userId: user.id,
        },
      })

      if (!toAccount) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Destination account not found",
          },
        }
      }
    } else if (data.recipientEmail) {
      // External transfer to another user - must be in same school
      const schoolId = session.user.schoolId
      if (!schoolId) {
        return {
          success: false,
          error: {
            code: "NO_SCHOOL_CONTEXT",
            message: "School context not found",
          },
        }
      }

      const recipient = await db.user.findUnique({
        where: {
          email_schoolId: {
            email: data.recipientEmail,
            schoolId: schoolId,
          },
        },
      })

      if (!recipient) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Recipient not found in your school",
          },
        }
      }

      // Get recipient's first account (no isDefault field exists)
      toAccount = await db.bankAccount.findFirst({
        where: {
          userId: recipient.id,
        },
        orderBy: { createdAt: "asc" },
      })

      if (!toAccount) {
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Recipient has no default account",
          },
        }
      }
    }

    // Get schoolId for multi-tenant support
    const schoolId = session.user.schoolId
    if (!schoolId) {
      return {
        success: false,
        error: {
          code: "NO_SCHOOL_CONTEXT",
          message: "School context not found",
        },
      }
    }

    // Create transaction records in a transaction
    const result = await db.$transaction(async (tx) => {
      // Debit from source account
      const debitTransaction = await tx.transaction.create({
        data: {
          schoolId,
          accountId: fromAccount.accountId,
          bankAccountId: fromAccount.id,
          amount: data.amount,
          type: "debit",
          category: "Transfer",
          name: `Transfer to ${toAccount?.name || data.recipientEmail}`,
          date: new Date(),
        },
      })

      // Update source account balance
      await tx.bankAccount.update({
        where: { id: fromAccount.id },
        data: {
          currentBalance: {
            decrement: data.amount,
          },
          availableBalance: {
            decrement: data.amount,
          },
        },
      })

      if (toAccount) {
        // Credit to destination account
        await tx.transaction.create({
          data: {
            schoolId,
            accountId: toAccount.accountId,
            bankAccountId: toAccount.id,
            amount: data.amount,
            type: "credit",
            category: "Transfer",
            name: `Transfer from ${fromAccount.name}`,
            date: new Date(),
          },
        })

        // Update destination account balance
        await tx.bankAccount.update({
          where: { id: toAccount.id },
          data: {
            currentBalance: {
              increment: data.amount,
            },
            availableBalance: {
              increment: data.amount,
            },
          },
        })
      }

      return debitTransaction
    })

    // Revalidate affected paths
    revalidatePath("/banking")
    revalidatePath("/banking/payment-transfer")
    revalidatePath("/banking/transaction-history")

    return {
      success: true,
      data: { transactionId: result.id },
    }
  } catch (error) {
    console.error("Failed to create transfer:", error)
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to process transfer",
      },
    }
  }
}

/**
 * Get recent transfers for a user
 */
export const getRecentTransfers = cache(
  async (params: { userId: string; limit?: number }): Promise<any[]> => {
    try {
      const transfers = await db.transaction.findMany({
        where: {
          bankAccount: {
            userId: params.userId,
          },
          category: "Transfer",
        },
        include: {
          bankAccount: {
            select: {
              id: true,
              name: true,
              mask: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: params.limit || 10,
      })

      return transfers.map((t) => ({
        ...t,
        amount: t.amount.toNumber(),
      }))
    } catch (error) {
      console.error("Failed to fetch transfers:", error)
      return []
    }
  }
)
