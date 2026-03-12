"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { experiencesSchema, type ExperiencesFormData } from "./validation"

export async function getTeacherExperiences(
  teacherId: string
): Promise<ActionResponse<ExperiencesFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        experiences: {
          where: { schoolId },
          select: {
            institution: true,
            position: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
          },
        },
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    return {
      success: true,
      data: {
        experiences: teacher.experiences.map((e) => ({
          institution: e.institution,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate ?? undefined,
          isCurrent: e.isCurrent,
          description: e.description ?? undefined,
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherExperiences(
  teacherId: string,
  input: ExperiencesFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = experiencesSchema.parse(input)

    await db.$transaction([
      // Delete existing experiences
      db.teacherExperience.deleteMany({
        where: { teacherId, schoolId },
      }),
      // Recreate from form data
      ...(parsed.experiences.length > 0
        ? [
            db.teacherExperience.createMany({
              data: parsed.experiences.map((e) => ({
                teacherId,
                schoolId,
                institution: e.institution,
                position: e.position,
                startDate: e.startDate,
                endDate: e.endDate ?? null,
                isCurrent: e.isCurrent,
                description: e.description ?? null,
              })),
            }),
          ]
        : []),
    ])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
