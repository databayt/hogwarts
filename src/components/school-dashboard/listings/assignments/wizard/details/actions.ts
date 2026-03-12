"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Decimal } from "@prisma/client/runtime/library"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { detailsSchema, type DetailsFormData } from "./validation"

export async function getAssignmentDetails(
  assignmentId: string
): Promise<ActionResponse<DetailsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        totalPoints: true,
        weight: true,
        dueDate: true,
        instructions: true,
      },
    })

    if (!assignment) return { success: false, error: "Assignment not found" }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateAssignmentDetails(
  assignmentId: string,
  input: DetailsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
