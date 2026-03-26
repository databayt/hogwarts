"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { scheduleSchema, type ScheduleFormData } from "./validation"

export async function getClassSchedule(
  classId: string
): Promise<ActionResponse<ScheduleFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const cls = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: {
        termId: true,
        startPeriodId: true,
        endPeriodId: true,
        classroomId: true,
        duration: true,
      },
    })

    if (!cls) return actionError(ACTION_ERRORS.CLASS_NOT_FOUND)

    return {
      success: true,
      data: {
        termId: cls.termId,
        startPeriodId: cls.startPeriodId,
        endPeriodId: cls.endPeriodId,
        classroomId: cls.classroomId,
        duration: cls.duration ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateClassSchedule(
  classId: string,
  input: ScheduleFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = scheduleSchema.parse(input)

    await db.class.updateMany({
      where: { id: classId, schoolId },
      data: {
        termId: parsed.termId,
        startPeriodId: parsed.startPeriodId,
        endPeriodId: parsed.endPeriodId,
        classroomId: parsed.classroomId,
        duration: parsed.duration ?? null,
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
