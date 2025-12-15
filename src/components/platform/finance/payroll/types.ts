/**
 * Payroll Sub-Block Types
 *
 * Feature-based sub-block for payroll processing
 */

import type { PayrollRun, SalarySlip } from "@prisma/client"

// Extended types with relations
export type PayrollRunWithRelations = PayrollRun & {
  slips?: SalarySlip[]
  _count?: {
    slips: number
  }
}

export type SalarySlipWithRelations = SalarySlip & {
  teacher: {
    id: string
    givenName: string
    surname: string
    employeeId: string | null
  }
  payrollRun: PayrollRun
}

// View Models
export type PayrollRunListItem = {
  id: string
  runNumber: string
  periodStart: Date
  periodEnd: Date
  paymentDate: Date
  status: string
  totalGross: number
  totalDeductions: number
  totalNet: number
  employeeCount: number
  processedAt: Date | null
  processedBy: string | null
}

export type SalarySlipListItem = {
  id: string
  slipNumber: string
  teacherId: string
  teacherName: string
  employeeId: string | null
  periodStart: Date
  periodEnd: Date
  basicSalary: number
  allowances: number
  grossSalary: number
  deductions: number
  taxAmount: number
  netSalary: number
  status: string
  paymentDate: Date | null
}

export type PayrollSummary = {
  totalRuns: number
  completedRuns: number
  pendingRuns: number
  totalEmployees: number
  monthlyPayroll: number
  yearToDatePayroll: number
  averageNetSalary: number
}

export type PayrollPeriod = {
  start: Date
  end: Date
  label: string
  isPast: boolean
  isCurrent: boolean
  isFuture: boolean
}

// Payroll calculation breakdown
export type PayrollCalculation = {
  teacherId: string
  basicSalary: number
  allowances: {
    name: string
    amount: number
  }[]
  deductions: {
    name: string
    amount: number
  }[]
  grossSalary: number
  totalAllowances: number
  totalDeductions: number
  taxAmount: number
  socialSecurityAmount: number
  netSalary: number
  workingDays: number
  absentDays: number
  overtimeHours: number
  overtimePay: number
}

// Tax calculation
export type TaxCalculation = {
  grossSalary: number
  taxableIncome: number
  taxBrackets: {
    from: number
    to: number | null
    rate: number
    amount: number
  }[]
  totalTax: number
  effectiveRate: number
}

// Payroll processing result
export type PayrollProcessingResult = {
  success: boolean
  runId?: string
  errors?: {
    teacherId: string
    teacherName: string
    error: string
  }[]
  summary: {
    processed: number
    failed: number
    totalGross: number
    totalNet: number
  }
}
