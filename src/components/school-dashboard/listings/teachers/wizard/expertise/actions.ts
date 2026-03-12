"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { expertiseSchema, type ExpertiseFormData } from "./validation"

export async function getTeacherExpertise(
  teacherId: string
): Promise<ActionResponse<ExpertiseFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const expertise = await db.teacherSubjectExpertise.findMany({
      where: { teacherId, schoolId },
      select: {
        subjectId: true,
        expertiseLevel: true,
        subject: { select: { subjectName: true } },
      },
    })

    return {
      success: true,
      data: {
        subjectExpertise: expertise.map((e) => ({
          subjectId: e.subjectId,
          expertiseLevel: e.expertiseLevel as
            | "PRIMARY"
            | "SECONDARY"
            | "CERTIFIED",
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

export async function updateTeacherExpertise(
  teacherId: string,
  input: ExpertiseFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = expertiseSchema.parse(input)

    await db.$transaction(async (tx) => {
      // Delete existing expertise records
      await tx.teacherSubjectExpertise.deleteMany({
        where: { teacherId, schoolId },
      })

      // Recreate from form data
      if (parsed.subjectExpertise.length > 0) {
        await tx.teacherSubjectExpertise.createMany({
          data: parsed.subjectExpertise.map((item) => ({
            schoolId,
            teacherId,
            subjectId: item.subjectId,
            expertiseLevel: item.expertiseLevel,
          })),
        })
      }
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}

export async function getSubjectsForExpertise(): Promise<
  ActionResponse<
    {
      id: string
      subjectName: string
      department: { id: string; departmentName: string } | null
    }[]
  >
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const subjects = await db.subject.findMany({
      where: { schoolId },
      select: {
        id: true,
        subjectName: true,
        department: {
          select: { id: true, departmentName: true },
        },
      },
      orderBy: { subjectName: "asc" },
    })

    return { success: true, data: subjects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}
