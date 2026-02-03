/**
 * Accounting Integration Actions
 *
 * Server actions for double-entry bookkeeping integration
 */

"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

import {
  createExpensePaymentEntry,
  createFeeAssignmentEntry,
  createFeePaymentEntry,
  createInvoicePaymentEntry,
  createSalaryPaymentEntry,
  createWalletTopupEntry,
} from "./posting-rules"
import {
  getOrCreateFiscalYear,
  initializeAccountingSystem,
} from "./seed-accounts"
import type { PostingResult } from "./types"
import {
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
} from "./utils"

/**
 * Initialize accounting system for school
 */
export async function initializeAccounting(schoolId: string): Promise<{
  success: boolean
  accountsCreated?: number
  fiscalYearId?: string
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await initializeAccountingSystem(schoolId)

    return {
      success: true,
      accountsCreated: result.accountsCreated,
      fiscalYearId: result.fiscalYearId,
    }
  } catch (error) {
    console.error("Error initializing accounting:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Post fee payment to accounting
 */
export async function postFeePayment(
  schoolId: string,
  paymentData: {
    paymentId: string
    studentId: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    feeType?: string
  }
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    const entryInput = await createFeePaymentEntry(schoolId, paymentData, db)
    return await createJournalEntry(schoolId, entryInput, session.user.id)
  } catch (error) {
    console.error("Error posting fee payment:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Post fee assignment to accounting
 */
export async function postFeeAssignment(
  schoolId: string,
  assignmentData: {
    assignmentId: string
    studentId: string
    amount: number
    feeType: string
    assignedDate: Date
  }
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    const entryInput = await createFeeAssignmentEntry(
      schoolId,
      assignmentData,
      db
    )
    return await createJournalEntry(schoolId, entryInput, session.user.id)
  } catch (error) {
    console.error("Error posting fee assignment:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Post salary payment to accounting
 */
export async function postSalaryPayment(
  schoolId: string,
  paymentData: {
    slipId: string
    teacherId: string
    grossSalary: number
    taxAmount: number
    socialSecurityAmount: number
    netSalary: number
    paymentDate: Date
  }
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    const entryInput = await createSalaryPaymentEntry(schoolId, paymentData, db)
    return await createJournalEntry(schoolId, entryInput, session.user.id)
  } catch (error) {
    console.error("Error posting salary payment:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Post expense payment to accounting
 */
export async function postExpensePayment(
  schoolId: string,
  expenseData: {
    expenseId: string
    categoryName: string
    amount: number
    paymentDate: Date
    description: string
  }
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    const entryInput = await createExpensePaymentEntry(
      schoolId,
      expenseData,
      db
    )
    return await createJournalEntry(schoolId, entryInput, session.user.id)
  } catch (error) {
    console.error("Error posting expense payment:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Post invoice payment to accounting
 */
export async function postInvoicePayment(
  schoolId: string,
  invoiceData: {
    invoiceId: string
    amount: number
    paymentDate: Date
    invoiceNumber: string
  }
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    const entryInput = await createInvoicePaymentEntry(
      schoolId,
      invoiceData,
      db
    )
    return await createJournalEntry(schoolId, entryInput, session.user.id)
  } catch (error) {
    console.error("Error posting invoice payment:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Post wallet top-up to accounting
 */
export async function postWalletTopup(
  schoolId: string,
  topupData: {
    transactionId: string
    amount: number
    topupDate: Date
  }
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    const entryInput = await createWalletTopupEntry(schoolId, topupData, db)
    return await createJournalEntry(schoolId, entryInput, session.user.id)
  } catch (error) {
    console.error("Error posting wallet top-up:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Post an unposted journal entry
 */
export async function postJournalEntryAction(
  journalEntryId: string
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    return await postJournalEntry(journalEntryId, session.user.id)
  } catch (error) {
    console.error("Error posting journal entry:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Reverse a journal entry
 */
export async function reverseJournalEntryAction(
  journalEntryId: string,
  reason: string
): Promise<PostingResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, errors: ["Unauthorized"] }
    }

    return await reverseJournalEntry(journalEntryId, session.user.id, reason)
  } catch (error) {
    console.error("Error reversing journal entry:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}

/**
 * Get chart of accounts for a school
 */
export async function getChartOfAccounts(schoolId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const accounts = await db.chartOfAccount.findMany({
      where: { schoolId },
      orderBy: { code: "asc" },
    })

    return { success: true, accounts }
  } catch (error) {
    console.error("Error fetching chart of accounts:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get journal entries for a school
 */
export async function getJournalEntries(
  schoolId: string,
  options?: {
    fiscalYearId?: string
    sourceModule?: string
    isPosted?: boolean
    limit?: number
  }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const entries = await db.journalEntry.findMany({
      where: {
        schoolId,
        ...(options?.fiscalYearId && { fiscalYearId: options.fiscalYearId }),
        ...(options?.sourceModule && { sourceModule: options.sourceModule }),
        ...(options?.isPosted !== undefined && { isPosted: options.isPosted }),
      },
      include: {
        ledgerEntries: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { entryDate: "desc" },
      take: options?.limit || 50,
    })

    return { success: true, entries }
  } catch (error) {
    console.error("Error fetching journal entries:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get account balances for a school
 */
export async function getAccountBalances(
  schoolId: string,
  fiscalYearId?: string
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Get or create current fiscal year if not provided
    let yearId = fiscalYearId
    if (!yearId) {
      yearId = await getOrCreateFiscalYear(schoolId)
    }

    const balances = await db.accountBalance.findMany({
      where: {
        schoolId,
      },
      include: {
        account: true,
      },
      orderBy: {
        account: {
          code: "asc",
        },
      },
    })

    return { success: true, balances }
  } catch (error) {
    console.error("Error fetching account balances:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
