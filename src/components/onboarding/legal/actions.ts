"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import {
  applyTimetableStructureForNewSchool,
  setupCatalogForSchool,
} from "@/lib/catalog-setup"
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
        isPublished: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: "completed",
      },
      select: {
        id: true,
        name: true,
        domain: true,
        country: true,
        system: true,
      },
    })

    if (!school.domain) {
      throw new Error(
        "School subdomain not configured. Please complete the subdomain step."
      )
    }

    // Auto-setup academic structure (grades, levels, subject selections)
    // Non-blocking: catalog setup failure should NOT prevent onboarding completion
    try {
      await setupCatalogForSchool(schoolId, {
        country: school.country || undefined,
      })
    } catch (catalogError) {
      console.error(
        `[completeOnboarding] Catalog setup failed for school ${schoolId}:`,
        catalogError
      )
    }

    // Apply timetable structure if the school selected one during onboarding
    // Non-blocking: timetable setup failure should NOT prevent onboarding completion
    if (school.system) {
      try {
        await applyTimetableStructureForNewSchool(schoolId, school.system)
      } catch (timetableError) {
        console.error(
          `[completeOnboarding] Timetable setup failed for school ${schoolId}:`,
          timetableError
        )
      }
    }

    // Auto-create default ClassroomType so the Configure tab works post-onboarding
    // Non-blocking: classroom type creation failure should NOT prevent onboarding completion
    try {
      await db.classroomType.upsert({
        where: { schoolId_name: { schoolId, name: "Classroom" } },
        create: { schoolId, name: "Classroom" },
        update: {},
      })
    } catch (classroomTypeError) {
      console.error(
        `[completeOnboarding] ClassroomType creation failed for school ${schoolId}:`,
        classroomTypeError
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
