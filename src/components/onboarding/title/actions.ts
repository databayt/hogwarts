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

import { titleSchema } from "./validation"

export type TitleFormData = z.infer<typeof titleSchema>

export async function updateSchoolTitle(
  schoolId: string,
  data: TitleFormData
): Promise<ActionResponse> {
  console.log("🎯 [UPDATE SCHOOL TITLE] Starting", {
    schoolId,
    data,
    timestamp: new Date().toISOString(),
  })

  try {
    // Validate user has ownership/access to this school
    console.log("🔐 [UPDATE SCHOOL TITLE] Checking ownership", { schoolId })
    await requireSchoolOwnership(schoolId)
    console.log("✅ [UPDATE SCHOOL TITLE] Ownership verified")

    const validatedData = titleSchema.parse(data)

    // Update school title in database
    console.log("📝 [UPDATE SCHOOL TITLE] Updating database", {
      schoolId,
      newTitle: validatedData.title,
    })

    const updateData: { name: string; domain?: string; updatedAt: Date } = {
      name: validatedData.title,
      updatedAt: new Date(),
    }

    // Only update domain if subdomain is provided
    if (validatedData.subdomain) {
      updateData.domain = validatedData.subdomain
    }

    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: updateData,
    })

    console.log("✅ [UPDATE SCHOOL TITLE] Database updated", {
      schoolId: updatedSchool.id,
      name: updatedSchool.name,
      timestamp: updatedSchool.updatedAt,
    })

    revalidatePath(`/onboarding/${schoolId}/title`)

    console.log("🎉 [UPDATE SCHOOL TITLE] Complete - returning success")
    return createActionResponse(updatedSchool)
  } catch (error) {
    console.error("❌ [UPDATE SCHOOL TITLE] Error:", error)

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

export async function getSchoolTitle(
  schoolId: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        domain: true,
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    return createActionResponse({
      title: school.name || "",
      subdomain: school.domain || "",
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function proceedToDescription(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId)

    // Validate that title exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    })

    if (!school?.name?.trim()) {
      throw new Error("Please set school name before proceeding")
    }

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to description:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/description`)
}
