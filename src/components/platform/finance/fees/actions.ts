"use server"

/**
 * Fees Sub-Block Server Actions
 *
 * Multi-tenant safe server actions for student fee management
 * Includes: fee structures, assignments, payments, scholarships, and fines
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  bulkFeeAssignmentSchema,
  feeAssignmentSchema,
  feeStructureSchema,
  fineSchema,
  paymentSchema,
  scholarshipSchema,
  type BulkFeeAssignmentInput,
  type FeeAssignmentInput,
  type FeeStructureInput,
  type FineInput,
  type PaymentInput,
  type ScholarshipInput,
} from "./validation"

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// FEE STRUCTURE ACTIONS
// ============================================

/**
 * Get all fee structures for the current school
 */
export async function getFeeStructures(): Promise<ActionResult<any[]>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const feeStructures = await db.feeStructure.findMany({
      where: { schoolId, isActive: true },
      include: {
        class: { select: { id: true, name: true } },
        _count: { select: { feeAssignments: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: feeStructures }
  } catch (error) {
    console.error("Error fetching fee structures:", error)
    return { success: false, error: "Failed to fetch fee structures" }
  }
}

/**
 * Create a new fee structure
 */
export async function createFeeStructure(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    // Extract and validate data
    const formData = Object.fromEntries(data)

    // Create fee structure with actual Prisma schema
    const feeStructure = await db.feeStructure.create({
      data: {
        schoolId,
        name: formData.name as string,
        academicYear: formData.academicYear as string,
        classId: formData.classId as string | undefined,
        stream: formData.stream as string | undefined,
        description: formData.description as string | undefined,
        tuitionFee: parseFloat(formData.tuitionFee as string),
        admissionFee: formData.admissionFee
          ? parseFloat(formData.admissionFee as string)
          : null,
        registrationFee: formData.registrationFee
          ? parseFloat(formData.registrationFee as string)
          : null,
        examFee: formData.examFee
          ? parseFloat(formData.examFee as string)
          : null,
        libraryFee: formData.libraryFee
          ? parseFloat(formData.libraryFee as string)
          : null,
        laboratoryFee: formData.laboratoryFee
          ? parseFloat(formData.laboratoryFee as string)
          : null,
        sportsFee: formData.sportsFee
          ? parseFloat(formData.sportsFee as string)
          : null,
        transportFee: formData.transportFee
          ? parseFloat(formData.transportFee as string)
          : null,
        hostelFee: formData.hostelFee
          ? parseFloat(formData.hostelFee as string)
          : null,
        totalAmount: parseFloat(formData.totalAmount as string),
        installments: parseInt(formData.installments as string, 10) || 1,
        isActive: true,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: feeStructure.id }
  } catch (error) {
    console.error("Error creating fee structure:", error)
    return { success: false, error: "Failed to create fee structure" }
  }
}

// ============================================
// FEE ASSIGNMENT ACTIONS
// ============================================

/**
 * Assign fee to a student
 */
export async function assignFee(data: FormData): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    // Check if student already has this fee assigned
    const existing = await db.feeAssignment.findFirst({
      where: {
        schoolId,
        studentId: formData.studentId as string,
        feeStructureId: formData.feeStructureId as string,
        academicYear: formData.academicYear as string,
      },
    })

    if (existing) {
      return { success: false, error: "Fee already assigned to this student" }
    }

    const feeAssignment = await db.feeAssignment.create({
      data: {
        schoolId,
        studentId: formData.studentId as string,
        feeStructureId: formData.feeStructureId as string,
        academicYear: formData.academicYear as string,
        finalAmount: parseFloat(formData.finalAmount as string),
        customAmount: formData.customAmount
          ? parseFloat(formData.customAmount as string)
          : null,
        totalDiscount: formData.totalDiscount
          ? parseFloat(formData.totalDiscount as string)
          : 0,
        scholarshipId: formData.scholarshipId as string | undefined,
        status: "PENDING",
      },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: feeAssignment.id }
  } catch (error) {
    console.error("Error assigning fee:", error)
    return { success: false, error: "Failed to assign fee" }
  }
}

/**
 * Assign fee to multiple students (bulk operation)
 */
export async function bulkAssignFees(
  data: FormData
): Promise<ActionResult<number>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)
    const studentIds = JSON.parse(formData.studentIds as string) as string[]
    const feeStructureId = formData.feeStructureId as string
    const academicYear = formData.academicYear as string
    const finalAmount = parseFloat(formData.finalAmount as string)

    // Get fee structure to ensure it exists
    const feeStructure = await db.feeStructure.findFirst({
      where: { id: feeStructureId, schoolId },
    })

    if (!feeStructure) {
      return { success: false, error: "Fee structure not found" }
    }

    // Create assignments for all students
    const assignments = await db.feeAssignment.createMany({
      data: studentIds.map((studentId) => ({
        schoolId,
        studentId,
        feeStructureId,
        academicYear,
        finalAmount,
        totalDiscount: 0,
        status: "PENDING",
      })),
      skipDuplicates: true, // Skip if already assigned
    })

    revalidatePath("/finance/fees")
    return { success: true, data: assignments.count }
  } catch (error) {
    console.error("Error bulk assigning fees:", error)
    return { success: false, error: "Failed to assign fees" }
  }
}

/**
 * Get fee assignments for a student
 */
export async function getStudentFees(
  studentId: string
): Promise<ActionResult<any[]>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const feeAssignments = await db.feeAssignment.findMany({
      where: { schoolId, studentId },
      include: {
        feeStructure: { select: { name: true, description: true } },
        payments: { select: { amount: true, paymentDate: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: feeAssignments }
  } catch (error) {
    console.error("Error fetching student fees:", error)
    return { success: false, error: "Failed to fetch student fees" }
  }
}

// ============================================
// PAYMENT ACTIONS
// ============================================

/**
 * Record a payment for a fee
 */
export async function recordPayment(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)
    const feeAssignmentId = formData.feeAssignmentId as string
    const amount = parseFloat(formData.amount as string)

    // Get fee assignment
    const feeAssignment = await db.feeAssignment.findFirst({
      where: { id: feeAssignmentId, schoolId },
      include: { payments: true },
    })

    if (!feeAssignment) {
      return { success: false, error: "Fee assignment not found" }
    }

    // Calculate total paid
    const totalPaid = feeAssignment.payments.reduce(
      (sum, p) => sum + (p.status === "SUCCESS" ? Number(p.amount) : 0),
      0
    )

    const newTotalPaid = totalPaid + amount
    const finalAmount = Number(feeAssignment.finalAmount)

    // Determine new status
    let newStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" =
      "PENDING"
    if (newTotalPaid >= finalAmount) {
      newStatus = "PAID"
    } else if (newTotalPaid > 0) {
      newStatus = "PARTIAL"
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        schoolId,
        feeAssignmentId,
        studentId: feeAssignment.studentId,
        paymentNumber:
          `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        amount,
        paymentMethod: formData.paymentMethod as any,
        paymentDate: new Date(formData.paymentDate as string),
        status: "SUCCESS",
        receiptNumber:
          `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
        transactionId: formData.transactionId as string | undefined,
        remarks: formData.remarks as string | undefined,
      },
    })

    // Update fee assignment status
    await db.feeAssignment.update({
      where: { id: feeAssignmentId },
      data: { status: newStatus },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: payment.id }
  } catch (error) {
    console.error("Error recording payment:", error)
    return { success: false, error: "Failed to record payment" }
  }
}

// ============================================
// SCHOLARSHIP ACTIONS
// ============================================

/**
 * Apply scholarship to a fee assignment
 */
export async function applyScholarship(
  feeAssignmentId: string,
  scholarshipId: string,
  scholarshipAmount: number
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    // Verify scholarship exists
    const scholarship = await db.scholarship.findFirst({
      where: { id: scholarshipId, schoolId, isActive: true },
    })

    if (!scholarship) {
      return { success: false, error: "Scholarship not found" }
    }

    // Update fee assignment
    await db.feeAssignment.update({
      where: { id: feeAssignmentId, schoolId },
      data: {
        scholarshipId,
        totalDiscount: scholarshipAmount,
        finalAmount: {
          decrement: scholarshipAmount,
        },
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error applying scholarship:", error)
    return { success: false, error: "Failed to apply scholarship" }
  }
}

// ============================================
// FINE ACTIONS
// ============================================

/**
 * Issue a fine to a student
 */
export async function issueFine(data: FormData): Promise<ActionResult<string>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const formData = Object.fromEntries(data)

    const fine = await db.fine.create({
      data: {
        schoolId,
        studentId: formData.studentId as string,
        fineType: formData.fineType as any,
        amount: parseFloat(formData.amount as string),
        reason: formData.reason as string,
        dueDate: new Date(formData.dueDate as string),
        isPaid: false,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: fine.id }
  } catch (error) {
    console.error("Error issuing fine:", error)
    return { success: false, error: "Failed to issue fine" }
  }
}

/**
 * Waive a fine
 */
export async function waiveFine(
  fineId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    await db.fine.update({
      where: { id: fineId, schoolId },
      data: {
        isWaived: true,
        waivedBy: session.user.id,
        waivedDate: new Date(),
        waiverReason: reason,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error waiving fine:", error)
    return { success: false, error: "Failed to waive fine" }
  }
}

// ============================================
// REPORTING ACTIONS
// ============================================

/**
 * Get fee collection summary for the school
 */
export async function getFeeCollectionSummary(): Promise<ActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user?.id || !schoolId) {
      return { success: false, error: "Not authenticated" }
    }

    const [
      totalAssignments,
      paidAssignments,
      partialAssignments,
      pendingAssignments,
      totalPayments,
    ] = await Promise.all([
      db.feeAssignment.count({ where: { schoolId } }),
      db.feeAssignment.count({ where: { schoolId, status: "PAID" } }),
      db.feeAssignment.count({ where: { schoolId, status: "PARTIAL" } }),
      db.feeAssignment.count({ where: { schoolId, status: "PENDING" } }),
      db.payment.aggregate({
        where: { schoolId, status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    return {
      success: true,
      data: {
        totalAssignments,
        paidAssignments,
        partialAssignments,
        pendingAssignments,
        totalCollected: totalPayments._sum.amount || 0,
        paymentCount: totalPayments._count,
      },
    }
  } catch (error) {
    console.error("Error fetching fee collection summary:", error)
    return { success: false, error: "Failed to fetch summary" }
  }
}
