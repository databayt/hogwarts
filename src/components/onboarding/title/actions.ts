"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { titleSchema, type TitleFormData } from "./validation"

export async function getSchoolTitle(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, domain: true },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      title: school.name,
      subdomain: school.domain,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function updateSchoolTitle(
  schoolId: string,
  data: TitleFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = titleSchema.parse(data)

    await db.school.update({
      where: { id: schoolId },
      data: { name: validated.title },
    })

    revalidatePath(`/onboarding/${schoolId}/title`)
    return createActionResponse({ id: schoolId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
      })
    }
    return createActionResponse(undefined, error)
  }
}
