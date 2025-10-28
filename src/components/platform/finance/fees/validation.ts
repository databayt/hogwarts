/**
 * Fees Sub-Block Validation Schemas
 *
 * Zod schemas for form validation
 */

import { z } from 'zod'

// Fee Structure Schema
export const feeStructureSchema = z.object({
  name: z.string().min(1, 'Fee name is required').max(100),
  description: z.string().optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  yearLevelId: z.string().optional(),
  dueDate: z.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
})

export type FeeStructureInput = z.infer<typeof feeStructureSchema>

// Fee Assignment Schema
export const feeAssignmentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  assignedDate: z.date(),
  dueDate: z.date(),
  amount: z.number().min(0, 'Amount must be positive'),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'WAIVED']).default('PENDING'),
  notes: z.string().optional(),
})

export type FeeAssignmentInput = z.infer<typeof feeAssignmentSchema>

// Payment Schema
export const paymentSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  feeAssignmentId: z.string().optional(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK', 'OTHER']),
  transactionReference: z.string().optional(),
  paymentDate: z.date(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']).default('COMPLETED'),
  notes: z.string().optional(),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// Refund Schema
export const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  refundMethod: z.enum(['ORIGINAL_PAYMENT_METHOD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'OTHER']),
  refundDate: z.date(),
  status: z.enum(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED']).default('PENDING'),
  notes: z.string().optional(),
})

export type RefundInput = z.infer<typeof refundSchema>

// Scholarship Schema
export const scholarshipSchema = z.object({
  name: z.string().min(1, 'Scholarship name is required').max(100),
  description: z.string().optional(),
  type: z.enum(['FULL', 'PARTIAL', 'MERIT_BASED', 'NEED_BASED', 'SPORTS', 'ACADEMIC']),
  amount: z.number().min(0, 'Amount must be positive'),
  percentage: z.number().min(0).max(100).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  eligibilityCriteria: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CLOSED']).default('ACTIVE'),
  maxRecipients: z.number().min(1).optional(),
})

export type ScholarshipInput = z.infer<typeof scholarshipSchema>

// Scholarship Application Schema
export const scholarshipApplicationSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  scholarshipId: z.string().min(1, 'Scholarship is required'),
  applicationDate: z.date(),
  reason: z.string().min(1, 'Application reason is required'),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).default('PENDING'),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  reviewNotes: z.string().optional(),
  approvedAmount: z.number().min(0).optional(),
})

export type ScholarshipApplicationInput = z.infer<typeof scholarshipApplicationSchema>

// Fine Schema
export const fineSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  reason: z.string().min(1, 'Fine reason is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  fineDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['PENDING', 'PAID', 'WAIVED', 'OVERDUE']).default('PENDING'),
  isPaid: z.boolean().default(false),
  paidAt: z.date().optional(),
  notes: z.string().optional(),
})

export type FineInput = z.infer<typeof fineSchema>

// Bulk Fee Assignment Schema
export const bulkFeeAssignmentSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  studentIds: z.array(z.string()).min(1, 'At least one student is required'),
  dueDate: z.date(),
  notes: z.string().optional(),
})

export type BulkFeeAssignmentInput = z.infer<typeof bulkFeeAssignmentSchema>
