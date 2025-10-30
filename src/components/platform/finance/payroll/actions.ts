"use server"

/**
 * Payroll Sub-Block Server Actions
 *
 * Multi-tenant safe server actions for payroll processing
 * Includes: payroll runs, salary slips, approval workflow, and disbursement
 */

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant-context"
import {
  payrollRunSchema,
  salarySlipSchema,
  payrollProcessingSchema,
  payrollApprovalSchema,
  payrollDisbursementSchema,
  type PayrollRunInput,
  type SalarySlipInput,
  type PayrollProcessingInput,
  type PayrollApprovalInput,
  type PayrollDisbursementInput,
} from "./validation"

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// PAYROLL RUN ACTIONS
// ============================================

/**
 * Get all payroll runs for the current school
 */
export async function getPayrollRuns(
  status?: string
): Promise<ActionResult<any[]>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const whereClause: any = { schoolId }
    if (status) {
      whereClause.status = status
    }

    const payrollRuns = await db.payrollRun.findMany({
      where: whereClause,
      include: {
        _count: { select: { salarySlips: true } },
      },
      orderBy: { payPeriodStart: "desc" },
    })

    return { success: true, data: payrollRuns }
  } catch (error) {
    console.error("Error fetching payroll runs:", error)
    return { success: false, error: "Failed to fetch payroll runs" }
  }
}

/**
 * Get a specific payroll run with all salary slips
 */
export async function getPayrollRun(
  runId: string
): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const payrollRun = await db.payrollRun.findFirst({
      where: { id: runId, schoolId },
      include: {
        salarySlips: {
          include: {
            teacher: {
              select: {
                id: true,
                givenName: true,
                surname: true,
                employeeId: true,
              },
            },
          },
        },
      },
    })

    if (!payrollRun) {
      return { success: false, error: "Payroll run not found" }
    }

    return { success: true, data: payrollRun }
  } catch (error) {
    console.error("Error fetching payroll run:", error)
    return { success: false, error: "Failed to fetch payroll run" }
  }
}

/**
 * Create a new payroll run
 */
export async function createPayrollRun(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    // Generate unique run number
    const runNumber = `PR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase()

    const payrollRun = await db.payrollRun.create({
      data: {
        schoolId,
        runNumber,
        payPeriodStart: new Date(formData.payPeriodStart as string),
        payPeriodEnd: new Date(formData.payPeriodEnd as string),
        payDate: new Date(formData.payDate as string),
        status: "DRAFT",
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        notes: formData.notes as string | undefined,
        processedBy: session.user.id,
      },
    })

    revalidatePath("/finance/payroll")
    return { success: true, data: payrollRun.id }
  } catch (error) {
    console.error("Error creating payroll run:", error)
    return { success: false, error: "Failed to create payroll run" }
  }
}

// ============================================
// SALARY SLIP GENERATION
// ============================================

/**
 * Generate salary slips for all teachers in a payroll run
 */
export async function generateSalarySlips(
  payrollRunId: string,
  teacherIds?: string[]
): Promise<ActionResult<number>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    // Get payroll run
    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
    })

    if (!payrollRun) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payrollRun.status !== "DRAFT" && payrollRun.status !== "PROCESSING") {
      return { success: false, error: "Payroll run is not in a valid state for generation" }
    }

    // Update status to PROCESSING
    await db.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: "PROCESSING" },
    })

    // Get teachers to process
    const teacherWhere: any = { schoolId, isActive: true }
    if (teacherIds && teacherIds.length > 0) {
      teacherWhere.id = { in: teacherIds }
    }

    const teachers = await db.teacher.findMany({
      where: teacherWhere,
      include: {
        salaryStructures: {
          where: {
            isActive: true,
            effectiveFrom: { lte: payrollRun.payPeriodEnd },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: payrollRun.payPeriodStart } },
            ],
          },
          include: {
            allowances: true,
            deductions: true,
          },
        },
      },
    })

    let slipsGenerated = 0
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    // Generate slip for each teacher
    for (const teacher of teachers) {
      const activeSalaryStructure = teacher.salaryStructures[0]
      if (!activeSalaryStructure) {
        console.warn(`No active salary structure for teacher ${teacher.id}`)
        continue
      }

      // Calculate working days
      const daysWorked = 22 // Default, should come from timesheet
      const daysPresent = 22 // Should come from attendance
      const daysAbsent = 0

      // Calculate allowances
      const allowances = activeSalaryStructure.allowances.map((a: any) => ({
        name: a.name,
        amount: Number(a.amount),
        isTaxable: a.isTaxable,
      }))
      const totalAllowances = allowances.reduce((sum: number, a: any) => sum + a.amount, 0)

      // Calculate deductions
      const deductions = activeSalaryStructure.deductions.map((d: any) => ({
        name: d.name,
        amount: Number(d.amount),
        type: d.type,
      }))
      const totalDeductionsAmount = deductions.reduce((sum: number, d: any) => sum + d.amount, 0)

      // Calculate gross, tax, and net
      const baseSalary = Number(activeSalaryStructure.baseSalary)
      const grossSalary = baseSalary + totalAllowances
      const taxAmount = grossSalary * 0.15 // Simplified 15% tax rate
      const netSalary = grossSalary - taxAmount - totalDeductionsAmount

      // Generate slip number
      const slipNumber = `SS-${payrollRun.runNumber}-${teacher.id.substring(0, 8)}`.toUpperCase()

      // Create salary slip
      await db.salarySlip.create({
        data: {
          schoolId,
          payrollRunId,
          structureId: activeSalaryStructure.id,
          teacherId: teacher.id,
          slipNumber,
          payPeriodStart: payrollRun.payPeriodStart,
          payPeriodEnd: payrollRun.payPeriodEnd,
          payDate: payrollRun.payDate,
          baseSalary,
          allowances,
          overtime: 0,
          bonus: 0,
          grossSalary,
          taxAmount,
          insurance: 0,
          loanDeduction: 0,
          otherDeductions: deductions,
          totalDeductions: taxAmount + totalDeductionsAmount,
          netSalary,
          daysWorked,
          daysPresent,
          daysAbsent,
          hoursWorked: daysWorked * 8, // 8 hours per day
          overtimeHours: 0,
          status: "GENERATED",
        },
      })

      slipsGenerated++
      totalGross += grossSalary
      totalDeductions += taxAmount + totalDeductionsAmount
      totalNet += netSalary
    }

    // Update payroll run totals
    await db.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        totalGross,
        totalDeductions,
        totalNet,
        status: "PENDING_APPROVAL",
        processedAt: new Date(),
      },
    })

    revalidatePath("/finance/payroll")
    return { success: true, data: slipsGenerated }
  } catch (error) {
    console.error("Error generating salary slips:", error)

    // Rollback status on error
    try {
      await db.payrollRun.update({
        where: { id: payrollRunId },
        data: { status: "DRAFT" },
      })
    } catch (rollbackError) {
      console.error("Error rolling back payroll status:", rollbackError)
    }

    return { success: false, error: "Failed to generate salary slips" }
  }
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

/**
 * Approve a payroll run
 */
export async function approvePayroll(
  payrollRunId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify payroll run exists and is in correct status
    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
    })

    if (!payrollRun) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payrollRun.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Payroll run is not pending approval" }
    }

    // Update payroll run status
    await db.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        notes: notes || payrollRun.notes,
      },
    })

    revalidatePath("/finance/payroll")
    return { success: true }
  } catch (error) {
    console.error("Error approving payroll:", error)
    return { success: false, error: "Failed to approve payroll" }
  }
}

/**
 * Reject a payroll run
 */
export async function rejectPayroll(
  payrollRunId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
    })

    if (!payrollRun) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payrollRun.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Payroll run is not pending approval" }
    }

    // Update status back to DRAFT for corrections
    await db.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: "DRAFT",
        notes: `REJECTED: ${reason}\n\n${payrollRun.notes || ""}`,
      },
    })

    revalidatePath("/finance/payroll")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting payroll:", error)
    return { success: false, error: "Failed to reject payroll" }
  }
}

// ============================================
// PAYMENT PROCESSING
// ============================================

/**
 * Process payments for an approved payroll run
 */
export async function processPayments(
  payrollRunId: string
): Promise<ActionResult<number>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify payroll run is approved
    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
      include: {
        salarySlips: {
          where: { status: "GENERATED" },
        },
      },
    })

    if (!payrollRun) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payrollRun.status !== "APPROVED") {
      return { success: false, error: "Payroll run must be approved before processing payments" }
    }

    // Update all salary slips to PAID status
    const updateResult = await db.salarySlip.updateMany({
      where: {
        payrollRunId,
        status: "GENERATED",
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    })

    // Update payroll run status
    await db.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: "PAID" },
    })

    revalidatePath("/finance/payroll")
    return { success: true, data: updateResult.count }
  } catch (error) {
    console.error("Error processing payments:", error)
    return { success: false, error: "Failed to process payments" }
  }
}

// ============================================
// INDIVIDUAL SLIP ACTIONS
// ============================================

/**
 * Get salary slips for a specific teacher
 */
export async function getTeacherSalarySlips(
  teacherId: string,
  limit?: number
): Promise<ActionResult<any[]>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const salarySlips = await db.salarySlip.findMany({
      where: { schoolId, teacherId },
      include: {
        payrollRun: {
          select: {
            runNumber: true,
            payPeriodStart: true,
            payPeriodEnd: true,
            status: true,
          },
        },
      },
      orderBy: { payDate: "desc" },
      take: limit || 12, // Default to last 12 months
    })

    return { success: true, data: salarySlips }
  } catch (error) {
    console.error("Error fetching teacher salary slips:", error)
    return { success: false, error: "Failed to fetch salary slips" }
  }
}

/**
 * Get a specific salary slip with full details
 */
export async function getSalarySlip(
  slipId: string
): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const salarySlip = await db.salarySlip.findFirst({
      where: { id: slipId, schoolId },
      include: {
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            employeeId: true,
            emailAddress: true,
          },
        },
        payrollRun: true,
        structure: {
          include: {
            allowances: true,
            deductions: true,
          },
        },
      },
    })

    if (!salarySlip) {
      return { success: false, error: "Salary slip not found" }
    }

    return { success: true, data: salarySlip }
  } catch (error) {
    console.error("Error fetching salary slip:", error)
    return { success: false, error: "Failed to fetch salary slip" }
  }
}

// ============================================
// REPORTING ACTIONS
// ============================================

/**
 * Get payroll summary statistics
 */
export async function getPayrollSummary(): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const [totalRuns, pendingApproval, approvedRuns, paidRuns, totalPayments] = await Promise.all([
      db.payrollRun.count({ where: { schoolId } }),
      db.payrollRun.count({ where: { schoolId, status: "PENDING_APPROVAL" } }),
      db.payrollRun.count({ where: { schoolId, status: "APPROVED" } }),
      db.payrollRun.count({ where: { schoolId, status: "PAID" } }),
      db.payrollRun.aggregate({
        where: { schoolId, status: "PAID" },
        _sum: { totalNet: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalRuns,
        pendingApproval,
        approvedRuns,
        paidRuns,
        totalPayments: totalPayments._sum.totalNet || 0,
      },
    }
  } catch (error) {
    console.error("Error fetching payroll summary:", error)
    return { success: false, error: "Failed to fetch summary" }
  }
}

/**
 * Delete a payroll run (only if in DRAFT status)
 */
export async function deletePayrollRun(
  runId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const payrollRun = await db.payrollRun.findFirst({
      where: { id: runId, schoolId },
    })

    if (!payrollRun) {
      return { success: false, error: "Payroll run not found" }
    }

    if (payrollRun.status !== "DRAFT") {
      return { success: false, error: "Only draft payroll runs can be deleted" }
    }

    await db.payrollRun.delete({
      where: { id: runId },
    })

    revalidatePath("/finance/payroll")
    return { success: true }
  } catch (error) {
    console.error("Error deleting payroll run:", error)
    return { success: false, error: "Failed to delete payroll run" }
  }
}
