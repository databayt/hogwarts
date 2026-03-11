"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import {
  applyTimetableStructureForNewSchool,
  autoProvisionSections,
  setupCatalogForSchool,
  setupDefaultsForSchool,
} from "@/lib/catalog-setup"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"

export async function completeOnboarding(
  schoolId: string,
  // TODO: legalData (operationalStatus, safetyFeatures) is collected but not yet persisted.
  // Needs a ComplianceLog entry or School schema fields in a future PR.
  legalData: {
    operationalStatus: string
    safetyFeatures: string[]
  }
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    // Check domain exists BEFORE marking school active
    const schoolCheck = await db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    })

    if (!schoolCheck?.domain) {
      throw new Error(
        "School subdomain not configured. Please complete the subdomain step."
      )
    }

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

    // Provision defaults after response is sent.
    // Uses next/server after() so Vercel keeps the function alive until completion
    // (unlike fire-and-forget promises which get terminated on serverless).
    after(async () => {
      try {
        await provisionSchoolDefaults(schoolId, school)
      } catch (err) {
        console.error(
          `[completeOnboarding] Provisioning failed for ${schoolId}:`,
          err
        )
      }
    })

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

/**
 * Background provisioning for a newly onboarded school.
 * Runs all setup steps (defaults, catalog, timetable, classrooms, sections).
 * Called fire-and-forget so it doesn't block the onboarding response.
 */
async function provisionSchoolDefaults(
  schoolId: string,
  school: {
    country: string | null
    curriculum: string | null
    schoolLevel: string | null
    schoolType: string | null
  }
) {
  // Step 1: Run independent setup steps in parallel
  const [defaults, catalog] = await Promise.allSettled([
    setupDefaultsForSchool(schoolId, school.schoolLevel || "both"),
    setupCatalogForSchool(schoolId, {
      country: school.country || undefined,
      schoolType: school.schoolType || undefined,
    }),
  ])

  console.log(
    `[provisionSchoolDefaults] Defaults: ${defaults.status}, Catalog: ${catalog.status} for school ${schoolId}`
  )

  // Step 2: Timetable depends on catalog (grades must exist)
  if (school.curriculum) {
    await applyTimetableStructureForNewSchool(
      schoolId,
      school.curriculum
    ).catch((err) =>
      console.error(
        `[provisionSchoolDefaults] Timetable failed for ${schoolId}:`,
        err
      )
    )
  }

  // Step 3: ClassroomType + sections depend on grades from catalog
  await db.classroomType
    .upsert({
      where: { schoolId_name: { schoolId, name: "Classroom" } },
      create: { schoolId, name: "Classroom" },
      update: {},
    })
    .catch((err) =>
      console.error(
        `[provisionSchoolDefaults] ClassroomType failed for ${schoolId}:`,
        err
      )
    )

  await autoProvisionSections(schoolId).catch((err) =>
    console.error(
      `[provisionSchoolDefaults] Sections failed for ${schoolId}:`,
      err
    )
  )

  console.log(
    `[provisionSchoolDefaults] All provisioning complete for school ${schoolId}`
  )
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
