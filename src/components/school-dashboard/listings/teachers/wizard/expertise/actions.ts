"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import type { ActionResponse } from "@/lib/action-response"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { SupportedLanguage } from "@/components/translation/types"

import { expertiseSchema, type ExpertiseFormData } from "./validation"

async function getDisplayLocale(schoolId: string) {
  const cookieStore = await cookies()
  const displayLang =
    (cookieStore.get("NEXT_LOCALE")?.value as SupportedLanguage) || "ar"
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const contentLang = (school?.preferredLanguage || "ar") as SupportedLanguage
  return { displayLang, contentLang }
}

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

    const { displayLang, contentLang } = await getDisplayLocale(schoolId)

    const data = await Promise.all(
      grades.map(async (g) => ({
        id: g.id,
        name: await getDisplayText(g.name, contentLang, displayLang, schoolId),
        gradeNumber: g.gradeNumber,
        subjects: await Promise.all(
          g.subjectSelections.map(async (s) => ({
            id: s.subject.id,
            name: await getDisplayText(
              s.subject.name,
              contentLang,
              displayLang,
              schoolId
            ),
            department: s.subject.department
              ? await getDisplayText(
                  s.subject.department,
                  contentLang,
                  displayLang,
                  schoolId
                )
              : "",
          }))
        ),
      }))
    )

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load grades",
    }
  }
}
