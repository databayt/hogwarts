/**
 * Payroll Sub-Block Validation Schemas
 *
 * Zod schemas for form validation
 */

import { z } from "zod"

// Payroll Run Schema
export const payrollRunSchema = z
  .object({
    runNumber: z.string().min(1, "Run number is required").max(50),
    periodStart: z.date(),
    periodEnd: z.date(),
    paymentDate: z.date(),
    description: z.string().optional(),
    status: z
      .enum([
        "DRAFT",
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ])
      .default("DRAFT"),
    notes: z.string().optional(),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: "Period end date must be after start date",
    path: ["periodEnd"],
  })
  .refine((data) => data.paymentDate >= data.periodEnd, {
    message: "Payment date must be after period end date",
    path: ["paymentDate"],
  })

export type PayrollRunInput = z.infer<typeof payrollRunSchema>

// Salary Slip Schema
export const salarySlipSchema = z.object({
  payrollRunId: z.string().min(1, "Payroll run is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  slipNumber: z.string().min(1, "Slip number is required").max(50),
  periodStart: z.date(),
  periodEnd: z.date(),
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  allowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  socialSecurityAmount: z.number().min(0).default(0),
  grossSalary: z.number().min(0),
  netSalary: z.number().min(0),
  workingDays: z.number().min(0).default(0),
  absentDays: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).default(0),
  overtimePay: z.number().min(0).default(0),
  status: z
    .enum(["DRAFT", "PENDING", "APPROVED", "PAID", "CANCELLED"])
    .default("DRAFT"),
  paymentMethod: z
    .enum(["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY"])
    .optional(),
  paymentReference: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
})

export type SalarySlipInput = z.infer<typeof salarySlipSchema>

// Payroll Processing Schema
export const payrollProcessingSchema = z.object({
  runId: z.string().optional(),
  periodStart: z.date(),
  periodEnd: z.date(),
  paymentDate: z.date(),
  teacherIds: z.array(z.string()).optional(), // If not provided, process all active staff
  includeTimesheetData: z.boolean().default(true),
  calculateTax: z.boolean().default(true),
  calculateSocialSecurity: z.boolean().default(true),
  autoApprove: z.boolean().default(false),
  notes: z.string().optional(),
})

export type PayrollProcessingInput = z.infer<typeof payrollProcessingSchema>

// Tax Calculation Schema
export const taxCalculationSchema = z.object({
  grossSalary: z.number().min(0, "Gross salary must be positive"),
  taxExemptions: z.number().min(0).default(0),
  dependents: z.number().min(0).default(0),
  additionalDeductions: z.number().min(0).default(0),
})

export type TaxCalculationInput = z.infer<typeof taxCalculationSchema>

// Payroll Approval Schema
export const payrollApprovalSchema = z
  .object({
    runId: z.string().min(1, "Payroll run is required"),
    approverNotes: z.string().optional(),
    action: z.enum(["APPROVE", "REJECT"]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === "REJECT") {
        return (
          data.rejectionReason !== undefined && data.rejectionReason.length > 0
        )
      }
      return true
    },
    {
      message: "Rejection reason is required when rejecting",
      path: ["rejectionReason"],
    }
  )

export type PayrollApprovalInput = z.infer<typeof payrollApprovalSchema>

// Payroll Disbursement Schema
export const payrollDisbursementSchema = z.object({
  runId: z.string().min(1, "Payroll run is required"),
  slipIds: z.array(z.string()).optional(), // If not provided, disburse all approved slips
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CHECK", "MOBILE_MONEY"]),
  paymentDate: z.date(),
  bankAccountId: z.string().optional(),
  batchReference: z.string().optional(),
  notes: z.string().optional(),
})

export type PayrollDisbursementInput = z.infer<typeof payrollDisbursementSchema>

// Payroll Adjustment Schema
export const payrollAdjustmentSchema = z.object({
  slipId: z.string().min(1, "Salary slip is required"),
  adjustmentType: z.enum(["ALLOWANCE", "DEDUCTION", "BONUS", "PENALTY"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  affectsTax: z.boolean().default(true),
  notes: z.string().optional(),
})

export type PayrollAdjustmentInput = z.infer<typeof payrollAdjustmentSchema>
