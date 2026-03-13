"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { questionTypesSchema, type QuestionTypesFormData } from "./validation"

export async function updateTemplateQuestionTypes(
  templateId: string,
  data: QuestionTypesFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = questionTypesSchema.parse(data)

    // Build distribution: Record<QuestionType, Record<Difficulty, count>>
    const distribution: Record<string, Record<string, number>> = {}
    for (const qt of parsed.questionTypes) {
      distribution[qt.type] = {
        EASY: qt.difficulty.EASY,
        MEDIUM: qt.difficulty.MEDIUM,
        HARD: qt.difficulty.HARD,
      }
    }

    await db.examTemplate.updateMany({
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
