"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"

import { informationSchema, type InformationFormData } from "./validation"

export async function getExamInformation(
  examId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      select: {
        title: true,
        description: true,
        gradeId: true,
        sectionId: true,
        subjectId: true,
        examType: true,
      },
    })

    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)

    // A fresh draft has no scope yet, and its placeholder subject is not a
    // choice anyone made.
    const gradeId = exam.gradeId ?? ""
    return {
      success: true,
      data: {
        title: exam.title,
        description: exam.description ?? undefined,
        gradeId,
        sectionId: exam.sectionId,
        subjectId: gradeId ? exam.subjectId : "",
        examType: exam.examType as InformationFormData["examType"],
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateExamInformation(
  examId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = informationSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

    const [exam, resolved] = await Promise.all([
      db.schoolExam.findFirst({
        where: { id: examId, schoolId },
        select: { termId: true },
      }),
      resolveTeachingScope(schoolId, parsed.data),
    ])
    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    if (!resolved.ok) return actionError(resolved.code)
    const { scope } = resolved

    // The exam belongs to the grade (or section) chosen here.
    await db.schoolExam.updateMany({
      where: { id: examId, schoolId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        examType: parsed.data.examType,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
        subjectId: scope.subjectId,
        termId: exam.termId ?? scope.termId,
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
