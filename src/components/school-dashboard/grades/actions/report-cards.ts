"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getTenantContext } from "@/lib/tenant-context"

import {
  generateReportCardsCore,
  type GenerateReportCardsInput,
} from "../lib/report-cards-core"
import { sendBatchGradeNotifications } from "./notifications"

// Generating/publishing report cards fans out notifications to every
// student/guardian — staff-level, never open to any tenant member.
const REPORT_CARD_ROLES: ReadonlySet<string> = new Set([
  "ADMIN",
  "DEVELOPER",
  "TEACHER",
])

// ============================================================================
// GENERATE REPORT CARDS
// ============================================================================

/**
 * Tenant-authed wrapper around `generateReportCardsCore`. The heavy aggregation
 * lives in the plain core (`grades/lib/report-cards-core.ts`) so the term-end
 * cron can call it with an explicit `schoolId`; here we resolve `schoolId` from
 * the session and delegate.
 */
export async function generateReportCards(
  input: GenerateReportCardsInput
): Promise<
  ActionResponse<{ created: number; updated: number; skipped: number }>
> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }
  if (!REPORT_CARD_ROLES.has(session.user.role ?? "")) {
    return { success: false, error: "Unauthorized" }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }
  return generateReportCardsCore(schoolId, input)
}

// ============================================================================
// PUBLISH REPORT CARDS
// ============================================================================

export async function publishReportCards(input: {
  termId: string
  gradeId?: string
}): Promise<ActionResponse<{ published: number }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }
    if (!REPORT_CARD_ROLES.has(session.user.role ?? "")) {
      return { success: false, error: "Unauthorized" }
    }
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const where: Record<string, unknown> = {
      schoolId,
      termId: input.termId,
      isPublished: false,
    }
    if (input.gradeId) {
      where.student = { academicGradeId: input.gradeId }
    }

    const result = await db.reportCard.updateMany({
      where,
      data: { isPublished: true, publishedAt: new Date() },
    })

    revalidatePath("/grades/reports")
    // Parent surface — both legacy /s/[subdomain] internal path and the
    // client-facing /parent/children/[id]/report-cards path. We don't
    // know the specific child IDs here, so we invalidate the listing
    // (which is the common entry point).
    revalidatePath("/parent")

    // Per-student direct notification — fires for every student userId so
    // the in-app bell and email channel are triggered immediately on publish.
    // One findMany covers all just-published cards; fire-and-forget per card.
    if (result.count > 0) {
      const publishedWhere: Record<string, unknown> = {
        schoolId,
        termId: input.termId,
        isPublished: true,
      }
      if (input.gradeId) {
        publishedWhere.student = { academicGradeId: input.gradeId }
      }

      db.reportCard
        .findMany({
          where: publishedWhere,
          select: {
            id: true,
            student: { select: { userId: true } },
          },
        })
        .then(async (publishedCards) => {
          // Fetch the school's preferred language so notifications are
          // authored in the school's content language.
          const school = await db.school
            .findUnique({
              where: { id: schoolId },
              select: { preferredLanguage: true },
            })
            .catch(() => null)
          const lang = school?.preferredLanguage ?? "ar"

          const isAr = lang === "ar"
          const title = isAr ? "تقرير بطاقة الدرجات جاهز" : "Report Card Ready"
          const body = isAr
            ? "تم نشر بطاقة درجاتك. يمكنك الاطلاع عليها الآن."
            : "Your report card has been published. You can view it now."

          await Promise.all(
            publishedCards
              .filter((rc) => !!rc.student.userId)
              .map((rc) =>
                dispatchNotification({
                  schoolId,
                  userId: rc.student.userId!,
                  type: "report_ready",
                  title,
                  body,
                  lang,
                  channels: ["in_app", "email"],
                  metadata: {
                    entityType: "report_card",
                    entityId: rc.id,
                    url: "/grades/report-cards",
                  },
                }).catch((err: unknown) => {
                  console.error("[publishReportCards] notify error:", err)
                })
              )
          )
        })
        .catch((err: unknown) => {
          console.error(
            "[publishReportCards] post-publish notify fetch error:",
            err
          )
        })

      // Also run the template-based batch (notifies guardians + richer
      // channels like WhatsApp). Both paths are best-effort.
      void sendBatchGradeNotifications({
        type: "report_ready",
        termId: input.termId,
        gradeId: input.gradeId,
      })
    }

    return { success: true, data: { published: result.count } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to publish report cards",
    }
  }
}

// ============================================================================
// GET REPORT CARDS
// ============================================================================

export async function getReportCards(input: {
  termId: string
  gradeId?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) return { items: [], total: 0 }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { items: [], total: 0 }

  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 20

  const where: Record<string, unknown> = {
    schoolId,
    termId: input.termId,
  }
  if (input.gradeId) {
    where.student = { academicGradeId: input.gradeId }
  }
  if (input.search) {
    where.student = {
      ...(where.student as Record<string, unknown>),
      OR: [
        { firstName: { contains: input.search, mode: "insensitive" } },
        { lastName: { contains: input.search, mode: "insensitive" } },
      ],
    }
  }

  const [items, total] = await Promise.all([
    db.reportCard.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        grades: {
          include: { subject: { select: { name: true } } },
        },
      },
      orderBy: { rank: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.reportCard.count({ where }),
  ])

  return { items, total }
}

// ============================================================================
// GET SINGLE REPORT CARD
// ============================================================================

export async function getReportCard(reportCardId: string) {
  const session = await auth()
  if (!session?.user) return null
  const { schoolId } = await getTenantContext()
  if (!schoolId) return null

  return db.reportCard.findFirst({
    where: { id: reportCardId, schoolId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
          profilePhotoUrl: true,
        },
      },
      term: { select: { termNumber: true, startDate: true, endDate: true } },
      grades: {
        include: { subject: { select: { id: true, name: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
  })
}
