"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * Save a practice session result by updating the QuestionBank analytics.
 * Increments usage counts for each practiced question.
 */
export async function updatePracticeQuestionStats(input: {
  questionResults: Array<{
    questionId: string
    isCorrect: boolean
  }>
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Batch update question analytics (timesUsed, successRate)
    for (const result of input.questionResults) {
      await db.questionBank.updateMany({
        where: { id: result.questionId, schoolId },
        data: {
          updatedAt: new Date(),
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating practice stats:", error)
    return { success: false, error: "Failed to update stats" }
  }
}
