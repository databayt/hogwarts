"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { GradingMethod, MarkingStatus } from "@prisma/client"

import { db } from "@/lib/db"

import {
  gradeFillBlank,
  gradeMCQ,
  gradeTrueFalse,
  isAutoGradable,
  parseAcceptedAnswers,
  parseQuestionOptions,
} from "../utils"
import type {
  ActionResponse,
  AutoGradeResult,
  StudentAnswerWithDetails,
} from "./types"

/**
 * Auto-grade a student's answer based on question type
 */
export async function autoGradeAnswer(
  studentAnswerId: string
): Promise<ActionResponse<AutoGradeResult>> {
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

    // Get student answer with question details
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    })

    if (!studentAnswer) {
      return {
        success: false,
        error: "Answer not found",
        code: "ANSWER_NOT_FOUND",
      }
    }

    const question = studentAnswer.question

    // Check if question type is auto-gradable
    if (!isAutoGradable(question.questionType)) {
      return {
        success: false,
        error: `Question type ${question.questionType} is not auto-gradable`,
        code: "NOT_AUTO_GRADABLE",
      }
    }

    let result: AutoGradeResult

    // Auto-grade based on question type
    switch (question.questionType) {
      case "MULTIPLE_CHOICE": {
        const options = parseQuestionOptions(question.options)
        const correctIds = options
          .map((opt, idx) => (opt.isCorrect ? idx.toString() : null))
          .filter((id): id is string => id !== null)

        const gradeResult = gradeMCQ(
          studentAnswer.selectedOptionIds,
          correctIds,
          true // Allow partial credit
        )

        result = {
          pointsAwarded: gradeResult.pointsAwarded * Number(question.points),
          maxPoints: Number(question.points),
          isCorrect: gradeResult.isCorrect,
          confidence: 1.0, // 100% confidence for auto-graded MCQ
        }
        break
      }

      case "TRUE_FALSE": {
        const options = parseQuestionOptions(question.options)
        const correctAnswer =
          options.find((opt) => opt.isCorrect)?.text === "True"
        const studentSelection = studentAnswer.selectedOptionIds[0] === "0"

        const gradeResult = gradeTrueFalse(studentSelection, correctAnswer)

        result = {
          pointsAwarded: gradeResult.isCorrect ? Number(question.points) : 0,
          maxPoints: Number(question.points),
          isCorrect: gradeResult.isCorrect,
          confidence: 1.0, // 100% confidence for auto-graded T/F
        }
        break
      }

      case "FILL_BLANK": {
        const options = question.options as {
          acceptedAnswers?: string[]
          caseSensitive?: boolean
        } | null
        const acceptedAnswers = parseAcceptedAnswers(options?.acceptedAnswers)
        const gradeResult = gradeFillBlank(
          studentAnswer.answerText || "",
          acceptedAnswers,
          options?.caseSensitive
        )

        result = {
          pointsAwarded: gradeResult.isCorrect ? Number(question.points) : 0,
          maxPoints: Number(question.points),
          isCorrect: gradeResult.isCorrect,
          confidence: 1.0, // 100% confidence for exact match
        }
        break
      }

      default:
        return {
          success: false,
          error: "Question type not supported for auto-grading",
          code: "UNSUPPORTED_TYPE",
        }
    }

    // Save marking result
    await saveMarkingResult(
      studentAnswer,
      result,
      "AUTO",
      "AUTO_GRADED",
      session.user.id
    )

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${studentAnswer.examId}/results`)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Auto-grade error:", error)
    return {
      success: false,
      error: "Auto-grading failed",
      code: "AUTO_GRADE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Auto-grade all answers for an exam
 */
export async function autoGradeExam(
  examId: string
): Promise<ActionResponse<{ graded: number; failed: number; total: number }>> {
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

    // Verify exam exists and belongs to school
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "EXAM_NOT_FOUND",
      }
    }

    // Get all student answers for auto-gradable questions
    const answers = await db.studentAnswer.findMany({
      where: {
        schoolId,
        examId,
        question: {
          questionType: {
            in: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"],
          },
        },
      },
      include: {
        question: true,
        markingResult: true,
      },
    })

    let graded = 0
    let failed = 0

    for (const answer of answers) {
      // Skip if already graded
      if (answer.markingResult && answer.markingResult.status === "COMPLETED") {
        continue
      }

      try {
        const result = await autoGradeAnswer(answer.id)
        if (result.success) {
          graded++
        } else {
          failed++
          console.error(`Failed to grade answer ${answer.id}:`, result.error)
        }
      } catch (error) {
        failed++
        console.error(`Error grading answer ${answer.id}:`, error)
      }
    }

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${examId}/results`)

    return {
      success: true,
      data: {
        graded,
        failed,
        total: answers.length,
      },
    }
  } catch (error) {
    console.error("Auto-grade exam error:", error)
    return {
      success: false,
      error: "Failed to auto-grade exam",
      code: "EXAM_GRADE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Helper function to save marking result
 */
async function saveMarkingResult(
  studentAnswer: any,
  result: AutoGradeResult,
  gradingMethod: GradingMethod,
  status: MarkingStatus,
  gradedBy?: string
): Promise<void> {
  const existingResult = await db.markingResult.findUnique({
    where: { studentAnswerId: studentAnswer.id },
  })

  const markingData = {
    schoolId: studentAnswer.schoolId,
    examId: studentAnswer.examId,
    questionId: studentAnswer.questionId,
    studentId: studentAnswer.studentId,
    gradingMethod,
    status,
    pointsAwarded: result.pointsAwarded,
    maxPoints: result.maxPoints,
    gradedBy,
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
        studentAnswerId: studentAnswer.id,
      },
    })
  }
}
