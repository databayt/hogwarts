"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { ExamStatus } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./types"

/**
 * Start an exam - changes status from PLANNED to IN_PROGRESS
 */
export async function startExam(
  examId: string
): Promise<ActionResponse<{ status: ExamStatus }>> {
  try {
    const { schoolId } = await getTenantContext()
    const session = await auth()

    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Check permissions (only ADMIN, TEACHER can start exams)
    if (
      !["ADMIN", "TEACHER", "DEVELOPER"].includes(session?.user?.role || "")
    ) {
      return {
        success: false,
        error: "Insufficient permissions to start exam",
        code: "PERMISSION_DENIED",
      }
    }

    // Get exam with generated questions
    const exam = await db.exam.findFirst({
      where: {
        id: examId,
        schoolId,
      },
      include: {
        generatedExam: {
          include: {
            _count: {
              select: { questions: true },
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

    // Check if exam can be started
    if (exam.status !== "PLANNED") {
      return {
        success: false,
        error: `Cannot start exam with status: ${exam.status}`,
        code: "INVALID_STATUS",
      }
    }

    // Check if exam has generated questions
    if (!exam.generatedExam || exam.generatedExam._count.questions === 0) {
      return {
        success: false,
        error: "Exam has no questions. Generate questions first.",
        code: "NO_QUESTIONS",
      }
    }

    // Update exam status
    const updated = await db.exam.update({
      where: { id: examId },
      data: {
        status: "IN_PROGRESS",
      },
    })

    revalidatePath("/exams")
    revalidatePath(`/exams/${examId}`)

    return {
      success: true,
      data: { status: updated.status },
    }
  } catch (error) {
    console.error("Error starting exam:", error)
    return {
      success: false,
      error: "Failed to start exam",
      code: "START_FAILED",
    }
  }
}

/**
 * Complete an exam - changes status from IN_PROGRESS to COMPLETED
 * Also triggers auto-grading for eligible questions
 */
export async function completeExam(
  examId: string,
  options?: { autoGrade?: boolean }
): Promise<ActionResponse<{ status: ExamStatus; autoGradedCount?: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    const session = await auth()

    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Check permissions
    if (
      !["ADMIN", "TEACHER", "DEVELOPER"].includes(session?.user?.role || "")
    ) {
      return {
        success: false,
        error: "Insufficient permissions to complete exam",
        code: "PERMISSION_DENIED",
      }
    }

    const exam = await db.exam.findFirst({
      where: {
        id: examId,
        schoolId,
      },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    if (exam.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: `Cannot complete exam with status: ${exam.status}`,
        code: "INVALID_STATUS",
      }
    }

    // Update exam status
    const updated = await db.exam.update({
      where: { id: examId },
      data: {
        status: "COMPLETED",
      },
    })

    let autoGradedCount = 0

    // Auto-grade if requested (default: true)
    if (options?.autoGrade !== false) {
      const { autoGradeExam } = await import("../../mark/actions/auto-mark")
      const gradeResult = await autoGradeExam(examId)
      if (gradeResult.success && gradeResult.data) {
        autoGradedCount = gradeResult.data.graded
      }
    }

    revalidatePath("/exams")
    revalidatePath(`/exams/${examId}`)
    revalidatePath("/exams/mark")

    return {
      success: true,
      data: {
        status: updated.status,
        autoGradedCount,
      },
    }
  } catch (error) {
    console.error("Error completing exam:", error)
    return {
      success: false,
      error: "Failed to complete exam",
      code: "COMPLETE_FAILED",
    }
  }
}

/**
 * Cancel an exam - changes status to CANCELLED
 */
export async function cancelExam(
  examId: string,
  reason?: string
): Promise<ActionResponse<{ status: ExamStatus }>> {
  try {
    const { schoolId } = await getTenantContext()
    const session = await auth()

    if (!schoolId) {
      return {
        success: false,
        error: "Missing school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    // Only ADMIN can cancel
    if (!["ADMIN", "DEVELOPER"].includes(session?.user?.role || "")) {
      return {
        success: false,
        error: "Only administrators can cancel exams",
        code: "PERMISSION_DENIED",
      }
    }

    const exam = await db.exam.findFirst({
      where: {
        id: examId,
        schoolId,
      },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    if (exam.status === "COMPLETED") {
      return {
        success: false,
        error: "Cannot cancel a completed exam",
        code: "INVALID_STATUS",
      }
    }

    const updated = await db.exam.update({
      where: { id: examId },
      data: {
        status: "CANCELLED",
        description: reason
          ? `${exam.description || ""}\n\n[Cancelled: ${reason}]`
          : exam.description,
      },
    })

    revalidatePath("/exams")
    revalidatePath(`/exams/${examId}`)

    return {
      success: true,
      data: { status: updated.status },
    }
  } catch (error) {
    console.error("Error cancelling exam:", error)
    return {
      success: false,
      error: "Failed to cancel exam",
      code: "CANCEL_FAILED",
    }
  }
}

/**
 * Get exam with full details for taking
 */
export async function getExamForTaking(examId: string): Promise<
  ActionResponse<{
    exam: {
      id: string
      title: string
      description: string | null
      duration: number
      totalMarks: number
      passingMarks: number
      instructions: string | null
      status: ExamStatus
    }
    questions: Array<{
      id: string
      questionId: string
      order: number
      points: number
      question: {
        id: string
        questionText: string
        questionType: string
        options: any
        imageUrl: string | null
      }
    }>
    existingAnswers: Array<{
      questionId: string
      answerText: string | null
      selectedOptionIds: string[]
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    const session = await auth()
    const studentId = session?.user?.id

    if (!schoolId || !studentId) {
      return {
        success: false,
        error: "Missing context",
        code: "NO_CONTEXT",
      }
    }

    const exam = await db.exam.findFirst({
      where: {
        id: examId,
        schoolId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalMarks: true,
        passingMarks: true,
        instructions: true,
        status: true,
      },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Students can only access IN_PROGRESS exams
    const userRole = session?.user?.role || ""
    const isTeacherOrAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
      userRole
    )

    if (!isTeacherOrAdmin && exam.status !== "IN_PROGRESS") {
      return {
        success: false,
        error: "Exam is not available for taking",
        code: "EXAM_NOT_ACTIVE",
      }
    }

    // Get generated questions
    const generatedExam = await db.generatedExam.findFirst({
      where: {
        examId,
        schoolId,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })

    if (!generatedExam) {
      return {
        success: false,
        error: "Exam has no questions",
        code: "NO_QUESTIONS",
      }
    }

    // Get existing answers for this student
    const existingAnswers = await db.studentAnswer.findMany({
      where: {
        examId,
        studentId,
        schoolId,
      },
      select: {
        questionId: true,
        answerText: true,
        selectedOptionIds: true,
      },
    })

    // Remove correct answers from options for students (prevent cheating)
    const questionsForStudent = generatedExam.questions.map((q) => {
      const question = q.question
      let sanitizedOptions = question.options

      // For MCQ/TF, remove isCorrect flag from options
      if (
        ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(question.questionType) &&
        Array.isArray(question.options)
      ) {
        sanitizedOptions = (question.options as any[]).map(
          (opt: any, idx: number) => ({
            text: opt.text,
            id: idx.toString(),
          })
        )
      }

      return {
        id: q.id,
        questionId: q.questionId,
        order: q.order,
        points: Number(q.points),
        question: {
          id: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          options: sanitizedOptions,
          imageUrl: question.imageUrl,
        },
      }
    })

    return {
      success: true,
      data: {
        exam: {
          ...exam,
          totalMarks: Number(exam.totalMarks),
          passingMarks: Number(exam.passingMarks),
        },
        questions: questionsForStudent,
        existingAnswers,
      },
    }
  } catch (error) {
    console.error("Error getting exam for taking:", error)
    return {
      success: false,
      error: "Failed to load exam",
      code: "LOAD_FAILED",
    }
  }
}

/**
 * Submit entire exam at once
 */
export async function submitExamAnswers(
  examId: string,
  answers: Array<{
    questionId: string
    answerText?: string
    selectedOptionIds?: string[]
  }>
): Promise<ActionResponse<{ submitted: number; failed: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    const session = await auth()
    const studentId = session?.user?.id

    if (!schoolId || !studentId) {
      return {
        success: false,
        error: "Missing context",
        code: "NO_CONTEXT",
      }
    }

    // Verify exam is IN_PROGRESS
    const exam = await db.exam.findFirst({
      where: {
        id: examId,
        schoolId,
        status: "IN_PROGRESS",
      },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found or not active",
        code: "EXAM_NOT_ACTIVE",
      }
    }

    let submitted = 0
    let failed = 0

    // Process each answer
    for (const answer of answers) {
      try {
        // Upsert answer
        await db.studentAnswer.upsert({
          where: {
            examId_questionId_studentId: {
              examId,
              questionId: answer.questionId,
              studentId,
            },
          },
          update: {
            answerText: answer.answerText || null,
            selectedOptionIds: answer.selectedOptionIds || [],
            submittedAt: new Date(),
          },
          create: {
            schoolId,
            examId,
            questionId: answer.questionId,
            studentId,
            submissionType: "DIGITAL",
            answerText: answer.answerText || null,
            selectedOptionIds: answer.selectedOptionIds || [],
            submittedAt: new Date(),
          },
        })
        submitted++
      } catch (err) {
        console.error(
          `Failed to submit answer for question ${answer.questionId}:`,
          err
        )
        failed++
      }
    }

    revalidatePath(`/exams/${examId}`)
    revalidatePath(`/exams/${examId}/take`)

    return {
      success: true,
      data: { submitted, failed },
    }
  } catch (error) {
    console.error("Error submitting exam answers:", error)
    return {
      success: false,
      error: "Failed to submit answers",
      code: "SUBMIT_FAILED",
    }
  }
}
