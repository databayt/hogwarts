"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { PrintFormData } from "./validation"

export async function updateTemplatePrint(
  templateId: string,
  data: PrintFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { printConfig: true, blockConfig: true },
    })
    if (!template) return { success: false, error: "Template not found" }

    const existingBlockConfig =
      (template.blockConfig as Record<string, unknown>) || {}

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        printConfig: {
          pageSize: data.pageSize,
          orientation: data.orientation,
          answerSheetType: data.answerSheetType,
          layout: data.layout,
        } as unknown as Prisma.InputJsonValue,
        blockConfig: {
          ...existingBlockConfig,
          decorations: data.decorations,
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
