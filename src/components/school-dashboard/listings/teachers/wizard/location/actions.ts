"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { locationSchema, type LocationFormData } from "./validation"

export async function getTeacherLocation(
  teacherId: string
): Promise<ActionResponse<LocationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        currentAddress: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    return {
      success: true,
      data: {
        currentAddress: teacher.currentAddress ?? undefined,
        city: teacher.city ?? undefined,
        state: teacher.state ?? undefined,
        postalCode: teacher.postalCode ?? undefined,
        country: teacher.country ?? undefined,
        latitude: teacher.latitude ?? undefined,
        longitude: teacher.longitude ?? undefined,
      },
    }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function updateTeacherLocation(
  teacherId: string,
  input: LocationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = locationSchema.parse(input)

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: {
        currentAddress: parsed.currentAddress || null,
        city: parsed.city || null,
        state: parsed.state || null,
        postalCode: parsed.postalCode || null,
        country: parsed.country || null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
