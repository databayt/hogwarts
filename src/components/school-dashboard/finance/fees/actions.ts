"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Fees Sub-Block Server Actions
 *
 * Multi-tenant safe server actions for student fee management
 * Includes: fee structures, assignments, payments, scholarships, and fines
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { checkCurrentUserPermission } from "../lib/permissions"
import {
  calculateSiblingDiscount,
  getFeeAssignmentList,
  getFineList,
  getPaymentList,
  getScholarshipList,
  type DiscountPolicy,
} from "./queries"
import { feeStructureSchema } from "./validation"

// Interpolate {key} placeholders in dictionary strings. Mirrors the
// internationalization helpers' interpolate() but is usable server-side
// without loading ValidationHelper for a notification dispatch.
function interp(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
    template
  )
}

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// AUTH + RBAC HELPER
// ============================================

async function requireFeePermission(
  action: "view" | "create" | "edit" | "delete" | "approve"
): Promise<{ userId: string; schoolId: string } | ActionResult<never>> {
  const session = await auth()
  if (!session?.user?.id) {
    return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return actionError(ACTION_ERRORS.MISSING_SCHOOL)
  }

  const allowed = await checkCurrentUserPermission(schoolId, "fees", action)
  if (!allowed) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  return { userId: session.user.id, schoolId }
}

function isAuthError(
  result: { userId: string; schoolId: string } | ActionResult<never>
): result is ActionResult<never> {
  return "success" in result && result.success === false
}

// ============================================
// FEE STRUCTURE ACTIONS
// ============================================

/**
 * Get all fee structures for the current school
 */
export async function getFeeStructures(): Promise<ActionResult<any[]>> {
  try {
    const ctx = await requireFeePermission("view")
    if (isAuthError(ctx)) return ctx

    const feeStructures = await db.feeStructure.findMany({
      where: { schoolId: ctx.schoolId },
      include: {
        class: { select: { id: true, name: true } },
        _count: { select: { feeAssignments: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: feeStructures }
  } catch (error) {
    console.error("Error fetching fee structures:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Create a new fee structure
 */
export async function createFeeStructure(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const raw = Object.fromEntries(data)

    // Parse FormData strings to numbers for Zod validation
    const parsed = feeStructureSchema.safeParse({
      name: raw.name,
      academicYear: raw.academicYear,
      classId: raw.classId || null,
      stream: raw.stream || null,
      description: raw.description || null,
      tuitionFee: parseFloat(raw.tuitionFee as string),
      admissionFee: raw.admissionFee
        ? parseFloat(raw.admissionFee as string)
        : null,
      registrationFee: raw.registrationFee
        ? parseFloat(raw.registrationFee as string)
        : null,
      examFee: raw.examFee ? parseFloat(raw.examFee as string) : null,
      libraryFee: raw.libraryFee ? parseFloat(raw.libraryFee as string) : null,
      laboratoryFee: raw.laboratoryFee
        ? parseFloat(raw.laboratoryFee as string)
        : null,
      sportsFee: raw.sportsFee ? parseFloat(raw.sportsFee as string) : null,
      transportFee: raw.transportFee
        ? parseFloat(raw.transportFee as string)
        : null,
      hostelFee: raw.hostelFee ? parseFloat(raw.hostelFee as string) : null,
      totalAmount: parseFloat(raw.totalAmount as string),
      installments: parseInt(raw.installments as string, 10) || 1,
      lateFeeAmount: raw.lateFeeAmount
        ? parseFloat(raw.lateFeeAmount as string)
        : null,
      lateFeeType: raw.lateFeeType || null,
      paymentSchedule: raw.paymentSchedule
        ? JSON.parse(raw.paymentSchedule as string)
        : undefined,
      discountPolicy: raw.discountPolicy
        ? JSON.parse(raw.discountPolicy as string)
        : undefined,
      isActive: true,
    })

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((issue) => issue.message).join(", "),
      }
    }

    const feeStructure = await db.feeStructure.create({
      data: {
        schoolId: ctx.schoolId,
        ...parsed.data,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: feeStructure.id }
  } catch (error) {
    console.error("Error creating fee structure:", error)
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

/**
 * Update an existing fee structure
 */
export async function updateFeeStructure(
  id: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("edit")
    if (isAuthError(ctx)) return ctx

    const existing = await db.feeStructure.findFirst({
      where: { id, schoolId: ctx.schoolId },
    })
    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    const formData = Object.fromEntries(data)

    await db.feeStructure.update({
      where: { id },
      data: {
        name: formData.name as string,
        academicYear: formData.academicYear as string,
        classId: (formData.classId as string) || null,
        stream: (formData.stream as string) || null,
        description: (formData.description as string) || null,
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
        lateFeeAmount: formData.lateFeeAmount
          ? parseFloat(formData.lateFeeAmount as string)
          : null,
        lateFeeType: (formData.lateFeeType as any) || null,
        paymentSchedule: formData.paymentSchedule
          ? JSON.parse(formData.paymentSchedule as string)
          : undefined,
        discountPolicy: formData.discountPolicy
          ? JSON.parse(formData.discountPolicy as string)
          : undefined,
        isActive:
          formData.isActive !== undefined
            ? formData.isActive === "true"
            : undefined,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error updating fee structure:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

/**
 * Delete a fee structure (blocked if it has assignments)
 */
export async function deleteFeeStructure(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("delete")
    if (isAuthError(ctx)) return ctx

    const structure = await db.feeStructure.findFirst({
      where: { id, schoolId: ctx.schoolId },
      include: { _count: { select: { feeAssignments: true } } },
    })

    if (!structure) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (structure._count.feeAssignments > 0) {
      return actionError(ACTION_ERRORS.FEE_STRUCTURE_HAS_ASSIGNMENTS)
    }

    await db.feeStructure.delete({ where: { id } })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error deleting fee structure:", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

/**
 * Toggle fee structure active/inactive
 */
export async function toggleFeeStructureActive(
  id: string
): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("edit")
    if (isAuthError(ctx)) return ctx

    const structure = await db.feeStructure.findFirst({
      where: { id, schoolId: ctx.schoolId },
      select: { isActive: true },
    })

    if (!structure) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    await db.feeStructure.update({
      where: { id },
      data: { isActive: !structure.isActive },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error toggling fee structure:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
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
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)

    // Check if student already has this fee assigned
    const existing = await db.feeAssignment.findFirst({
      where: {
        schoolId: ctx.schoolId,
        studentId: formData.studentId as string,
        feeStructureId: formData.feeStructureId as string,
        academicYear: formData.academicYear as string,
      },
    })

    if (existing) {
      return actionError(ACTION_ERRORS.FEE_ALREADY_ASSIGNED)
    }

    const studentId = formData.studentId as string
    const feeStructureId = formData.feeStructureId as string
    const academicYear = formData.academicYear as string
    const baseAmount = parseFloat(formData.finalAmount as string)
    let manualDiscount = formData.totalDiscount
      ? parseFloat(formData.totalDiscount as string)
      : 0

    // Auto-calculate sibling discount
    const { discountAmount: siblingDiscount, discountEntries } =
      await calculateSiblingDiscount(
        studentId,
        ctx.schoolId,
        feeStructureId,
        academicYear,
        baseAmount
      )

    // Merge existing manual discounts with sibling discount
    const existingDiscounts = formData.discounts
      ? (JSON.parse(formData.discounts as string) as Array<{
          type: string
          amount: number
          reason: string
        }>)
      : []
    const allDiscounts = [...existingDiscounts, ...discountEntries]
    const totalDiscount = manualDiscount + siblingDiscount
    const finalAmount = Math.max(baseAmount - totalDiscount, 0)

    const feeAssignment = await db.feeAssignment.create({
      data: {
        schoolId: ctx.schoolId,
        studentId,
        feeStructureId,
        academicYear,
        finalAmount,
        customAmount: formData.customAmount
          ? parseFloat(formData.customAmount as string)
          : null,
        totalDiscount,
        discounts: allDiscounts.length > 0 ? allDiscounts : undefined,
        scholarshipId: formData.scholarshipId as string | undefined,
        status: "PENDING",
      },
    })

    // Look up school's preferred language and load the dictionary once so
    // every downstream dispatch avoids ternary-per-sentence duplication.
    const schoolPref = await db.school.findFirst({
      where: { id: ctx.schoolId },
      select: { preferredLanguage: true },
    })
    const schoolLang = (schoolPref?.preferredLanguage ?? "ar") as Locale
    const dict = await getDictionary(schoolLang)
    const n = (dict as any)?.finance?.notifications as
      | Record<string, string>
      | undefined
    const amountStr = parseFloat(
      formData.finalAmount as string
    ).toLocaleString()
    const student = await db.student.findFirst({
      where: { id: formData.studentId as string, schoolId: ctx.schoolId },
      select: { userId: true, firstName: true, lastName: true },
    })
    if (student?.userId) {
      dispatchNotification({
        schoolId: ctx.schoolId,
        userId: student.userId,
        type: "fee_due",
        title: n?.feeDueTitle || "New Fee Assignment",
        body: interp(
          n?.feeDueStudentBody ||
            "A fee of {amount} has been assigned to your account",
          { amount: amountStr }
        ),
        lang: schoolLang,
        priority: "high",
        channels: ["in_app", "email"],
        metadata: {
          feeAssignmentId: feeAssignment.id,
          amount: parseFloat(formData.finalAmount as string),
          url: "/finance/fees",
        },
        actorId: ctx.userId,
      }).catch((err) => console.error("[assignFee] Notification error:", err))
    }

    if (student) {
      const studentName = `${student.firstName} ${student.lastName}`
      const guardianLinks = await db.studentGuardian.findMany({
        where: {
          studentId: formData.studentId as string,
          schoolId: ctx.schoolId,
        },
        select: { guardian: { select: { userId: true } } },
      })
      for (const link of guardianLinks) {
        if (link.guardian?.userId) {
          dispatchNotification({
            schoolId: ctx.schoolId,
            userId: link.guardian.userId,
            type: "fee_due",
            title: n?.feeDueTitle || "New Fee Assignment",
            body: interp(
              n?.feeDueGuardianBody ||
                "A fee of {amount} has been assigned to {studentName}",
              { amount: amountStr, studentName }
            ),
            lang: schoolLang,
            priority: "high",
            channels: ["in_app", "email"],
            metadata: {
              feeAssignmentId: feeAssignment.id,
              amount: parseFloat(formData.finalAmount as string),
              studentName,
              url: "/finance/fees",
            },
            actorId: ctx.userId,
          }).catch((err) =>
            console.error("[assignFee] Guardian notification error:", err)
          )
        }
      }
    }

    revalidatePath("/finance/fees")
    return { success: true, data: feeAssignment.id }
  } catch (error) {
    console.error("Error assigning fee:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Assign fee to multiple students (bulk operation)
 */
export async function bulkAssignFees(
  data: FormData
): Promise<ActionResult<number>> {
  try {
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)
    const studentIds = JSON.parse(formData.studentIds as string) as string[]
    const feeStructureId = formData.feeStructureId as string
    const academicYear = formData.academicYear as string
    const finalAmount = parseFloat(formData.finalAmount as string)

    // Get fee structure to ensure it exists
    const feeStructure = await db.feeStructure.findFirst({
      where: { id: feeStructureId, schoolId: ctx.schoolId },
    })

    if (!feeStructure) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Calculate per-student sibling discounts and create assignments
    const assignmentData = await Promise.all(
      studentIds.map(async (studentId) => {
        const { discountAmount, discountEntries } =
          await calculateSiblingDiscount(
            studentId,
            ctx.schoolId,
            feeStructureId,
            academicYear,
            finalAmount
          )
        return {
          schoolId: ctx.schoolId,
          studentId,
          feeStructureId,
          academicYear,
          finalAmount: Math.max(finalAmount - discountAmount, 0),
          totalDiscount: discountAmount,
          discounts:
            discountEntries.length > 0
              ? (discountEntries as any)
              : Prisma.JsonNull,
          status: "PENDING" as const,
        }
      })
    )

    const assignments = await db.feeAssignment.createMany({
      data: assignmentData,
      skipDuplicates: true,
    })

    // Dispatch fee_due notifications for all assigned students (non-blocking)
    try {
      const schoolPref = await db.school.findFirst({
        where: { id: ctx.schoolId },
        select: { preferredLanguage: true },
      })
      const schoolLang = (schoolPref?.preferredLanguage ?? "ar") as Locale
      const dict = await getDictionary(schoolLang)
      const n = (dict as any)?.finance?.notifications as
        | Record<string, string>
        | undefined

      for (const studentId of studentIds) {
        const student = await db.student.findUnique({
          where: { id: studentId },
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            studentGuardians: {
              select: {
                guardian: {
                  select: { userId: true },
                },
              },
            },
          },
        })
        if (!student?.userId) continue

        const studentName = [student.firstName, student.lastName]
          .filter(Boolean)
          .join(" ")

        // Find this student's actual final amount from assignmentData
        const studentData = assignmentData.find(
          (a) => a.studentId === studentId
        )
        const amount = studentData
          ? Number(studentData.finalAmount)
          : finalAmount
        const amountStr = amount.toLocaleString()

        // Notify student
        dispatchNotification({
          schoolId: ctx.schoolId,
          userId: student.userId,
          type: "fee_due",
          title: n?.feeDueTitle || "New Fee Assignment",
          body: interp(
            n?.feeDueStudentBody ||
              "A fee of {amount} has been assigned to your account",
            { amount: amountStr }
          ),
          lang: schoolLang,
          priority: "high",
          channels: ["in_app", "email"],
          metadata: {
            amount,
            url: "/finance/fees",
          },
          actorId: ctx.userId,
        }).catch((err) =>
          console.error("[bulkAssignFees] Student notification error:", err)
        )

        for (const sg of student.studentGuardians) {
          if (sg.guardian?.userId) {
            dispatchNotification({
              schoolId: ctx.schoolId,
              userId: sg.guardian.userId,
              type: "fee_due",
              title: n?.feeDueTitle || "New Fee Assignment",
              body: interp(
                n?.feeDueGuardianBody ||
                  "A fee of {amount} has been assigned to {studentName}",
                { amount: amountStr, studentName }
              ),
              lang: schoolLang,
              priority: "high",
              channels: ["in_app", "email"],
              metadata: {
                amount,
                studentName,
                url: "/finance/fees",
              },
              actorId: ctx.userId,
            }).catch((err) =>
              console.error(
                "[bulkAssignFees] Guardian notification error:",
                err
              )
            )
          }
        }
      }
    } catch (notifError) {
      console.warn("[bulkAssignFees] Notification dispatch failed:", notifError)
    }

    revalidatePath("/finance/fees")
    return { success: true, data: assignments.count }
  } catch (error) {
    console.error("Error bulk assigning fees:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Delete a fee assignment (blocked if it has payments)
 */
export async function deleteFeeAssignment(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("delete")
    if (isAuthError(ctx)) return ctx

    const assignment = await db.feeAssignment.findFirst({
      where: { id, schoolId: ctx.schoolId },
      include: { _count: { select: { payments: true } } },
    })

    if (!assignment) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (assignment._count.payments > 0) {
      return actionError(ACTION_ERRORS.FEE_ASSIGNMENT_HAS_PAYMENTS)
    }

    // Unlink invoices (preserve for audit trail) then delete assignment
    await db.userInvoice.updateMany({
      where: { feeAssignmentId: id, schoolId: ctx.schoolId },
      data: { feeAssignmentId: null },
    })

    await db.feeAssignment.delete({ where: { id } })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error deleting fee assignment:", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

/**
 * Student fee assignment with computed paid amount and payment details
 */
export type StudentFeeAssignment = {
  id: string
  feeStructureName: string
  academicYear: string
  finalAmount: number
  totalDiscount: number
  paidAmount: number
  status: string
  payments: Array<{
    id: string
    paymentNumber: string
    receiptNumber: string
    amount: number
    paymentDate: string
    paymentMethod: string
    status: string
  }>
}

/**
 * Get fee assignments for a student with full payment details.
 * Used by both the My Fees page and the student profile fees tab.
 */
export async function getStudentFees(
  studentId: string
): Promise<ActionResult<StudentFeeAssignment[]>> {
  try {
    const ctx = await requireFeePermission("view")
    if (isAuthError(ctx)) return ctx

    const feeAssignments = await db.feeAssignment.findMany({
      where: { schoolId: ctx.schoolId, studentId },
      include: {
        feeStructure: { select: { name: true } },
        payments: {
          where: { status: "SUCCESS" },
          select: {
            id: true,
            paymentNumber: true,
            receiptNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            status: true,
          },
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const data: StudentFeeAssignment[] = feeAssignments.map((a) => ({
      id: a.id,
      feeStructureName: a.feeStructure?.name || "-",
      academicYear: a.academicYear,
      finalAmount: Number(a.finalAmount),
      totalDiscount: Number(a.totalDiscount),
      paidAmount: a.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      status: a.status,
      payments: a.payments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        receiptNumber: p.receiptNumber,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
        paymentMethod: p.paymentMethod,
        status: p.status,
      })),
    }))

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching student fees:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
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
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)
    const feeAssignmentId = formData.feeAssignmentId as string
    const amount = parseFloat(formData.amount as string)

    // Get fee assignment with fee structure for discount policy
    const feeAssignment = await db.feeAssignment.findFirst({
      where: { id: feeAssignmentId, schoolId: ctx.schoolId },
      include: {
        payments: true,
        feeStructure: {
          select: {
            discountPolicy: true,
            paymentSchedule: true,
          },
        },
      },
    })

    if (!feeAssignment) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Calculate total paid
    const totalPaid = feeAssignment.payments.reduce(
      (sum, p) => sum + (p.status === "SUCCESS" ? Number(p.amount) : 0),
      0
    )

    // Apply early payment discount on first payment if eligible
    let finalAmount = Number(feeAssignment.finalAmount)
    let earlyDiscountApplied = 0
    if (totalPaid === 0) {
      const policy = feeAssignment.feeStructure
        ?.discountPolicy as DiscountPolicy | null
      if (policy?.earlyPaymentDiscount) {
        const { type, value, deadlineDays } = policy.earlyPaymentDiscount
        // Find earliest due date from payment schedule
        const schedule = feeAssignment.feeStructure?.paymentSchedule as Array<{
          dueDate: string
        }> | null
        const earliestDue = schedule?.length
          ? new Date(
              schedule.reduce((earliest, entry) =>
                new Date(entry.dueDate) < new Date(earliest.dueDate)
                  ? entry
                  : earliest
              ).dueDate
            )
          : null
        if (earliestDue) {
          const deadlineDate = new Date(earliestDue)
          deadlineDate.setDate(deadlineDate.getDate() - deadlineDays)
          if (new Date() <= deadlineDate) {
            earlyDiscountApplied =
              type === "PERCENTAGE"
                ? finalAmount * (value / 100)
                : Math.min(value, finalAmount)
            finalAmount = Math.max(finalAmount - earlyDiscountApplied, 0)
            // Persist the reduced final amount
            await db.feeAssignment.update({
              where: { id: feeAssignmentId },
              data: {
                finalAmount,
                totalDiscount:
                  Number(feeAssignment.totalDiscount ?? 0) +
                  earlyDiscountApplied,
              },
            })
          }
        }
      }
    }

    const newTotalPaid = totalPaid + amount

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
        schoolId: ctx.schoolId,
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

    // Sync linked invoice status — reflect partial payments properly
    try {
      const linkedInvoice = await db.userInvoice.findFirst({
        where: { feeAssignmentId, schoolId: ctx.schoolId },
      })
      if (linkedInvoice) {
        const invoiceStatus = newStatus === "PAID" ? "PAID" : "UNPAID"
        await db.userInvoice.update({
          where: { id: linkedInvoice.id },
          data: {
            status: invoiceStatus as any,
            total: finalAmount,
            // Store paid amount in notes for tracking until schema supports amountPaid
            notes: linkedInvoice.notes
              ? `${linkedInvoice.notes}\nPayment: ${amount} on ${new Date().toISOString().split("T")[0]} (Total paid: ${newTotalPaid})`
              : `Payment: ${amount} on ${new Date().toISOString().split("T")[0]} (Total paid: ${newTotalPaid})`,
          },
        })
      }
    } catch (invoiceSyncErr) {
      console.warn("[recordPayment] Invoice sync failed:", invoiceSyncErr)
    }

    const schoolPref2 = await db.school.findFirst({
      where: { id: ctx.schoolId },
      select: { preferredLanguage: true },
    })
    const schoolLang2 = (schoolPref2?.preferredLanguage ?? "ar") as Locale
    const dict2 = await getDictionary(schoolLang2)
    const n2 = (dict2 as any)?.finance?.notifications as
      | Record<string, string>
      | undefined
    const amountStr2 = amount.toLocaleString()
    const remainingStr = (finalAmount - newTotalPaid).toLocaleString()
    const studentBodyKey =
      newStatus === "PAID"
        ? "paymentRecordedStudentFull"
        : "paymentRecordedStudentPartial"
    const guardianBodyKey =
      newStatus === "PAID"
        ? "paymentRecordedGuardianFull"
        : "paymentRecordedGuardianPartial"
    const studentBodyFallback =
      newStatus === "PAID"
        ? "Payment of {amount} recorded. Fee fully paid."
        : "Payment of {amount} recorded. Remaining: {remaining}"
    const guardianBodyFallback =
      newStatus === "PAID"
        ? "Payment of {amount} recorded for student. Fee fully paid."
        : "Payment of {amount} recorded for student. Remaining: {remaining}"

    const student = await db.student.findFirst({
      where: { id: feeAssignment.studentId, schoolId: ctx.schoolId },
      select: { userId: true },
    })
    if (student?.userId) {
      dispatchNotification({
        schoolId: ctx.schoolId,
        userId: student.userId,
        type: "fee_paid",
        title: n2?.paymentReceivedTitle || "Payment Received",
        body: interp(n2?.[studentBodyKey] || studentBodyFallback, {
          amount: amountStr2,
          remaining: remainingStr,
        }),
        lang: schoolLang2,
        priority: "normal",
        channels: ["in_app"],
        metadata: {
          paymentId: payment.id,
          feeAssignmentId,
          amount,
          status: newStatus,
          url: "/finance/fees",
        },
        actorId: ctx.userId,
      }).catch((err) =>
        console.error("[recordPayment] Notification error:", err)
      )
    }

    const guardianLinks = await db.studentGuardian.findMany({
      where: { studentId: feeAssignment.studentId, schoolId: ctx.schoolId },
      select: { guardian: { select: { userId: true } } },
    })
    for (const link of guardianLinks) {
      if (link.guardian?.userId) {
        dispatchNotification({
          schoolId: ctx.schoolId,
          userId: link.guardian.userId,
          type: "fee_paid",
          title: n2?.paymentReceivedTitle || "Payment Received",
          body: interp(n2?.[guardianBodyKey] || guardianBodyFallback, {
            amount: amountStr2,
            remaining: remainingStr,
          }),
          lang: schoolLang2,
          priority: "normal",
          channels: ["in_app", "email"],
          metadata: {
            paymentId: payment.id,
            feeAssignmentId,
            amount,
            status: newStatus,
            url: "/finance/fees",
          },
          actorId: ctx.userId,
        }).catch((err) =>
          console.error("[recordPayment] Guardian notification error:", err)
        )
      }
    }

    revalidatePath("/finance/fees")
    return { success: true, data: payment.id }
  } catch (error) {
    console.error("Error recording payment:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Delete a payment (only if it's the latest and not verified)
 */
export async function deletePayment(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("delete")
    if (isAuthError(ctx)) return ctx

    const payment = await db.payment.findFirst({
      where: { id, schoolId: ctx.schoolId },
      select: {
        id: true,
        feeAssignmentId: true,
        amount: true,
        status: true,
        verifiedBy: true,
        refund: { select: { id: true } },
      },
    })

    if (!payment) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (payment.verifiedBy) {
      return actionError(ACTION_ERRORS.PAYMENT_CANNOT_DELETE)
    }

    if (payment.refund) {
      return actionError(ACTION_ERRORS.PAYMENT_HAS_REFUND)
    }

    // Delete the payment
    await db.payment.delete({ where: { id } })

    // Recalculate fee assignment status (preserve OVERDUE if it was overdue)
    const remainingPayments = await db.payment.aggregate({
      where: {
        feeAssignmentId: payment.feeAssignmentId,
        schoolId: ctx.schoolId,
        status: "SUCCESS",
      },
      _sum: { amount: true },
    })

    const assignment = await db.feeAssignment.findFirst({
      where: { id: payment.feeAssignmentId },
      select: { finalAmount: true, status: true },
    })

    if (assignment) {
      const totalPaid = Number(remainingPayments._sum.amount ?? 0)
      const finalAmount = Number(assignment.finalAmount)
      const wasOverdue = assignment.status === "OVERDUE"

      let newStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = wasOverdue
        ? "OVERDUE"
        : "PENDING"
      if (totalPaid >= finalAmount) newStatus = "PAID"
      else if (totalPaid > 0) newStatus = "PARTIAL"

      await db.feeAssignment.update({
        where: { id: payment.feeAssignmentId },
        data: { status: newStatus },
      })
    }

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error deleting payment:", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
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
    const ctx = await requireFeePermission("approve")
    if (isAuthError(ctx)) return ctx

    // Verify scholarship exists
    const scholarship = await db.scholarship.findFirst({
      where: { id: scholarshipId, schoolId: ctx.schoolId, isActive: true },
    })

    if (!scholarship) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Update fee assignment
    const updatedAssignment = await db.feeAssignment.update({
      where: { id: feeAssignmentId, schoolId: ctx.schoolId },
      data: {
        scholarshipId,
        totalDiscount: { increment: scholarshipAmount },
        finalAmount: {
          decrement: scholarshipAmount,
        },
      },
    })

    // Sync linked invoice total (non-blocking)
    try {
      const linkedInvoice = await db.userInvoice.findFirst({
        where: { feeAssignmentId, schoolId: ctx.schoolId },
        include: { items: true },
      })
      if (linkedInvoice) {
        const newTotal = Number(updatedAssignment.finalAmount)
        await db.userInvoice.update({
          where: { id: linkedInvoice.id },
          data: {
            sub_total: newTotal,
            total: newTotal,
            discount: scholarshipAmount,
          },
        })
        // Update the invoice item amount to match
        if (linkedInvoice.items.length === 1) {
          await db.userInvoiceItem.update({
            where: { id: linkedInvoice.items[0].id },
            data: { price: newTotal, total: newTotal },
          })
        }
      }
    } catch (invoiceSyncErr) {
      console.warn("[applyScholarship] Invoice sync failed:", invoiceSyncErr)
    }

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error applying scholarship:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Create a new scholarship
 */
export async function createScholarship(
  data: FormData
): Promise<ActionResult<string>> {
  try {
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)

    const scholarship = await db.scholarship.create({
      data: {
        schoolId: ctx.schoolId,
        name: formData.name as string,
        description: (formData.description as string) || undefined,
        coverageType: formData.coverageType as any,
        coverageAmount: parseFloat(formData.coverageAmount as string),
        academicYear: formData.academicYear as string,
        startDate: new Date(formData.startDate as string),
        endDate: new Date(formData.endDate as string),
        maxBeneficiaries: formData.maxBeneficiaries
          ? parseInt(formData.maxBeneficiaries as string, 10)
          : null,
        minPercentage: formData.minPercentage
          ? parseFloat(formData.minPercentage as string)
          : null,
        maxFamilyIncome: formData.maxFamilyIncome
          ? parseFloat(formData.maxFamilyIncome as string)
          : null,
        isActive: true,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true, data: scholarship.id }
  } catch (error) {
    console.error("Error creating scholarship:", error)
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

/**
 * Update an existing scholarship
 */
export async function updateScholarship(
  id: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("edit")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)

    await db.scholarship.update({
      where: { id, schoolId: ctx.schoolId },
      data: {
        name: formData.name as string,
        description: (formData.description as string) || undefined,
        coverageType: formData.coverageType as any,
        coverageAmount: parseFloat(formData.coverageAmount as string),
        academicYear: formData.academicYear as string,
        startDate: new Date(formData.startDate as string),
        endDate: new Date(formData.endDate as string),
        maxBeneficiaries: formData.maxBeneficiaries
          ? parseInt(formData.maxBeneficiaries as string, 10)
          : null,
        minPercentage: formData.minPercentage
          ? parseFloat(formData.minPercentage as string)
          : null,
        maxFamilyIncome: formData.maxFamilyIncome
          ? parseFloat(formData.maxFamilyIncome as string)
          : null,
        isActive: formData.isActive === "true",
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error updating scholarship:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

/**
 * Delete a scholarship (blocked if it has active assignments)
 */
export async function deleteScholarship(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("delete")
    if (isAuthError(ctx)) return ctx

    const scholarship = await db.scholarship.findFirst({
      where: { id, schoolId: ctx.schoolId },
      select: {
        id: true,
        currentBeneficiaries: true,
        _count: { select: { feeAssignments: true } },
      },
    })

    if (!scholarship) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (scholarship._count.feeAssignments > 0) {
      return actionError(ACTION_ERRORS.SCHOLARSHIP_HAS_ASSIGNMENTS)
    }

    await db.scholarship.delete({ where: { id } })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error deleting scholarship:", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

/**
 * Update a fine
 */
export async function updateFine(
  id: string,
  data: FormData
): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("edit")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)

    await db.fine.update({
      where: { id, schoolId: ctx.schoolId },
      data: {
        fineType: formData.fineType as any,
        amount: parseFloat(formData.amount as string),
        reason: formData.reason as string,
        dueDate: new Date(formData.dueDate as string),
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error updating fine:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

/**
 * Record payment for a fine
 */
export async function payFine(
  fineId: string,
  amount: number,
  paymentMethod: string
): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const fine = await db.fine.findFirst({
      where: { id: fineId, schoolId: ctx.schoolId },
    })

    if (!fine) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    await db.fine.update({
      where: { id: fineId, schoolId: ctx.schoolId },
      data: {
        isPaid: true,
        paidAmount: amount,
        paidDate: new Date(),
        // Fine model lacks paymentMethod column; append to reason for audit trail
        reason: paymentMethod
          ? `${fine.reason} [Paid via: ${paymentMethod}]`
          : fine.reason,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error paying fine:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
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
    const ctx = await requireFeePermission("create")
    if (isAuthError(ctx)) return ctx

    const formData = Object.fromEntries(data)

    const fine = await db.fine.create({
      data: {
        schoolId: ctx.schoolId,
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
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
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
    const ctx = await requireFeePermission("approve")
    if (isAuthError(ctx)) return ctx

    await db.fine.update({
      where: { id: fineId, schoolId: ctx.schoolId },
      data: {
        isWaived: true,
        waivedBy: ctx.userId,
        waivedDate: new Date(),
        waiverReason: reason,
      },
    })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error waiving fine:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

/**
 * Delete a fine (blocked if paid or waived — preserves audit trail)
 */
export async function deleteFine(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireFeePermission("delete")
    if (isAuthError(ctx)) return ctx

    const fine = await db.fine.findFirst({
      where: { id, schoolId: ctx.schoolId },
      select: { id: true, isPaid: true, isWaived: true },
    })

    if (!fine) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (fine.isPaid) {
      return actionError(ACTION_ERRORS.FINE_CANNOT_DELETE)
    }

    if (fine.isWaived) {
      return actionError(ACTION_ERRORS.FINE_WAIVED_CANNOT_DELETE)
    }

    await db.fine.delete({ where: { id } })

    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    console.error("Error deleting fine:", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

// ============================================
// ONLINE PAYMENT ACTIONS
// ============================================

/**
 * Create a Stripe checkout session for fee payment
 */
export async function createFeePaymentCheckout(
  feeAssignmentId: string,
  lang: string
): Promise<ActionResult<{ checkoutUrl: string }>> {
  try {
    const ctx = await requireFeePermission("view")
    if (isAuthError(ctx)) return ctx

    const session = await auth()

    // Load fee assignment with student and structure
    const assignment = await db.feeAssignment.findFirst({
      where: { id: feeAssignmentId, schoolId: ctx.schoolId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        feeStructure: { select: { name: true } },
        payments: { where: { status: "SUCCESS" }, select: { amount: true } },
      },
    })

    if (!assignment) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Calculate remaining amount
    const totalPaid = assignment.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    const remaining = Number(assignment.finalAmount) - totalPaid
    if (remaining <= 0) {
      return actionError(ACTION_ERRORS.FEE_FULLY_PAID)
    }

    // Load school for currency
    const school = await db.school.findFirst({
      where: { id: ctx.schoolId },
      select: { currency: true, name: true },
    })
    const currency = school?.currency || "SAR"

    const { createPaymentCheckout } = await import("@/lib/payment/provider")
    const result = await createPaymentCheckout("stripe", {
      amount: remaining,
      currency,
      context: "school_fee",
      schoolId: ctx.schoolId,
      referenceId: feeAssignmentId,
      referenceNumber: `FEE-${feeAssignmentId.slice(-8).toUpperCase()}`,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/${lang}/finance/fees/assignments/${feeAssignmentId}?payment=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/${lang}/finance/fees/assignments/${feeAssignmentId}?payment=cancelled`,
      lineItems: [
        {
          name: assignment.feeStructure?.name || "School Fee",
          description: `${[assignment.student?.firstName, assignment.student?.lastName].filter(Boolean).join(" ")} — ${assignment.academicYear}`,
          quantity: 1,
          unitAmount: 0, // Will be overridden by amount
        },
      ],
      metadata: {
        type: "fee_payment",
        feeAssignmentId,
        studentId: assignment.studentId,
        schoolId: ctx.schoolId,
      },
      customerEmail: session?.user?.email || undefined,
    })

    if (!result.success || !result.checkoutUrl) {
      return actionError(ACTION_ERRORS.PAYMENT_FAILED)
    }

    return { success: true, data: { checkoutUrl: result.checkoutUrl } }
  } catch (error) {
    console.error("Error creating fee payment checkout:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}

// ============================================
// TABLE FETCHER ACTIONS
// ============================================

/** Fetch fee assignment rows for table pagination */
export async function fetchAssignmentRows(
  params: Record<string, unknown> & { page: number; perPage: number }
): Promise<{ rows: any[]; total: number }> {
  const session = await auth()
  if (!session?.user) return { rows: [], total: 0 }
  const { page, perPage } = params
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { rows: [], total: 0 }

    const result = await getFeeAssignmentList(schoolId, { page, perPage })
    const rows = result.rows.map((fa: any) => ({
      id: fa.id,
      studentName: [fa.student?.firstName, fa.student?.lastName]
        .filter(Boolean)
        .join(" "),
      studentId: fa.student?.id,
      feeStructureName: fa.feeStructure?.name || "-",
      academicYear: fa.academicYear,
      finalAmount: Number(fa.finalAmount),
      totalDiscount: Number(fa.totalDiscount),
      paidAmount: (fa.payments ?? [])
        .filter((p: any) => p.status === "SUCCESS")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0),
      status: fa.status,
      createdAt:
        fa.createdAt instanceof Date
          ? fa.createdAt.toISOString()
          : String(fa.createdAt),
    }))
    return { rows, total: result.count }
  } catch {
    return { rows: [], total: 0 }
  }
}

/** Fetch payment rows for table pagination */
export async function fetchPaymentRows(
  params: Record<string, unknown> & { page: number; perPage: number }
): Promise<{ rows: any[]; total: number }> {
  const session = await auth()
  if (!session?.user) return { rows: [], total: 0 }
  const { page, perPage } = params
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { rows: [], total: 0 }

    const result = await getPaymentList(schoolId, { page, perPage })
    const rows = result.rows.map((p: any) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      studentName: [p.student?.firstName, p.student?.lastName]
        .filter(Boolean)
        .join(" "),
      studentId: p.student?.id,
      feeStructureName: p.feeAssignment?.feeStructure?.name || "-",
      amount: Number(p.amount),
      paymentDate:
        p.paymentDate instanceof Date
          ? p.paymentDate.toISOString()
          : String(p.paymentDate),
      paymentMethod: p.paymentMethod,
      receiptNumber: p.receiptNumber,
      status: p.status,
      createdAt:
        p.createdAt instanceof Date
          ? p.createdAt.toISOString()
          : String(p.createdAt),
    }))
    return { rows, total: result.count }
  } catch {
    return { rows: [], total: 0 }
  }
}

/** Fetch fine rows for table pagination */
export async function fetchFineRows(
  params: Record<string, unknown> & { page: number; perPage: number }
): Promise<{ rows: any[]; total: number }> {
  const session = await auth()
  if (!session?.user) return { rows: [], total: 0 }
  const { page, perPage } = params
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { rows: [], total: 0 }

    const result = await getFineList(schoolId, { page, perPage })
    const rows = result.rows.map((f: any) => ({
      id: f.id,
      studentName: [f.student?.firstName, f.student?.lastName]
        .filter(Boolean)
        .join(" "),
      studentId: f.student?.id,
      fineType: f.fineType,
      amount: Number(f.amount),
      reason: f.reason,
      dueDate:
        f.dueDate instanceof Date ? f.dueDate.toISOString() : String(f.dueDate),
      isPaid: f.isPaid,
      paidAmount: f.paidAmount ? Number(f.paidAmount) : 0,
      isWaived: f.isWaived,
      waiverReason: f.waiverReason,
      createdAt:
        f.createdAt instanceof Date
          ? f.createdAt.toISOString()
          : String(f.createdAt),
    }))
    return { rows, total: result.count }
  } catch {
    return { rows: [], total: 0 }
  }
}

/** Fetch scholarship rows for table pagination */
export async function fetchScholarshipRows(
  params: Record<string, unknown> & { page: number; perPage: number }
): Promise<{ rows: any[]; total: number }> {
  const session = await auth()
  if (!session?.user) return { rows: [], total: 0 }
  const { page, perPage } = params
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { rows: [], total: 0 }

    const result = await getScholarshipList(schoolId, { page, perPage })
    const rows = result.rows.map((s: any) => ({
      id: s.id,
      name: s.name,
      coverageType: s.coverageType,
      coverageAmount: Number(s.coverageAmount),
      academicYear: s.academicYear,
      startDate:
        s.startDate instanceof Date
          ? s.startDate.toISOString()
          : String(s.startDate),
      endDate:
        s.endDate instanceof Date ? s.endDate.toISOString() : String(s.endDate),
      maxBeneficiaries: s.maxBeneficiaries,
      currentBeneficiaries: s.currentBeneficiaries,
      applicationCount: s._count?.applications || 0,
      isActive: s.isActive,
      createdAt:
        s.createdAt instanceof Date
          ? s.createdAt.toISOString()
          : String(s.createdAt),
    }))
    return { rows, total: result.count }
  } catch {
    return { rows: [], total: 0 }
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
    const ctx = await requireFeePermission("view")
    if (isAuthError(ctx)) return ctx

    const [
      totalAssignments,
      paidAssignments,
      partialAssignments,
      pendingAssignments,
      totalPayments,
    ] = await Promise.all([
      db.feeAssignment.count({ where: { schoolId: ctx.schoolId } }),
      db.feeAssignment.count({
        where: { schoolId: ctx.schoolId, status: "PAID" },
      }),
      db.feeAssignment.count({
        where: { schoolId: ctx.schoolId, status: "PARTIAL" },
      }),
      db.feeAssignment.count({
        where: { schoolId: ctx.schoolId, status: "PENDING" },
      }),
      db.payment.aggregate({
        where: { schoolId: ctx.schoolId, status: "SUCCESS" },
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
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
