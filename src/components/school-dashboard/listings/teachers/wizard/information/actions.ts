"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getTeacherInformation(
  teacherId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        nationality: true,
      },
    })

    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    return {
      success: true,
      data: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        gender: teacher.gender as "male" | "female" | undefined,
        birthDate: teacher.birthDate ?? undefined,
        nationality: teacher.nationality ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherInformation(
  teacherId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = informationSchema.parse(input)

    // Detect the language the name was entered in (from current locale)
    const cookieStore = await cookies()
    const lang = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        gender: parsed.gender ?? null,
        birthDate: parsed.birthDate ?? null,
        nationality: parsed.nationality ?? null,
        lang,
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
