"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

import { joinSchema } from "./validation"

// TEMPORARILY: Local ActionResponse to bypass auth-security import chain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

function createActionResponse<T>(data?: T, error?: unknown): ActionResponse<T> {
  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred"
    return { success: false, error: errorMessage, code: "ERROR" }
  }
  return { success: true, data }
}

// Lazy auth import - only load when needed
async function requireSchoolOwnershipLazy(schoolId: string) {
  const { requireSchoolOwnership } = await import("@/lib/auth-security")
  return requireSchoolOwnership(schoolId)
}

export type JoinFormData = z.infer<typeof joinSchema>

export async function updateJoinSettings(
  schoolId: string,
  data: JoinFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    const validatedData = joinSchema.parse(data)

    // Update school join settings in database
    // Note: These fields are not in current schema, storing in email field temporarily
    const joinSettings = JSON.stringify(validatedData)
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        email: `join-settings:${joinSettings}`, // Temporary storage
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/onboarding/${schoolId}/join`)

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

export async function getJoinSettings(
  schoolId: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        email: true, // Temporary field for join settings
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    // Parse join settings from email field
    let joinSettings: JoinFormData = {
      joinMethod: "invite-with-codes",
      autoApproval: false,
      requireParentApproval: true,
      allowSelfEnrollment: false,
    }

    if (school.email?.startsWith("join-settings:")) {
      try {
        const parsed = JSON.parse(school.email.replace("join-settings:", ""))
        joinSettings = { ...joinSettings, ...parsed }
      } catch (e) {
        console.warn("Failed to parse join settings")
      }
    }

    return createActionResponse(joinSettings)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function proceedToVisibility(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to visibility:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/visibility`)
}
