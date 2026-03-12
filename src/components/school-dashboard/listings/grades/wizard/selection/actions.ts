"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { selectionSchema, type SelectionFormData } from "./validation"

export async function getGradeSelection(
  resultId: string
): Promise<ActionResponse<SelectionFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const result = await db.result.findFirst({
      where: { id: resultId, schoolId },
      select: {
        studentId: true,
        classId: true,
        assignmentId: true,
        examId: true,
        subjectId: true,
      },
    })

    if (!result) return { success: false, error: "Result not found" }

    return {
      success: true,
      data: {
        studentId: result.studentId,
        classId: result.classId,
        assignmentId: result.assignmentId ?? undefined,
        examId: result.examId ?? undefined,
        subjectId: result.subjectId ?? undefined,
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = selectionSchema.parse(input)

    await db.result.updateMany({
      where: { id: resultId, schoolId },
      data: {
        studentId: parsed.studentId,
        classId: parsed.classId,
        assignmentId: parsed.assignmentId ?? null,
        examId: parsed.examId ?? null,
        subjectId: parsed.subjectId ?? null,
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
  ActionResponse<{ id: string; givenName: string; surname: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const students = await db.student.findMany({
      where: { schoolId },
      select: { id: true, givenName: true, surname: true },
      orderBy: { givenName: "asc" },
    })

    return { success: true, data: students }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load students",
    }
  }
}

/** Get classes for the grade selection dropdown */
export async function getClassesForGrade(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: classes }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load classes",
    }
  }
}

/** Get assignments for a specific class */
export async function getAssignmentsForGrade(
  classId: string
): Promise<ActionResponse<{ id: string; title: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const assignments = await db.assignment.findMany({
      where: { schoolId, classId },
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

/** Get exams for a specific class */
export async function getExamsForGrade(
  classId: string
): Promise<ActionResponse<{ id: string; title: string }[]>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const exams = await db.exam.findMany({
      where: { schoolId, classId },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    })

    return { success: true, data: exams }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load exams",
    }
  }
}

/** Get subjects for the grade selection dropdown */
export async function getSubjectsForGrade(): Promise<
  ActionResponse<{ id: string; subjectName: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const subjects = await db.subject.findMany({
      where: { schoolId },
      select: { id: true, subjectName: true },
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
