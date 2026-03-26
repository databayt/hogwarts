"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  questionDetailsSchema,
  type QuestionDetailsFormData,
} from "./validation"

export async function getQuestionDetails(
  questionId: string
): Promise<ActionResponse<QuestionDetailsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const question = await db.questionBank.findFirst({
      where: { id: questionId, schoolId },
      select: {
        subjectId: true,
        questionText: true,
        questionType: true,
        difficulty: true,
        bloomLevel: true,
        points: true,
        timeEstimate: true,
        tags: true,
        explanation: true,
        imageUrl: true,
      },
    })

    if (!question) return actionError(ACTION_ERRORS.QUESTION_NOT_FOUND)

    return {
      success: true,
      data: {
        subjectId: question.subjectId,
        questionText: question.questionText,
        questionType: question.questionType,
        difficulty: question.difficulty,
        bloomLevel: question.bloomLevel,
        points: Number(question.points),
        timeEstimate: question.timeEstimate ?? undefined,
        tags: question.tags.join(", "),
        explanation: question.explanation ?? undefined,
        imageUrl: question.imageUrl ?? undefined,
      } as QuestionDetailsFormData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateQuestionDetails(
  questionId: string,
  input: QuestionDetailsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = questionDetailsSchema.parse(input)

    const tags =
      typeof parsed.tags === "string" && parsed.tags.trim().length > 0
        ? parsed.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []

    await db.questionBank.updateMany({
      where: { id: questionId, schoolId },
      data: {
        subjectId: parsed.subjectId,
        questionText: parsed.questionText,
        questionType: parsed.questionType,
        difficulty: parsed.difficulty,
        bloomLevel: parsed.bloomLevel,
        points: parsed.points,
        timeEstimate:
          parsed.timeEstimate != null && parsed.timeEstimate !== ""
            ? Number(parsed.timeEstimate)
            : null,
        tags,
        explanation: parsed.explanation || null,
        imageUrl: parsed.imageUrl || null,
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

/** Fetch subjects for the current school */
export async function getSubjectsForQuestion(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const { getSchoolSubjectOptions } = await import("@/lib/school-subjects")
    const subjects = (await getSchoolSubjectOptions(schoolId)).map((s) => ({
      id: s.id,
      name: s.name,
    }))

    return { success: true, data: subjects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}
