"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { studentAudienceWhere } from "@/lib/teaching-audience"
import { getStudentScopes } from "@/lib/teaching-scope"
import { getTenantContext } from "@/lib/tenant-context"
import { studentExamsWhere } from "@/components/school-dashboard/exams/lib/audience"
import { resolveStudentSubjectContext } from "@/components/school-dashboard/grades/lib/gradebook"
import { getDisplayLang } from "@/components/translation/locale"
import { getLabels } from "@/components/translation/person"

import { selectionSchema, type SelectionFormData } from "./validation"

export async function getGradeSelection(
  resultId: string
): Promise<ActionResponse<SelectionFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const result = await db.result.findFirst({
      where: { id: resultId, schoolId },
      select: {
        studentId: true,
        assignmentId: true,
        examId: true,
        subjectId: true,
      },
    })

    if (!result) return actionError(ACTION_ERRORS.NOT_FOUND)

    return {
      success: true,
      data: {
        studentId: result.studentId,
        subjectId: result.subjectId ?? "",
        assignmentId: result.assignmentId ?? undefined,
        examId: result.examId ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateGradeSelection(
  resultId: string,
  input: SelectionFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = selectionSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    const { studentId, subjectId, assignmentId, examId } = parsed.data

    // The student studies the subject in their grade, and that decides the
    // row's section, grade and term.
    const context = await resolveStudentSubjectContext(
      schoolId,
      studentId,
      subjectId
    )
    if (!context) return actionError(ACTION_ERRORS.SUBJECT_NOT_IN_GRADE)

    await db.result.updateMany({
      where: { id: resultId, schoolId },
      data: {
        studentId,
        subjectId,
        ...context,
        assignmentId: assignmentId ?? null,
        examId: examId ?? null,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}

/** Get students for the grade selection dropdown */
export async function getStudentsForGrade(): Promise<
  ActionResponse<{ id: string; firstName: string; lastName: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const students = await db.student.findMany({
      where: { schoolId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    })

    return { success: true, data: students }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load students",
    }
  }
}

/** The subjects a student studies: their grade's. */
export async function getSubjectsForStudent(
  studentId: string
): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const [scope] = await getStudentScopes(schoolId, [studentId])
    if (!scope) return { success: true, data: [] }

    const [selections, lang] = await Promise.all([
      scope.gradeId
        ? db.subjectSelection.findMany({
            where: { schoolId, gradeId: scope.gradeId, isActive: true },
            select: {
              catalogSubjectId: true,
              customName: true,
              subject: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
      getDisplayLang(),
    ])

    const byId = new Map<string, string>()
    for (const s of selections) {
      if (!byId.has(s.catalogSubjectId)) {
        byId.set(s.catalogSubjectId, s.customName || s.subject?.name || "")
      }
    }
    const labels = await getLabels([...byId.values()], lang, schoolId)

    return {
      success: true,
      data: [...byId.entries()]
        .map(([id, name]) => ({ id, name: labels.get(name) ?? name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}

/** Exams the student sits in this subject (their section or grade). */
export async function getExamsForStudent(
  studentId: string,
  subjectId: string
): Promise<ActionResponse<{ id: string; title: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const scopes = await getStudentScopes(schoolId, [studentId])
    const exams = await db.schoolExam.findMany({
      where: {
        schoolId,
        subjectId,
        wizardStep: null,
        ...studentExamsWhere(scopes),
      },
      select: { id: true, title: true },
      orderBy: { examDate: "desc" },
    })

    return { success: true, data: exams }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load exams",
    }
  }
}

/** Assignments in this subject set for the student's section or grade. */
export async function getAssignmentsForStudent(
  studentId: string,
  subjectId: string
): Promise<ActionResponse<{ id: string; title: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const [scope] = await getStudentScopes(schoolId, [studentId])
    if (!scope) return { success: true, data: [] }

    const assignments = await db.schoolAssignment.findMany({
      where: {
        schoolId,
        subjectId,
        ...studentAudienceWhere(scope),
      },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    })

    return { success: true, data: assignments }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load assignments",
    }
  }
}
