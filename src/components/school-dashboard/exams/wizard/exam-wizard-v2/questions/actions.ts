"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

interface QuestionOption {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  points: number
}

/** Fetch available questions from QuestionBank for the school */
export async function getAvailableQuestions(
  subjectId?: string
): Promise<ActionResponse<QuestionOption[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const where: Record<string, unknown> = {
      schoolId,
      wizardStep: null, // Only completed questions
    }
    if (subjectId) {
      where.subjectId = subjectId
    }

    const questions = await db.questionBank.findMany({
      where,
      select: {
        id: true,
        questionText: true,
        questionType: true,
        difficulty: true,
        points: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    const data: QuestionOption[] = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      points: Number(q.points),
    }))

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load questions",
    }
  }
}

/** Update selected questions for the generated exam */
export async function updateSelectedQuestions(
  generatedExamId: string,
  questionIds: string[]
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    // Verify generated exam belongs to school
    const genExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      select: { id: true },
    })

    if (!genExam) {
      return { success: false, error: "Generated exam not found" }
    }

    // Delete existing questions and re-create
    await db.$transaction([
      db.generatedExamQuestion.deleteMany({
        where: { generatedExamId, schoolId },
      }),
      ...questionIds.map((questionId, index) =>
        db.generatedExamQuestion.create({
          data: {
            schoolId,
            generatedExamId,
            questionId,
            order: index + 1,
            points: 1, // Default, can be adjusted later
          },
        })
      ),
      db.generatedExam.updateMany({
        where: { id: generatedExamId, schoolId },
        data: { totalQuestions: questionIds.length },
      }),
    ])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update questions",
    }
  }
}
