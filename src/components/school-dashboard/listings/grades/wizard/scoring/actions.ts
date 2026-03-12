"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { scoringSchema, type ScoringFormData } from "./validation"

export async function getGradeScoring(
  resultId: string
): Promise<ActionResponse<ScoringFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const result = await db.result.findFirst({
      where: { id: resultId, schoolId },
      select: {
        score: true,
        maxScore: true,
        grade: true,
        feedback: true,
      },
    })

    if (!result) return { success: false, error: "Result not found" }

    return {
      success: true,
      data: {
        score: Number(result.score),
        maxScore: Number(result.maxScore),
        grade: result.grade,
        feedback: result.feedback ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateGradeScoring(
  resultId: string,
  input: ScoringFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = scoringSchema.parse(input)
    const percentage = (parsed.score / parsed.maxScore) * 100

    const session = await auth()

    await db.result.updateMany({
      where: { id: resultId, schoolId },
      data: {
        score: parsed.score,
        maxScore: parsed.maxScore,
        percentage,
        grade: parsed.grade,
        feedback: parsed.feedback ?? null,
        gradedAt: new Date(),
        gradedBy: session?.user?.id ?? null,
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
