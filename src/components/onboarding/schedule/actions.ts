"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export async function getSchoolScheduleData(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        country: true,
        schoolType: true,
        schoolLevel: true,
        curriculum: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      country: school.country || null,
      schoolType: school.schoolType || undefined,
      schoolLevel: school.schoolLevel || undefined,
      selectedStructure: school.curriculum || undefined,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function saveScheduleChoice(
  schoolId: string,
  structureSlug: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    // Store the chosen structure slug in the school's curriculum field
    await db.school.update({
      where: { id: schoolId },
      data: { curriculum: structureSlug },
    })

    revalidatePath(`/onboarding/${schoolId}/schedule`)
    return createActionResponse({ structureSlug })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
