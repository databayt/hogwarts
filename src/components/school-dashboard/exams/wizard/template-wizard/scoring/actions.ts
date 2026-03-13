"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

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
    if (!schoolId) return { success: false, error: "Missing school context" }

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { scoringConfig: true },
    })
    if (!template) return { success: false, error: "Template not found" }

    const existing = (template.scoringConfig as Record<string, unknown>) || {}

    await db.examTemplate.updateMany({
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
