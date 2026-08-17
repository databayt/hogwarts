"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { getTenantContext } from "@/lib/tenant-context"
import {
  fetchLessonQuizQuestions,
  toClientQuestion,
  type LessonQuizQuestion,
} from "@/components/lumos/lib/lesson-quiz"

export interface LessonContent {
  questions: LessonQuizQuestion[]
}

/**
 * Fetch all supplementary content for a catalog lesson.
 *
 * The question set — gates, ordering and cap — is defined once in
 * `lib/lesson-quiz.ts` and shared with `submitLessonQuiz`, so what the student
 * sees is exactly what the server grades. The rows are stripped of their
 * answer key here (`toClientQuestion`); correctness comes back in the graded
 * response, not with the question.
 */
export async function getLessonContent(
  catalogLessonId: string
): Promise<LessonContent> {
  const { schoolId } = await getTenantContext()

  try {
    const rows = await fetchLessonQuizQuestions(catalogLessonId, schoolId)
    return { questions: rows.map(toClientQuestion) }
  } catch (error) {
    console.error("[getLessonContent] Prisma error:", {
      name: (error as Error)?.constructor?.name,
      code: (error as Record<string, unknown>)?.code,
      message: (error as Error)?.message,
      meta: (error as Record<string, unknown>)?.meta,
      catalogLessonId,
      schoolId,
    })
    throw error
  }
}
