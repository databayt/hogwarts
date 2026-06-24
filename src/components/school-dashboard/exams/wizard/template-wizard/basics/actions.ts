"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { basicsSchema, type BasicsFormData } from "./validation"

export async function getSubjectOptions(): Promise<
  ActionResponse<{ id: string; name: string; grades: number[] }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const selections = await db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: {
        subject: { select: { id: true, name: true, grades: true } },
      },
      distinct: ["catalogSubjectId"],
    })

    return { success: true, data: selections.map((s) => s.subject) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}

export async function updateTemplateBasics(
  templateId: string,
  input: BasicsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = basicsSchema.parse(input)

    // Merge examType into the existing blockConfig (it has no own column).
    const existing = await db.schoolExamTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { blockConfig: true },
    })
    const blockConfig = (existing?.blockConfig as Record<string, unknown>) || {}

    await db.schoolExamTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        subjectId: parsed.subjectId,
        duration: parsed.duration,
        totalMarks: parsed.totalMarks,
        blockConfig: {
          ...blockConfig,
          examType: parsed.examType,
        } as unknown as Prisma.InputJsonValue,
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
