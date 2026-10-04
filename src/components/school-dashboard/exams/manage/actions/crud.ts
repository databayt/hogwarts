"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"
import { examAudienceUserIds } from "@/components/school-dashboard/exams/lib/roster"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"
import { prewarm } from "@/components/translation/prewarm"

import { examCreateSchema, examUpdateSchema } from "../validation"
import { checkExamConflicts } from "./conflict-detection"
import type { ActionResponse } from "./types"

/** Roles that set and change exams. */
const EXAM_AUTHOR_ROLES = new Set(["DEVELOPER", "ADMIN", "TEACHER"])

function unauthorized() {
  return {
    success: false as const,
    error: ACTION_ERRORS.UNAUTHORIZED,
    code: ACTION_ERRORS.UNAUTHORIZED,
  }
}

/**
 * Creates a new exam for a grade — one of its sections, or the whole grade.
 */
export async function createExam(
  input: z.infer<typeof examCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId, role } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }
    if (!EXAM_AUTHOR_ROLES.has(role ?? "")) return unauthorized()
    const session = await auth()

    const parsed = examCreateSchema.parse(input)

    // The grade, section and subject must be the school's, and the subject
    // taught in that grade.
    const resolved = await resolveTeachingScope(schoolId, parsed)
    if (!resolved.ok) {
      return { success: false, error: resolved.code, code: resolved.code }
    }
    const { scope } = resolved

    // Check for timetable conflicts
    const conflictCheck = await checkExamConflicts({
      examDate: parsed.examDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      gradeId: scope.gradeId,
      sectionId: scope.sectionId,
    })

    if (!conflictCheck.success) {
      return {
        success: false,
        error: conflictCheck.error || "Failed to check conflicts",
        code: "CONFLICT_CHECK_FAILED",
      }
    }

    // Warn about conflicts but allow creation (with suggestions)
    if (conflictCheck.data?.hasConflicts) {
      const highSeverityConflicts = conflictCheck.data.conflicts.filter(
        (c) => c.severity === "high"
      )

      if (highSeverityConflicts.length > 0 && !parsed.forceCreate) {
        return {
          success: false,
          error: "Exam conflicts with existing schedule",
          code: "SCHEDULE_CONFLICT",
          details: {
            conflicts: conflictCheck.data.conflicts,
            suggestions: conflictCheck.data.suggestions,
            message: "Set forceCreate=true to create despite conflicts",
          },
        }
      }
    }

    const exam = await db.schoolExam.create({
      data: {
        schoolId,
        title: parsed.title,
        description: parsed.description || null,
        subjectId: scope.subjectId,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
        termId: scope.termId,
        createdById: session?.user?.id ?? null,
        examDate: parsed.examDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        duration: parsed.duration,
        totalMarks: parsed.totalMarks,
        passingMarks: parsed.passingMarks,
        examType: parsed.examType,
        instructions: parsed.instructions || null,
        status: "PLANNED",
      },
    })

    // Pre-translate the other language OFF the response path so the first reader
    // hits the cache. `Exam` is the logical registry name (Prisma accessor is
    // `schoolExam`). Non-blocking and best-effort.
    after(() => prewarm("Exam", exam, { schoolId }))

    // Notify the students who sit it, and its teachers (non-blocking)
    const [schoolPref, targetUserIds] = await Promise.all([
      db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      }),
      examAudienceUserIds(
        schoolId,
        { ...scope, classId: null },
        { students: true, teachers: true }
      ),
    ])
    dispatchNotificationsToAudience({
      schoolId,
      type: "system_alert",
      title: "امتحان جديد",
      body: `تم جدولة امتحان "${parsed.title}" في ${new Date(parsed.examDate).toLocaleDateString("ar")}`,
      lang: schoolPref?.preferredLanguage ?? "ar",
      priority: "high",
      channels: ["in_app"],
      metadata: {
        examId: exam.id,
        examDate: parsed.examDate.toISOString(),
        url: "/exams",
      },
      targetUserIds,
    }).catch((err) => console.error("[createExam] Notification error:", err))

    refreshPage("/exams")
    return {
      success: true,
      data: { id: exam.id },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        code: "VALIDATION_ERROR",
        details: error.issues,
      }
    }

    console.error("Error creating exam:", error)
    return {
      success: false,
      error: "Failed to create exam",
      code: "CREATE_FAILED",
    }
  }
}

/**
 * Updates an existing exam
 */
export async function updateExam(
  input: z.infer<typeof examUpdateSchema>
): Promise<ActionResponse> {
  try {
    const { schoolId, role } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }
    if (!EXAM_AUTHOR_ROLES.has(role ?? "")) return unauthorized()

    const parsed = examUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Check if exam exists and belongs to school
    const examExists = await db.schoolExam.findFirst({
      where: {
        id,
        schoolId,
      },
    })

    if (!examExists) {
      return {
        success: false,
        error: "Exam not found or does not belong to your school",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Check if exam is not in COMPLETED status
    if (examExists.status === "COMPLETED") {
      return {
        success: false,
        error: "Cannot update a completed exam",
        code: "EXAM_COMPLETED",
      }
    }

    // Build update data object
    const data: Record<string, unknown> = {}

    if (typeof rest.title !== "undefined") data.title = rest.title
    if (typeof rest.description !== "undefined")
      data.description = rest.description || null

    // A new grade, section or subject moves the exam to that scope — and off
    // a legacy class, if it had one.
    const scopeChanged =
      rest.gradeId !== undefined ||
      rest.sectionId !== undefined ||
      rest.subjectId !== undefined
    if (scopeChanged) {
      const gradeId = rest.gradeId ?? examExists.gradeId
      if (!gradeId) {
        return {
          success: false,
          error: ACTION_ERRORS.GRADE_NOT_FOUND,
          code: ACTION_ERRORS.GRADE_NOT_FOUND,
        }
      }
      const resolved = await resolveTeachingScope(schoolId, {
        gradeId,
        sectionId:
          rest.sectionId !== undefined ? rest.sectionId : examExists.sectionId,
        subjectId: rest.subjectId ?? examExists.subjectId,
      })
      if (!resolved.ok) {
        return { success: false, error: resolved.code, code: resolved.code }
      }
      data.classId = null
      data.gradeId = resolved.scope.gradeId
      data.sectionId = resolved.scope.sectionId
      data.subjectId = resolved.scope.subjectId
      if (!examExists.termId) data.termId = resolved.scope.termId
    }
    if (typeof rest.examDate !== "undefined") data.examDate = rest.examDate
    if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime
    if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime
    if (typeof rest.duration !== "undefined") data.duration = rest.duration
    if (typeof rest.totalMarks !== "undefined")
      data.totalMarks = rest.totalMarks
    if (typeof rest.passingMarks !== "undefined")
      data.passingMarks = rest.passingMarks
    if (typeof rest.examType !== "undefined") data.examType = rest.examType
    if (typeof rest.instructions !== "undefined")
      data.instructions = rest.instructions || null

    // Check for conflicts if date/time fields are being updated
    const isScheduleUpdate =
      rest.examDate !== undefined ||
      rest.startTime !== undefined ||
      rest.endTime !== undefined ||
      scopeChanged

    if (isScheduleUpdate) {
      const examData = {
        examDate: rest.examDate || examExists.examDate,
        startTime: rest.startTime || examExists.startTime,
        endTime: rest.endTime || examExists.endTime,
        ...(scopeChanged
          ? {
              gradeId: data.gradeId as string,
              sectionId: data.sectionId as string | null,
            }
          : {
              classId: examExists.classId,
              gradeId: examExists.gradeId,
              sectionId: examExists.sectionId,
            }),
        examId: id, // Pass exam ID to exclude it from conflict check
      }

      const conflictCheck = await checkExamConflicts(examData)

      if (!conflictCheck.success) {
        return {
          success: false,
          error: conflictCheck.error || "Failed to check conflicts",
          code: "CONFLICT_CHECK_FAILED",
        }
      }

      // Warn about conflicts but allow update (with suggestions)
      if (conflictCheck.data?.hasConflicts) {
        const highSeverityConflicts = conflictCheck.data.conflicts.filter(
          (c) => c.severity === "high"
        )

        if (highSeverityConflicts.length > 0 && !rest.forceUpdate) {
          return {
            success: false,
            error: "Exam update would conflict with existing schedule",
            code: "SCHEDULE_CONFLICT",
            details: {
              conflicts: conflictCheck.data.conflicts,
              suggestions: conflictCheck.data.suggestions,
              message: "Set forceUpdate=true to update despite conflicts",
            },
          }
        }
      }
    }

    await db.schoolExam.updateMany({
      where: { id, schoolId },
      data,
    })

    // Pre-translate edited text OFF the response path. `updateMany` returns a
    // count, not the row — prewarm reads only the registered fields from the
    // freshly written values. Non-blocking and best-effort.
    after(() => prewarm("Exam", { id, ...data }, { schoolId }))

    refreshPage("/exams")
    return {
      success: true,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        code: "VALIDATION_ERROR",
        details: error.issues,
      }
    }

    console.error("Error updating exam:", error)
    return {
      success: false,
      error: "Failed to update exam",
      code: "UPDATE_FAILED",
    }
  }
}

/**
 * Deletes an exam (soft delete)
 */
export async function deleteExam(input: {
  id: string
}): Promise<ActionResponse> {
  try {
    const { schoolId, role } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }
    if (!EXAM_AUTHOR_ROLES.has(role ?? "")) return unauthorized()

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Check if exam exists and belongs to school
    const examExists = await db.schoolExam.findFirst({
      where: {
        id,
        schoolId,
      },
      include: {
        _count: {
          select: {
            results: true,
          },
        },
      },
    })

    if (!examExists) {
      return {
        success: false,
        error: "Exam not found or does not belong to your school",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Check if exam has results
    if (examExists._count.results > 0) {
      return {
        success: false,
        error: "Cannot delete exam with existing results. Archive instead.",
        code: "HAS_RESULTS",
      }
    }

    await db.schoolExam.deleteMany({
      where: { id, schoolId },
    })

    // Notify the students who sat it, and its teachers (non-blocking). The
    // audience is resolved from the exam's keys, so it survives the delete.
    const [schoolPref2, targetUserIds] = await Promise.all([
      db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      }),
      examAudienceUserIds(schoolId, examExists, {
        students: true,
        teachers: true,
      }),
    ])
    dispatchNotificationsToAudience({
      schoolId,
      type: "system_alert",
      title: "إلغاء امتحان",
      body: `تم إلغاء امتحان "${examExists.title}"`,
      lang: schoolPref2?.preferredLanguage ?? "ar",
      priority: "high",
      channels: ["in_app"],
      metadata: {
        examId: id,
        url: "/exams",
      },
      targetUserIds,
    }).catch((err) => console.error("[deleteExam] Notification error:", err))

    refreshPage("/exams")
    return {
      success: true,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        code: "VALIDATION_ERROR",
        details: error.issues,
      }
    }

    console.error("Error deleting exam:", error)
    return {
      success: false,
      error: "Failed to delete exam",
      code: "DELETE_FAILED",
    }
  }
}
