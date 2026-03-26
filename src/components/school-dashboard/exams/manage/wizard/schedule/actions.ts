"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { scheduleSchema, type ScheduleFormData } from "./validation"

export async function getExamSchedule(
  examId: string
): Promise<ActionResponse<ScheduleFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      select: {
        examDate: true,
        startTime: true,
        endTime: true,
        duration: true,
        totalMarks: true,
        passingMarks: true,
        instructions: true,
      },
    })

    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)

    return {
      success: true,
      data: {
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        instructions: exam.instructions ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateExamSchedule(
  examId: string,
  input: ScheduleFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = scheduleSchema.parse(input)

    await db.exam.updateMany({
      where: { id: examId, schoolId },
      data: {
        examDate: parsed.examDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        duration: parsed.duration,
        totalMarks: parsed.totalMarks,
        passingMarks: parsed.passingMarks,
        instructions: parsed.instructions ?? null,
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
