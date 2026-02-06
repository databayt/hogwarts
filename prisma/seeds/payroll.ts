/**
 * Payroll Seed
 * Creates salary structures, payroll runs, and salary slips for teachers
 *
 * Phase 11b: Finance - Payroll
 *
 * Features:
 * - Salary structures for all 100 teachers (SDG currency, monthly)
 * - Allowances: housing, transport, phone
 * - Deductions: tax, insurance, pension
 * - 3 payroll runs (Oct, Nov, Dec 2025) - all PAID
 * - Salary slips with timesheet data
 * - Timesheet periods for each month
 */

import type { PrismaClient } from "@prisma/client"

import type { TeacherRef, UserRef } from "./types"
import { logSuccess, randomNumber } from "./utils"

// ============================================================================
// SALARY DATA
// ============================================================================

// Sudanese salary ranges (SDG) by seniority band
const SALARY_BANDS = [
  { min: 80000, max: 120000, weight: 30 }, // Junior teachers (30%)
  { min: 120000, max: 180000, weight: 40 }, // Mid-level (40%)
  { min: 180000, max: 250000, weight: 20 }, // Senior (20%)
  { min: 250000, max: 350000, weight: 10 }, // Department heads (10%)
]

const ALLOWANCES = [
  { name: "بدل سكن", taxable: false, pctOfBase: 0.25 },
  { name: "بدل نقل", taxable: false, pctOfBase: 0.1 },
  { name: "بدل اتصالات", taxable: true, pctOfBase: 0.05 },
]

const DEDUCTION_TYPES: Array<{
  name: string
  type: "TAX" | "INSURANCE" | "PENSION"
  pctOfGross: number
}> = [
  { name: "ضريبة الدخل", type: "TAX", pctOfGross: 0.08 },
  { name: "تأمين صحي", type: "INSURANCE", pctOfGross: 0.03 },
  { name: "معاش تقاعدي", type: "PENSION", pctOfGross: 0.05 },
]

// Payroll months (first 3 months of Term 1)
const PAYROLL_MONTHS = [
  {
    label: "أكتوبر 2025",
    start: new Date("2025-10-01"),
    end: new Date("2025-10-31"),
    payDate: new Date("2025-10-28"),
    status: "PAID" as const,
  },
  {
    label: "نوفمبر 2025",
    start: new Date("2025-11-01"),
    end: new Date("2025-11-30"),
    payDate: new Date("2025-11-27"),
    status: "PAID" as const,
  },
  {
    label: "ديسمبر 2025",
    start: new Date("2025-12-01"),
    end: new Date("2025-12-31"),
    payDate: new Date("2025-12-25"),
    status: "PAID" as const,
  },
]

// ============================================================================
// HELPERS
// ============================================================================

function getSalaryBand(index: number): { min: number; max: number } {
  const bucket = index % 100
  let cumulative = 0
  for (const band of SALARY_BANDS) {
    cumulative += band.weight
    if (bucket < cumulative) return band
  }
  return SALARY_BANDS[0]
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100
}

// ============================================================================
// MAIN SEED
// ============================================================================

export async function seedPayroll(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[],
  adminUsers: UserRef[]
): Promise<void> {
  // Clean existing payroll data
  await prisma.salarySlip.deleteMany({ where: { schoolId } })
  await prisma.payrollRun.deleteMany({ where: { schoolId } })
  await prisma.salaryDeduction.deleteMany({ where: { schoolId } })
  await prisma.salaryAllowance.deleteMany({ where: { schoolId } })
  await prisma.salaryStructure.deleteMany({ where: { schoolId } })
  await prisma.timesheetEntry.deleteMany({ where: { schoolId } })
  await prisma.timesheetPeriod.deleteMany({ where: { schoolId } })

  const processedBy = adminUsers[0]?.id || null

  // ------------------------------------------------------------------
  // 1. Create salary structures for all teachers
  // ------------------------------------------------------------------
  const structureMap = new Map<
    string,
    { id: string; baseSalary: number; grossSalary: number }
  >()

  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i]
    const band = getSalaryBand(i)
    const baseSalary = randomNumber(band.min, band.max)

    const structure = await prisma.salaryStructure.create({
      data: {
        schoolId,
        teacherId: teacher.id,
        effectiveFrom: new Date("2025-09-01"),
        baseSalary,
        currency: "SDG",
        payFrequency: "MONTHLY",
        isActive: true,
      },
    })

    // Create allowances
    let totalAllowances = 0
    for (const allowance of ALLOWANCES) {
      const amount = roundTo2(baseSalary * allowance.pctOfBase)
      totalAllowances += amount
      await prisma.salaryAllowance.create({
        data: {
          schoolId,
          structureId: structure.id,
          name: allowance.name,
          amount,
          isTaxable: allowance.taxable,
          isRecurring: true,
        },
      })
    }

    const grossSalary = baseSalary + totalAllowances

    // Create deductions
    for (const deduction of DEDUCTION_TYPES) {
      const amount = roundTo2(grossSalary * deduction.pctOfGross)
      await prisma.salaryDeduction.create({
        data: {
          schoolId,
          structureId: structure.id,
          name: deduction.name,
          amount,
          type: deduction.type,
          isRecurring: true,
        },
      })
    }

    structureMap.set(teacher.id, {
      id: structure.id,
      baseSalary,
      grossSalary,
    })
  }

  logSuccess(
    "Salary Structures",
    teachers.length,
    "with allowances & deductions"
  )

  // ------------------------------------------------------------------
  // 2. Create timesheet periods
  // ------------------------------------------------------------------
  const timesheetPeriods: { id: string; start: Date; end: Date }[] = []

  for (const month of PAYROLL_MONTHS) {
    const period = await prisma.timesheetPeriod.create({
      data: {
        schoolId,
        name: month.label,
        startDate: month.start,
        endDate: month.end,
        status: "CLOSED",
      },
    })
    timesheetPeriods.push({ id: period.id, start: month.start, end: month.end })
  }

  // ------------------------------------------------------------------
  // 2b. Create timesheet entries for each teacher per period
  // ------------------------------------------------------------------
  let entryCount = 0

  for (const period of timesheetPeriods) {
    const entryBatch: Array<{
      schoolId: string
      periodId: string
      teacherId: string
      entryDate: Date
      hoursWorked: number
      overtimeHours: number
      leaveHours: number
      leaveType: string | null
      notes: string | null
      status: "APPROVED"
    }> = []

    for (const teacher of teachers) {
      // Generate ~20 working day entries per teacher per month (Sun-Thu)
      const current = new Date(period.start)
      while (current <= period.end) {
        const day = current.getDay()
        // Sun=0, Mon=1, ..., Thu=4 are working days in MENA
        if (day >= 0 && day <= 4) {
          const hasOvertime = Math.random() < 0.1 // 10% overtime
          const isLeave = Math.random() < 0.05 // 5% leave

          entryBatch.push({
            schoolId,
            periodId: period.id,
            teacherId: teacher.id,
            entryDate: new Date(current),
            hoursWorked: isLeave ? 0 : 7,
            overtimeHours: hasOvertime && !isLeave ? randomNumber(1, 3) : 0,
            leaveHours: isLeave ? 7 : 0,
            leaveType: isLeave ? "SICK" : null,
            notes: null,
            status: "APPROVED",
          })
        }
        current.setDate(current.getDate() + 1)
      }
    }

    // Insert in batches of 500
    for (let i = 0; i < entryBatch.length; i += 500) {
      const batch = entryBatch.slice(i, i + 500)
      try {
        const result = await prisma.timesheetEntry.createMany({
          data: batch,
          skipDuplicates: true,
        })
        entryCount += result.count
      } catch {
        // Skip duplicates
      }
    }
  }

  logSuccess("Timesheet Entries", entryCount, "daily records for all teachers")

  // ------------------------------------------------------------------
  // 3. Create payroll runs and salary slips
  // ------------------------------------------------------------------
  let slipCount = 0

  for (let m = 0; m < PAYROLL_MONTHS.length; m++) {
    const month = PAYROLL_MONTHS[m]
    const runNumber = `PR-2025-${String(m + 1).padStart(3, "0")}`

    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    // Pre-calculate totals for the run
    const slipData: Array<{
      teacherId: string
      structureId: string
      baseSalary: number
      grossSalary: number
      taxAmount: number
      insurance: number
      pension: number
      totalDed: number
      netSalary: number
      daysWorked: number
      daysPresent: number
      daysAbsent: number
    }> = []

    for (const teacher of teachers) {
      const info = structureMap.get(teacher.id)
      if (!info) continue

      const daysWorked = randomNumber(20, 23) // Working days in month
      const daysAbsent = randomNumber(0, 2)
      const daysPresent = daysWorked - daysAbsent

      const taxAmount = roundTo2(info.grossSalary * 0.08)
      const insurance = roundTo2(info.grossSalary * 0.03)
      const pension = roundTo2(info.grossSalary * 0.05)
      const totalDed = roundTo2(taxAmount + insurance + pension)
      const netSalary = roundTo2(info.grossSalary - totalDed)

      totalGross += info.grossSalary
      totalDeductions += totalDed
      totalNet += netSalary

      slipData.push({
        teacherId: teacher.id,
        structureId: info.id,
        baseSalary: info.baseSalary,
        grossSalary: info.grossSalary,
        taxAmount,
        insurance,
        pension,
        totalDed,
        netSalary,
        daysWorked,
        daysPresent,
        daysAbsent,
      })
    }

    // Create payroll run
    const payrollRun = await prisma.payrollRun.create({
      data: {
        schoolId,
        runNumber,
        payPeriodStart: month.start,
        payPeriodEnd: month.end,
        payDate: month.payDate,
        status: month.status,
        totalGross: roundTo2(totalGross),
        totalDeductions: roundTo2(totalDeductions),
        totalNet: roundTo2(totalNet),
        processedBy,
        processedAt: month.payDate,
        approvedBy: processedBy,
        approvedAt: month.payDate,
      },
    })

    // Create salary slips in batches
    const slipBatch = slipData.map((s, idx) => ({
      schoolId,
      payrollRunId: payrollRun.id,
      structureId: s.structureId,
      teacherId: s.teacherId,
      slipNumber: `SLP-2025-${String(m + 1).padStart(2, "0")}-${String(idx + 1).padStart(4, "0")}`,
      payPeriodStart: month.start,
      payPeriodEnd: month.end,
      payDate: month.payDate,
      baseSalary: s.baseSalary,
      allowances: ALLOWANCES.map((a) => ({
        name: a.name,
        amount: roundTo2(s.baseSalary * a.pctOfBase),
        isTaxable: a.taxable,
      })),
      overtime: 0,
      bonus: 0,
      grossSalary: s.grossSalary,
      taxAmount: s.taxAmount,
      insurance: s.insurance,
      loanDeduction: 0,
      otherDeductions: [] as Array<{ name: string; amount: number }>,
      totalDeductions: s.totalDed,
      netSalary: s.netSalary,
      daysWorked: s.daysWorked,
      daysPresent: s.daysPresent,
      daysAbsent: s.daysAbsent,
      status: "PAID" as const,
      paidAt: month.payDate,
    }))

    // Insert slips in batches of 50
    for (let i = 0; i < slipBatch.length; i += 50) {
      const batch = slipBatch.slice(i, i + 50)
      const result = await prisma.salarySlip.createMany({
        data: batch,
        skipDuplicates: true,
      })
      slipCount += result.count
    }
  }

  logSuccess("Payroll Runs", PAYROLL_MONTHS.length, "Oct/Nov/Dec 2025 - PAID")
  logSuccess(
    "Salary Slips",
    slipCount,
    `${teachers.length} teachers x ${PAYROLL_MONTHS.length} months`
  )
}
