"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function updateTemplatePreset(
  templateId: string,
  presetId: string | null,
  blockConfig: Record<string, unknown>
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        blockConfig: blockConfig as unknown as Prisma.InputJsonValue,
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

export async function getSchoolTemplates(): Promise<
  ActionResponse<{ id: string; name: string; blockConfig: unknown }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const templates = await db.examTemplate.findMany({
      where: { schoolId, isActive: true, wizardStep: null },
      select: { id: true, name: true, blockConfig: true },
      orderBy: { name: "asc" },
      take: 20,
    })

    return { success: true, data: templates }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}
