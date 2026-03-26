"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getSchoolSubjectOptions } from "@/lib/school-subjects"
import { getTenantContext } from "@/lib/tenant-context"

import { subjectSchema, type SubjectFormData } from "./validation"

export async function getSubjectOptions(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const subjects = await getSchoolSubjectOptions(schoolId)

    return { success: true, data: subjects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}

export async function updateTemplateSubject(
  templateId: string,
  input: SubjectFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = subjectSchema.parse(input)

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: { subjectId: parsed.subjectId },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
