"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function updateTemplateDifficulty(
  templateId: string,
  questionType: string,
  difficulty: { EASY: number; MEDIUM: number; HARD: number }
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { distribution: true },
    })
    if (!template) return { success: false, error: "Template not found" }

    const distribution =
      (template.distribution as Record<string, Record<string, number>>) || {}
    distribution[questionType] = difficulty

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: { distribution: distribution as unknown as Prisma.InputJsonValue },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
