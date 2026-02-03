"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type {
  ActionResponse,
  ExamStudent,
  ExamWithClass,
  MarksEntry,
} from "./types"

/**
 * Get exam with enrolled students for marks entry
 */
export async function getExamWithStudents(input: { examId: string }): Promise<{
  exam: ExamWithClass | null
  students: ExamStudent[]
}> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      throw new Error("Missing school context")
    }

    const { examId } = z.object({ examId: z.string().min(1) }).parse(input)

    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: {
          include: {
            studentClasses: {
              include: {
                student: {
                  select: {
                    id: true,
                    givenName: true,
                    middleName: true,
                    surname: true,
                    studentId: true,
                  },
                },
              },
            },
          },
        },
        examResults: true,
      },
    })

    if (!exam) {
      return { exam: null, students: [] }
    }

    // Map students with their existing results
    const students: ExamStudent[] = exam.class.studentClasses.map((sc) => {
      const result = exam.examResults.find((r) => r.studentId === sc.student.id)
      return {
        id: sc.student.id,
        studentId: sc.student.studentId,
        name: `${sc.student.givenName} ${sc.student.middleName || ""} ${
          sc.student.surname
        }`.trim(),
        marksObtained: result?.marksObtained ?? null,
        isAbsent: result?.isAbsent ?? false,
        resultId: result?.id ?? null,
      }
    })

    const examWithClass: ExamWithClass = {
      id: exam.id,
      title: exam.title,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      className: exam.class.name,
    }

    return {
      exam: examWithClass,
      students,
    }
  } catch (error) {
    console.error("Error getting exam with students:", error)
    return {
      exam: null,
      students: [],
    }
  }
}

/**
 * Calculate grade based on percentage and boundaries
 */
async function calculateGrade(
  percentage: number,
  schoolId: string
): Promise<string | null> {
  const gradeBoundaries = await db.gradeBoundary.findMany({
    where: { schoolId },
    orderBy: { minScore: "desc" },
  })

  if (gradeBoundaries.length === 0) return null

  for (const boundary of gradeBoundaries) {
    const min = Number(boundary.minScore)
    const max = Number(boundary.maxScore)
    if (percentage >= min && percentage <= max) {
      return boundary.grade
    }
  }

  return null
}

/**
 * Enter or update marks for multiple students
 */
export async function enterMarks(input: {
  examId: string
  marks: MarksEntry[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schema = z.object({
      examId: z.string().min(1),
      marks: z.array(
        z.object({
          studentId: z.string().min(1),
          marksObtained: z.number().min(0).nullable(),
          isAbsent: z.boolean(),
        })
      ),
    })

    const parsed = schema.parse(input)

    // Get exam details for validation
    const exam = await db.exam.findFirst({
      where: { id: parsed.examId, schoolId },
      select: { totalMarks: true, passingMarks: true },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Validate marks don't exceed total marks
    for (const mark of parsed.marks) {
      if (
        !mark.isAbsent &&
        mark.marksObtained !== null &&
        mark.marksObtained > exam.totalMarks
      ) {
        return {
          success: false,
          error: `Marks for a student exceed total marks (${exam.totalMarks})`,
          code: "INVALID_MARKS",
        }
      }
    }

    // Use transaction for atomicity
    const results = await db.$transaction(async (tx) => {
      return Promise.all(
        parsed.marks.map(async (mark) => {
          const marksObtained = mark.isAbsent ? 0 : (mark.marksObtained ?? 0)
          const percentage = (marksObtained / exam.totalMarks) * 100
          const grade = mark.isAbsent
            ? null
            : await calculateGrade(percentage, schoolId)

          return tx.examResult.upsert({
            where: {
              examId_studentId: {
                examId: parsed.examId,
                studentId: mark.studentId,
              },
            },
            create: {
              schoolId,
              examId: parsed.examId,
              studentId: mark.studentId,
              marksObtained,
              totalMarks: exam.totalMarks,
              percentage,
              grade,
              isAbsent: mark.isAbsent,
            },
            update: {
              marksObtained,
              percentage,
              grade,
              isAbsent: mark.isAbsent,
            },
          })
        })
      )
    })

    revalidatePath("/exams")
    return {
      success: true,
      data: { count: results.length },
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

    console.error("Error entering marks:", error)
    return {
      success: false,
      error: "Failed to enter marks",
      code: "MARKS_ENTRY_FAILED",
    }
  }
}

/**
 * Bulk update marks with CSV import
 */
export async function bulkImportMarks(input: {
  examId: string
  csvData: Array<{
    studentId: string
    marks: number
    isAbsent?: boolean
  }>
}): Promise<ActionResponse<{ imported: number; failed: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Validate exam exists
    const exam = await db.exam.findFirst({
      where: { id: input.examId, schoolId },
      select: { totalMarks: true },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Transform CSV data to marks format
    const marks: MarksEntry[] = input.csvData.map((row) => ({
      studentId: row.studentId,
      marksObtained: row.isAbsent ? null : row.marks,
      isAbsent: row.isAbsent ?? false,
    }))

    // Use existing enterMarks function
    const result = await enterMarks({
      examId: input.examId,
      marks,
    })

    if (result.success) {
      return {
        success: true,
        data: {
          imported: result.data?.count || 0,
          failed: 0,
        },
      }
    }

    return {
      success: false,
      error: result.error,
      code: result.code,
    }
  } catch (error) {
    console.error("Error bulk importing marks:", error)
    return {
      success: false,
      error: "Failed to import marks",
      code: "IMPORT_FAILED",
    }
  }
}
