"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { DifficultyLevel, QuestionType } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./types"

// ============================================================================
// Browse catalog questions available for adoption
// ============================================================================

export interface CatalogBrowseFilters {
  catalogSubjectId?: string
  questionType?: string
  difficulty?: string
  search?: string
  page?: number
}

export interface CatalogQuestionRow {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  points: number
  tags: string[]
  visibility: string
  usageCount: number
  catalogSubjectName: string | null
  catalogChapterName: string | null
  contributedSchoolId: string | null
  isAdopted: boolean
}

export async function browseCatalogQuestions(
  filters: CatalogBrowseFilters
): Promise<{ questions: CatalogQuestionRow[]; total: number }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { questions: [], total: 0 }
  }

  // Find already-adopted question IDs for this school
  const adopted = await db.questionBank.findMany({
    where: { schoolId, catalogQuestionId: { not: null } },
    select: { catalogQuestionId: true },
  })
  const adoptedIds = new Set(
    adopted.map((q) => q.catalogQuestionId).filter(Boolean)
  )

  // Build where clause
  const where: any = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    OR: [
      { visibility: "PUBLIC" },
      { contributedSchoolId: schoolId }, // Own PRIVATE/SCHOOL content
    ],
  }

  if (filters.catalogSubjectId) {
    where.catalogSubjectId = filters.catalogSubjectId
  }
  if (filters.questionType) {
    where.questionType = filters.questionType as QuestionType
  }
  if (filters.difficulty) {
    where.difficulty = filters.difficulty as DifficultyLevel
  }
  if (filters.search) {
    where.questionText = { contains: filters.search, mode: "insensitive" }
  }

  const page = filters.page || 0
  const take = 20

  const [questions, total] = await Promise.all([
    db.catalogQuestion.findMany({
      where,
      include: {
        catalogSubject: { select: { name: true } },
        catalogChapter: { select: { name: true } },
      },
      take,
      skip: page * take,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    }),
    db.catalogQuestion.count({ where }),
  ])

  return {
    questions: questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      points: Number(q.points),
      tags: q.tags,
      visibility: q.visibility,
      usageCount: q.usageCount,
      catalogSubjectName: q.catalogSubject?.name ?? null,
      catalogChapterName: q.catalogChapter?.name ?? null,
      contributedSchoolId: q.contributedSchoolId,
      isAdopted: adoptedIds.has(q.id),
    })),
    total,
  }
}

// ============================================================================
// Adopt a catalog question into the school's question bank
// ============================================================================

export async function adoptCatalogQuestion(
  catalogQuestionId: string
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

    // Verify question exists and is accessible
    const catalogQ = await db.catalogQuestion.findFirst({
      where: {
        id: catalogQuestionId,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: schoolId }],
      },
    })

    if (!catalogQ) {
      return {
        success: false,
        error: "Question not available",
        code: "NOT_FOUND",
      }
    }

    // Check not already adopted
    const existing = await db.questionBank.findFirst({
      where: { schoolId, catalogQuestionId },
    })
    if (existing) {
      return {
        success: false,
        error: "Already in your question bank",
        code: "ALREADY_ADOPTED",
      }
    }

    // Find matching school subject via catalogSubjectId bridge
    const subject = await db.subject.findFirst({
      where: { schoolId, catalogSubjectId: catalogQ.catalogSubjectId },
    })
    if (!subject) {
      return {
        success: false,
        error: "Subject not in your school",
        code: "SUBJECT_NOT_FOUND",
      }
    }

    // Create mirror + analytics in transaction
    const question = await db.$transaction(async (tx) => {
      const newQuestion = await tx.questionBank.create({
        data: {
          schoolId,
          subjectId: subject.id,
          catalogQuestionId: catalogQ.id,
          catalogSubjectId: catalogQ.catalogSubjectId,
          catalogChapterId: catalogQ.catalogChapterId,
          catalogLessonId: catalogQ.catalogLessonId,
          questionText: catalogQ.questionText,
          questionType: catalogQ.questionType,
          difficulty: catalogQ.difficulty,
          bloomLevel: catalogQ.bloomLevel,
          points: catalogQ.points,
          options: catalogQ.options ?? undefined,
          sampleAnswer: catalogQ.sampleAnswer ?? null,
          explanation: catalogQ.explanation ?? null,
          tags: catalogQ.tags ?? [],
          source: "IMPORTED",
          createdBy: userId,
        },
      })

      await tx.questionAnalytics.create({
        data: {
          questionId: newQuestion.id,
          schoolId,
        },
      })

      // Increment catalog usage count
      await tx.catalogQuestion.update({
        where: { id: catalogQuestionId },
        data: { usageCount: { increment: 1 } },
      })

      return newQuestion
    })

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/generate")

    return { success: true, data: { id: question.id } }
  } catch (error) {
    console.error("Adopt catalog question error:", error)
    return {
      success: false,
      error: "Failed to adopt question",
      code: "ADOPT_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

// ============================================================================
// Bulk adopt multiple catalog questions
// ============================================================================

export async function bulkAdoptCatalogQuestions(
  catalogQuestionIds: string[]
): Promise<ActionResponse<{ adopted: number; skipped: number }>> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return {
        success: false,
        error: "Unauthorized - No school context",
        code: "NO_SCHOOL_CONTEXT",
      }
    }

    let adopted = 0
    let skipped = 0

    for (const id of catalogQuestionIds) {
      const result = await adoptCatalogQuestion(id)
      if (result.success) {
        adopted++
      } else {
        skipped++
      }
    }

    return { success: true, data: { adopted, skipped } }
  } catch (error) {
    console.error("Bulk adopt error:", error)
    return {
      success: false,
      error: "Failed to bulk adopt questions",
      code: "BULK_ADOPT_FAILED",
      details: error instanceof Error ? error.message : undefined,
    }
  }
}

// ============================================================================
// Get catalog subjects for filter dropdown
// ============================================================================

export async function getCatalogSubjectsForBrowse(): Promise<
  { id: string; name: string }[]
> {
  const subjects = await db.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  })
  return subjects
}
