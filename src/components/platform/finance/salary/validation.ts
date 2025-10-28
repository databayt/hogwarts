/**
 * Salary Sub-Block Validation Schemas
 *
 * Zod schemas for form validation
 */

import { z } from 'zod'

// Salary Structure Schema
export const salaryStructureSchema = z.object({
  teacherId: z.string().min(1, 'Teacher is required'),
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  currency: z.string().default('USD'),
  paymentFrequency: z.enum(['MONTHLY', 'BI_WEEKLY', 'WEEKLY']).default('MONTHLY'),
  notes: z.string().optional(),
})

export type SalaryStructureInput = z.infer<typeof salaryStructureSchema>

// Salary Allowance Schema
export const salaryAllowanceSchema = z.object({
  salaryStructureId: z.string().min(1, 'Salary structure is required'),
  name: z.string().min(1, 'Allowance name is required').max(100),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  isPercentage: z.boolean().default(false),
  isRecurring: z.boolean().default(true),
  isTaxable: z.boolean().default(true),
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
}).refine(
  (data) => {
    // Ensure either amount or percentage is provided
    if (data.isPercentage) {
      return data.percentage !== undefined && data.percentage > 0
    }
    return data.amount !== undefined && data.amount > 0
  },
  {
    message: 'Either amount or percentage must be provided',
    path: ['amount'],
  }
)

export type SalaryAllowanceInput = z.infer<typeof salaryAllowanceSchema>

// Salary Deduction Schema
export const salaryDeductionSchema = z.object({
  salaryStructureId: z.string().min(1, 'Salary structure is required'),
  name: z.string().min(1, 'Deduction name is required').max(100),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  isPercentage: z.boolean().default(false),
  isRecurring: z.boolean().default(true),
  isMandatory: z.boolean().default(false),
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
}).refine(
  (data) => {
    // Ensure either amount or percentage is provided
    if (data.isPercentage) {
      return data.percentage !== undefined && data.percentage > 0
    }
    return data.amount !== undefined && data.amount > 0
  },
  {
    message: 'Either amount or percentage must be provided',
    path: ['amount'],
  }
)

export type SalaryDeductionInput = z.infer<typeof salaryDeductionSchema>

// Salary Calculator Input Schema
export const salaryCalculatorSchema = z.object({
  basicSalary: z.number().min(0, 'Basic salary must be positive'),
  allowances: z.array(
    z.object({
      name: z.string(),
      amount: z.number().optional(),
      percentage: z.number().optional(),
      isPercentage: z.boolean(),
    })
  ),
  deductions: z.array(
    z.object({
      name: z.string(),
      amount: z.number().optional(),
      percentage: z.number().optional(),
      isPercentage: z.boolean(),
    })
  ),
  taxRate: z.number().min(0).max(100).optional(),
  socialSecurityRate: z.number().min(0).max(100).optional(),
})

export type SalaryCalculatorInput = z.infer<typeof salaryCalculatorSchema>

// Bulk Salary Update Schema
export const bulkSalaryUpdateSchema = z.object({
  teacherIds: z.array(z.string()).min(1, 'At least one teacher is required'),
  updateType: z.enum(['BASIC_SALARY', 'ALLOWANCE', 'DEDUCTION']),
  amount: z.number().optional(),
  percentage: z.number().min(0).max(100).optional(),
  isPercentage: z.boolean().default(false),
  effectiveFrom: z.date(),
  notes: z.string().optional(),
})

export type BulkSalaryUpdateInput = z.infer<typeof bulkSalaryUpdateSchema>

// Salary Increment Schema
export const salaryIncrementSchema = z.object({
  salaryStructureId: z.string().min(1, 'Salary structure is required'),
  incrementType: z.enum(['FIXED_AMOUNT', 'PERCENTAGE']),
  amount: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  reason: z.string().min(1, 'Reason is required'),
  effectiveFrom: z.date(),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.incrementType === 'FIXED_AMOUNT') {
      return data.amount !== undefined && data.amount > 0
    }
    return data.percentage !== undefined && data.percentage > 0
  },
  {
    message: 'Amount or percentage is required based on increment type',
    path: ['amount'],
  }
)

export type SalaryIncrementInput = z.infer<typeof salaryIncrementSchema>
