"use server"

import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { setupCatalogForSchool } from "@/lib/catalog-setup"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export async function publishSchool(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.update({
      where: { id: schoolId },
      data: {
        isPublished: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: "completed",
      },
      select: { id: true, name: true, domain: true, country: true },
    })

    // Auto-setup academic structure (grades, levels, subject selections)
    // Non-blocking: catalog setup failure should NOT prevent publishing
    try {
      await setupCatalogForSchool(schoolId, {
        country: school.country || undefined,
      })
    } catch (catalogError) {
      console.error(
        `[publishSchool] Catalog setup failed for school ${schoolId}:`,
        catalogError
      )
    }

    revalidatePath(`/onboarding/${schoolId}`)

    return createActionResponse({
      ...school,
      redirectUrl: `/s/${school.domain}`,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getPublishStatus(
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
        isPublished: true,
        onboardingCompletedAt: true,
        schoolType: true,
        address: true,
        tuitionFee: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      ...school,
      tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
