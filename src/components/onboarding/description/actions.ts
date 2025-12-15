"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import {
  createActionResponse,
  requireSchoolOwnership,
  type ActionResponse,
} from "@/lib/auth-security"
import { db } from "@/lib/db"

import { descriptionSchema, type DescriptionFormData } from "./validation"

export async function updateSchoolDescription(
  schoolId: string,
  data: DescriptionFormData
): Promise<ActionResponse> {
  console.log("🎯 [UPDATE SCHOOL DESCRIPTION] Starting", {
    schoolId,
    data,
    timestamp: new Date().toISOString(),
  })

  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    const validatedData = descriptionSchema.parse(data)
    console.log("✅ [UPDATE SCHOOL DESCRIPTION] Data validated", validatedData)

    // Update school description in database
    // Note: schoolType is not in current schema
    // Storing in planType as a temporary solution until schema is updated
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        planType: validatedData.schoolType, // Temporary storage until proper fields are added
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/onboarding/${schoolId}/description`)

    console.log("🎉 [UPDATE SCHOOL DESCRIPTION] Success", {
      schoolId: updatedSchool.id,
      planType: updatedSchool.planType,
      timestamp: new Date().toISOString(),
    })

    return createActionResponse(updatedSchool)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
        issues: error.issues,
      })
    }

    return createActionResponse(undefined, error)
  }
}

export async function getSchoolDescription(
  schoolId: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        planType: true, // Temporary field for school info
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    // Parse stored school type from planType field
    const schoolType = school.planType

    return createActionResponse({
      schoolType: schoolType as
        | "private"
        | "public"
        | "international"
        | "technical"
        | "special"
        | null,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function proceedToLocation(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    // Validate that description data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { planType: true },
    })

    if (!school?.planType) {
      throw new Error("Please select school type before proceeding")
    }

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to location:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/location`)
}
