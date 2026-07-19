// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Accounts Module - Server Actions
 * Server-side operations for chart of accounts, journal entries, and accounting reports
 */

"use server"

import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../guard"
import { JOURNAL_ENTRY_NUMBER_FORMAT, StandardAccountCodes } from "./config"
import type { AccountActionResult, JournalEntryActionResult } from "./types"
import {
  accountSchema,
  fiscalYearSchema,
  journalEntrySchema,
} from "./validation"

/**
 * Create Account
 * Creates a new account in the chart of accounts
 */
export async function createAccount(
  formData: FormData
): Promise<AccountActionResult> {
  try {
    const ctx = await requireFinanceActor("accounts", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const data = {
      code: formData.get("code"),
      name: formData.get("name"),
      type: formData.get("type"),
      description: formData.get("description") || undefined,
      parentAccountId: formData.get("parentAccountId") || null,
      isActive: formData.get("isActive") === "true",
    }

    const validated = accountSchema.parse(data)

    // Check if account code already exists
    const existing = await db.chartOfAccount.findFirst({
      where: {
        schoolId,
        code: validated.code,
      },
    })

    if (existing) {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }

    // Derive normalBalance from account type
    const { NormalBalance } = await import("./config")
    const normalBalance = NormalBalance[validated.type]

    const account = await db.chartOfAccount.create({
      data: {
        ...validated,
        normalBalance,
        schoolId,
      },
    })

    revalidatePath("/finance/accounts")
    return { success: true, data: account as any }
  } catch (error) {
    console.error("Error creating account:", error)
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

/**
 * Update Account
 * Updates an existing account
 */
export async function updateAccount(
  accountId: string,
  formData: FormData
): Promise<AccountActionResult> {
  try {
    const ctx = await requireFinanceActor("accounts", "edit")
    if (isFinanceAuthError(ctx)) return ctx

    const data = {
      code: formData.get("code"),
      name: formData.get("name"),
      type: formData.get("type"),
      description: formData.get("description") || undefined,
      parentAccountId: formData.get("parentAccountId") || null,
      isActive: formData.get("isActive") === "true",
    }

    const validated = accountSchema.parse(data)

    // Derive normalBalance from account type
    const { NormalBalance } = await import("./config")
    const normalBalance = NormalBalance[validated.type]

    const account = await db.chartOfAccount.update({
      where: {
        id: accountId,
        schoolId: ctx.schoolId,
      },
      data: {
        ...validated,
        normalBalance,
      },
    })

    revalidatePath("/finance/accounts")
    return { success: true, data: account as any }
  } catch (error) {
    console.error("Error updating account:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update account",
    }
  }
}

/**
 * Delete Account
 * Soft deletes an account (marks as inactive)
 */
export async function deleteAccount(
  accountId: string
): Promise<AccountActionResult> {
  try {
    const ctx = await requireFinanceActor("accounts", "delete")
    if (isFinanceAuthError(ctx)) return ctx

    // Check if account has been used in any ledger entries
    const usageCount = await db.ledgerEntry.count({
      where: { accountId, schoolId: ctx.schoolId },
    })

    if (usageCount > 0) {
      return {
        success: false,
        error:
          "Cannot delete account that has been used in transactions. Mark as inactive instead.",
      }
    }

    const account = await db.chartOfAccount.update({
      where: {
        id: accountId,
        schoolId: ctx.schoolId,
      },
      data: { isActive: false },
    })

    revalidatePath("/finance/accounts")
    return { success: true, data: account as any }
  } catch (error) {
    console.error("Error deleting account:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete account",
    }
  }
}

/**
 * Create Journal Entry
 * Creates a new manual journal entry
 */
export async function createJournalEntry(
  formData: FormData
): Promise<JournalEntryActionResult> {
  try {
    const ctx = await requireFinanceActor("accounts", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const entriesData = JSON.parse(formData.get("entries") as string)

    const data = {
      entryDate: formData.get("entryDate"),
      description: formData.get("description"),
      fiscalYearId: formData.get("fiscalYearId"),
      entries: entriesData,
    }

    const validated = journalEntrySchema.parse(data)

    // Generate journal entry number
    const today = new Date()
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`

    const lastEntry = await db.journalEntry.findFirst({
      where: {
        schoolId,
        entryNumber: {
          startsWith: `${JOURNAL_ENTRY_NUMBER_FORMAT.prefix}-${yearMonth}`,
        },
      },
      orderBy: { entryNumber: "desc" },
    })

    let sequence = 1
    if (lastEntry) {
      const lastSequence = parseInt(
        lastEntry.entryNumber.split("-").pop() || "0"
      )
      sequence = lastSequence + 1
    }

    const entryNumber = `${JOURNAL_ENTRY_NUMBER_FORMAT.prefix}-${yearMonth}-${String(sequence).padStart(JOURNAL_ENTRY_NUMBER_FORMAT.sequenceLength, "0")}`

    // Create journal entry with ledger entries
    const journalEntry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate: validated.entryDate,
        description: validated.description,
        fiscalYearId: validated.fiscalYearId,
        schoolId,
        sourceModule: "MANUAL",
        createdBy: userId,
        ledgerEntries: {
          create: validated.entries.map((entry) => ({
            school: { connect: { id: schoolId } },
            account: { connect: { id: entry.accountId } },
            debit: entry.debit,
            credit: entry.credit,
            description: entry.description,
          })),
        },
      },
      include: {
        ledgerEntries: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    revalidatePath("/finance/accounts/journal")
    return { success: true, data: journalEntry as any }
  } catch (error) {
    console.error("Error creating journal entry:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create journal entry",
    }
  }
}

/**
 * Post Journal Entry
 * Posts a draft journal entry to the ledger
 */
export async function postJournalEntry(
  journalEntryId: string
): Promise<JournalEntryActionResult> {
  try {
    const ctx = await requireFinanceActor("accounts", "approve")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const journalEntry = await db.journalEntry.findUnique({
      where: {
        id: journalEntryId,
        schoolId,
      },
      include: {
        ledgerEntries: true,
      },
    })

    if (!journalEntry) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (journalEntry.isPosted) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    // Post the entry
    const updated = await db.journalEntry.update({
      where: {
        id: journalEntryId,
        schoolId,
      },
      data: {
        isPosted: true,
        postedAt: new Date(),
        postedBy: userId,
      },
      include: {
        ledgerEntries: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    revalidatePath("/finance/accounts/journal")
    revalidatePath("/finance/accounts/ledger")
    return { success: true, data: updated as any }
  } catch (error) {
    console.error("Error posting journal entry:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to post journal entry",
    }
  }
}

/**
 * Get Chart of Accounts
 * Retrieves all accounts with hierarchical structure
 */
export async function getChartOfAccounts(filters?: {
  type?: string
  isActive?: boolean
}) {
  try {
    const ctx = await requireFinanceActor("accounts", "view")
    if (isFinanceAuthError(ctx)) return ctx

    const accounts = await db.chartOfAccount.findMany({
      where: {
        schoolId: ctx.schoolId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [{ code: "asc" }],
    })

    return { success: true, data: accounts }
  } catch (error) {
    console.error("Error fetching chart of accounts:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Get Journal Entries
 * Retrieves journal entries with filtering
 */
export async function getJournalEntries(filters?: {
  isPosted?: boolean
  fiscalYearId?: string
}) {
  try {
    const ctx = await requireFinanceActor("accounts", "view")
    if (isFinanceAuthError(ctx)) return ctx

    const entries = await db.journalEntry.findMany({
      where: {
        schoolId: ctx.schoolId,
        ...(filters?.isPosted !== undefined && { isPosted: filters.isPosted }),
        ...(filters?.fiscalYearId && { fiscalYearId: filters.fiscalYearId }),
      },
      include: {
        ledgerEntries: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { entryDate: "desc" },
      take: 50,
    })

    return { success: true, data: entries }
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
