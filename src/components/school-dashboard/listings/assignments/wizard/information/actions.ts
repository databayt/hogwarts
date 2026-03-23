"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getAssignmentInformation(
  assignmentId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        title: true,
        classId: true,
        type: true,
        description: true,
      },
    })

    if (!assignment) return actionError(ACTION_ERRORS.NOT_FOUND)

    return {
      success: true,
      data: {
        title: assignment.title,
        classId: assignment.classId,
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = informationSchema.parse(input)

    await db.assignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: {
        title: parsed.title,
        classId: parsed.classId,
        type: parsed.type,
        description: parsed.description ?? null,
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

/** Get available classes for the assignment class selector */
export async function getClassesForAssignment(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        subject: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    })

    const options = classes.map((c) => ({
      label: c.name || c.subject?.name || c.id,
      value: c.id,
    }))

    return { success: true, data: options }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}
