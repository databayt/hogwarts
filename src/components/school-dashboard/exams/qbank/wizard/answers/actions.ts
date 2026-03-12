"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { answersSchema, type AnswersFormData } from "./validation"

export async function getQuestionAnswers(
  questionId: string
): Promise<ActionResponse<AnswersFormData & { questionType: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const question = await db.questionBank.findFirst({
      where: { id: questionId, schoolId },
      select: {
        questionType: true,
        options: true,
        sampleAnswer: true,
        gradingRubric: true,
      },
    })

    if (!question) return { success: false, error: "Question not found" }

    // Parse options from JSON
    const optionsData = question.options as {
      options?: { text: string; isCorrect?: boolean; explanation?: string }[]
      acceptedAnswers?: string[]
      caseSensitive?: boolean
    } | null

    return {
      success: true,
      data: {
        questionType: question.questionType,
        options: (optionsData?.options ?? []).map((opt) => ({
          ...opt,
          isCorrect: opt.isCorrect ?? false,
        })),
        acceptedAnswers: optionsData?.acceptedAnswers ?? [],
        caseSensitive: optionsData?.caseSensitive ?? false,
        sampleAnswer: question.sampleAnswer ?? undefined,
        gradingRubric: question.gradingRubric ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateQuestionAnswers(
  questionId: string,
  input: AnswersFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = answersSchema.parse(input)

    // Build the JSON options field based on what's provided
    const optionsJson: Record<string, unknown> = {}

    if (parsed.options && parsed.options.length > 0) {
      optionsJson.options = parsed.options
    }
    if (parsed.acceptedAnswers && parsed.acceptedAnswers.length > 0) {
      optionsJson.acceptedAnswers = parsed.acceptedAnswers
    }
    if (parsed.caseSensitive !== undefined) {
      optionsJson.caseSensitive = parsed.caseSensitive
    }

    await db.questionBank.updateMany({
      where: { id: questionId, schoolId },
      data: {
        options:
          Object.keys(optionsJson).length > 0
            ? (optionsJson as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        sampleAnswer: parsed.sampleAnswer || null,
        gradingRubric: parsed.gradingRubric || null,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
