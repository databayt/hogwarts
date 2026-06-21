// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Expenses Module - Server Actions
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { checkCurrentUserPermission } from "../lib/permissions"
import type { ExpenseActionResult } from "./types"
import {
  expenseApprovalSchema,
  expenseCategorySchema,
  expenseSchema,
} from "./validation"

export async function createExpense(
  formData: FormData
): Promise<ExpenseActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const data = {
      amount: Number(formData.get("amount")),
      description: formData.get("description"),
      expenseDate: formData.get("expenseDate"),
      categoryId: formData.get("categoryId"),
      receiptUrl: formData.get("receiptUrl") || null,
      notes: formData.get("notes") || undefined,
    }

    const validated = expenseSchema.parse(data)

    // Generate unique expense number
    const expenseNumber = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    const expense = await db.expense.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
        expenseNumber,
        submittedBy: session.user.id!,
        submittedAt: new Date(),
        status: "PENDING",
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    revalidatePath("/finance/expenses")
    return { success: true, data: expense as any }
  } catch (error) {
    console.error("Error creating expense:", error)
    return actionError(ACTION_ERRORS.EXPENSE_CREATE_FAILED)
  }
}

export async function updateExpense(
  expenseId: string,
  formData: FormData
): Promise<ExpenseActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const data = {
      amount: Number(formData.get("amount")),
      description: formData.get("description"),
      expenseDate: formData.get("expenseDate"),
      categoryId: formData.get("categoryId"),
      receiptUrl: formData.get("receiptUrl") || null,
      notes: formData.get("notes") || undefined,
    }

    const validated = expenseSchema.parse(data)

    const expense = await db.expense.update({
      where: {
        id: expenseId,
        schoolId: session.user.schoolId,
      },
      data: validated,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    revalidatePath("/finance/expenses")
    return { success: true, data: expense as any }
  } catch (error) {
    console.error("Error updating expense:", error)
    return actionError(ACTION_ERRORS.EXPENSE_CREATE_FAILED)
  }
}

export async function approveExpense(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const data = {
      expenseId: formData.get("expenseId"),
      status: formData.get("status"),
      notes: formData.get("notes") || undefined,
    }

    const validated = expenseApprovalSchema.parse(data)

    const expense = await db.expense.update({
      where: {
        id: validated.expenseId,
        schoolId: session.user.schoolId,
      },
      data: {
        status: validated.status,
        approvedBy: session.user.id!,
        approvedAt: new Date(),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    revalidatePath("/finance/expenses")
    return { success: true, data: expense }
  } catch (error) {
    console.error("Error approving expense:", error)
    return actionError(ACTION_ERRORS.EXPENSE_CREATE_FAILED)
  }
}

/**
 * Mark an APPROVED expense as PAID and post it to the double-entry ledger.
 *
 * Approval precedes payment (mirrors payroll). The status guard also prevents
 * double-payment — a PAID expense is rejected. Posting `postExpensePayment`
 * (DR expense / CR cash) is fire-and-forget, mirroring fees `recordPayment`; it
 * is idempotent by `sourceRecordId=expenseId`, so a retried call posts once.
 */
export async function markExpensePaid(
  expenseId: string
): Promise<ExpenseActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    // Paying an expense posts to the ledger — gate it behind the same finance
    // permission that guards approval (server actions are callable directly, so
    // the UI gating in content.tsx is not sufficient).
    const canApprove = await checkCurrentUserPermission(
      session.user.schoolId,
      "expenses",
      "approve"
    )
    if (!canApprove) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const paidAt = new Date()
    // Atomic conditional transition: the status guard lives in the WHERE clause,
    // so only an APPROVED expense flips to PAID. A concurrent second call (or a
    // non-approved / wrong-tenant expense) matches no row → Prisma throws P2025,
    // caught below. This closes the check-then-write double-payment race.
    let expense
    try {
      expense = await db.expense.update({
        where: {
          id: expenseId,
          schoolId: session.user.schoolId,
          status: "APPROVED",
        },
        data: { status: "PAID", paidAt },
        include: { category: { select: { id: true, name: true } } },
      })
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "P2025") {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
      throw e
    }

    // Post to the double-entry ledger (DR expense / CR cash). Non-fatal.
    try {
      const { postExpensePayment } = await import("../lib/accounting/actions")
      const postResult = await postExpensePayment(session.user.schoolId, {
        expenseId: expense.id,
        categoryName: expense.category?.name ?? "Expense",
        amount: Number(expense.amount),
        paymentDate: paidAt,
        description: expense.description ?? "",
      })
      if (!postResult.success) {
        console.error(
          "[markExpensePaid] postExpensePayment failed:",
          postResult.errors
        )
      }
    } catch (postingErr) {
      console.error(
        "[markExpensePaid] Ledger posting threw (continuing):",
        postingErr
      )
    }

    revalidatePath("/finance/expenses")
    return { success: true }
  } catch (error) {
    console.error("Error marking expense paid:", error)
    return actionError(ACTION_ERRORS.EXPENSE_CREATE_FAILED)
  }
}

export async function createExpenseCategory(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const data = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      isActive: formData.get("isActive") === "true",
    }

    const validated = expenseCategorySchema.parse(data)

    const category = await db.expenseCategory.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
      },
    })

    revalidatePath("/finance/expenses")
    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating category:", error)
    return actionError(ACTION_ERRORS.EXPENSE_CREATE_FAILED)
  }
}

export async function getExpenses(filters?: {
  status?: string
  categoryId?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const expenses = await db.expense.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expenseDate: "desc" },
      take: 100,
    })

    return { success: true, data: expenses }
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
  }
}
