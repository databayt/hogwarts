"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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
        classId: true,
        subjectId: true,
        examType: true,
      },
    })

    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)

    return {
      success: true,
      data: {
        title: exam.title,
        description: exam.description ?? undefined,
        classId: exam.classId,
        subjectId: exam.subjectId,
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = informationSchema.parse(input)

    await db.schoolExam.updateMany({
      where: { id: examId, schoolId },
      data: {
        title: parsed.title,
        description: parsed.description ?? null,
        classId: parsed.classId,
        subjectId: parsed.subjectId,
        examType: parsed.examType,
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
