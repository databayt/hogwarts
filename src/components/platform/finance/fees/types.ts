/**
 * Fees Sub-Block Types
 *
 * Feature-based sub-block for student fee management
 */

import type {
  FeeAssignment,
  FeeStructure,
  Fine,
  Payment,
  Refund,
  Scholarship,
  ScholarshipApplication,
} from "@prisma/client"

// Extended types with relations
export type FeeStructureWithRelations = FeeStructure & {
  yearLevel?: {
    id: string
    levelName: string
  }
  assignments?: FeeAssignment[]
  _count?: {
    assignments: number
  }
}

export type FeeAssignmentWithRelations = FeeAssignment & {
  student: {
    id: string
    givenName: string
    surname: string
  }
  feeStructure: FeeStructure
  payments?: Payment[]
  _count?: {
    payments: number
  }
}

export type PaymentWithRelations = Payment & {
  student: {
    id: string
    givenName: string
    surname: string
  }
  feeAssignment?: FeeAssignment
}

export type ScholarshipWithRelations = Scholarship & {
  applications?: ScholarshipApplication[]
  _count?: {
    applications: number
  }
}

export type ScholarshipApplicationWithRelations = ScholarshipApplication & {
  student: {
    id: string
    givenName: string
    surname: string
  }
  scholarship: Scholarship
}

export type FineWithRelations = Fine & {
  student: {
    id: string
    givenName: string
    surname: string
  }
}

// View Models
export type FeeStructureListItem = {
  id: string
  name: string
  description: string | null
  amount: number
  yearLevelId: string | null
  yearLevelName: string | null
  status: string
  dueDate: Date | null
  assignmentCount: number
}

export type StudentFeesSummary = {
  studentId: string
  studentName: string
  totalFees: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  scholarshipAmount: number
  fineAmount: number
  netAmount: number
}

export type PaymentSummary = {
  totalCollected: number
  pendingPayments: number
  overduePayments: number
  paymentCount: number
  averagePaymentAmount: number
}
