"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ScoringFormData } from "./validation"

export async function updateTemplateScoring(
  templateId: string,
  data: ScoringFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const template = await db.schoolExamTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { scoringConfig: true },
    })
    if (!template) return actionError(ACTION_ERRORS.NOT_FOUND)

    const existing = (template.scoringConfig as Record<string, unknown>) || {}

    await db.schoolExamTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        scoringConfig: {
          ...existing,
          passingScore: data.passingScore,
          gradeBoundaries: data.gradeBoundaries,
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
