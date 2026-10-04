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

export async function getAssignmentInformation(
  assignmentId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const assignment = await db.schoolAssignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        title: true,
        gradeId: true,
        sectionId: true,
        subjectId: true,
        type: true,
        description: true,
      },
    })

    if (!assignment) return actionError(ACTION_ERRORS.NOT_FOUND)

    return {
      success: true,
      data: {
        title: assignment.title,
        gradeId: assignment.gradeId ?? "",
        sectionId: assignment.sectionId,
        subjectId: assignment.subjectId ?? "",
        type: assignment.type,
        description: assignment.description ?? undefined,
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateAssignmentInformation(
  assignmentId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = informationSchema.safeParse(input)
    if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

    const [assignment, resolved] = await Promise.all([
      db.schoolAssignment.findFirst({
        where: { id: assignmentId, schoolId },
        select: { termId: true },
      }),
      resolveTeachingScope(schoolId, parsed.data),
    ])
    if (!assignment) return actionError(ACTION_ERRORS.NOT_FOUND)
    if (!resolved.ok) return actionError(resolved.code)
    const { scope } = resolved

    await db.schoolAssignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: {
        title: parsed.data.title,
        type: parsed.data.type,
        description: parsed.data.description ?? null,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
        subjectId: scope.subjectId,
        termId: assignment.termId ?? scope.termId,
      },
    })

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}
