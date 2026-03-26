"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { PhotoFormData } from "./validation"

export async function getTeacherPhoto(
  teacherId: string
): Promise<ActionResponse<PhotoFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { profilePhotoUrl: true },
    })

    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    return {
      success: true,
      data: {
        profilePhotoUrl: teacher.profilePhotoUrl ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherPhoto(
  teacherId: string,
  input: PhotoFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: {
        profilePhotoUrl: input.profilePhotoUrl || null,
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
