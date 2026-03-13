"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Prisma } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { nameSchema, type NameFormData } from "./validation"

export async function getTemplateName(
  templateId: string
): Promise<ActionResponse<NameFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const template = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: {
        name: true,
        description: true,
        blockConfig: true,
      },
    })

    if (!template) return { success: false, error: "Template not found" }

    const blockConfig = (template.blockConfig as Record<string, unknown>) || {}

    return {
      success: true,
      data: {
        name: template.name,
        description: template.description ?? undefined,
        examType:
          (blockConfig.examType as NameFormData["examType"]) ?? "MIDTERM",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTemplateName(
  templateId: string,
  input: NameFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = nameSchema.parse(input)

    // Read existing blockConfig to merge examType into it
    const existing = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { blockConfig: true },
    })

    const blockConfig = (existing?.blockConfig as Record<string, unknown>) || {}

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
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
