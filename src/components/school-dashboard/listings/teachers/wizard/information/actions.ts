"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getTeacherInformation(
  teacherId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        givenName: true,
        surname: true,
        gender: true,
        birthDate: true,
        profilePhotoUrl: true,
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    return {
      success: true,
      data: {
        givenName: teacher.givenName,
        surname: teacher.surname,
        gender: teacher.gender as "male" | "female" | undefined,
        birthDate: teacher.birthDate ?? undefined,
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

export async function updateTeacherInformation(
  teacherId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = informationSchema.parse(input)

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: {
        givenName: parsed.givenName,
        surname: parsed.surname,
        gender: parsed.gender ?? null,
        birthDate: parsed.birthDate ?? null,
        profilePhotoUrl: parsed.profilePhotoUrl ?? null,
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
