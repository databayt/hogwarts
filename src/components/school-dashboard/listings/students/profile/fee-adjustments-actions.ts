"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Admin-only fee adjustment actions. Relocated from the retired
// `wizard/fees/actions.ts` when the fees step was removed from the student
// wizard — admins now apply scholarships and overrides from the student
// profile's Fees tab instead. See issue #265.
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getFeePreviewByGradeId, type FeePreview } from "@/lib/fee-preview"
import { getTenantContext } from "@/lib/tenant-context"

import { checkCurrentUserPermission } from "../../../finance/lib/permissions"

export async function getStudentFeePreview(
  academicGradeId: string,
  studentId?: string
): Promise<ActionResponse<FeePreview>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    if (!academicGradeId || academicGradeId.trim().length === 0) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    const preview = await getFeePreviewByGradeId(
      schoolId,
      academicGradeId,
      studentId ?? null
    )
    return { success: true, data: preview }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export interface StudentFeeAssignmentSummary {
  id: string
  feeStructureName: string
  subtotal: number
  totalDiscount: number
  finalAmount: number
  scholarshipId: string | null
  status: string
  discounts: Array<{ type: string; amount: number; reason?: string }>
}

export async function getStudentFeeAssignments(
  studentId: string
): Promise<ActionResponse<StudentFeeAssignmentSummary[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const rows = await db.feeAssignment.findMany({
      where: { schoolId, studentId },
      include: {
        feeStructure: { select: { name: true, totalAmount: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    const summaries: StudentFeeAssignmentSummary[] = rows.map((r) => ({
      id: r.id,
      feeStructureName: r.feeStructure.name,
      subtotal: Number(r.feeStructure.totalAmount),
      totalDiscount: Number(r.totalDiscount),
      finalAmount: Number(r.finalAmount),
      scholarshipId: r.scholarshipId,
      status: r.status,
      discounts:
        (r.discounts as Array<{
          type: string
          amount: number
          reason?: string
        }> | null) ?? [],
    }))

    return { success: true, data: summaries }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export interface FeeAdjustmentInput {
  scholarshipId?: string | null
  overrideAmount?: number | null
  overrideReason?: string | null
}

export async function applyFeeAdjustments(
  studentId: string,
  adjustments: FeeAdjustmentInput
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const allowed = await checkCurrentUserPermission(
      schoolId,
      "fees",
      "approve"
    )
    if (!allowed) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const hasOverride =
      adjustments.overrideAmount != null && adjustments.overrideAmount > 0
    if (hasOverride) {
      if (
        !adjustments.overrideReason ||
        adjustments.overrideReason.trim().length < 5
      ) {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
    }

    const assignments = await db.feeAssignment.findMany({
      where: { schoolId, studentId },
      include: {
        feeStructure: { select: { totalAmount: true } },
      },
    })
    if (assignments.length === 0) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    let scholarship: {
      id: string
      coverageType: string
      coverageAmount: Prisma.Decimal
    } | null = null
    if (adjustments.scholarshipId) {
      scholarship = await db.scholarship.findFirst({
        where: {
          id: adjustments.scholarshipId,
          schoolId,
          isActive: true,
        },
        select: { id: true, coverageType: true, coverageAmount: true },
      })
      if (!scholarship) return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    await db.$transaction(async (tx) => {
      for (const assignment of assignments) {
        const base = Number(assignment.feeStructure.totalAmount)
        const existingDiscounts =
          (assignment.discounts as Array<{
            type: string
            amount: number
            reason?: string
          }> | null) ?? []

        // Drop previously-applied ADMIN_OVERRIDE + SCHOLARSHIP so repeat saves
        // don't compound on themselves; preserve any other discount types.
        const preserved = existingDiscounts.filter(
          (d) => d.type !== "ADMIN_OVERRIDE" && d.type !== "SCHOLARSHIP"
        )
        const nextDiscounts = [...preserved]

        let scholarshipAmount = 0
        if (scholarship) {
          scholarshipAmount =
            scholarship.coverageType === "PERCENTAGE"
              ? Math.round((base * Number(scholarship.coverageAmount)) / 100)
              : scholarship.coverageType === "FULL"
                ? base
                : Math.min(Number(scholarship.coverageAmount), base)
          nextDiscounts.push({
            type: "SCHOLARSHIP",
            amount: scholarshipAmount,
            reason: `Scholarship ${scholarship.id}`,
          })
        }

        let overrideAmount = 0
        if (hasOverride) {
          overrideAmount = Math.min(
            Number(adjustments.overrideAmount),
            base - scholarshipAmount
          )
          nextDiscounts.push({
            type: "ADMIN_OVERRIDE",
            amount: overrideAmount,
            reason: adjustments.overrideReason!,
          })
        }

        const totalDiscount = nextDiscounts.reduce((s, d) => s + d.amount, 0)
        const finalAmount = Math.max(0, base - totalDiscount)

        await tx.feeAssignment.update({
          where: { id: assignment.id },
          data: {
            scholarshipId: adjustments.scholarshipId ?? null,
            totalDiscount,
            finalAmount,
            discounts: nextDiscounts as unknown as Prisma.InputJsonValue,
          },
        })

        // Best-effort: keep the linked invoice totals in sync.
        const linkedInvoice = await tx.userInvoice.findFirst({
          where: { feeAssignmentId: assignment.id, schoolId },
          include: { items: true },
        })
        if (linkedInvoice) {
          await tx.userInvoice.update({
            where: { id: linkedInvoice.id },
            data: {
              sub_total: finalAmount,
              total: finalAmount,
              discount: totalDiscount,
            },
          })
          if (linkedInvoice.items.length === 1) {
            await tx.userInvoiceItem.update({
              where: { id: linkedInvoice.items[0].id },
              data: { price: finalAmount, total: finalAmount },
            })
          }
        }
      }
    })

    revalidatePath("/students")
    revalidatePath("/finance/fees")
    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function canApplyFeeAdjustments(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.id) return false
    const { schoolId } = await getTenantContext()
    if (!schoolId) return false
    return await checkCurrentUserPermission(schoolId, "fees", "approve")
  } catch {
    return false
  }
}

// Lightweight lookup used by the fee-adjustments dialog to avoid prop-drilling
// the grade through the profile component tree.
export async function getStudentAcademicGradeId(
  studentId: string
): Promise<ActionResponse<{ academicGradeId: string | null }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { academicGradeId: true },
    })
    if (!student) return actionError(ACTION_ERRORS.NOT_FOUND)
    return { success: true, data: { academicGradeId: student.academicGradeId } }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
