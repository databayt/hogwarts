"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"
import { z } from "zod"

import { actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/** Valid AI domains that can be toggled */
export const AI_DOMAINS = [
  "admission",
  "finance",
  "exams",
  "attendance",
  "library",
] as const

export type AIDomain = (typeof AI_DOMAINS)[number]

const updateAISettingsSchema = z.object({
  budget: z.number().min(0).nullable(),
  domains: z.array(z.enum(AI_DOMAINS)),
})

export type UpdateAISettingsInput = z.infer<typeof updateAISettingsSchema>

/**
 * Update AI settings for the current school.
 * Only ADMIN and DEVELOPER roles can modify these settings.
 */
export async function updateAISettings(
  data: UpdateAISettingsInput
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError("NOT_AUTHENTICATED")
    }

    const { schoolId, role } = await getTenantContext()
    if (!schoolId) {
      return actionError("MISSING_SCHOOL")
    }

    if (role !== "ADMIN" && role !== "DEVELOPER") {
      return actionError("UNAUTHORIZED")
    }

    const parsed = updateAISettingsSchema.parse(data)

    await db.school.update({
      where: { id: schoolId },
      data: {
        aiMonthlyBudget:
          parsed.budget !== null ? new Decimal(parsed.budget) : null,
        aiEnabledDomains: parsed.domains,
      },
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to update AI settings:", error)
    return actionError("SETTINGS_UPDATE_FAILED")
  }
}
