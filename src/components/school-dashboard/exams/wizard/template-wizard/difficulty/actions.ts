"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { difficultySchema, type DifficultyFormData } from "./validation"

/**
 * Write the full per-type difficulty distribution in one call (replaces the
 * old one-action-per-question-type flow).
 */
export async function updateTemplateAllDifficulties(
  templateId: string,
  data: DifficultyFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = difficultySchema.parse(data)

    await db.schoolExamTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        distribution: parsed.distribution as unknown as Prisma.InputJsonValue,
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
