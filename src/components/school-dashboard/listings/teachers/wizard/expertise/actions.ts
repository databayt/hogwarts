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
        subject: { select: { name: true } },
      },
    })

    return {
      success: true,
      data: {
        subjectExpertise: expertise.map((e) => ({
          subjectId: e.subjectId,
          expertiseLevel: e.expertiseLevel as "PRIMARY" | "SECONDARY",
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
      await tx.teacherSubjectExpertise.deleteMany({
        where: { teacherId, schoolId },
      })

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

export interface SubjectWithDept {
  id: string
  name: string
  department: string
}

export interface GradeWithSubjects {
  id: string
  name: string
  gradeNumber: number
  subjects: SubjectWithDept[]
}

export async function getGradesAndSubjects(): Promise<
  ActionResponse<GradeWithSubjects[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        gradeNumber: true,
        subjectSelections: {
          where: { isActive: true },
          select: {
            subject: { select: { id: true, name: true, department: true } },
          },
          distinct: ["catalogSubjectId"],
        },
      },
      orderBy: { gradeNumber: "asc" },
    })

    return {
      success: true,
      data: grades.map((g) => ({
        id: g.id,
        name: g.name,
        gradeNumber: g.gradeNumber,
        subjects: g.subjectSelections.map((s) => s.subject),
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load grades",
    }
  }
}
