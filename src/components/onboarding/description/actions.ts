"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { descriptionSchema, type DescriptionFormData } from "./validation"

export async function updateSchoolDescription(
  schoolId: string,
  data: DescriptionFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = descriptionSchema.parse(data)

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        schoolType: validated.schoolType,
        schoolLevel: validated.schoolLevel ?? null,
        description: validated.description ?? null,
      },
    })

    revalidatePath(`/onboarding/${schoolId}/description`)
    return createActionResponse(updatedSchool)
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

export async function getSchoolDescription(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        schoolType: true,
        schoolLevel: true,
        description: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      schoolType: school.schoolType as
        | "private"
        | "public"
        | "international"
        | "technical"
        | "special"
        | null,
      schoolLevel: school.schoolLevel as
        | "primary"
        | "secondary"
        | "both"
        | null,
      description: school.description,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
