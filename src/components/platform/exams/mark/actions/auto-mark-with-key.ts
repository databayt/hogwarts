"use server"

/**
 * Enhanced Auto-Marking with Answer Key Integration
 * Uses pre-computed answer keys for faster, more accurate grading
 */
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
import type { ActionResponse, AutoGradeResult } from "./types"

// ============================================================================
// TYPES
// ============================================================================

interface AnswerKeyEntry {
  questionId: string
  order: number
  questionType: string
  correctAnswer: string | string[]
  correctOptionIndices?: number[]
  acceptedAnswers?: string[]
  caseSensitive?: boolean
  points: number
}

interface BatchGradeProgress {
  total: number
  graded: number
  failed: number
  skipped: number
  currentQuestion?: string
}

// ============================================================================
// GET OR CREATE ANSWER KEY
// ============================================================================

/**
 * Get the answer key for a generated exam
 * If not found, generate it from question data
 */
export async function getOrCreateAnswerKey(
  generatedExamId: string
): Promise<ActionResponse<AnswerKeyEntry[]>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Try to get existing answer key
    const existingKey = await db.examAnswerKey.findUnique({
      where: { generatedExamId },
    })

    if (existingKey) {
      return {
        success: true,
        data: existingKey.answers as AnswerKeyEntry[],
      }
    }

    // Generate answer key from generated exam questions
    const generatedExam = await db.generatedExam.findFirst({
      where: {
        id: generatedExamId,
        schoolId,
      },
      include: {
        exam: true,
      },
    })

    if (!generatedExam) {
      return { success: false, error: "Exam not found", code: "NOT_FOUND" }
    }

    // Get question IDs from the generated exam
    const questionIds = (generatedExam.questionIds as string[]) || []

    // Fetch questions with their correct answers
    const questions = await db.questionBank.findMany({
      where: {
        id: { in: questionIds },
        schoolId,
      },
    })

    // Build answer key entries
    const answers: AnswerKeyEntry[] = questionIds.map((qId, index) => {
      const question = questions.find((q) => q.id === qId)
      if (!question) {
        return {
          questionId: qId,
          order: index + 1,
          questionType: "UNKNOWN",
          correctAnswer: "",
          points: 0,
        }
      }

      const options = parseQuestionOptions(question.options)

      let correctAnswer: string | string[] = ""
      let correctOptionIndices: number[] = []
      let acceptedAnswers: string[] | undefined

      switch (question.questionType) {
        case "MULTIPLE_CHOICE":
          correctOptionIndices = options
            .map((opt, idx) => (opt.isCorrect ? idx : -1))
            .filter((idx) => idx >= 0)
          correctAnswer = correctOptionIndices.map(String)
          break

        case "TRUE_FALSE":
          const correctOption = options.find((opt) => opt.isCorrect)
          correctAnswer = correctOption?.text === "True" ? "true" : "false"
          correctOptionIndices = correctOption
            ? [options.indexOf(correctOption)]
            : []
          break

        case "FILL_BLANK":
          const fillOptions = question.options as {
            acceptedAnswers?: string[]
            caseSensitive?: boolean
          } | null
          acceptedAnswers = fillOptions?.acceptedAnswers || []
          correctAnswer = acceptedAnswers[0] || ""
          break

        case "SHORT_ANSWER":
        case "ESSAY":
          // These require manual/AI grading
          correctAnswer = ""
          break
      }

      return {
        questionId: qId,
        order: index + 1,
        questionType: question.questionType,
        correctAnswer,
        correctOptionIndices,
        acceptedAnswers,
        caseSensitive:
          (question.options as { caseSensitive?: boolean } | null)
            ?.caseSensitive ?? false,
        points: Number(question.points),
      }
    })

    // Save the answer key
    await db.examAnswerKey.create({
      data: {
        schoolId,
        generatedExamId,
        answers: answers as unknown as Parameters<
          typeof db.examAnswerKey.create
        >[0]["data"]["answers"],
        generatedBy: session.user.id,
      },
    })

    return { success: true, data: answers }
  } catch (error) {
    console.error("Error getting/creating answer key:", error)
    return {
      success: false,
      error: "Failed to get answer key",
      code: "ANSWER_KEY_FAILED",
    }
  }
}

// ============================================================================
// AUTO-GRADE WITH ANSWER KEY
// ============================================================================

/**
 * Auto-grade a single answer using the answer key
 * Falls back to question-based grading if no key exists
 */
export async function autoGradeWithKey(
  studentAnswerId: string,
  answerKey?: AnswerKeyEntry[]
): Promise<ActionResponse<AutoGradeResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Get student answer
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    })

    if (!studentAnswer) {
      return { success: false, error: "Answer not found", code: "NOT_FOUND" }
    }

    const question = studentAnswer.question

    // Check if auto-gradable
    if (!isAutoGradable(question.questionType)) {
      return {
        success: false,
        error: `${question.questionType} requires manual grading`,
        code: "NOT_AUTO_GRADABLE",
      }
    }

    // Try to find answer key entry
    let keyEntry: AnswerKeyEntry | undefined
    if (answerKey) {
      keyEntry = answerKey.find((k) => k.questionId === question.id)
    }

    let result: AutoGradeResult

    // Grade based on question type
    switch (question.questionType) {
      case "MULTIPLE_CHOICE": {
        const correctIds = keyEntry
          ? keyEntry.correctOptionIndices?.map(String) || []
          : parseQuestionOptions(question.options)
              .map((opt, idx) => (opt.isCorrect ? idx.toString() : null))
              .filter((id): id is string => id !== null)

        const gradeResult = gradeMCQ(
          studentAnswer.selectedOptionIds,
          correctIds,
          true
        )

        const maxPoints = keyEntry?.points || Number(question.points)
        result = {
          pointsAwarded: gradeResult.pointsAwarded * maxPoints,
          maxPoints,
          isCorrect: gradeResult.isCorrect,
          confidence: 1.0,
        }
        break
      }

      case "TRUE_FALSE": {
        let correctAnswer: boolean
        if (keyEntry) {
          correctAnswer = keyEntry.correctAnswer === "true"
        } else {
          const options = parseQuestionOptions(question.options)
          correctAnswer = options.find((opt) => opt.isCorrect)?.text === "True"
        }

        const studentSelection = studentAnswer.selectedOptionIds[0] === "0"
        const gradeResult = gradeTrueFalse(studentSelection, correctAnswer)

        const maxPoints = keyEntry?.points || Number(question.points)
        result = {
          pointsAwarded: gradeResult.isCorrect ? maxPoints : 0,
          maxPoints,
          isCorrect: gradeResult.isCorrect,
          confidence: 1.0,
        }
        break
      }

      case "FILL_BLANK": {
        let acceptedAnswers: string[]
        let caseSensitive: boolean

        if (keyEntry?.acceptedAnswers) {
          acceptedAnswers = keyEntry.acceptedAnswers
          caseSensitive = keyEntry.caseSensitive || false
        } else {
          const options = question.options as {
            acceptedAnswers?: string[]
            caseSensitive?: boolean
          } | null
          acceptedAnswers = parseAcceptedAnswers(options?.acceptedAnswers)
          caseSensitive = options?.caseSensitive || false
        }

        const gradeResult = gradeFillBlank(
          studentAnswer.answerText || "",
          acceptedAnswers,
          caseSensitive
        )

        const maxPoints = keyEntry?.points || Number(question.points)
        result = {
          pointsAwarded: gradeResult.isCorrect ? maxPoints : 0,
          maxPoints,
          isCorrect: gradeResult.isCorrect,
          confidence: 1.0,
        }
        break
      }

      default:
        return {
          success: false,
          error: "Unsupported question type",
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

    return { success: true, data: result }
  } catch (error) {
    console.error("Auto-grade with key error:", error)
    return {
      success: false,
      error: "Auto-grading failed",
      code: "AUTO_GRADE_FAILED",
    }
  }
}

// ============================================================================
// BATCH AUTO-GRADE WITH ANSWER KEY
// ============================================================================

/**
 * Auto-grade all answers for an exam using the answer key
 * Significantly faster than grading one-by-one
 */
export async function batchAutoGradeWithKey(
  examId: string,
  generatedExamId?: string,
  onProgress?: (progress: BatchGradeProgress) => void
): Promise<
  ActionResponse<{
    graded: number
    failed: number
    skipped: number
    total: number
  }>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Get or create answer key
    let answerKey: AnswerKeyEntry[] | undefined
    if (generatedExamId) {
      const keyResult = await getOrCreateAnswerKey(generatedExamId)
      if (keyResult.success) {
        answerKey = keyResult.data
      }
    }

    // Get all auto-gradable answers that haven't been graded
    const answers = await db.studentAnswer.findMany({
      where: {
        schoolId,
        examId,
        question: {
          questionType: {
            in: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"],
          },
        },
        OR: [
          { markingResult: null },
          {
            markingResult: {
              status: { not: "COMPLETED" },
            },
          },
        ],
      },
      include: {
        question: true,
        markingResult: true,
      },
    })

    const progress: BatchGradeProgress = {
      total: answers.length,
      graded: 0,
      failed: 0,
      skipped: 0,
    }

    // Process in batches of 50 for better performance
    const batchSize = 50
    for (let i = 0; i < answers.length; i += batchSize) {
      const batch = answers.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (answer) => {
          // Skip already completed
          if (answer.markingResult?.status === "COMPLETED") {
            progress.skipped++
            return
          }

          try {
            const result = await autoGradeWithKey(answer.id, answerKey)
            if (result.success) {
              progress.graded++
            } else {
              progress.failed++
            }
          } catch {
            progress.failed++
          }
        })
      )

      // Report progress
      onProgress?.(progress)
    }

    revalidatePath("/exams/mark")
    revalidatePath(`/exams/${examId}/results`)

    return {
      success: true,
      data: {
        graded: progress.graded,
        failed: progress.failed,
        skipped: progress.skipped,
        total: progress.total,
      },
    }
  } catch (error) {
    console.error("Batch auto-grade error:", error)
    return {
      success: false,
      error: "Batch grading failed",
      code: "BATCH_GRADE_FAILED",
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function saveMarkingResult(
  studentAnswer: {
    id: string
    schoolId: string
    examId: string
    questionId: string
    studentId: string
  },
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

// ============================================================================
// REFRESH ANSWER KEY
// ============================================================================

/**
 * Regenerate the answer key for an exam
 * Useful if questions have been modified
 */
export async function refreshAnswerKey(
  generatedExamId: string
): Promise<ActionResponse<AnswerKeyEntry[]>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    // Delete existing key
    await db.examAnswerKey.deleteMany({
      where: { generatedExamId },
    })

    // Regenerate
    return await getOrCreateAnswerKey(generatedExamId)
  } catch (error) {
    console.error("Error refreshing answer key:", error)
    return {
      success: false,
      error: "Failed to refresh answer key",
      code: "REFRESH_FAILED",
    }
  }
}
