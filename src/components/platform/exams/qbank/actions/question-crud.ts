"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"

import { db } from "@/lib/db"

import { questionBankSchema } from "../validation"
import type {
  ActionResponse,
  CreateQuestionData,
  QuestionFilters,
  QuestionWithAnalytics,
} from "./types"

/**
 * Create a new question in the question bank
 */
export async function createQuestion(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const userId = session.user.id

    // Parse and validate
    const data = Object.fromEntries(formData)

    // Parse JSON fields
    if (typeof data.tags === "string") {
      data.tags = JSON.parse(data.tags)
    }
    if (typeof data.options === "string" && data.options) {
      data.options = JSON.parse(data.options)
    }
    if (typeof data.acceptedAnswers === "string" && data.acceptedAnswers) {
      data.acceptedAnswers = JSON.parse(data.acceptedAnswers)
    }

    const validated = questionBankSchema.parse(data)

    // Create question with transaction to ensure analytics record is created
    const question = await db.$transaction(async (tx) => {
      // Create question
      const newQuestion = await tx.questionBank.create({
        data: {
          ...validated,
          schoolId,
          createdBy: userId,
          source: "MANUAL",
        },
      })

      // Create analytics record
      await tx.questionAnalytics.create({
        data: {
          questionId: newQuestion.id,
          schoolId,
        },
      })

      return newQuestion
    })

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/generate")

    return {
      success: true,
      data: { id: question.id },
    }
  } catch (error) {
    console.error("Create question error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid question data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to create question",
      code: "CREATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const data = Object.fromEntries(formData)
    const questionId = data.id as string

    if (!questionId) {
      return {
        success: false,
        error: "Question ID is required",
        code: "MISSING_ID",
      }
    }

    // Parse JSON fields
    if (typeof data.tags === "string") {
      data.tags = JSON.parse(data.tags)
    }
    if (typeof data.options === "string" && data.options) {
      data.options = JSON.parse(data.options)
    }
    if (typeof data.acceptedAnswers === "string" && data.acceptedAnswers) {
      data.acceptedAnswers = JSON.parse(data.acceptedAnswers)
    }

    // Remove id from data before validation
    delete data.id

    const validated = questionBankSchema.parse(data)

    // Update with schoolId scope
    const question = await db.questionBank.update({
      where: {
        id: questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      data: {
        ...validated,
        updatedAt: new Date(),
      },
    })

    revalidatePath("/exams/qbank")
    revalidatePath(`/exams/qbank/${questionId}`)
    revalidatePath("/exams/generate")

    return {
      success: true,
      data: { id: question.id },
    }
  } catch (error) {
    console.error("Update question error:", error)

    if (error instanceof Error && error.message.includes("validation")) {
      return {
        success: false,
        error: "Invalid question data",
        code: "VALIDATION_ERROR",
        details: error.message,
      }
    }

    return {
      success: false,
      error: "Failed to update question",
      code: "UPDATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Delete a question from the question bank
 */
export async function deleteQuestion(
  questionId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId

    // Check if question is used in any generated exams
    const usageCount = await db.generatedExamQuestion.count({
      where: {
        questionId,
        schoolId,
      },
    })

    if (usageCount > 0) {
      return {
        success: false,
        error: `Cannot delete: question is used in ${usageCount} exam(s)`,
        code: "QUESTION_IN_USE",
      }
    }

    // Check for student answers
    const answerCount = await db.studentAnswer.count({
      where: {
        questionId,
        schoolId,
      },
    })

    if (answerCount > 0) {
      return {
        success: false,
        error: `Cannot delete: question has ${answerCount} student answer(s)`,
        code: "HAS_STUDENT_ANSWERS",
      }
    }

    // Delete with transaction to ensure cascade
    await db.$transaction(async (tx) => {
      // Delete analytics first
      await tx.questionAnalytics.deleteMany({
        where: {
          questionId,
          schoolId,
        },
      })

      // Delete question
      await tx.questionBank.delete({
        where: {
          id: questionId,
          schoolId, // CRITICAL: Multi-tenant scope
        },
      })
    })

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/generate")

    return { success: true }
  } catch (error) {
    console.error("Delete question error:", error)
    return {
      success: false,
      error: "Failed to delete question",
      code: "DELETE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

/**
 * Get questions with filters
 */
export async function getQuestions(
  filters?: QuestionFilters
): Promise<QuestionWithAnalytics[]> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context")
    }

    const schoolId = session.user.schoolId

    const questions = await db.questionBank.findMany({
      where: {
        schoolId, // CRITICAL: Multi-tenant scope
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.questionType && {
          questionType: filters.questionType as QuestionType,
        }),
        ...(filters?.difficulty && {
          difficulty: filters.difficulty as DifficultyLevel,
        }),
        ...(filters?.bloomLevel && {
          bloomLevel: filters.bloomLevel as BloomLevel,
        }),
        ...(filters?.search && {
          OR: [
            {
              questionText: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              tags: {
                has: filters.search,
              },
            },
          ],
        }),
        ...(filters?.tags &&
          filters.tags.length > 0 && {
            tags: {
              hasSome: filters.tags,
            },
          }),
      },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
          },
        },
        analytics: true,
        _count: {
          select: {
            generatedExamQuestions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return questions
  } catch (error) {
    console.error("Get questions error:", error)
    throw error
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(
  questionId: string
): Promise<QuestionWithAnalytics | null> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      throw new Error("Unauthorized - No school context")
    }

    const schoolId = session.user.schoolId

    const question = await db.questionBank.findFirst({
      where: {
        id: questionId,
        schoolId, // CRITICAL: Multi-tenant scope
      },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
          },
        },
        analytics: true,
        _count: {
          select: {
            generatedExamQuestions: true,
          },
        },
      },
    })

    return question
  } catch (error) {
    console.error("Get question error:", error)
    throw error
  }
}

/**
 * Duplicate a question
 */
export async function duplicateQuestion(
  questionId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    const schoolId = session.user.schoolId
    const userId = session.user.id

    // Get original question
    const original = await db.questionBank.findFirst({
      where: {
        id: questionId,
        schoolId,
      },
    })

    if (!original) {
      return {
        success: false,
        error: "Question not found",
        code: "QUESTION_NOT_FOUND",
      }
    }

    // Create duplicate with transaction
    const duplicate = await db.$transaction(async (tx) => {
      // Destructure to exclude id and relation fields
      const { id, generationJob, analytics, examQuestions, ...questionData } =
        original as any

      // Create duplicate question
      const newQuestion = await tx.questionBank.create({
        data: {
          ...questionData,
          questionText: `${original.questionText} (Copy)`,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Keep same school context
          schoolId,
        },
      })

      // Create analytics for duplicate
      await tx.questionAnalytics.create({
        data: {
          questionId: newQuestion.id,
          schoolId,
        },
      })

      return newQuestion
    })

    revalidatePath("/exams/qbank")

    return {
      success: true,
      data: { id: duplicate.id },
    }
  } catch (error) {
    console.error("Duplicate question error:", error)
    return {
      success: false,
      error: "Failed to duplicate question",
      code: "DUPLICATE_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}
