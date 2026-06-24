"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { questionsSchema, type QuestionsFormData } from "./validation"

export async function updateTemplateQuestions(
  templateId: string,
  data: QuestionsFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = questionsSchema.parse(data)

    // Build distribution: Record<QuestionType, Record<Difficulty, count>>
    const distribution: Record<string, Record<string, number>> = {}
    for (const qt of parsed.questionTypes) {
      distribution[qt.type] = {
        EASY: qt.difficulty.EASY,
        MEDIUM: qt.difficulty.MEDIUM,
        HARD: qt.difficulty.HARD,
      }
    }

    await db.schoolExamTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: { distribution },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save question types",
    }
  }
}
