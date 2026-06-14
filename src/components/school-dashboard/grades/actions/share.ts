"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// SHARE A REPORT CARD (admin / teacher action)
// ============================================================================

/**
 * Enable the public share link for a published report card.
 *
 * - Requires auth + schoolId (multi-tenant: verifies the card belongs to
 *   this school before touching it).
 * - Report card must already be published; returning an error code otherwise.
 * - Idempotent: if a shareToken already exists it is reused.
 * - shareExpiry is intentionally left null (link does not expire by default;
 *   callers can set an explicit date post-creation if desired).
 */
export async function shareReportCard(
  reportCardId: string
): Promise<ActionResponse<{ token: string }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, code: "NOT_AUTHENTICATED" }
    }
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, code: "MISSING_SCHOOL_CONTEXT" }
    }

    const reportCard = await db.reportCard.findFirst({
      where: { id: reportCardId, schoolId },
      select: { id: true, isPublished: true, shareToken: true, isPublic: true },
    })

    if (!reportCard) {
      return { success: false, code: "REPORT_CARD_NOT_FOUND" }
    }

    if (!reportCard.isPublished) {
      return { success: false, code: "REPORT_CARD_NOT_PUBLISHED" }
    }

    // Reuse existing token if already generated.
    if (reportCard.shareToken && reportCard.isPublic) {
      return { success: true, data: { token: reportCard.shareToken } }
    }

    const token = reportCard.shareToken ?? crypto.randomUUID().replace(/-/g, "")

    await db.reportCard.update({
      where: { id: reportCard.id },
      data: {
        shareToken: token,
        isPublic: true,
        // shareExpiry left null — no expiry by default
      },
    })

    return { success: true, data: { token } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to share report card",
    }
  }
}

// ============================================================================
// GET SHARED REPORT CARD (public — no auth)
// ============================================================================

export interface SharedReportCardGrade {
  subjectId: string
  subjectName: string
  grade: string
  score: number | null
  maxScore: number | null
  percentage: number | null
}

export interface SharedReportCardData {
  studentName: string
  termNumber: number | null
  termStartDate: Date | null
  termEndDate: Date | null
  overallGrade: string | null
  overallGPA: number | null
  rank: number | null
  totalStudents: number | null
  grades: SharedReportCardGrade[]
}

/**
 * Public reader for a shared report card — no session required.
 *
 * Increments viewCount fire-and-forget. Returns only the minimal display
 * payload; cross-tenant leakage is impossible because the lookup is keyed
 * on the globally-unique shareToken column (@@unique index).
 */
export async function getSharedReportCard(token: string): Promise<{
  valid: boolean
  data?: SharedReportCardData
}> {
  try {
    const reportCard = await db.reportCard.findFirst({
      where: { shareToken: token, isPublic: true },
      select: {
        id: true,
        overallGrade: true,
        overallGPA: true,
        rank: true,
        totalStudents: true,
        student: {
          select: { firstName: true, lastName: true },
        },
        term: {
          select: {
            termNumber: true,
            startDate: true,
            endDate: true,
          },
        },
        grades: {
          select: {
            subjectId: true,
            grade: true,
            score: true,
            maxScore: true,
            percentage: true,
            subject: { select: { name: true } },
          },
          orderBy: { subject: { name: "asc" } },
        },
      },
    })

    if (!reportCard) {
      return { valid: false }
    }

    // Increment viewCount fire-and-forget (best-effort analytics).
    db.reportCard
      .update({
        where: { id: reportCard.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => undefined)

    const data: SharedReportCardData = {
      studentName: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
      termNumber: reportCard.term?.termNumber ?? null,
      termStartDate: reportCard.term?.startDate ?? null,
      termEndDate: reportCard.term?.endDate ?? null,
      overallGrade: reportCard.overallGrade,
      overallGPA: reportCard.overallGPA ? Number(reportCard.overallGPA) : null,
      rank: reportCard.rank,
      totalStudents: reportCard.totalStudents,
      grades: reportCard.grades.map((g) => ({
        subjectId: g.subjectId,
        subjectName: g.subject?.name ?? "",
        grade: g.grade,
        score: g.score ? Number(g.score) : null,
        maxScore: g.maxScore ? Number(g.maxScore) : null,
        percentage: g.percentage ?? null,
      })),
    }

    return { valid: true, data }
  } catch {
    return { valid: false }
  }
}

// ============================================================================
// REVOKE SHARE (admin / teacher action)
// ============================================================================

/**
 * Revoke the public share link for a report card.
 * Sets isPublic:false; the shareToken is preserved so it can be re-enabled
 * without generating a new URL (prevents link-rot for already-distributed
 * links if the admin changes their mind).
 */
export async function revokeReportCardShare(
  reportCardId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, code: "NOT_AUTHENTICATED" }
    }
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, code: "MISSING_SCHOOL_CONTEXT" }
    }

    const reportCard = await db.reportCard.findFirst({
      where: { id: reportCardId, schoolId },
      select: { id: true },
    })

    if (!reportCard) {
      return { success: false, code: "REPORT_CARD_NOT_FOUND" }
    }

    await db.reportCard.update({
      where: { id: reportCard.id },
      data: { isPublic: false },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to revoke report card share",
    }
  }
}
