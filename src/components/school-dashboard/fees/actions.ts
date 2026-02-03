"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"

import { db } from "@/lib/db"

import {
  bulkFeeAssignmentSchema,
  feeStructureSchema,
  paymentSchema,
  refundSchema,
  scholarshipSchema,
  type BulkFeeAssignmentFormData,
  type FeeStructureFormData,
  type PaymentFormData,
  type RefundFormData,
  type ScholarshipFormData,
} from "./validation"

// Get session and schoolId helper
async function getSessionAndSchool() {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!session?.user?.id || !schoolId) {
    throw new Error("Unauthorized")
  }

  return { userId: session.user.id, schoolId, session }
}

// Generate unique payment number
function generatePaymentNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `PAY${year}${month}${random}`
}

// Generate unique receipt number
function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `RCP${year}${month}${random}`
}

// Fee Structure Actions
export async function createFeeStructure(data: FeeStructureFormData) {
  const { schoolId } = await getSessionAndSchool()
  const validated = feeStructureSchema.parse(data)

  // Calculate total amount
  const totalAmount =
    validated.tuitionFee +
    (validated.admissionFee || 0) +
    (validated.registrationFee || 0) +
    (validated.examFee || 0) +
    (validated.libraryFee || 0) +
    (validated.laboratoryFee || 0) +
    (validated.sportsFee || 0) +
    (validated.transportFee || 0) +
    (validated.hostelFee || 0) +
    (validated.otherFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0)

  const feeStructure = await db.feeStructure.create({
    data: {
      ...validated,
      schoolId,
      totalAmount: new Decimal(totalAmount),
      tuitionFee: new Decimal(validated.tuitionFee),
      admissionFee: validated.admissionFee
        ? new Decimal(validated.admissionFee)
        : null,
      registrationFee: validated.registrationFee
        ? new Decimal(validated.registrationFee)
        : null,
      examFee: validated.examFee ? new Decimal(validated.examFee) : null,
      libraryFee: validated.libraryFee
        ? new Decimal(validated.libraryFee)
        : null,
      laboratoryFee: validated.laboratoryFee
        ? new Decimal(validated.laboratoryFee)
        : null,
      sportsFee: validated.sportsFee ? new Decimal(validated.sportsFee) : null,
      transportFee: validated.transportFee
        ? new Decimal(validated.transportFee)
        : null,
      hostelFee: validated.hostelFee ? new Decimal(validated.hostelFee) : null,
      lateFeeAmount: validated.lateFeeAmount
        ? new Decimal(validated.lateFeeAmount)
        : null,
      otherFees: validated.otherFees || [],
      paymentSchedule: validated.paymentSchedule || [],
    },
  })

  revalidatePath("/fees/structures")
  return { success: true, feeStructure }
}

export async function updateFeeStructure(
  id: string,
  data: FeeStructureFormData
) {
  const { schoolId } = await getSessionAndSchool()
  const validated = feeStructureSchema.parse(data)

  // Calculate total amount
  const totalAmount =
    validated.tuitionFee +
    (validated.admissionFee || 0) +
    (validated.registrationFee || 0) +
    (validated.examFee || 0) +
    (validated.libraryFee || 0) +
    (validated.laboratoryFee || 0) +
    (validated.sportsFee || 0) +
    (validated.transportFee || 0) +
    (validated.hostelFee || 0) +
    (validated.otherFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0)

  const feeStructure = await db.feeStructure.update({
    where: { id, schoolId },
    data: {
      ...validated,
      totalAmount: new Decimal(totalAmount),
      tuitionFee: new Decimal(validated.tuitionFee),
      admissionFee: validated.admissionFee
        ? new Decimal(validated.admissionFee)
        : null,
      registrationFee: validated.registrationFee
        ? new Decimal(validated.registrationFee)
        : null,
      examFee: validated.examFee ? new Decimal(validated.examFee) : null,
      libraryFee: validated.libraryFee
        ? new Decimal(validated.libraryFee)
        : null,
      laboratoryFee: validated.laboratoryFee
        ? new Decimal(validated.laboratoryFee)
        : null,
      sportsFee: validated.sportsFee ? new Decimal(validated.sportsFee) : null,
      transportFee: validated.transportFee
        ? new Decimal(validated.transportFee)
        : null,
      hostelFee: validated.hostelFee ? new Decimal(validated.hostelFee) : null,
      lateFeeAmount: validated.lateFeeAmount
        ? new Decimal(validated.lateFeeAmount)
        : null,
      otherFees: validated.otherFees || [],
      paymentSchedule: validated.paymentSchedule || [],
    },
  })

  revalidatePath("/fees/structures")
  return { success: true, feeStructure }
}

export async function getFeeStructures() {
  const { schoolId } = await getSessionAndSchool()

  const structures = await db.feeStructure.findMany({
    where: { schoolId },
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return structures
}

// Bulk Fee Assignment
export async function assignFeesInBulk(data: BulkFeeAssignmentFormData) {
  const { schoolId } = await getSessionAndSchool()
  const validated = bulkFeeAssignmentSchema.parse(data)

  // Get fee structure
  const feeStructure = await db.feeStructure.findUnique({
    where: { id: validated.feeStructureId, schoolId },
  })

  if (!feeStructure) {
    throw new Error("Fee structure not found")
  }

  // Create fee assignments for each student
  const assignments = await Promise.all(
    validated.studentIds.map((studentId) =>
      db.feeAssignment.create({
        data: {
          schoolId,
          studentId,
          feeStructureId: validated.feeStructureId,
          academicYear: validated.academicYear,
          finalAmount: feeStructure.totalAmount,
        },
      })
    )
  )

  revalidatePath("/fees/assignments")
  return { success: true, count: assignments.length }
}

// Payment Actions
export async function recordPayment(data: PaymentFormData) {
  const { schoolId } = await getSessionAndSchool()
  const validated = paymentSchema.parse(data)

  // Generate unique numbers
  const paymentNumber = generatePaymentNumber()
  const receiptNumber = generateReceiptNumber()

  // Create payment
  const payment = await db.payment.create({
    data: {
      ...validated,
      schoolId,
      paymentNumber,
      receiptNumber,
      amount: new Decimal(validated.amount),
      status: "SUCCESS",
    },
  })

  // Update fee assignment status
  const feeAssignment = await db.feeAssignment.findUnique({
    where: { id: validated.feeAssignmentId },
    include: {
      payments: true,
    },
  })

  if (feeAssignment) {
    const totalPaid = feeAssignment.payments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      validated.amount
    )
    const finalAmount = feeAssignment.finalAmount.toNumber()

    let status: "PARTIAL" | "PAID" = "PARTIAL"
    if (totalPaid >= finalAmount) {
      status = "PAID"
    }

    await db.feeAssignment.update({
      where: { id: validated.feeAssignmentId },
      data: { status },
    })
  }

  revalidatePath("/fees/payments")
  return { success: true, payment, receiptNumber }
}

export async function getPayments(studentId?: string) {
  const { schoolId } = await getSessionAndSchool()

  const where: any = {
    schoolId,
    ...(studentId && { studentId }),
  }

  const payments = await db.payment.findMany({
    where,
    include: {
      student: {
        select: {
          studentId: true,
          givenName: true,
          surname: true,
        },
      },
      feeAssignment: {
        include: {
          feeStructure: {
            select: {
              name: true,
              academicYear: true,
            },
          },
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  })

  return payments
}

// Scholarship Actions
export async function createScholarship(data: ScholarshipFormData) {
  const { schoolId } = await getSessionAndSchool()
  const validated = scholarshipSchema.parse(data)

  const scholarship = await db.scholarship.create({
    data: {
      ...validated,
      schoolId,
      coverageAmount: new Decimal(validated.coverageAmount),
      maxFamilyIncome: validated.maxFamilyIncome
        ? new Decimal(validated.maxFamilyIncome)
        : null,
      minPercentage: validated.minPercentage
        ? new Decimal(validated.minPercentage)
        : null,
      eligibilityCriteria: {},
      categories: validated.categories || [],
      components: validated.components || [],
    },
  })

  revalidatePath("/fees/scholarships")
  return { success: true, scholarship }
}

export async function getScholarships() {
  const { schoolId } = await getSessionAndSchool()

  const scholarships = await db.scholarship.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  })

  return scholarships
}

// Refund Actions
export async function requestRefund(data: RefundFormData) {
  const { schoolId } = await getSessionAndSchool()
  const validated = refundSchema.parse(data)

  const refundNumber = `REF${new Date().getFullYear()}${Math.floor(
    Math.random() * 10000
  )
    .toString()
    .padStart(4, "0")}`

  const refund = await db.refund.create({
    data: {
      ...validated,
      schoolId,
      refundNumber,
      amount: new Decimal(validated.amount),
      supportingDocs: validated.supportingDocs || [],
    },
  })

  revalidatePath("/fees/refunds")
  return { success: true, refund }
}

export async function processRefund(
  refundId: string,
  action: "APPROVED" | "REJECTED",
  notes?: string
) {
  const { schoolId, userId } = await getSessionAndSchool()

  const status = action === "APPROVED" ? "PROCESSING" : "REJECTED"

  const refund = await db.refund.update({
    where: { id: refundId, schoolId },
    data: {
      status,
      processedBy: userId,
      processedDate: new Date(),
      approvalNotes: notes,
    },
  })

  if (action === "APPROVED") {
    // Update payment status
    await db.payment.update({
      where: { id: refund.paymentId },
      data: { status: "REFUNDED" },
    })
  }

  revalidatePath("/fees/refunds")
  return { success: true, refund }
}

// Dashboard Stats
export async function getFeeStats() {
  const { schoolId } = await getSessionAndSchool()

  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  const [
    totalAssignments,
    paidAssignments,
    partialAssignments,
    overdueAssignments,
    totalPayments,
    currentMonthPayments,
    totalScholarships,
    totalRefunds,
  ] = await Promise.all([
    db.feeAssignment.findMany({ where: { schoolId } }),
    db.feeAssignment.count({ where: { schoolId, status: "PAID" } }),
    db.feeAssignment.count({ where: { schoolId, status: "PARTIAL" } }),
    db.feeAssignment.count({ where: { schoolId, status: "OVERDUE" } }),
    db.payment.findMany({ where: { schoolId, status: "SUCCESS" } }),
    db.payment.findMany({
      where: {
        schoolId,
        status: "SUCCESS",
        paymentDate: { gte: currentMonth },
      },
    }),
    db.scholarshipApplication.count({
      where: { schoolId, status: "APPROVED" },
    }),
    db.refund.count({ where: { schoolId, status: "COMPLETED" } }),
  ])

  const totalDue = totalAssignments.reduce(
    (sum, a) => sum + a.finalAmount.toNumber(),
    0
  )

  const totalCollected = totalPayments.reduce(
    (sum, p) => sum + p.amount.toNumber(),
    0
  )

  const currentMonthCollection = currentMonthPayments.reduce(
    (sum, p) => sum + p.amount.toNumber(),
    0
  )

  const totalPending = totalDue - totalCollected
  const collectionRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0

  return {
    totalDue,
    totalCollected,
    totalPending,
    totalOverdue: totalDue * 0.1, // Simplified calculation
    collectionRate,
    studentsWithDues: totalAssignments.length - paidAssignments,
    studentsFullyPaid: paidAssignments,
    currentMonthCollection,
    scholarshipsAwarded: totalScholarships,
    refundsProcessed: totalRefunds,
  }
}

// Get student fee details
export async function getStudentFeeDetails(studentId: string) {
  const { schoolId } = await getSessionAndSchool()

  const assignments = await db.feeAssignment.findMany({
    where: { schoolId, studentId },
    include: {
      feeStructure: true,
      payments: true,
      scholarship: true,
    },
  })

  return assignments
}
