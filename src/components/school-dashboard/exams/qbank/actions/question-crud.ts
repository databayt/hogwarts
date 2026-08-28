"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"

import { db } from "@/lib/db"

import { questionBankSchema, type QuestionBankSchema } from "../validation"
import type {
  ActionResponse,
  CreateQuestionData,
  QuestionFilters,
  QuestionWithAnalytics,
} from "./types"

// ---------------------------------------------------------------------------
// Catalog bridge helpers
// ---------------------------------------------------------------------------

/**
 * A qbank question may be attached to a catalog LESSON, which is what makes it
 * show up in that lesson's practice quiz inside Lumos
 * (`components/lumos/lib/lesson-quiz.ts` reads `catalogLessonId`). Until this
 * existed, the only lane for a school-authored lesson quiz question was the
 * platform-review-gated `submitQuestion`, and everything authored here — which
 * self-approves — could never reach a lesson.
 *
 * The lesson is re-derived from the id, never trusted: it must live under the
 * subject the question was filed against, or the attachment is refused. The
 * chapter comes back with it so both catalog FKs stay consistent.
 */
async function resolveCatalogLesson(
  lessonId: string,
  subjectId: string | null | undefined
): Promise<{ id: string; chapterId: string } | null> {
  if (!subjectId) return null
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, chapter: { subjectId } },
    select: { id: true, chapterId: true },
  })
  return lesson
}

/**
 * The answer key as the catalog stores it.
 *
 * FILL_BLANK keeps `{ acceptedAnswers, caseSensitive }` in `options` — the Zod
 * union carries those as top-level fields, and the Lumos grader reads them
 * from `options`. Every other type stores its choice array as-is.
 */
function catalogOptionsFor(
  questionType: QuestionType,
  v: Record<string, unknown>
): unknown {
  if (questionType === "FILL_BLANK") {
    return {
      acceptedAnswers: (v.acceptedAnswers as string[]) ?? [],
      caseSensitive: v.caseSensitive === true,
    }
  }
  return v.options ?? undefined
}

/**
 * QuestionBank COLUMNS only.
 *
 * The validated payload is a discriminated union whose FILL_BLANK arm carries
 * `acceptedAnswers`/`caseSensitive`, which are not columns — spreading the
 * whole object into Prisma threw "Unknown argument" and made every FILL_BLANK
 * save fail. Mapping explicitly also keeps the mirror's `options` in the same
 * shape the edit form reads back.
 */
function questionBankColumns(
  validated: QuestionBankSchema,
  v: Record<string, unknown>
) {
  return {
    subjectId: validated.subjectId,
    questionText: validated.questionText,
    questionType: validated.questionType,
    difficulty: validated.difficulty,
    bloomLevel: validated.bloomLevel,
    points: validated.points,
    timeEstimate: (v.timeEstimate as number | undefined) ?? null,
    options: catalogOptionsFor(validated.questionType, v) as never,
    sampleAnswer: (v.sampleAnswer as string | undefined) ?? null,
    gradingRubric: (v.gradingRubric as string | undefined) ?? null,
    tags: validated.tags ?? [],
    explanation: validated.explanation ?? null,
    imageUrl: validated.imageUrl || null,
  }
}

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

    // Optional catalog lesson attachment — what puts this question into that
    // lesson's Lumos practice quiz. Pulled out before validation; the union
    // schema doesn't (and shouldn't) know about catalog FKs.
    const requestedLessonId =
      typeof data.catalogLessonId === "string" ? data.catalogLessonId : ""
    delete data.catalogLessonId

    const validated = questionBankSchema.parse(data)

    // Extract optional fields from the discriminated union safely
    const v = validated as Record<string, unknown>

    // Refuse an attachment that doesn't belong to the chosen subject rather
    // than silently filing the question under someone else's lesson.
    const lesson = requestedLessonId
      ? await resolveCatalogLesson(requestedLessonId, validated.subjectId)
      : null
    if (requestedLessonId && !lesson) {
      return {
        success: false,
        error: "That lesson does not belong to the selected subject",
        code: "LESSON_SUBJECT_MISMATCH",
      }
    }

    // Create question with transaction: catalog first, then school mirror
    const question = await db.$transaction(async (tx) => {
      // 1. Create in catalog first (single source of truth)
      // subjectId IS the catalogSubjectId now
      const catalogQuestion = await tx.question.create({
        data: {
          catalogSubjectId: validated.subjectId ?? null,
          catalogChapterId: lesson?.chapterId ?? null,
          catalogLessonId: lesson?.id ?? null,
          questionText: validated.questionText,
          questionType: validated.questionType,
          difficulty: validated.difficulty,
          bloomLevel: validated.bloomLevel,
          points: validated.points,
          options: catalogOptionsFor(validated.questionType, v) as never,
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
          ...questionBankColumns(validated, v),
          catalogChapterId: lesson?.chapterId ?? null,
          catalogLessonId: lesson?.id ?? null,
          schoolId,
          createdBy: userId,
          source: "MANUAL",
          catalogQuestionId: catalogQuestion.id,
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

    // Optional catalog lesson attachment. An empty string is an explicit
    // DETACH (the picker's "not attached" option); an absent field leaves the
    // current attachment alone.
    const hasLessonField = "catalogLessonId" in data
    const requestedLessonId =
      typeof data.catalogLessonId === "string" ? data.catalogLessonId : ""
    delete data.catalogLessonId

    const validated = questionBankSchema.parse(data)
    const uv = validated as Record<string, unknown>

    const lesson = requestedLessonId
      ? await resolveCatalogLesson(requestedLessonId, validated.subjectId)
      : null
    if (requestedLessonId && !lesson) {
      return {
        success: false,
        error: "That lesson does not belong to the selected subject",
        code: "LESSON_SUBJECT_MISMATCH",
      }
    }
    const catalogLinks = hasLessonField
      ? {
          catalogChapterId: lesson?.chapterId ?? null,
          catalogLessonId: lesson?.id ?? null,
        }
      : {}

    // Update with schoolId scope and handle standards in transaction
    const question = await db.$transaction(async (tx) => {
      // Update question
      const updated = await tx.questionBank.update({
        where: {
          id: questionId,
          schoolId, // CRITICAL: Multi-tenant scope
        },
        data: {
          ...questionBankColumns(validated, uv),
          ...catalogLinks,
          updatedAt: new Date(),
        },
      })

      // Sync changes back to Question if this school is the contributor
      if (updated.catalogQuestionId) {
        const catalogQ = await tx.question.findFirst({
          where: {
            id: updated.catalogQuestionId,
            contributedSchoolId: schoolId,
          },
        })
        if (catalogQ) {
          await tx.question.update({
            where: { id: catalogQ.id },
            data: {
              questionText: validated.questionText,
              questionType: validated.questionType,
              difficulty: validated.difficulty,
              bloomLevel: validated.bloomLevel,
              points: validated.points,
              options: catalogOptionsFor(validated.questionType, uv) as never,
              sampleAnswer: (uv.sampleAnswer as string) ?? null,
              explanation: validated.explanation ?? null,
              tags: validated.tags ?? [],
              // Keep the catalog row's lesson link in step with the mirror, or
              // detaching in the qbank would leave the question on the lesson.
              ...catalogLinks,
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

      // Clean up Question if this school is the contributor and no other schools use it
      if (question?.catalogQuestionId) {
        const otherMirrors = await tx.questionBank.count({
          where: { catalogQuestionId: question.catalogQuestionId },
        })
        if (otherMirrors === 0) {
          const catalogQ = await tx.question.findFirst({
            where: {
              id: question.catalogQuestionId,
              contributedSchoolId: schoolId,
            },
          })
          if (catalogQ) {
            await tx.question.delete({
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
        wizardStep: null,
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
            name: true,
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
            name: true,
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

    // Create duplicate with transaction: new Question + new QuestionBank mirror
    const duplicate = await db.$transaction(async (tx) => {
      // 1. Create new Question for the duplicate
      // subjectId IS the catalogSubjectId now
      const catalogQuestion = await tx.question.create({
        data: {
          catalogSubjectId: original.subjectId,
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
