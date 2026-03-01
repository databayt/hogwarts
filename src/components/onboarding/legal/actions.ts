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
  setupDefaultsForSchool,
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
        curriculum: true,
        schoolLevel: true,
        schoolType: true,
        preferredLanguage: true,
      },
    })

    if (!school.domain) {
      throw new Error(
        "School subdomain not configured. Please complete the subdomain step."
      )
    }

    // 1. Auto-provision defaults (YearLevels, Departments, ScoreRanges)
    try {
      const defaults = await setupDefaultsForSchool(
        schoolId,
        school.schoolLevel || "both"
      )
      console.log(
        `[completeOnboarding] Defaults created for school ${schoolId}:`,
        defaults
      )
    } catch (defaultsError) {
      console.error(
        `[completeOnboarding] Defaults setup failed for school ${schoolId}:`,
        defaultsError
      )
    }

    // 2. Auto-setup academic structure (grades, levels, subject selections)
    try {
      const catalog = await setupCatalogForSchool(schoolId, {
        country: school.country || undefined,
        schoolType: school.schoolType || undefined,
      })
      if (catalog.skipped && "message" in catalog) {
        console.warn(
          `[completeOnboarding] Catalog setup skipped for school ${schoolId}: ${catalog.message}`
        )
      } else {
        console.log(
          `[completeOnboarding] Catalog setup complete for school ${schoolId}:`,
          catalog
        )
      }
    } catch (catalogError) {
      console.error(
        `[completeOnboarding] Catalog setup failed for school ${schoolId}:`,
        catalogError
      )
    }

    // 3. Apply timetable structure if the school selected one during onboarding
    if (school.curriculum) {
      try {
        await applyTimetableStructureForNewSchool(schoolId, school.curriculum)
      } catch (timetableError) {
        console.error(
          `[completeOnboarding] Timetable setup failed for school ${schoolId}:`,
          timetableError
        )
      }
    }

    // 4. Auto-create default ClassroomType so the Configure tab works post-onboarding
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
