"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { isAutoGradable } from "../utils"
import { bulkGradeSchema } from "../validation"
import { aiGradeAnswer } from "./ai-grade"
import { autoGradeAnswer } from "./auto-mark"
import type { ActionResponse, BulkGradeResult } from "./types"

/**
 * Bulk grade all auto-gradable questions in an exam
 */
export async function bulkGradeExam(
  data: FormData
): Promise<ActionResponse<BulkGradeResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Check permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions for bulk grading",
        code: "PERMISSION_DENIED",
      }
    }

    const validated = bulkGradeSchema.parse(Object.fromEntries(data))

    // Verify exam exists and belongs to school
    const exam = await db.exam.findFirst({
      where: { id: validated.examId, schoolId },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Build query for student answers
    const where: any = {
      schoolId,
      examId: validated.examId,
    }

    if (validated.studentIds && validated.studentIds.length > 0) {
      where.studentId = { in: validated.studentIds }
    }

    if (validated.questionIds && validated.questionIds.length > 0) {
      where.questionId = { in: validated.questionIds }
    }

    // Get answers with question and marking result details
    const answers = await db.studentAnswer.findMany({
      where,
      include: {
        question: true,
        markingResult: true,
      },
    })

    let graded = 0
    let failed = 0
    const errors: Array<{ answerId: string; error: string }> = []

    for (const answer of answers) {
      // Skip if already graded and completed
      if (answer.markingResult && answer.markingResult.status === "COMPLETED") {
        continue
      }

      // Only process auto-gradable questions if specified
      if (
        validated.autoGradeOnly &&
        !isAutoGradable(answer.question.questionType)
      ) {
        continue
      }

      try {
        // Auto-grade the answer
        const result = await autoGradeAnswer(answer.id)
        if (result.success) {
          graded++
        } else {
          failed++
          errors.push({
            answerId: answer.id,
            error: result.error,
          })
        }
      } catch (error) {
        failed++
        errors.push({
          answerId: answer.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${validated.examId}/results`)

    return {
      success: true,
      data: {
        graded,
        failed,
        total: answers.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    }
  } catch (error) {
    console.error("Bulk grade error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid bulk grade data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Bulk grading failed",
      code: "BULK_GRADE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Bulk grade using AI for essay/short answer questions
 */
export async function bulkAIGrade(
  examId: string,
  questionType?: "ESSAY" | "SHORT_ANSWER" | "LONG_ANSWER"
): Promise<ActionResponse<BulkGradeResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Check permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions for AI grading",
        code: "PERMISSION_DENIED",
      }
    }

    // Build query
    const where: any = {
      schoolId,
      examId,
      question: {
        questionType: questionType
          ? questionType
          : { in: ["ESSAY", "SHORT_ANSWER", "LONG_ANSWER"] },
      },
    }

    // Get answers that need AI grading
    const answers = await db.studentAnswer.findMany({
      where,
      include: {
        markingResult: true,
      },
    })

    let graded = 0
    let failed = 0
    const errors: Array<{ answerId: string; error: string }> = []

    for (const answer of answers) {
      // Skip if already completed
      if (answer.markingResult && answer.markingResult.status === "COMPLETED") {
        continue
      }

      // Skip if no answer text
      if (!answer.answerText && !answer.ocrText) {
        continue
      }

      try {
        const result = await aiGradeAnswer(answer.id)
        if (result.success) {
          graded++
        } else {
          failed++
          errors.push({
            answerId: answer.id,
            error: result.error,
          })
        }
      } catch (error) {
        failed++
        errors.push({
          answerId: answer.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${examId}/results`)

    return {
      success: true,
      data: {
        graded,
        failed,
        total: answers.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    }
  } catch (error) {
    console.error("Bulk AI grade error:", error)
    return {
      success: false,
      error: "Bulk AI grading failed",
      code: "BULK_AI_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Import marks from CSV file
 */
export async function importMarksFromCSV(
  examId: string,
  csvData: string
): Promise<ActionResponse<BulkGradeResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Check permissions
    if (!["ADMIN", "TEACHER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Insufficient permissions to import marks",
        code: "PERMISSION_DENIED",
      }
    }

    // Parse CSV data (simplified - actual implementation would use a CSV parser)
    const lines = csvData.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    // Validate required columns
    const requiredColumns = ["studentId", "questionId", "marks"]
    for (const col of requiredColumns) {
      if (!headers.includes(col)) {
        return {
          success: false,
          error: `Missing required column: ${col}`,
          code: "INVALID_CSV_FORMAT",
        }
      }
    }

    let imported = 0
    let failed = 0
    const errors: Array<{ answerId: string; error: string }> = []

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      if (values.length !== headers.length) continue

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]
      })

      try {
        // Find student answer
        const answer = await db.studentAnswer.findFirst({
          where: {
            examId,
            studentId: row.studentId,
            questionId: row.questionId,
            schoolId,
          },
          include: { question: true },
        })

        if (!answer) {
          failed++
          errors.push({
            answerId: `${row.studentId}-${row.questionId}`,
            error: "Answer not found",
          })
          continue
        }

        const marks = parseFloat(row.marks)
        if (isNaN(marks)) {
          failed++
          errors.push({
            answerId: answer.id,
            error: "Invalid marks value",
          })
          continue
        }

        // Save marking result
        const existingResult = await db.markingResult.findUnique({
          where: { studentAnswerId: answer.id },
        })

        const markingData = {
          schoolId,
          examId,
          questionId: answer.questionId,
          studentId: answer.studentId,
          gradingMethod: "MANUAL" as const,
          status: "COMPLETED" as const,
          pointsAwarded: marks,
          maxPoints: Number(answer.question.points),
          feedback: row.feedback || undefined,
          gradedBy: session.user.id!,
          gradedAt: new Date(),
        }

        if (existingResult) {
          await db.markingResult.update({
            where: { id: existingResult.id },
            data: markingData,
          })
        } else {
          await db.markingResult.create({
            data: {
              ...markingData,
              studentAnswerId: answer.id,
            },
          })
        }

        imported++
      } catch (error) {
        failed++
        errors.push({
          answerId: `${row.studentId}-${row.questionId}`,
          error: error instanceof Error ? error.message : "Import failed",
        })
      }
    }

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${examId}/results`)

    return {
      success: true,
      data: {
        graded: imported,
        failed,
        total: lines.length - 1, // Exclude header
        errors: errors.length > 0 ? errors : undefined,
      },
    }
  } catch (error) {
    console.error("Import marks error:", error)
    return {
      success: false,
      error: "Failed to import marks from CSV",
      code: "IMPORT_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Reset all grades for an exam (admin only)
 */
export async function resetExamGrades(examId: string): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Admin only
    if (session?.user?.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can reset exam grades",
        code: "ADMIN_ONLY",
      }
    }

    // Delete all marking results and grade overrides for the exam
    await db.$transaction(async (tx) => {
      // Delete grade overrides first
      await tx.gradeOverride.deleteMany({
        where: {
          markingResult: {
            examId,
            schoolId,
          },
        },
      })

      // Delete marking results
      await tx.markingResult.deleteMany({
        where: {
          examId,
          schoolId,
        },
      })
    })

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${examId}/results`)

    return { success: true }
  } catch (error) {
    console.error("Reset exam grades error:", error)
    return {
      success: false,
      error: "Failed to reset exam grades",
      code: "RESET_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}
