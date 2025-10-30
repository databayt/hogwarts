"use server"

/**
 * Salary Sub-Block Server Actions
 *
 * Multi-tenant safe server actions for salary structure management
 * Includes: salary structures, allowances, deductions, and salary calculations
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"
import {
  salaryStructureSchema,
  salaryAllowanceSchema,
  salaryDeductionSchema,
  salaryCalculatorSchema,
  salaryIncrementSchema,
  type SalaryStructureInput,
  type SalaryAllowanceInput,
  type SalaryDeductionInput,
  type SalaryCalculatorInput,
  type SalaryIncrementInput,
} from "./validation"

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// SALARY STRUCTURE ACTIONS
// ============================================

/**
 * Get all salary structures for the school
 */
export async function getSalaryStructures(
  teacherId?: string
): Promise<ActionResult<any[]>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const whereClause: any = { schoolId }
    if (teacherId) {
      whereClause.teacherId = teacherId
    }

    const salaryStructures = await db.salaryStructure.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            employeeId: true,
          },
        },
        allowances: true,
        deductions: true,
        _count: {
          select: {
            allowances: true,
            deductions: true,
            salarySlips: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: salaryStructures }
  } catch (error) {
    console.error("Error fetching salary structures:", error)
    return { success: false, error: "Failed to fetch salary structures" }
  }
}

/**
 * Get a specific salary structure with all details
 */
export async function getSalaryStructure(
  structureId: string
): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const salaryStructure = await db.salaryStructure.findFirst({
      where: { id: structureId, schoolId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            email: true,
            phoneNumber: true,
          },
        },
        allowances: {
          orderBy: { createdAt: "desc" },
        },
        deductions: {
          orderBy: { createdAt: "desc" },
        },
        salarySlips: {
          select: {
            id: true,
            slipNumber: true,
            payPeriodStart: true,
            payPeriodEnd: true,
            grossSalary: true,
            netSalary: true,
            status: true,
          },
          orderBy: { payDate: "desc" },
          take: 6, // Last 6 months
        },
      },
    })

    if (!salaryStructure) {
      return { success: false, error: "Salary structure not found" }
    }

    return { success: true, data: salaryStructure }
  } catch (error) {
    console.error("Error fetching salary structure:", error)
    return { success: false, error: "Failed to fetch salary structure" }
  }
}

/**
 * Create a new salary structure
 */
export async function createSalaryStructure(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    // Deactivate existing salary structures for this teacher
    await db.salaryStructure.updateMany({
      where: {
        schoolId,
        teacherId: formData.teacherId as string,
        isActive: true,
      },
      data: {
        isActive: false,
        effectiveTo: new Date(formData.effectiveFrom as string),
      },
    })

    // Create new salary structure
    const salaryStructure = await db.salaryStructure.create({
      data: {
        schoolId,
        teacherId: formData.teacherId as string,
        baseSalary: parseFloat(formData.baseSalary as string),
        currency: (formData.currency as string) || "USD",
        payFrequency: (formData.payFrequency as any) || "MONTHLY",
        effectiveFrom: new Date(formData.effectiveFrom as string),
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo as string) : null,
        isActive: true,
        notes: formData.notes as string | undefined,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true, data: salaryStructure.id }
  } catch (error) {
    console.error("Error creating salary structure:", error)
    return { success: false, error: "Failed to create salary structure" }
  }
}

/**
 * Update a salary structure
 */
export async function updateSalaryStructure(
  structureId: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    const salaryStructure = await db.salaryStructure.findFirst({
      where: { id: structureId, schoolId },
    })

    if (!salaryStructure) {
      return { success: false, error: "Salary structure not found" }
    }

    await db.salaryStructure.update({
      where: { id: structureId },
      data: {
        baseSalary: formData.baseSalary ? parseFloat(formData.baseSalary as string) : undefined,
        currency: formData.currency as string | undefined,
        payFrequency: formData.payFrequency as any | undefined,
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo as string) : undefined,
        isActive: formData.isActive !== undefined ? (formData.isActive === "true") : undefined,
        notes: formData.notes as string | undefined,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error updating salary structure:", error)
    return { success: false, error: "Failed to update salary structure" }
  }
}

/**
 * Deactivate a salary structure
 */
export async function deactivateSalaryStructure(
  structureId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.salaryStructure.update({
      where: { id: structureId, schoolId },
      data: {
        isActive: false,
        effectiveTo: new Date(),
      },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error deactivating salary structure:", error)
    return { success: false, error: "Failed to deactivate salary structure" }
  }
}

// ============================================
// ALLOWANCE ACTIONS
// ============================================

/**
 * Add an allowance to a salary structure
 */
export async function addAllowance(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    const allowance = await db.salaryAllowance.create({
      data: {
        schoolId,
        structureId: formData.structureId as string,
        name: formData.name as string,
        amount: parseFloat(formData.amount as string),
        isTaxable: formData.isTaxable === "true",
        isRecurring: formData.isRecurring !== "false",
        description: formData.description as string | undefined,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true, data: allowance.id }
  } catch (error) {
    console.error("Error adding allowance:", error)
    return { success: false, error: "Failed to add allowance" }
  }
}

/**
 * Update an allowance
 */
export async function updateAllowance(
  allowanceId: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    await db.salaryAllowance.update({
      where: { id: allowanceId, schoolId },
      data: {
        name: formData.name as string | undefined,
        amount: formData.amount ? parseFloat(formData.amount as string) : undefined,
        isTaxable: formData.isTaxable !== undefined ? (formData.isTaxable === "true") : undefined,
        isRecurring: formData.isRecurring !== undefined ? (formData.isRecurring === "true") : undefined,
        description: formData.description as string | undefined,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error updating allowance:", error)
    return { success: false, error: "Failed to update allowance" }
  }
}

/**
 * Delete an allowance
 */
export async function deleteAllowance(
  allowanceId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.salaryAllowance.delete({
      where: { id: allowanceId, schoolId },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error deleting allowance:", error)
    return { success: false, error: "Failed to delete allowance" }
  }
}

// ============================================
// DEDUCTION ACTIONS
// ============================================

/**
 * Add a deduction to a salary structure
 */
export async function addDeduction(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    const deduction = await db.salaryDeduction.create({
      data: {
        schoolId,
        structureId: formData.structureId as string,
        name: formData.name as string,
        amount: parseFloat(formData.amount as string),
        type: (formData.type as any) || "OTHER",
        isRecurring: formData.isRecurring !== "false",
        description: formData.description as string | undefined,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true, data: deduction.id }
  } catch (error) {
    console.error("Error adding deduction:", error)
    return { success: false, error: "Failed to add deduction" }
  }
}

/**
 * Update a deduction
 */
export async function updateDeduction(
  deductionId: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    await db.salaryDeduction.update({
      where: { id: deductionId, schoolId },
      data: {
        name: formData.name as string | undefined,
        amount: formData.amount ? parseFloat(formData.amount as string) : undefined,
        type: formData.type as any | undefined,
        isRecurring: formData.isRecurring !== undefined ? (formData.isRecurring === "true") : undefined,
        description: formData.description as string | undefined,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error updating deduction:", error)
    return { success: false, error: "Failed to update deduction" }
  }
}

/**
 * Delete a deduction
 */
export async function deleteDeduction(
  deductionId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.salaryDeduction.delete({
      where: { id: deductionId, schoolId },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error deleting deduction:", error)
    return { success: false, error: "Failed to delete deduction" }
  }
}

// ============================================
// SALARY CALCULATION ACTIONS
// ============================================

/**
 * Calculate salary breakdown for a given structure
 */
export async function calculateSalary(
  structureId: string,
  period: { start: Date; end: Date }
): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const salaryStructure = await db.salaryStructure.findFirst({
      where: { id: structureId, schoolId },
      include: {
        allowances: true,
        deductions: true,
      },
    })

    if (!salaryStructure) {
      return { success: false, error: "Salary structure not found" }
    }

    // Calculate total allowances
    const totalAllowances = salaryStructure.allowances.reduce(
      (sum, a) => sum + Number(a.amount),
      0
    )

    // Calculate gross salary
    const baseSalary = Number(salaryStructure.baseSalary)
    const grossSalary = baseSalary + totalAllowances

    // Calculate taxable income
    const taxableAllowances = salaryStructure.allowances
      .filter((a) => a.isTaxable)
      .reduce((sum, a) => sum + Number(a.amount), 0)
    const taxableIncome = baseSalary + taxableAllowances

    // Calculate tax (15% simplified rate)
    const taxAmount = taxableIncome * 0.15

    // Calculate total deductions
    const totalDeductions = salaryStructure.deductions.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )

    // Calculate net salary
    const netSalary = grossSalary - taxAmount - totalDeductions

    return {
      success: true,
      data: {
        baseSalary,
        allowances: salaryStructure.allowances.map((a) => ({
          name: a.name,
          amount: Number(a.amount),
          isTaxable: a.isTaxable,
        })),
        totalAllowances,
        grossSalary,
        taxableIncome,
        taxAmount,
        deductions: salaryStructure.deductions.map((d) => ({
          name: d.name,
          amount: Number(d.amount),
          type: d.type,
        })),
        totalDeductions,
        netSalary,
      },
    }
  } catch (error) {
    console.error("Error calculating salary:", error)
    return { success: false, error: "Failed to calculate salary" }
  }
}

/**
 * Apply salary increment to a structure
 */
export async function applySalaryIncrement(
  structureId: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)
    const incrementType = formData.incrementType as "FIXED_AMOUNT" | "PERCENTAGE"
    const effectiveFrom = new Date(formData.effectiveFrom as string)

    const currentStructure = await db.salaryStructure.findFirst({
      where: { id: structureId, schoolId },
    })

    if (!currentStructure) {
      return { success: false, error: "Salary structure not found" }
    }

    // Calculate new basic salary
    let newBaseSalary: number
    const currentBaseSalary = Number(currentStructure.baseSalary)

    if (incrementType === "FIXED_AMOUNT") {
      const amount = parseFloat(formData.amount as string)
      newBaseSalary = currentBaseSalary + amount
    } else {
      const percentage = parseFloat(formData.percentage as string)
      newBaseSalary = currentBaseSalary * (1 + percentage / 100)
    }

    // Deactivate current structure
    await db.salaryStructure.update({
      where: { id: structureId },
      data: {
        isActive: false,
        effectiveTo: effectiveFrom,
      },
    })

    // Create new structure with incremented salary
    await db.salaryStructure.create({
      data: {
        schoolId,
        teacherId: currentStructure.teacherId,
        baseSalary: newBaseSalary,
        currency: currentStructure.currency,
        payFrequency: currentStructure.payFrequency,
        effectiveFrom,
        isActive: true,
        notes: `Increment applied: ${formData.reason}\n${currentStructure.notes || ""}`,
      },
    })

    revalidatePath("/finance/salary")
    return { success: true }
  } catch (error) {
    console.error("Error applying salary increment:", error)
    return { success: false, error: "Failed to apply salary increment" }
  }
}

// ============================================
// REPORTING ACTIONS
// ============================================

/**
 * Get salary summary statistics
 */
export async function getSalarySummary(): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const [totalStructures, activeStructures, totalAllowances, totalDeductions, avgSalary] = await Promise.all([
      db.salaryStructure.count({ where: { schoolId } }),
      db.salaryStructure.count({ where: { schoolId, isActive: true } }),
      db.salaryAllowance.count({ where: { schoolId } }),
      db.salaryDeduction.count({ where: { schoolId } }),
      db.salaryStructure.aggregate({
        where: { schoolId, isActive: true },
        _avg: { baseSalary: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalStructures,
        activeStructures,
        totalAllowances,
        totalDeductions,
        averageSalary: avgSalary._avg.baseSalary || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching salary summary:", error)
    return { success: false, error: "Failed to fetch summary" }
  }
}
