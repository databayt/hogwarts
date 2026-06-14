"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Auto-generate the question set for a drafted exam from its template's
 * distribution, pulling from the school question bank. This wires the existing
 * `generateExamQuestions` selection algorithm into the exam-generate wizard so
 * a teacher gets a one-click, distribution-correct paper instead of hand-picking.
 */
import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type {
  BloomDistribution,
  QuestionBankDTO,
  TemplateDistribution,
} from "../../../generate/types"
import { generateExamQuestions } from "../../../generate/utils"

const EMPTY_BANK_MESSAGE =
  "No matching questions in the bank for this template."

export interface CoverageSlot {
  questionType: string
  difficulty: string
  needed: number
  available: number
}

export interface AutoGenerateResult {
  selectedQuestionIds: string[]
  totalQuestions: number
  totalMarks: number
  distributionMet: boolean
  missingCategories: string[]
  coverage: CoverageSlot[]
}

async function loadGenerationContext(
  generatedExamId: string,
  schoolId: string
) {
  const generatedExam = await db.generatedExam.findFirst({
    where: { id: generatedExamId, schoolId },
    select: {
      id: true,
      templateId: true,
      isRandomized: true,
      seed: true,
      exam: { select: { subjectId: true } },
    },
  })
  if (!generatedExam) {
    return { ok: false as const, error: ACTION_ERRORS.EXAM_NOT_FOUND }
  }
  if (!generatedExam.templateId) {
    return { ok: false as const, error: ACTION_ERRORS.VALIDATION_ERROR }
  }

  const template = await db.schoolExamTemplate.findFirst({
    where: { id: generatedExam.templateId, schoolId },
    select: { distribution: true, bloomDistribution: true, subjectId: true },
  })
  if (!template) {
    return { ok: false as const, error: ACTION_ERRORS.VALIDATION_ERROR }
  }

  const subjectId = generatedExam.exam?.subjectId ?? template.subjectId

  const questions = (await db.questionBank.findMany({
    where: { schoolId, subjectId, wizardStep: null },
    orderBy: { createdAt: "desc" },
  })) as unknown as QuestionBankDTO[]

  return {
    ok: true as const,
    generatedExam,
    distribution: (template.distribution ?? {}) as TemplateDistribution,
    bloomDistribution:
      (template.bloomDistribution as BloomDistribution | null) ?? undefined,
    questions,
  }
}

function buildCoverage(
  distribution: TemplateDistribution,
  questions: QuestionBankDTO[]
): CoverageSlot[] {
  const counts = new Map<string, number>()
  for (const q of questions) {
    const key = `${q.questionType}-${q.difficulty}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const slots: CoverageSlot[] = []
  for (const [questionType, byDifficulty] of Object.entries(distribution)) {
    for (const [difficulty, needed] of Object.entries(byDifficulty)) {
      if (!needed) continue
      slots.push({
        questionType,
        difficulty,
        needed: needed as number,
        available: counts.get(`${questionType}-${difficulty}`) ?? 0,
      })
    }
  }
  return slots
}

/** Preview how well the bank covers the template before generating. */
export async function getTemplateCoverage(
  generatedExamId: string
): Promise<ActionResponse<CoverageSlot[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const ctx = await loadGenerationContext(generatedExamId, schoolId)
    if (!ctx.ok) return actionError(ctx.error)

    return {
      success: true,
      data: buildCoverage(ctx.distribution, ctx.questions),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to compute coverage",
    }
  }
}

/**
 * Run the selection algorithm and persist the chosen questions onto the
 * generated exam, with each question's real point value (not a flat 1).
 */
export async function autoGenerateExamQuestions(
  generatedExamId: string
): Promise<ActionResponse<AutoGenerateResult>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const ctx = await loadGenerationContext(generatedExamId, schoolId)
    if (!ctx.ok) return actionError(ctx.error)

    const { distribution, bloomDistribution, questions, generatedExam } = ctx

    const result = generateExamQuestions(
      questions,
      distribution,
      bloomDistribution,
      generatedExam.isRandomized,
      generatedExam.seed ?? undefined
    )

    const selected = result.selectedQuestions
    if (selected.length === 0) {
      // Friendly, non-fatal message; the client also has a dictionary fallback.
      return { success: false, error: EMPTY_BANK_MESSAGE }
    }

    const totalMarks = selected.reduce((sum, q) => sum + Number(q.points), 0)

    await db.$transaction([
      db.generatedExamQuestion.deleteMany({
        where: { generatedExamId, schoolId },
      }),
      ...selected.map((q, index) =>
        db.generatedExamQuestion.create({
          data: {
            schoolId,
            generatedExamId,
            questionId: q.id,
            order: index + 1,
            points: Number(q.points) || 1,
          },
        })
      ),
      db.generatedExam.updateMany({
        where: { id: generatedExamId, schoolId },
        data: { totalQuestions: selected.length },
      }),
    ])

    // Answer key may be stale after a regeneration — drop it so marking rebuilds.
    await db.examAnswerKey.deleteMany({ where: { generatedExamId, schoolId } })

    revalidatePath(`/exams/generate/add/${generatedExamId}/questions`)

    return {
      success: true,
      data: {
        selectedQuestionIds: selected.map((q) => q.id),
        totalQuestions: selected.length,
        totalMarks,
        distributionMet: result.metadata.distributionMet,
        missingCategories: result.metadata.missingCategories,
        coverage: buildCoverage(distribution, questions),
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to auto-generate exam",
    }
  }
}
