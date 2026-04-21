"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { syncStudentClassToEnrollment } from "@/lib/enrollment-sync"
import { autoAssignFeesForStudent } from "@/lib/fee-auto-assign"
import { ensureInvoicesForAssignment } from "@/lib/fee-invoice-sync"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertStudentPermission,
  getAuthContext,
} from "@/components/school-dashboard/listings/students/authorization"

/**
 * Enroll a student: set academic grade, assign to class, and optionally batch.
 * Also creates StudentYearLevel record for backward compatibility.
 */
export async function enrollStudent(input: {
  studentId: string
  academicGradeId?: string
  classId?: string
  batchId?: string
}): Promise<ActionResponse<{ studentId: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertStudentPermission(authContext, "update", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { studentId, academicGradeId, classId, batchId } = input

    // Verify student belongs to school
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    })
    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    // Set academic grade on student (scoped by schoolId for defense-in-depth)
    if (academicGradeId) {
      await db.student.updateMany({
        where: { id: studentId, schoolId },
        data: { academicGradeId },
      })

      // Auto-create StudentYearLevel for backward compat
      const grade = await db.academicGrade.findFirst({
        where: { id: academicGradeId, schoolId },
        select: { yearLevelId: true },
      })

      if (grade?.yearLevelId) {
        // Get most recent school year (ordered by start date)
        const currentYear = await db.schoolYear.findFirst({
          where: { schoolId },
          orderBy: { startDate: "desc" },
          select: { id: true },
        })

        if (currentYear) {
          // Upsert to avoid duplicates
          const existing = await db.studentYearLevel.findFirst({
            where: {
              schoolId,
              studentId,
              yearId: currentYear.id,
            },
          })

          if (!existing) {
            await db.studentYearLevel.create({
              data: {
                schoolId,
                studentId,
                levelId: grade.yearLevelId,
                yearId: currentYear.id,
              },
            })
          }
        }
      }
    }

    // Assign to class
    if (classId) {
      // Check capacity
      const classData = await db.class.findFirst({
        where: { id: classId, schoolId },
        select: {
          maxCapacity: true,
          _count: { select: { studentClasses: true } },
        },
      })

      if (!classData) {
        return actionError(ACTION_ERRORS.CLASS_NOT_FOUND)
      }

      const maxCapacity = classData.maxCapacity || 50
      if (classData._count.studentClasses >= maxCapacity) {
        return actionError(ACTION_ERRORS.UNKNOWN)
      }

      // Check if already enrolled
      const existingEnrollment = await db.studentClass.findFirst({
        where: { schoolId, studentId, classId },
      })

      if (!existingEnrollment) {
        await db.studentClass.create({
          data: {
            schoolId,
            studentId,
            classId,
          },
        })
        // Sync to LMS enrollment (non-blocking)
        try {
          await syncStudentClassToEnrollment(schoolId, studentId, classId)
        } catch {
          // Non-blocking: logged inside syncStudentClassToEnrollment
        }
      }
    }

    // Assign to batch
    if (batchId) {
      const existingBatch = await db.studentBatch.findFirst({
        where: { schoolId, studentId, batchId },
      })

      if (!existingBatch) {
        await db.studentBatch.create({
          data: {
            schoolId,
            studentId,
            batchId,
            startDate: new Date(),
            isActive: true,
          },
        })
      }
    }

    // Auto-assign fees + generate invoices when grade is set (parity with admission)
    if (academicGradeId) {
      autoAssignFeesForStudent(schoolId, studentId, academicGradeId)
        .then(async ({ assignedCount }) => {
          if (assignedCount === 0) return
          const assignments = await db.feeAssignment.findMany({
            where: { schoolId, studentId },
            select: { id: true },
          })
          await Promise.all(
            assignments.map((a) =>
              ensureInvoicesForAssignment(schoolId, a.id).catch((err) =>
                console.error(
                  `[enrollStudent] Invoice gen failed for assignment ${a.id}:`,
                  err
                )
              )
            )
          )
        })
        .catch((err) =>
          console.error("[enrollStudent] Fee auto-assign failed:", err)
        )
    }

    revalidatePath("/students")
    return { success: true, data: { studentId } }
  } catch (error) {
    console.error("[enrollStudent] Error:", error)
    return actionError(
      ACTION_ERRORS.ENROLLMENT_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
