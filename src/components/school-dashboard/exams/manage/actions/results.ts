"use server"

import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse, ExamResultRow } from "./types"

/**
 * Get exam results with student details
 */
export async function getExamResults(input: {
  examId: string
}): Promise<ActionResponse<ExamResultRow[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { examId } = z.object({ examId: z.string().min(1) }).parse(input)

    const results = await db.examResult.findMany({
      where: { examId, schoolId },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            givenName: true,
            middleName: true,
            surname: true,
          },
        },
      },
      orderBy: { marksObtained: "desc" },
    })

    const mapped: ExamResultRow[] = results.map((result) => ({
      id: result.id,
      studentId: result.student.studentId,
      studentName: `${result.student.givenName} ${
        result.student.middleName || ""
      } ${result.student.surname}`.trim(),
      marksObtained: result.marksObtained,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      isAbsent: result.isAbsent,
      remarks: result.remarks,
    }))

    return {
      success: true,
      data: mapped,
    }
  } catch (error) {
    console.error("Error getting exam results:", error)
    return {
      success: false,
      error: "Failed to get exam results",
      code: "RESULTS_FETCH_FAILED",
    }
  }
}

/**
 * Get student's all exam results
 */
export async function getStudentResults(input: {
  studentId: string
  termId?: string
  subjectId?: string
}): Promise<
  ActionResponse<
    Array<{
      examTitle: string
      examDate: Date
      subjectName: string
      marksObtained: number
      totalMarks: number
      percentage: number
      grade: string | null
      rank?: number
    }>
  >
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { studentId, termId, subjectId } = input

    // Build where clause
    const examWhere: Record<string, unknown> = {
      schoolId,
    }

    if (termId) {
      examWhere.termId = termId
    }

    if (subjectId) {
      examWhere.subjectId = subjectId
    }

    const results = await db.examResult.findMany({
      where: {
        studentId,
        schoolId,
        exam: examWhere,
      },
      include: {
        exam: {
          select: {
            title: true,
            examDate: true,
            subject: {
              select: {
                subjectName: true,
              },
            },
          },
        },
      },
      orderBy: {
        exam: {
          examDate: "desc",
        },
      },
    })

    // Calculate ranks for each exam
    const resultsWithRanks = await Promise.all(
      results.map(async (result) => {
        // Get all results for this exam to calculate rank
        const allExamResults = await db.examResult.findMany({
          where: {
            examId: result.examId,
            schoolId,
            isAbsent: false,
          },
          orderBy: {
            marksObtained: "desc",
          },
        })

        const rank =
          allExamResults.findIndex((r) => r.id === result.id) + 1 || undefined

        return {
          examTitle: result.exam.title,
          examDate: result.exam.examDate,
          subjectName: result.exam.subject?.subjectName || "Unknown",
          marksObtained: result.marksObtained,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          grade: result.grade,
          rank: result.isAbsent ? undefined : rank,
        }
      })
    )

    return {
      success: true,
      data: resultsWithRanks,
    }
  } catch (error) {
    console.error("Error getting student results:", error)
    return {
      success: false,
      error: "Failed to get student results",
      code: "STUDENT_RESULTS_FAILED",
    }
  }
}

/**
 * Get top performers for an exam
 */
export async function getTopPerformers(input: {
  examId: string
  limit?: number
}): Promise<ActionResponse<ExamResultRow[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const { examId, limit = 10 } = input

    const topResults = await db.examResult.findMany({
      where: {
        examId,
        schoolId,
        isAbsent: false,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            givenName: true,
            middleName: true,
            surname: true,
          },
        },
      },
      orderBy: {
        marksObtained: "desc",
      },
      take: limit,
    })

    const mapped: ExamResultRow[] = topResults.map((result, index) => ({
      id: result.id,
      studentId: result.student.studentId,
      studentName: `${result.student.givenName} ${
        result.student.middleName || ""
      } ${result.student.surname}`.trim(),
      marksObtained: result.marksObtained,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      isAbsent: result.isAbsent,
      remarks: result.remarks,
    }))

    return {
      success: true,
      data: mapped,
    }
  } catch (error) {
    console.error("Error getting top performers:", error)
    return {
      success: false,
      error: "Failed to get top performers",
      code: "TOP_PERFORMERS_FAILED",
    }
  }
}

/**
 * Publish exam results (make them visible to students)
 */
export async function publishResults(input: {
  examId: string
  notifyStudents?: boolean
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

    const { examId, notifyStudents = true } = input

    // Check if exam exists and all results are entered
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        _count: {
          select: {
            results: true,
          },
        },
        class: {
          include: {
            _count: {
              select: {
                studentClasses: true,
              },
            },
          },
        },
      },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Check if all students have results
    const totalStudents = exam.class._count.studentClasses
    const resultsEntered = exam._count.results

    if (resultsEntered < totalStudents) {
      return {
        success: false,
        error: `Results incomplete. ${resultsEntered}/${totalStudents} students have results.`,
        code: "INCOMPLETE_RESULTS",
      }
    }

    // Update exam status to indicate results are published
    await db.exam.update({
      where: { id: examId },
      data: {
        status: "COMPLETED",
        // You might want to add a resultsPublishedAt field
      },
    })

    // TODO: Send notifications if notifyStudents is true
    if (notifyStudents) {
      // Implement notification logic here
      // This could involve sending emails, SMS, or in-app notifications
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error publishing results:", error)
    return {
      success: false,
      error: "Failed to publish results",
      code: "PUBLISH_FAILED",
    }
  }
}
