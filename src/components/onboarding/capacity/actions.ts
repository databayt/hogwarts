"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { capacitySchema, type CapacityFormData } from "./validation"

function getGradeCount(schoolLevel: string | null | undefined): number {
  switch (schoolLevel) {
    case "primary":
      return 6 // grades 1-6
    case "secondary":
      return 6 // grades 7-12
    case "both":
      return 12 // grades 1-12
    default:
      return 12
  }
}

export async function updateSchoolCapacity(
  schoolId: string,
  data: CapacityFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = capacitySchema.parse(data)

    // Fetch schoolLevel to compute grade count
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { schoolLevel: true },
    })

    const gradeCount = getGradeCount(school?.schoolLevel)
    const maxClasses = gradeCount * validated.sectionsPerGrade
    const maxStudents = maxClasses * validated.studentsPerSection

    await db.school.update({
      where: { id: schoolId },
      data: {
        maxTeachers: validated.teachers,
        sectionsPerGrade: validated.sectionsPerGrade,
        studentsPerSection: validated.studentsPerSection,
        maxClasses,
        maxStudents,
      },
    })

    revalidatePath(`/onboarding/${schoolId}/capacity`)
    return createActionResponse({ id: schoolId })
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

export async function getSchoolCapacity(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        maxTeachers: true,
        schoolLevel: true,
        sectionsPerGrade: true,
        studentsPerSection: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      teachers: school.maxTeachers || 10,
      sectionsPerGrade: school.sectionsPerGrade || 2,
      studentsPerSection: school.studentsPerSection || 30,
      schoolLevel: school.schoolLevel || "both",
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
