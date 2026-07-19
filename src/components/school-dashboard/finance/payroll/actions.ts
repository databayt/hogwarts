"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payroll Sub-Block Server Actions
 *
 * Multi-tenant safe server actions for payroll processing
 * Includes: payroll runs, salary slips, approval workflow, and disbursement
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { checkFinancePermission } from "../lib/permissions"
import { calculateProgressiveTax, calculateSocialSecurity } from "./config"
import { resolveSchoolPayrollPolicy } from "./country-rules/school-policy"
import { loadTimesheetSummaries } from "./timesheet-summary"
import {
  payrollApprovalSchema,
  payrollDisbursementSchema,
  payrollProcessingSchema,
  payrollRunSchema,
  salarySlipSchema,
  type PayrollApprovalInput,
  type PayrollDisbursementInput,
  type PayrollProcessingInput,
  type PayrollRunInput,
  type SalarySlipInput,
} from "./validation"

function interp(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
    template
  )
}

// Error code constants for domain-specific payroll errors
const PAYROLL_ERRORS = {
  NOT_PENDING: "PAYROLL_NOT_PENDING_APPROVAL",
  NOT_APPROVED: "PAYROLL_NOT_APPROVED",
  INVALID_STATE: "PAYROLL_INVALID_STATE",
  DRAFT_ONLY: "PAYROLL_DRAFT_ONLY_DELETE",
} as const

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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
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
    return actionError(ACTION_ERRORS.UNKNOWN)
  }
}

/**
 * Get a specific payroll run with all salary slips
 */
export async function getPayrollRun(runId: string): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const payrollRun = await db.payrollRun.findFirst({
      where: { id: runId, schoolId },
      include: {
        salarySlips: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
      },
    })

    if (!payrollRun) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    return { success: true, data: payrollRun }
  } catch (error) {
    console.error("Error fetching payroll run:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    if (
      !(await checkFinancePermission(
        session.user.id,
        schoolId,
        "payroll",
        "create"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const formData = Object.fromEntries(data)

    // Generate unique run number
    const runNumber =
      `PR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase()

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
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    if (
      !(await checkFinancePermission(
        session.user.id,
        schoolId,
        "payroll",
        "process"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Get payroll run
    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
    })

    if (!payrollRun) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (payrollRun.status !== "DRAFT" && payrollRun.status !== "PROCESSING") {
      return { success: false, error: PAYROLL_ERRORS.INVALID_STATE }
    }

    // Resolve the school's payroll policy ONCE — every slip in this run is taxed
    // by the school's OWN country's brackets (auto-provisioned from its location),
    // not a global Sudan default. isFailSafeDefault ⇒ no country rules configured.
    const schoolForPolicy = await db.school.findUnique({
      where: { id: schoolId },
      select: { country: true, timezone: true, currency: true },
    })
    const payrollPolicy = await resolveSchoolPayrollPolicy(
      schoolId,
      schoolForPolicy ?? {}
    )

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

    // Pull real attendance from APPROVED timesheet entries for the whole run in
    // ONE query (keyed by teacherId), so the loop below doesn't N+1. Teachers
    // with no approved entries fall back to the salaried default further down.
    const timesheetByTeacher = await loadTimesheetSummaries({
      schoolId,
      teacherIds: teachers.map((t) => t.id),
      periodStart: payrollRun.payPeriodStart,
      periodEnd: payrollRun.payPeriodEnd,
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

      // Working days come from APPROVED timesheet entries for this pay period.
      // A salaried employee with no timesheet on file is assumed to have worked
      // the standard month (full attendance) — the same behaviour as before, so
      // schools not using timesheets are unaffected. These counts are shown on
      // the slip but do not alter pay (base salary is paid in full).
      const DEFAULT_WORKING_DAYS = 22
      const timesheet = timesheetByTeacher.get(teacher.id)
      const daysWorked = timesheet?.daysWorked ?? DEFAULT_WORKING_DAYS
      const daysPresent = timesheet?.daysPresent ?? DEFAULT_WORKING_DAYS
      const daysAbsent = timesheet?.daysAbsent ?? 0
      const hoursWorked = timesheet?.hoursWorked ?? daysWorked * 8
      const overtimeHours = timesheet?.overtimeHours ?? 0

      // Calculate allowances
      const allowances = activeSalaryStructure.allowances.map((a: any) => ({
        name: a.name,
        amount: Number(a.amount),
        isTaxable: a.isTaxable,
      }))
      const totalAllowances = allowances.reduce(
        (sum: number, a: any) => sum + a.amount,
        0
      )

      // Calculate deductions
      const deductions = activeSalaryStructure.deductions.map((d: any) => ({
        name: d.name,
        amount: Number(d.amount),
        type: d.type,
      }))
      const totalDeductionsAmount = deductions.reduce(
        (sum: number, d: any) => sum + d.amount,
        0
      )

      // Calculate gross, tax, and net
      const baseSalary = Number(activeSalaryStructure.baseSalary)
      const grossSalary = baseSalary + totalAllowances
      // Tax only the taxable base (base + taxable allowances), matching the
      // salary calculator in salary/actions.ts so the stored slip + the ledger
      // agree with what the user was shown (non-taxable allowances excluded).
      const taxableAllowances = allowances
        .filter((a: { isTaxable: boolean }) => a.isTaxable)
        .reduce((sum: number, a: { amount: number }) => sum + a.amount, 0)
      const taxAmount = calculateProgressiveTax(
        baseSalary + taxableAllowances,
        payrollPolicy.taxBrackets
      )
      // Employee social-security contribution on the basic salary, at the
      // school's country rate (0 for AE / the fail-safe pack). Withheld from
      // net and remitted to the SS-payable account by the ledger poster.
      const socialSecurityAmount = calculateSocialSecurity(
        baseSalary,
        payrollPolicy.socialSecurityEmployeeRate
      )
      const netSalary =
        grossSalary - taxAmount - socialSecurityAmount - totalDeductionsAmount

      // Generate slip number
      const slipNumber =
        `SS-${payrollRun.runNumber}-${teacher.id.substring(0, 8)}`.toUpperCase()

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
          socialSecurityAmount,
          insurance: 0,
          loanDeduction: 0,
          otherDeductions: deductions,
          totalDeductions:
            taxAmount + socialSecurityAmount + totalDeductionsAmount,
          netSalary,
          daysWorked,
          daysPresent,
          daysAbsent,
          hoursWorked,
          overtimeHours,
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

    const schoolPref = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const schoolLang = (schoolPref?.preferredLanguage ?? "ar") as Locale
    const dict = await getDictionary(schoolLang)
    const n = (dict as any)?.finance?.notifications as
      | Record<string, string>
      | undefined
    const admins = await db.user.findMany({
      where: { schoolId, role: "ADMIN" },
      select: { id: true },
    })
    for (const admin of admins) {
      dispatchNotification({
        schoolId,
        userId: admin.id,
        type: "system_alert",
        title: n?.payrollReadyForApprovalTitle || "Payroll Ready for Approval",
        body: interp(
          n?.payrollReadyForApprovalBody ||
            "Payroll run {runNumber} is ready for review. {slips} salary slips totalling {total}.",
          {
            runNumber: payrollRun.runNumber,
            slips: slipsGenerated,
            total: totalNet.toLocaleString(),
          }
        ),
        lang: schoolLang,
        priority: "high",
        channels: ["in_app"],
        metadata: {
          payrollRunId,
          runNumber: payrollRun.runNumber,
          slipsGenerated,
          totalNet,
          url: "/finance/payroll",
        },
        actorId: session.user.id,
      }).catch((err) =>
        console.error("[generateSalarySlips] Notification error:", err)
      )
    }

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

    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    if (
      !(await checkFinancePermission(
        session.user.id,
        schoolId,
        "payroll",
        "approve"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Verify payroll run exists and is in correct status
    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
    })

    if (!payrollRun) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (payrollRun.status !== "PENDING_APPROVAL") {
      return { success: false, error: PAYROLL_ERRORS.NOT_PENDING }
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

    if (payrollRun.processedBy) {
      const schoolPref2 = await db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const lang2 = (schoolPref2?.preferredLanguage ?? "ar") as Locale
      const dict2 = await getDictionary(lang2)
      const n2 = (dict2 as any)?.finance?.notifications as
        | Record<string, string>
        | undefined
      dispatchNotification({
        schoolId,
        userId: payrollRun.processedBy,
        type: "system_alert",
        title: n2?.payrollApprovedTitle || "Payroll Approved",
        body: interp(
          n2?.payrollApprovedBody ||
            "Payroll run {runNumber} has been approved. You can now disburse payments.",
          { runNumber: payrollRun.runNumber }
        ),
        lang: lang2,
        priority: "normal",
        channels: ["in_app"],
        metadata: {
          payrollRunId,
          runNumber: payrollRun.runNumber,
          url: "/finance/payroll",
        },
        actorId: session.user.id,
      }).catch((err) =>
        console.error("[approvePayroll] Notification error:", err)
      )
    }

    revalidatePath("/finance/payroll")
    return { success: true }
  } catch (error) {
    console.error("Error approving payroll:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    if (
      !(await checkFinancePermission(
        session.user.id,
        schoolId,
        "payroll",
        "approve"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const payrollRun = await db.payrollRun.findFirst({
      where: { id: payrollRunId, schoolId },
    })

    if (!payrollRun) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (payrollRun.status !== "PENDING_APPROVAL") {
      return { success: false, error: PAYROLL_ERRORS.NOT_PENDING }
    }

    // Update status back to DRAFT for corrections
    await db.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: "DRAFT",
        notes: `REJECTED: ${reason}\n\n${payrollRun.notes || ""}`,
      },
    })

    if (payrollRun.processedBy) {
      const schoolPref3 = await db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const lang3 = (schoolPref3?.preferredLanguage ?? "ar") as Locale
      const dict3 = await getDictionary(lang3)
      const n3 = (dict3 as any)?.finance?.notifications as
        | Record<string, string>
        | undefined
      dispatchNotification({
        schoolId,
        userId: payrollRun.processedBy,
        type: "system_alert",
        title: n3?.payrollRejectedTitle || "Payroll Rejected",
        body: interp(
          n3?.payrollRejectedBody ||
            "Payroll run {runNumber} was rejected: {reason}",
          { runNumber: payrollRun.runNumber, reason }
        ),
        lang: lang3,
        priority: "high",
        channels: ["in_app"],
        metadata: {
          payrollRunId,
          runNumber: payrollRun.runNumber,
          reason,
          url: "/finance/payroll",
        },
        actorId: session.user.id,
      }).catch((err) =>
        console.error("[rejectPayroll] Notification error:", err)
      )
    }

    revalidatePath("/finance/payroll")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting payroll:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }
    if (
      !(await checkFinancePermission(
        session.user.id,
        schoolId,
        "payroll",
        "process"
      ))
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (payrollRun.status !== "APPROVED") {
      return { success: false, error: PAYROLL_ERRORS.NOT_APPROVED }
    }

    // Mark all generated slips PAID first. Idempotent on retry: the filter
    // requires GENERATED, so a re-run matches 0 rows.
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

    const paidSlips = await db.salarySlip.findMany({
      where: { payrollRunId, status: "PAID" },
      select: {
        id: true,
        teacherId: true,
        grossSalary: true,
        taxAmount: true,
        socialSecurityAmount: true,
        netSalary: true,
        teacher: { select: { userId: true, firstName: true, lastName: true } },
      },
    })

    // Post each disbursed slip to the double-entry ledger (DR salary expense; CR
    // cash + tax/ss/other-deduction payables) BEFORE flipping the run to its
    // terminal PAID state. Posting is idempotent by sourceRecordId=slipId, so if
    // this crashes/times out mid-loop the run is still APPROVED and a retry
    // re-enters, re-posts (no double), then claims the gate below. Doing the gate
    // flip first (as before) made a crash here unrecoverable — the run was PAID
    // but the ledger was partial, and re-entry was blocked by the APPROVED guard.
    // socialSecurityAmount is withheld per the school's country policy and
    // credited to the SS-payable account; any remaining residual (gross − net −
    // tax − ss) goes to Accounts Payable.
    try {
      const { postSalaryPayment } = await import("../lib/accounting/actions")
      for (const slip of paidSlips) {
        const postResult = await postSalaryPayment(schoolId, {
          slipId: slip.id,
          teacherId: slip.teacherId,
          grossSalary: Number(slip.grossSalary),
          taxAmount: Number(slip.taxAmount),
          socialSecurityAmount: Number(slip.socialSecurityAmount),
          netSalary: Number(slip.netSalary),
          paymentDate: new Date(),
        })
        if (!postResult.success) {
          console.error(
            "[processPayments] postSalaryPayment failed:",
            slip.id,
            postResult.errors
          )
        }
      }
    } catch (postingErr) {
      console.error(
        "[processPayments] Ledger posting threw (continuing):",
        postingErr
      )
    }

    // Atomic gate: flip the run to PAID only if it is still APPROVED, AFTER the
    // ledger is posted. A concurrent second invocation sees count 0 and bails
    // here — before notifying — so neither the ledger (idempotent) nor the
    // notifications double-fire.
    const runFlip = await db.payrollRun.updateMany({
      where: { id: payrollRunId, schoolId, status: "APPROVED" },
      data: { status: "PAID" },
    })
    if (runFlip.count === 0) {
      return { success: true, data: 0 }
    }

    // Notify each teacher (winner only — fire-and-forget).
    const schoolPref4 = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const schoolLang4 = (schoolPref4?.preferredLanguage ?? "ar") as Locale
    const dict4 = await getDictionary(schoolLang4)
    const n4 = (dict4 as any)?.finance?.notifications as
      | Record<string, string>
      | undefined
    for (const slip of paidSlips) {
      if (slip.teacher?.userId) {
        dispatchNotification({
          schoolId,
          userId: slip.teacher.userId,
          type: "system_alert",
          title: n4?.salaryPaidTitle || "Salary Paid",
          body: interp(
            n4?.salaryPaidBody || "Your salary of {amount} has been paid.",
            { amount: Number(slip.netSalary).toLocaleString() }
          ),
          lang: schoolLang4,
          priority: "high",
          channels: ["in_app", "email"],
          metadata: {
            payrollRunId,
            netSalary: Number(slip.netSalary),
            url: "/finance/payroll",
          },
        }).catch((err) =>
          console.error("[processPayments] Notification error:", err)
        )
      }
    }

    revalidatePath("/finance/payroll")
    return { success: true, data: updateResult.count }
  } catch (error) {
    console.error("Error processing payments:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
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
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const salarySlip = await db.salarySlip.findFirst({
      where: { id: slipId, schoolId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    return { success: true, data: salarySlip }
  } catch (error) {
    console.error("Error fetching salary slip:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const [totalRuns, pendingApproval, approvedRuns, paidRuns, totalPayments] =
      await Promise.all([
        db.payrollRun.count({ where: { schoolId } }),
        db.payrollRun.count({
          where: { schoolId, status: "PENDING_APPROVAL" },
        }),
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
    return actionError(ACTION_ERRORS.UNKNOWN)
  }
}

/**
 * Delete a payroll run (only if in DRAFT status)
 */
export async function deletePayrollRun(runId: string): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const payrollRun = await db.payrollRun.findFirst({
      where: { id: runId, schoolId },
    })

    if (!payrollRun) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (payrollRun.status !== "DRAFT") {
      return { success: false, error: PAYROLL_ERRORS.DRAFT_ONLY }
    }

    await db.payrollRun.delete({
      where: { id: runId },
    })

    revalidatePath("/finance/payroll")
    return { success: true }
  } catch (error) {
    console.error("Error deleting payroll run:", error)
    return actionError(ACTION_ERRORS.UNKNOWN)
  }
}
