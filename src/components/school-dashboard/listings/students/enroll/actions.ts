"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertStudentPermission,
  getAuthContext,
} from "@/components/school-dashboard/listings/students/authorization"

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

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
      return { success: false, error: "Unauthorized" }
    }

    const { studentId, academicGradeId, classId, batchId } = input

    // Verify student belongs to school
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    })
    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // Set academic grade on student
    if (academicGradeId) {
      await db.student.update({
        where: { id: studentId },
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
        return { success: false, error: "Class not found" }
      }

      const maxCapacity = classData.maxCapacity || 50
      if (classData._count.studentClasses >= maxCapacity) {
        return { success: false, error: "Class is at full capacity" }
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
        // TODO: Call syncStudentClassToEnrollment(schoolId, studentId, classId) from
        // "@/lib/enrollment-sync" here to create a corresponding LMS Enrollment record.
        // This bridges the timetable/attendance StudentClass with the catalog/LMS Enrollment
        // so that the student automatically gets access to the subject's catalog content.
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

    revalidatePath("/students")
    return { success: true, data: { studentId } }
  } catch (error) {
    console.error("[enrollStudent] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to enroll student",
    }
  }
}
