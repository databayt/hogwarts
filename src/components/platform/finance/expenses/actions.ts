/**
 * Expenses Module - Server Actions
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { expenseSchema, expenseCategorySchema, expenseApprovalSchema } from './validation'
import type { ExpenseActionResult } from './types'

export async function createExpense(formData: FormData): Promise<ExpenseActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      amount: Number(formData.get('amount')),
      description: formData.get('description'),
      expenseDate: formData.get('expenseDate'),
      categoryId: formData.get('categoryId'),
      receiptUrl: formData.get('receiptUrl') || null,
      notes: formData.get('notes') || undefined,
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
        status: 'PENDING',
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    revalidatePath('/finance/expenses')
    return { success: true, data: expense as any }
  } catch (error) {
    console.error('Error creating expense:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create expense' }
  }
}

export async function updateExpense(expenseId: string, formData: FormData): Promise<ExpenseActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      amount: Number(formData.get('amount')),
      description: formData.get('description'),
      expenseDate: formData.get('expenseDate'),
      categoryId: formData.get('categoryId'),
      receiptUrl: formData.get('receiptUrl') || null,
      notes: formData.get('notes') || undefined,
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

    revalidatePath('/finance/expenses')
    return { success: true, data: expense as any }
  } catch (error) {
    console.error('Error updating expense:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update expense' }
  }
}

export async function approveExpense(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      expenseId: formData.get('expenseId'),
      status: formData.get('status'),
      notes: formData.get('notes') || undefined,
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

    revalidatePath('/finance/expenses')
    return { success: true, data: expense }
  } catch (error) {
    console.error('Error approving expense:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to approve expense' }
  }
}

export async function createExpenseCategory(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      isActive: formData.get('isActive') === 'true',
    }

    const validated = expenseCategorySchema.parse(data)

    const category = await db.expenseCategory.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
      },
    })

    revalidatePath('/finance/expenses')
    return { success: true, data: category }
  } catch (error) {
    console.error('Error creating category:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create category' }
  }
}

export async function getExpenses(filters?: { status?: string; categoryId?: string }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
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
        submittedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expenseDate: 'desc' },
      take: 100,
    })

    return { success: true, data: expenses }
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return { success: false, error: 'Failed to fetch expenses' }
  }
}
