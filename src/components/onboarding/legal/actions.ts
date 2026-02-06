"use server"

import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export async function completeOnboarding(
  schoolId: string,
  legalData: {
    operationalStatus: string
    safetyFeatures: string[]
  }
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.update({
      where: { id: schoolId },
      data: {
        isActive: true,
        onboardingStep: "legal",
      },
      select: { id: true, name: true, domain: true },
    })

    if (!school.domain) {
      throw new Error(
        "School subdomain not configured. Please complete the subdomain step."
      )
    }

    revalidatePath(`/onboarding/${schoolId}`)

    return createActionResponse({
      success: true,
      school,
      redirectUrl: `/onboarding/${schoolId}/congratulations`,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getSchoolOnboardingStatus(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        isPublished: true,
        onboardingCompletedAt: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      isCompleted: !!school.onboardingCompletedAt,
      isActive: school.isActive,
      isPublished: school.isPublished,
      domain: school.domain,
      name: school.name,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
