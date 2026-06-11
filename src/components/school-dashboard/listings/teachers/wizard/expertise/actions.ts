"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { expertiseSchema, type ExpertiseFormData } from "./validation"

async function getDisplayLocale(schoolId: string) {
  const cookieStore = await cookies()
  const displayLang = (cookieStore.get("NEXT_LOCALE")?.value as Lang) || "ar"
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const contentLang = (school?.preferredLanguage || "ar") as Lang
  return { displayLang, contentLang }
}

export async function getTeacherExpertise(
  teacherId: string
): Promise<ActionResponse<ExpertiseFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

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
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = expertiseSchema.parse(input)

    await db.$transaction(
      async (tx) => {
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
      },
      { timeout: 15000 }
    )

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
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

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

    const { displayLang } = await getDisplayLocale(schoolId)

    // One batched, deduped resolution across ALL grade/subject/department
    // names (replaces the nested per-row getText N+1).
    const labels = await getLabels(
      [
        ...grades.map((g) => g.name),
        ...grades.flatMap((g) =>
          g.subjectSelections.flatMap((s) => [
            s.subject.name,
            s.subject.department,
          ])
        ),
      ],
      displayLang,
      schoolId
    )

    const data = grades.map((g) => ({
      id: g.id,
      name: labels.get(g.name) ?? g.name,
      gradeNumber: g.gradeNumber,
      subjects: g.subjectSelections.map((s) => ({
        id: s.subject.id,
        name: labels.get(s.subject.name) ?? s.subject.name,
        department: s.subject.department
          ? (labels.get(s.subject.department) ?? s.subject.department)
          : "",
      })),
    }))

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
