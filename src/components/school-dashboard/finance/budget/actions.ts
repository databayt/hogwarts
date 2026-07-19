// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Budget Module - Server Actions
 */

"use server"

import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../guard"
import type { BudgetActionResult } from "./types"
import { budgetAllocationSchema, budgetSchema } from "./validation"

export async function createBudget(
  formData: FormData
): Promise<BudgetActionResult> {
  try {
    const ctx = await requireFinanceActor("budget", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const data = {
      name: formData.get("name"),
      fiscalYearId: formData.get("fiscalYearId"),
      totalAmount: Number(formData.get("totalAmount")),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status") || "DRAFT",
      description: formData.get("description") || undefined,
    }

    const validated = budgetSchema.parse(data)

    const budget = await db.budget.create({
      data: {
        ...validated,
        schoolId: schoolId,
        createdBy: userId,
      },
      include: {
        allocations: true,
      },
    })

    revalidatePath("/finance/budget")
    return { success: true, data: budget as any }
  } catch (error) {
    console.error("Error creating budget:", error)
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

export async function updateBudget(
  budgetId: string,
  formData: FormData
): Promise<BudgetActionResult> {
  try {
    const ctx = await requireFinanceActor("budget", "edit")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const data = {
      name: formData.get("name"),
      fiscalYearId: formData.get("fiscalYearId"),
      totalAmount: Number(formData.get("totalAmount")),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status"),
      description: formData.get("description") || undefined,
    }

    const validated = budgetSchema.parse(data)

    const budget = await db.budget.update({
      where: {
        id: budgetId,
        schoolId: schoolId,
      },
      data: validated,
      include: {
        allocations: true,
      },
    })

    revalidatePath("/finance/budget")
    return { success: true, data: budget as any }
  } catch (error) {
    console.error("Error updating budget:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update budget",
    }
  }
}

export async function createBudgetAllocation(formData: FormData) {
  try {
    const ctx = await requireFinanceActor("budget", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const data = {
      budgetId: formData.get("budgetId"),
      categoryId: formData.get("categoryId"),
      allocatedAmount: Number(formData.get("allocatedAmount")),
      description: formData.get("description") || undefined,
    }

    const validated = budgetAllocationSchema.parse(data)

    const allocation = await db.budgetAllocation.create({
      data: {
        budgetId: validated.budgetId,
        categoryId: validated.categoryId,
        schoolId: schoolId,
        allocated: validated.allocatedAmount,
        spent: 0,
        remaining: validated.allocatedAmount,
        ...(validated.description && { notes: validated.description }),
      },
    })

    revalidatePath("/finance/budget")
    return { success: true, data: allocation }
  } catch (error) {
    console.error("Error creating allocation:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create allocation",
    }
  }
}

export async function getBudgets(filters?: {
  status?: string
  fiscalYearId?: string
}) {
  try {
    const ctx = await requireFinanceActor("budget", "view")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const budgets = await db.budget.findMany({
      where: {
        schoolId: schoolId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.fiscalYearId && { fiscalYearId: filters.fiscalYearId }),
      },
      include: {
        allocations: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: budgets }
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
