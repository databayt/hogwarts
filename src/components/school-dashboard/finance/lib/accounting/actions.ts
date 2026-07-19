// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Accounting Integration - internal posting layer
 *
 * Deliberately NOT a "use server" file. These functions accept a
 * caller-supplied schoolId so that session-less system contexts (Stripe/Tap
 * webhooks, crons) can post, which means they perform no tenant check of
 * their own — every caller must pass a schoolId it has already verified
 * (requireFinanceActor / webhook signature + row lookup). Marking this file
 * "use server" would turn each export into a public POST endpoint and make
 * that trust model a cross-tenant ledger-write vector.
 */

import "server-only"

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
import type { PostingResult } from "./types"
import { createJournalEntry } from "./utils"

/**
 * Resolve the acting user for audit attribution. System contexts (webhooks,
 * crons) pass an explicit sentinel like "system:stripe-webhook";
 * session-driven callers omit it and the session user is recorded.
 * JournalEntry.createdBy is a free-form String, not an FK.
 */
async function resolveActor(actorUserId?: string): Promise<string | null> {
  if (actorUserId) return actorUserId
  const session = await auth()
  return session?.user?.id ?? null
}

/**
 * Post fee payment to accounting.
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
  },
  actorUserId?: string
): Promise<PostingResult> {
  try {
    const userId = await resolveActor(actorUserId)
    if (!userId) return { success: false, errors: ["Unauthorized"] }

    const entryInput = await createFeePaymentEntry(schoolId, paymentData, db)
    return await createJournalEntry(schoolId, entryInput, userId)
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
  },
  actorUserId?: string
): Promise<PostingResult> {
  try {
    const userId = await resolveActor(actorUserId)
    if (!userId) return { success: false, errors: ["Unauthorized"] }

    const entryInput = await createFeeAssignmentEntry(
      schoolId,
      assignmentData,
      db
    )
    return await createJournalEntry(schoolId, entryInput, userId)
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
  },
  actorUserId?: string
): Promise<PostingResult> {
  try {
    const userId = await resolveActor(actorUserId)
    if (!userId) return { success: false, errors: ["Unauthorized"] }

    const entryInput = await createSalaryPaymentEntry(schoolId, paymentData, db)
    return await createJournalEntry(schoolId, entryInput, userId)
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
  },
  actorUserId?: string
): Promise<PostingResult> {
  try {
    const userId = await resolveActor(actorUserId)
    if (!userId) return { success: false, errors: ["Unauthorized"] }

    const entryInput = await createExpensePaymentEntry(
      schoolId,
      expenseData,
      db
    )
    return await createJournalEntry(schoolId, entryInput, userId)
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
  },
  actorUserId?: string
): Promise<PostingResult> {
  try {
    const userId = await resolveActor(actorUserId)
    if (!userId) return { success: false, errors: ["Unauthorized"] }

    const entryInput = await createInvoicePaymentEntry(
      schoolId,
      invoiceData,
      db
    )
    return await createJournalEntry(schoolId, entryInput, userId)
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
  },
  actorUserId?: string
): Promise<PostingResult> {
  try {
    const userId = await resolveActor(actorUserId)
    if (!userId) return { success: false, errors: ["Unauthorized"] }

    const entryInput = await createWalletTopupEntry(schoolId, topupData, db)
    return await createJournalEntry(schoolId, entryInput, userId)
  } catch (error) {
    console.error("Error posting wallet top-up:", error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    }
  }
}
