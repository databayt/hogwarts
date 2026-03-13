"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { durationMarksSchema, type DurationMarksFormData } from "./validation"

export async function updateTemplateDurationMarks(
  templateId: string,
  input: DurationMarksFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = durationMarksSchema.parse(input)

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        duration: parsed.duration,
        totalMarks: parsed.totalMarks,
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
