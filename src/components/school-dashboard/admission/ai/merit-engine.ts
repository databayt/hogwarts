"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Admission Merit Scoring Engine
 * Computes weighted merit scores from extracted data + entrance/interview scores
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import type {
  MeritScoreBreakdown,
  ProcessedDocument,
  TranscriptData,
} from "./types"

// ============================================
// COMPUTE MERIT SCORE
// ============================================

/**
 * Compute the merit score for an application using:
 * - Extracted transcript GPA (academic component)
 * - Application.entranceScore
 * - Application.interviewScore
 * - Weight configuration from AdmissionSettings
 *
 * All components normalized to a 100-point scale, then weighted.
 * Updates Application.meritScore.
 */
export async function computeMeritScore(
  applicationId: string
): Promise<ActionResponse<MeritScoreBreakdown>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // RBAC: ADMIN, STAFF can compute merit scores
    const role = session.user.role
    if (role !== "DEVELOPER" && role !== "ADMIN" && role !== "STAFF") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Fetch application with scores
    const application = await db.application.findFirst({
      where: { id: applicationId, schoolId },
      select: {
        id: true,
        documents: true,
        entranceScore: true,
        interviewScore: true,
        previousPercentage: true,
      },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.APPLICATION_NOT_FOUND)
    }

    // Fetch school's admission settings for weight config
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: {
        academicWeight: true,
        entranceWeight: true,
        interviewWeight: true,
      },
    })

    // Default weights if no settings exist (40/35/25)
    const academicWeight = settings?.academicWeight ?? 40
    const entranceWeight = settings?.entranceWeight ?? 35
    const interviewWeight = settings?.interviewWeight ?? 25

    // Validate weights sum to 100
    const totalWeight = academicWeight + entranceWeight + interviewWeight
    if (totalWeight !== 100) {
      logger.warn("Merit weights do not sum to 100, normalizing", {
        action: "merit_weight_normalization",
        academicWeight,
        entranceWeight,
        interviewWeight,
        totalWeight,
        schoolId,
      })
    }

    // Extract academic score from transcript GPA or previousPercentage
    const academicScore = extractAcademicScore(application)

    // Normalize entrance and interview scores to 0-100
    const entranceScore = application.entranceScore
      ? Number(application.entranceScore)
      : 0
    const interviewScoreRaw = application.interviewScore
      ? Number(application.interviewScore)
      : 0

    // Normalize all scores to 100-point scale
    const normalizedAcademic = normalizeScore(academicScore, 100)
    const normalizedEntrance = normalizeScore(entranceScore, 100)
    const normalizedInterview = normalizeScore(interviewScoreRaw, 100)

    // Apply weights (normalize weights if they don't sum to 100)
    const weightDivisor = totalWeight > 0 ? totalWeight : 100
    const totalScore =
      (normalizedAcademic * academicWeight +
        normalizedEntrance * entranceWeight +
        normalizedInterview * interviewWeight) /
      weightDivisor

    // Round to 2 decimal places
    const finalScore = Math.round(totalScore * 100) / 100

    // Update application merit score
    await db.application.update({
      where: { id: applicationId },
      data: { meritScore: finalScore },
    })

    const breakdown: MeritScoreBreakdown = {
      academicScore,
      entranceScore,
      interviewScore: interviewScoreRaw,
      academicWeight,
      entranceWeight,
      interviewWeight,
      normalizedAcademic,
      normalizedEntrance,
      normalizedInterview,
      totalScore: finalScore,
    }

    logger.info("Merit score computed", {
      action: "compute_merit_score",
      applicationId,
      schoolId,
      finalScore,
      academicScore,
      entranceScore,
      interviewScore: interviewScoreRaw,
    })

    revalidatePath("/admission")

    return {
      success: true,
      data: breakdown,
    }
  } catch (error) {
    logger.error(
      "computeMeritScore failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "compute_merit_score_error" }
    )
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// ============================================
// BULK MERIT COMPUTATION
// ============================================

/**
 * Compute merit scores for all applications in a campaign
 * and assign merit ranks
 */
export async function computeCampaignMeritRanks(
  campaignId: string
): Promise<ActionResponse<{ computed: number; ranked: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const role = session.user.role
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Verify campaign
    const campaign = await db.admissionCampaign.findFirst({
      where: { id: campaignId, schoolId },
      select: { id: true },
    })

    if (!campaign) {
      return actionError(ACTION_ERRORS.CAMPAIGN_NOT_FOUND)
    }

    // Fetch all eligible applications (SUBMITTED or later, not REJECTED/WITHDRAWN)
    const applications = await db.application.findMany({
      where: {
        campaignId,
        schoolId,
        status: {
          in: [
            "SUBMITTED",
            "UNDER_REVIEW",
            "SHORTLISTED",
            "ENTRANCE_SCHEDULED",
            "INTERVIEW_SCHEDULED",
            "SELECTED",
            "WAITLISTED",
          ],
        },
      },
      select: {
        id: true,
        documents: true,
        entranceScore: true,
        interviewScore: true,
        previousPercentage: true,
        meritScore: true,
      },
    })

    // Fetch settings
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: {
        academicWeight: true,
        entranceWeight: true,
        interviewWeight: true,
      },
    })

    const academicWeight = settings?.academicWeight ?? 40
    const entranceWeight = settings?.entranceWeight ?? 35
    const interviewWeight = settings?.interviewWeight ?? 25
    const totalWeight = academicWeight + entranceWeight + interviewWeight
    const weightDivisor = totalWeight > 0 ? totalWeight : 100

    // Compute scores for each application
    const scored: Array<{ id: string; score: number }> = []

    for (const app of applications) {
      const academicScore = extractAcademicScore(app)
      const entrance = app.entranceScore ? Number(app.entranceScore) : 0
      const interview = app.interviewScore ? Number(app.interviewScore) : 0

      const normalizedAcademic = normalizeScore(academicScore, 100)
      const normalizedEntrance = normalizeScore(entrance, 100)
      const normalizedInterview = normalizeScore(interview, 100)

      const total =
        (normalizedAcademic * academicWeight +
          normalizedEntrance * entranceWeight +
          normalizedInterview * interviewWeight) /
        weightDivisor

      const finalScore = Math.round(total * 100) / 100
      scored.push({ id: app.id, score: finalScore })
    }

    // Sort by score descending for ranking
    scored.sort((a, b) => b.score - a.score)

    // Batch update all scores and ranks
    const updates = scored.map((item, index) =>
      db.application.update({
        where: { id: item.id },
        data: {
          meritScore: item.score,
          meritRank: index + 1,
        },
      })
    )

    await db.$transaction(updates)

    logger.info("Campaign merit ranks computed", {
      action: "compute_campaign_merit_ranks",
      campaignId,
      schoolId,
      totalApplications: scored.length,
    })

    revalidatePath("/admission")

    return {
      success: true,
      data: {
        computed: scored.length,
        ranked: scored.length,
      },
    }
  } catch (error) {
    logger.error(
      "computeCampaignMeritRanks failed",
      error instanceof Error ? error : new Error("Unknown error"),
      { action: "compute_campaign_merit_ranks_error" }
    )
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Extract academic score from application data
 * Priority: extracted transcript GPA > previousPercentage
 */
function extractAcademicScore(application: {
  documents: unknown
  previousPercentage: string | null
}): number {
  // Try to get GPA from extracted transcript data
  const docs = (Array.isArray(application.documents)
    ? application.documents
    : []) as unknown as ProcessedDocument[]

  const transcript = docs.find(
    (d) =>
      d.type === "transcript" && d.status === "completed" && d.extractedData
  )

  if (transcript?.extractedData) {
    const data = transcript.extractedData as TranscriptData
    if (data.cumulativeGpa != null && data.gpaScale) {
      // Normalize GPA to 100-point scale
      return (data.cumulativeGpa / data.gpaScale) * 100
    }
    if (data.cumulativeGpa != null) {
      // Assume 4.0 scale if not specified
      return (data.cumulativeGpa / 4.0) * 100
    }
  }

  // Fall back to previousPercentage from the application form
  if (application.previousPercentage) {
    return Number(application.previousPercentage)
  }

  return 0
}

/**
 * Normalize a raw score to a target scale
 * Clamps result between 0 and targetMax
 */
function normalizeScore(score: number, targetMax: number): number {
  if (score <= 0) return 0
  if (score > targetMax) return targetMax
  return score
}
