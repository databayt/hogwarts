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

/**
 * Admin-only fallback: manually publish a school and trigger catalog setup.
 * Primary provisioning now happens in completeOnboarding() (legal/actions.ts).
 * This remains for manual re-provisioning from admin dashboard if needed.
 */
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
      select: {
        id: true,
        name: true,
        domain: true,
        country: true,
        curriculum: true,
      },
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

    // Auto-setup timetable structure (school year, terms, periods)
    // Non-blocking: timetable setup failure should NOT prevent publishing
    if (school.curriculum) {
      try {
        await applyTimetableStructureForNewSchool(schoolId, school.curriculum)
      } catch (timetableError) {
        console.error(
          `[publishSchool] Timetable setup failed for school ${schoolId}:`,
          timetableError
        )
      }
    }

    // Auto-create default ClassroomType so the Configure tab works post-onboarding
    try {
      await db.classroomType.upsert({
        where: { schoolId_name: { schoolId, name: "Classroom" } },
        create: { schoolId, name: "Classroom" },
        update: {},
      })
    } catch (classroomTypeError) {
      console.error(
        `[publishSchool] ClassroomType creation failed for school ${schoolId}:`,
        classroomTypeError
      )
    }

    revalidatePath(`/onboarding/${schoolId}`)

    return createActionResponse({
      id: school.id,
      name: school.name,
      domain: school.domain,
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
      id: school.id,
      name: school.name,
      domain: school.domain,
      isPublished: school.isPublished,
      onboardingCompletedAt:
        school.onboardingCompletedAt?.toISOString() ?? null,
      schoolType: school.schoolType,
      address: school.address,
      tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
