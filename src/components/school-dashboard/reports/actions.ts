"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Report Card Server Actions
 *
 * `generateReportCards` is deprecated (Phase 2b) — use the rich path at
 * `grades/actions/report-cards.ts` and let the async PDF cron at
 * `api/cron/process-report-card-pdfs` fill the URL out-of-band.
 *
 * The remaining exports (`publishReportCards`, `updateReportCardComments`,
 * `getReportCards`) serve the id-scoped publish-button surface and are
 * still in use; they auto-fire `report_ready` notifications on publish.
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { sendBatchGradeNotifications } from "@/components/school-dashboard/grades/actions/notifications"

type ActionResponse<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }

/**
 * Publish report cards (make visible to students/guardians)
 */
export async function publishReportCards(input: {
  reportCardIds: string[]
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    await db.reportCard.updateMany({
      where: {
        id: { in: input.reportCardIds },
        schoolId,
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    revalidatePath("/exams/report-cards")
    revalidatePath("/parent")

    // Fan out `report_ready` to student + guardians for every newly-published
    // card. Notifications are best-effort: a template-lookup miss does not
    // roll back the publish (errors are logged inside the helper).
    void sendBatchGradeNotifications({
      type: "report_ready",
      reportCardIds: input.reportCardIds,
    })

    return { success: true }
  } catch (error) {
    console.error("Publish error:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/**
 * Update report card comments
 */
export async function updateReportCardComments(input: {
  reportCardId: string
  teacherComments?: string
  principalComments?: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    await db.reportCard.update({
      where: { id: input.reportCardId, schoolId },
      data: {
        ...(input.teacherComments !== undefined
          ? { teacherComments: input.teacherComments }
          : {}),
        ...(input.principalComments !== undefined
          ? { principalComments: input.principalComments }
          : {}),
      },
    })

    revalidatePath("/exams/report-cards")
    return { success: true }
  } catch (error) {
    console.error("Update comments error:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

/**
 * Get report cards for a term (admin/teacher view)
 */
export async function getReportCards(input: {
  termId: string
  classId?: string
}): Promise<
  ActionResponse<
    Array<{
      id: string
      studentName: string
      studentId: string
      overallGrade: string | null
      overallGPA: number | null
      isPublished: boolean
      pdfUrl: string | null
      gradesCount: number
    }>
  >
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    const reportCards = await db.reportCard.findMany({
      where: {
        schoolId,
        termId: input.termId,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        grades: { select: { id: true } },
      },
      orderBy: { student: { firstName: "asc" } },
    })

    const data = reportCards.map((rc) => ({
      id: rc.id,
      studentName: `${rc.student.firstName} ${rc.student.lastName}`,
      studentId: rc.student.studentId ?? "",
      overallGrade: rc.overallGrade,
      overallGPA: rc.overallGPA ? Number(rc.overallGPA) : null,
      isPublished: rc.isPublished,
      pdfUrl: rc.pdfUrl,
      gradesCount: rc.grades.length,
    }))

    return { success: true, data }
  } catch (error) {
    console.error("Get report cards error:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
