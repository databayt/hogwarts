"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function updateTemplateInstructions(
  templateId: string,
  variant: string
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { blockConfig: true },
    })
    if (!template) return actionError(ACTION_ERRORS.NOT_FOUND)

    const blockConfig = (template.blockConfig as Record<string, unknown>) || {}
    const slots = (blockConfig.slots as Record<string, string>) || {}

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        blockConfig: {
          ...blockConfig,
          slots: { ...slots, instructions: variant },
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
