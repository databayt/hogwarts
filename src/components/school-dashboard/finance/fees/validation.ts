// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Fees Sub-Block Validation Schemas
 *
 * Zod schemas matching the actual Prisma models in finance-fees.prisma
 */

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export const createFeeStructureSchema = (v: ValidationHelper) =>
  z.object({
    name: z.string().min(1, v.required()).max(100),
    academicYear: z.string().min(1, v.required()),
    classId: z.string().optional().nullable(),
    stream: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    tuitionFee: z.number().min(0, v.min(0)),
    admissionFee: z.number().min(0).optional().nullable(),
    registrationFee: z.number().min(0).optional().nullable(),
    examFee: z.number().min(0).optional().nullable(),
    libraryFee: z.number().min(0).optional().nullable(),
    laboratoryFee: z.number().min(0).optional().nullable(),
    sportsFee: z.number().min(0).optional().nullable(),
    transportFee: z.number().min(0).optional().nullable(),
    hostelFee: z.number().min(0).optional().nullable(),
    totalAmount: z.number().min(0, v.min(0)),
    installments: z.number().int().min(1).default(4),
    lateFeeAmount: z.number().min(0).optional().nullable(),
    lateFeeType: z
      .enum(["FIXED", "PERCENTAGE", "DAILY", "MONTHLY"])
      .optional()
      .nullable(),
    discountPolicy: z.any().optional(),
    paymentSchedule: z.any().optional(),
    isActive: z.boolean().default(true),
  })

export const createFeeAssignmentSchema = (v: ValidationHelper) =>
  z.object({
    studentId: z.string().min(1, v.required()),
    feeStructureId: z.string().min(1, v.required()),
    academicYear: z.string().min(1, v.required()),
    finalAmount: z.number().min(0, v.min(0)),
    customAmount: z.number().min(0).optional().nullable(),
    totalDiscount: z.number().min(0).optional(),
    scholarshipId: z.string().optional().nullable(),
    discounts: z.any().optional(),
    status: z
      .enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"])
      .default("PENDING"),
  })

export const createPaymentSchema = (v: ValidationHelper) =>
  z.object({
    feeAssignmentId: z.string().min(1, v.required()),
    amount: z.number().min(0.01, v.positive()),
    paymentMethod: z.enum([
      "CASH",
      "CHEQUE",
      "BANK_TRANSFER",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "UPI",
      "NET_BANKING",
      "WALLET",
      "OTHER",
    ]),
    transactionId: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    chequeNumber: z.string().optional().nullable(),
    cardLastFour: z.string().optional().nullable(),
    paymentDate: z.coerce.date(),
    status: z
      .enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"])
      .default("SUCCESS"),
    remarks: z.string().optional().nullable(),
  })

export const createRefundSchema = (v: ValidationHelper) =>
  z.object({
    paymentId: z.string().min(1, v.required()),
    amount: z.number().min(0.01, v.positive()),
    reason: z.string().min(1, v.required()),
    refundMethod: z
      .enum([
        "CASH",
        "CHEQUE",
        "BANK_TRANSFER",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "UPI",
        "NET_BANKING",
        "WALLET",
        "OTHER",
      ])
      .optional()
      .nullable(),
    status: z
      .enum([
        "REQUESTED",
        "APPROVED",
        "PROCESSING",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ])
      .default("REQUESTED"),
    approvalNotes: z.string().optional().nullable(),
    supportingDocs: z.any().optional(),
  })

export const createScholarshipSchema = (v: ValidationHelper) =>
  z.object({
    name: z.string().min(1, v.required()).max(100),
    description: z.string().optional().nullable(),
    coverageType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FULL"]),
    coverageAmount: z.number().min(0, v.min(0)),
    academicYear: z.string().min(1, v.required()),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    maxBeneficiaries: z.number().int().min(1).optional().nullable(),
    minPercentage: z.number().min(0).max(100).optional().nullable(),
    maxFamilyIncome: z.number().min(0).optional().nullable(),
    eligibilityCriteria: z.any().optional(),
    isActive: z.boolean().default(true),
  })

export const createScholarshipApplicationSchema = (v: ValidationHelper) =>
  z.object({
    studentId: z.string().min(1, v.required()),
    scholarshipId: z.string().min(1, v.required()),
    academicYear: z.string().min(1, v.required()),
    familyIncome: z.number().min(0).optional().nullable(),
    documents: z.any().optional(),
    statement: z.string().optional().nullable(),
    status: z
      .enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"])
      .default("PENDING"),
    reviewNotes: z.string().optional().nullable(),
    awardedAmount: z.number().min(0).optional().nullable(),
  })

export const createFineSchema = (v: ValidationHelper) =>
  z.object({
    studentId: z.string().min(1, v.required()),
    fineType: z.enum([
      "LATE_FEE",
      "LIBRARY_FINE",
      "DISCIPLINE_FINE",
      "DAMAGE_FINE",
      "OTHER",
    ]),
    reason: z.string().min(1, v.required()),
    amount: z.number().min(0.01, v.positive()),
    dueDate: z.coerce.date(),
  })

export const createBulkFeeAssignmentSchema = (v: ValidationHelper) =>
  z.object({
    feeStructureId: z.string().min(1, v.required()),
    studentIds: z.array(z.string()).min(1, v.required()),
    academicYear: z.string().min(1, v.required()),
    finalAmount: z.number().min(0, v.min(0)),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

// Fee Structure Schema — matches FeeStructure Prisma model
export const feeStructureSchema = z.object({
  name: z.string().min(1, "Fee name is required").max(100),
  academicYear: z.string().min(1, "Academic year is required"),
  classId: z.string().optional().nullable(),
  stream: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tuitionFee: z.number().min(0, "Tuition fee must be non-negative"),
  admissionFee: z.number().min(0).optional().nullable(),
  registrationFee: z.number().min(0).optional().nullable(),
  examFee: z.number().min(0).optional().nullable(),
  libraryFee: z.number().min(0).optional().nullable(),
  laboratoryFee: z.number().min(0).optional().nullable(),
  sportsFee: z.number().min(0).optional().nullable(),
  transportFee: z.number().min(0).optional().nullable(),
  hostelFee: z.number().min(0).optional().nullable(),
  totalAmount: z.number().min(0, "Total amount must be non-negative"),
  installments: z.number().int().min(1).default(4),
  lateFeeAmount: z.number().min(0).optional().nullable(),
  lateFeeType: z
    .enum(["FIXED", "PERCENTAGE", "DAILY", "MONTHLY"])
    .optional()
    .nullable(),
  discountPolicy: z.any().optional(),
  paymentSchedule: z.any().optional(),
  isActive: z.boolean().default(true),
})

export type FeeStructureInput = z.infer<typeof feeStructureSchema>

// Fee Assignment Schema
export const feeAssignmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  finalAmount: z.number().min(0, "Amount must be non-negative"),
  customAmount: z.number().min(0).optional().nullable(),
  totalDiscount: z.number().min(0).optional(),
  scholarshipId: z.string().optional().nullable(),
  discounts: z.any().optional(),
  status: z
    .enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"])
    .default("PENDING"),
})

export type FeeAssignmentInput = z.infer<typeof feeAssignmentSchema>

// Payment Schema
export const paymentSchema = z.object({
  feeAssignmentId: z.string().min(1, "Fee assignment is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum([
    "CASH",
    "CHEQUE",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "UPI",
    "NET_BANKING",
    "WALLET",
    "OTHER",
  ]),
  transactionId: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  chequeNumber: z.string().optional().nullable(),
  cardLastFour: z.string().optional().nullable(),
  paymentDate: z.coerce.date(),
  status: z
    .enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"])
    .default("SUCCESS"),
  remarks: z.string().optional().nullable(),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// Refund Schema — matches Refund Prisma model
export const refundSchema = z.object({
  paymentId: z.string().min(1, "Payment is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  refundMethod: z
    .enum([
      "CASH",
      "CHEQUE",
      "BANK_TRANSFER",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "UPI",
      "NET_BANKING",
      "WALLET",
      "OTHER",
    ])
    .optional()
    .nullable(),
  status: z
    .enum([
      "REQUESTED",
      "APPROVED",
      "PROCESSING",
      "COMPLETED",
      "REJECTED",
      "CANCELLED",
    ])
    .default("REQUESTED"),
  approvalNotes: z.string().optional().nullable(),
  supportingDocs: z.any().optional(),
})

export type RefundInput = z.infer<typeof refundSchema>

// Scholarship Schema — matches Scholarship Prisma model
export const scholarshipSchema = z.object({
  name: z.string().min(1, "Scholarship name is required").max(100),
  description: z.string().optional().nullable(),
  coverageType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FULL"]),
  coverageAmount: z.number().min(0, "Coverage amount must be non-negative"),
  academicYear: z.string().min(1, "Academic year is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxBeneficiaries: z.number().int().min(1).optional().nullable(),
  minPercentage: z.number().min(0).max(100).optional().nullable(),
  maxFamilyIncome: z.number().min(0).optional().nullable(),
  eligibilityCriteria: z.any().optional(),
  isActive: z.boolean().default(true),
})

export type ScholarshipInput = z.infer<typeof scholarshipSchema>

// Scholarship Application Schema
export const scholarshipApplicationSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  scholarshipId: z.string().min(1, "Scholarship is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  familyIncome: z.number().min(0).optional().nullable(),
  documents: z.any().optional(),
  statement: z.string().optional().nullable(),
  status: z
    .enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"])
    .default("PENDING"),
  reviewNotes: z.string().optional().nullable(),
  awardedAmount: z.number().min(0).optional().nullable(),
})

export type ScholarshipApplicationInput = z.infer<
  typeof scholarshipApplicationSchema
>

// Fine Schema
export const fineSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  fineType: z.enum([
    "LATE_FEE",
    "LIBRARY_FINE",
    "DISCIPLINE_FINE",
    "DAMAGE_FINE",
    "OTHER",
  ]),
  reason: z.string().min(1, "Fine reason is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.coerce.date(),
})

export type FineInput = z.infer<typeof fineSchema>

// Bulk Fee Assignment Schema
export const bulkFeeAssignmentSchema = z.object({
  feeStructureId: z.string().min(1, "Fee structure is required"),
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  finalAmount: z.number().min(0, "Amount must be non-negative"),
})

export type BulkFeeAssignmentInput = z.infer<typeof bulkFeeAssignmentSchema>
