"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Decimal } from "@prisma/client/runtime/library"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { detailsSchema, type DetailsFormData } from "./validation"

export async function getAssignmentDetails(
  assignmentId: string
): Promise<ActionResponse<DetailsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        totalPoints: true,
        weight: true,
        dueDate: true,
        instructions: true,
      },
    })

    if (!assignment) return actionError(ACTION_ERRORS.NOT_FOUND)

    return {
      success: true,
      data: {
        totalPoints: Number(assignment.totalPoints),
        weight: Number(assignment.weight),
        dueDate: assignment.dueDate,
        instructions: assignment.instructions ?? undefined,
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateAssignmentDetails(
  assignmentId: string,
  input: DetailsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = detailsSchema.parse(input)

    await db.assignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: {
        totalPoints: new Decimal(parsed.totalPoints),
        weight: new Decimal(parsed.weight),
        dueDate: parsed.dueDate,
        instructions: parsed.instructions ?? null,
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
