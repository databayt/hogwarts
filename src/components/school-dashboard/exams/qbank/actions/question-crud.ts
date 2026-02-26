"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

    // Parse optional standardIds
    let standardIds: string[] = []
    if (data.standardIds) {
      if (typeof data.standardIds === "string") {
        standardIds = JSON.parse(data.standardIds)
      } else if (Array.isArray(data.standardIds)) {
        standardIds = data.standardIds
      }
      delete data.standardIds
    }

    // Parse optional visibility for catalog
    const visibility = (data.visibility as string) || "PRIVATE"
    delete data.visibility

    const validated = questionBankSchema.parse(data)

    // Resolve catalog subject from school subject
    const subject = await db.subject.findFirst({
      where: { id: validated.subjectId, schoolId },
      select: { catalogSubjectId: true },
    })

    // Extract optional fields from the discriminated union safely
    const v = validated as Record<string, unknown>

    // Create question with transaction: catalog first, then school mirror
    const question = await db.$transaction(async (tx) => {
      // 1. Create in catalog first (single source of truth)
      const catalogQuestion = await tx.catalogQuestion.create({
        data: {
          catalogSubjectId: subject?.catalogSubjectId ?? null,
          questionText: validated.questionText,
          questionType: validated.questionType,
          difficulty: validated.difficulty,
          bloomLevel: validated.bloomLevel,
          points: validated.points,
          options: (v.options as any) ?? undefined,
          sampleAnswer: (v.sampleAnswer as string) ?? null,
          explanation: validated.explanation ?? null,
          tags: validated.tags ?? [],
          contributedBy: userId,
          contributedSchoolId: schoolId,
          approvalStatus: "APPROVED",
          visibility: visibility as any,
          status: "PUBLISHED",
        },
      })

      // 2. Create school mirror with catalog link
      const newQuestion = await tx.questionBank.create({
        data: {
          ...validated,
          schoolId,
          createdBy: userId,
          source: "MANUAL",
          catalogQuestionId: catalogQuestion.id,
          catalogSubjectId: subject?.catalogSubjectId ?? null,
        },
      })

      // 3. Create analytics record
      await tx.questionAnalytics.create({
        data: {
          questionId: newQuestion.id,
          schoolId,
        },
      })

      // 4. Link to standards if provided
      if (standardIds.length > 0) {
        await tx.questionStandard.createMany({
          data: standardIds.map((standardId) => ({
            questionId: newQuestion.id,
            standardId,
            schoolId,
          })),
        })
      }

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

    // Parse optional standardIds
    let standardIds: string[] | undefined
    if (data.standardIds) {
      if (typeof data.standardIds === "string") {
        standardIds = JSON.parse(data.standardIds)
      } else if (Array.isArray(data.standardIds)) {
        standardIds = data.standardIds
      }
      delete data.standardIds
    }

    // Remove id from data before validation
    delete data.id

    const validated = questionBankSchema.parse(data)
    const uv = validated as Record<string, unknown>

    // Update with schoolId scope and handle standards in transaction
    const question = await db.$transaction(async (tx) => {
      // Update question
      const updated = await tx.questionBank.update({
        where: {
          id: questionId,
          schoolId, // CRITICAL: Multi-tenant scope
        },
        data: {
          ...validated,
          updatedAt: new Date(),
        },
      })

      // Sync changes back to CatalogQuestion if this school is the contributor
      if (updated.catalogQuestionId) {
        const catalogQ = await tx.catalogQuestion.findFirst({
          where: {
            id: updated.catalogQuestionId,
            contributedSchoolId: schoolId,
          },
        })
        if (catalogQ) {
          await tx.catalogQuestion.update({
            where: { id: catalogQ.id },
            data: {
              questionText: validated.questionText,
              questionType: validated.questionType,
              difficulty: validated.difficulty,
              bloomLevel: validated.bloomLevel,
              points: validated.points,
              options: (uv.options as any) ?? undefined,
              sampleAnswer: (uv.sampleAnswer as string) ?? null,
              explanation: validated.explanation ?? null,
              tags: validated.tags ?? [],
            },
          })
        }
      }

      // Update standards if provided
      if (standardIds !== undefined) {
        // Delete existing links
        await tx.questionStandard.deleteMany({
          where: {
            questionId,
            schoolId,
          },
        })

        // Create new links
        if (standardIds.length > 0) {
          await tx.questionStandard.createMany({
            data: standardIds.map((standardId) => ({
              questionId,
              standardId,
              schoolId,
            })),
          })
        }
      }

      return updated
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
      // Get the question to check for catalog link
      const question = await tx.questionBank.findFirst({
        where: { id: questionId, schoolId },
        select: { catalogQuestionId: true },
      })

      // Delete analytics first
      await tx.questionAnalytics.deleteMany({
        where: {
          questionId,
          schoolId,
        },
      })

      // Delete school mirror
      await tx.questionBank.delete({
        where: {
          id: questionId,
          schoolId, // CRITICAL: Multi-tenant scope
        },
      })

      // Clean up CatalogQuestion if this school is the contributor and no other schools use it
      if (question?.catalogQuestionId) {
        const otherMirrors = await tx.questionBank.count({
          where: { catalogQuestionId: question.catalogQuestionId },
        })
        if (otherMirrors === 0) {
          const catalogQ = await tx.catalogQuestion.findFirst({
            where: {
              id: question.catalogQuestionId,
              contributedSchoolId: schoolId,
            },
          })
          if (catalogQ) {
            await tx.catalogQuestion.delete({
              where: { id: catalogQ.id },
            })
          }
        }
      }
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

    // Create duplicate with transaction: new CatalogQuestion + new QuestionBank mirror
    const duplicate = await db.$transaction(async (tx) => {
      // Resolve catalog subject from school subject
      const subject = await tx.subject.findFirst({
        where: { id: original.subjectId, schoolId },
        select: { catalogSubjectId: true },
      })

      // 1. Create new CatalogQuestion for the duplicate
      const catalogQuestion = await tx.catalogQuestion.create({
        data: {
          catalogSubjectId:
            subject?.catalogSubjectId ?? original.catalogSubjectId,
          questionText: `${original.questionText} (Copy)`,
          questionType: original.questionType,
          difficulty: original.difficulty,
          bloomLevel: original.bloomLevel,
          points: original.points,
          options: original.options ?? undefined,
          sampleAnswer: original.sampleAnswer ?? null,
          explanation: original.explanation ?? null,
          tags: original.tags ?? [],
          contributedBy: userId,
          contributedSchoolId: schoolId,
          approvalStatus: "APPROVED",
          visibility: "PRIVATE",
          status: "PUBLISHED",
        },
      })

      // 2. Create school mirror
      const newQuestion = await tx.questionBank.create({
        data: {
          schoolId,
          subjectId: original.subjectId,
          questionText: `${original.questionText} (Copy)`,
          questionType: original.questionType,
          difficulty: original.difficulty,
          bloomLevel: original.bloomLevel,
          points: original.points,
          options: original.options ?? undefined,
          sampleAnswer: original.sampleAnswer ?? null,
          gradingRubric: original.gradingRubric ?? null,
          tags: original.tags ?? [],
          explanation: original.explanation ?? null,
          source: original.source,
          imageUrl: original.imageUrl ?? null,
          createdBy: userId,
          catalogQuestionId: catalogQuestion.id,
          catalogSubjectId:
            subject?.catalogSubjectId ?? original.catalogSubjectId,
          catalogChapterId: original.catalogChapterId ?? null,
          catalogLessonId: original.catalogLessonId ?? null,
        },
      })

      // 3. Create analytics for duplicate
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
