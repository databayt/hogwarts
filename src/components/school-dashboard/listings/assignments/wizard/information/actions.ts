"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getAssignmentInformation(
  assignmentId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        title: true,
        classId: true,
        type: true,
        description: true,
      },
    })

    if (!assignment) return { success: false, error: "Assignment not found" }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateAssignmentInformation(
  assignmentId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}

/** Get available classes for the assignment class selector */
export async function getClassesForAssignment(): Promise<
  ActionResponse<{ label: string; value: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        subject: { select: { subjectName: true } },
      },
      orderBy: { name: "asc" },
    })

    const options = classes.map((c) => ({
      label: c.name || c.subject?.subjectName || c.id,
      value: c.id,
    }))

    return { success: true, data: options }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load classes",
    }
  }
}
