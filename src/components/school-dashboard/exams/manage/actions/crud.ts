"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { examCreateSchema, examUpdateSchema } from "../validation"
import { checkExamConflicts } from "./conflict-detection"
import type { ActionResponse } from "./types"

/**
 * Creates a new exam
 */
export async function createExam(
  input: z.infer<typeof examCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const parsed = examCreateSchema.parse(input)

    // Check if class exists and belongs to school
    const classExists = await db.class.findFirst({
      where: {
        id: parsed.classId,
        schoolId,
      },
    })

    if (!classExists) {
      return {
        success: false,
        error: "Class not found or does not belong to your school",
        code: "INVALID_CLASS",
      }
    }

    // Check if subject exists and belongs to school
    const subjectExists = await db.subject.findFirst({
      where: {
        id: parsed.subjectId,
        schoolId,
      },
    })

    if (!subjectExists) {
      return {
        success: false,
        error: "Subject not found or does not belong to your school",
        code: "INVALID_SUBJECT",
      }
    }

    // Check for timetable conflicts
    const conflictCheck = await checkExamConflicts({
      examDate: parsed.examDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      classId: parsed.classId,
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

    const exam = await db.exam.create({
      data: {
        schoolId,
        title: parsed.title,
        description: parsed.description || null,
        classId: parsed.classId,
        subjectId: parsed.subjectId,
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

    revalidatePath("/exams")
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const parsed = examUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Check if exam exists and belongs to school
    const examExists = await db.exam.findFirst({
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
    if (typeof rest.classId !== "undefined") data.classId = rest.classId
    if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId
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
      rest.classId !== undefined

    if (isScheduleUpdate) {
      const examData = {
        examDate: rest.examDate || examExists.examDate,
        startTime: rest.startTime || examExists.startTime,
        endTime: rest.endTime || examExists.endTime,
        classId: rest.classId || examExists.classId,
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

    await db.exam.update({
      where: { id },
      data,
    })

    revalidatePath("/exams")
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Check if exam exists and belongs to school
    const examExists = await db.exam.findFirst({
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

    await db.exam.deleteMany({
      where: { id, schoolId },
    })

    revalidatePath("/exams")
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
