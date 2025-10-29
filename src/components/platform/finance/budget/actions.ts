/**
 * Budget Module - Server Actions
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { budgetSchema, budgetAllocationSchema } from './validation'
import type { BudgetActionResult } from './types'

export async function createBudget(formData: FormData): Promise<BudgetActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      name: formData.get('name'),
      fiscalYearId: formData.get('fiscalYearId'),
      totalAmount: Number(formData.get('totalAmount')),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status') || 'DRAFT',
      description: formData.get('description') || undefined,
    }

    const validated = budgetSchema.parse(data)

    const budget = await db.budget.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
        createdBy: session.user.id!,
      },
      include: {
        allocations: true,
      },
    })

    revalidatePath('/finance/budget')
    return { success: true, data: budget as any }
  } catch (error) {
    console.error('Error creating budget:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create budget' }
  }
}

export async function updateBudget(budgetId: string, formData: FormData): Promise<BudgetActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      name: formData.get('name'),
      fiscalYearId: formData.get('fiscalYearId'),
      totalAmount: Number(formData.get('totalAmount')),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      status: formData.get('status'),
      description: formData.get('description') || undefined,
    }

    const validated = budgetSchema.parse(data)

    const budget = await db.budget.update({
      where: {
        id: budgetId,
        schoolId: session.user.schoolId,
      },
      data: validated,
      include: {
        allocations: true,
      },
    })

    revalidatePath('/finance/budget')
    return { success: true, data: budget as any }
  } catch (error) {
    console.error('Error updating budget:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update budget' }
  }
}

export async function createBudgetAllocation(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      budgetId: formData.get('budgetId'),
      departmentId: formData.get('departmentId') || null,
      categoryId: formData.get('categoryId') || null,
      allocatedAmount: Number(formData.get('allocatedAmount')),
      description: formData.get('description') || undefined,
    }

    const validated = budgetAllocationSchema.parse(data)

    const allocation = await db.budgetAllocation.create({
      data: {
        budgetId: validated.budgetId,
        allocatedAmount: validated.allocatedAmount,
        ...(validated.departmentId && { departmentId: validated.departmentId }),
        ...(validated.categoryId && { categoryId: validated.categoryId }),
        ...(validated.description && { description: validated.description }),
        schoolId: session.user.schoolId,
        allocated: validated.allocatedAmount,
        spent: 0,
        remaining: validated.allocatedAmount,
      },
    })

    revalidatePath('/finance/budget')
    return { success: true, data: allocation }
  } catch (error) {
    console.error('Error creating allocation:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create allocation' }
  }
}

export async function getBudgets(filters?: { status?: string; fiscalYearId?: string }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const budgets = await db.budget.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.fiscalYearId && { fiscalYearId: filters.fiscalYearId }),
      },
      include: {
        allocations: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: budgets }
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return { success: false, error: 'Failed to fetch budgets' }
  }
}
