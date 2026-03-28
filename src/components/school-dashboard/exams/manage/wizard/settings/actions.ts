"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { settingsSchema, type SettingsFormData } from "./validation"

export async function getExamSettings(
  examId: string
): Promise<ActionResponse<SettingsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      select: {
        proctorMode: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        maxAttempts: true,
        retakePenalty: true,
        allowLateSubmit: true,
        lateSubmitMinutes: true,
      },
    })

    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)

    return {
      success: true,
      data: {
        proctorMode: exam.proctorMode as SettingsFormData["proctorMode"],
        shuffleQuestions: exam.shuffleQuestions,
        shuffleOptions: exam.shuffleOptions,
        maxAttempts: exam.maxAttempts,
        retakePenalty: exam.retakePenalty
          ? Number(exam.retakePenalty)
          : undefined,
        allowLateSubmit: exam.allowLateSubmit,
        lateSubmitMinutes: exam.lateSubmitMinutes,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateExamSettings(
  examId: string,
  input: SettingsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = settingsSchema.parse(input)

    await db.schoolExam.updateMany({
      where: { id: examId, schoolId },
      data: {
        proctorMode: parsed.proctorMode,
        shuffleQuestions: parsed.shuffleQuestions,
        shuffleOptions: parsed.shuffleOptions,
        maxAttempts: parsed.maxAttempts,
        retakePenalty: parsed.retakePenalty ?? null,
        allowLateSubmit: parsed.allowLateSubmit,
        lateSubmitMinutes: parsed.lateSubmitMinutes,
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
