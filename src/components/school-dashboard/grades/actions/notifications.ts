"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchTemplated } from "@/lib/dispatch-notification"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// HELPERS
// ============================================================================

async function getStudentGuardianUserIds(
  studentId: string,
  schoolId: string
): Promise<string[]> {
  const guardians = await db.studentGuardian.findMany({
    where: {
      studentId,
      student: { schoolId },
    },
    select: {
      guardian: {
        select: { userId: true },
      },
    },
  })
  return guardians
    .map((g) => g.guardian.userId)
    .filter((id): id is string => !!id)
}

// Channels we attempt for parent-facing notifications. The dispatcher will
// per-channel filter against `NotificationPreference` and `NotificationTemplate`
// availability, so a channel missing a template or disabled by the user is
// silently skipped without failing the rest.
const PARENT_CHANNELS = ["in_app", "email", "whatsapp"] as const

// ============================================================================
// GRADE POSTED NOTIFICATION
// ============================================================================

export async function sendGradeNotification(input: {
  resultId: string
  type: "grade_posted"
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const result = await db.result.findFirst({
      where: { id: input.resultId, schoolId },
      include: {
        student: {
          select: { id: true, userId: true, firstName: true, lastName: true },
        },
        class: { include: { subject: { select: { name: true } } } },
      },
    })

    if (!result) return { success: false, error: "Result not found" }

    const studentName = `${result.student.firstName} ${result.student.lastName}`
    const subject = result.class?.subject?.name ?? ""
    // Render whatever the school configured: "A", "85%", "85/100", etc.
    const grade = result.grade || `${result.score}/${result.maxScore}` || ""

    const recipients: string[] = []
    if (result.student.userId) recipients.push(result.student.userId)
    const guardianIds = await getStudentGuardianUserIds(
      result.studentId,
      schoolId
    )
    recipients.push(...guardianIds)

    const metadata = {
      studentName,
      subject,
      grade,
      resultId: input.resultId,
      studentId: result.studentId,
      // Deep-link target so the mobile app can navigate on tap and the
      // web in-app bell can render a "View" CTA. Web absolute path is
      // also derivable from this for the email channel.
      deep_link: `hogwarts://parent/children/${result.studentId}/grades`,
    }

    const dispatches = await Promise.all(
      recipients.map((userId) =>
        dispatchTemplated({
          schoolId,
          userId,
          type: input.type,
          metadata,
          channels: [...PARENT_CHANNELS],
        })
      )
    )

    return {
      success: true,
      data: { count: dispatches.filter(Boolean).length },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send notification",
    }
  }
}

// ============================================================================
// REPORT CARD PUBLISHED NOTIFICATION (BATCH)
// ============================================================================

export async function sendBatchGradeNotifications(input: {
  type: "report_ready" | "grade_posted"
  /** Term scope — used by the rich grades/actions publishReportCards path. */
  termId?: string
  /** Grade-level filter inside the term scope. */
  gradeId?: string
  /** ID scope — used by reports/actions publish-button which has explicit IDs. */
  reportCardIds?: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    if (!input.termId && !input.reportCardIds) {
      return {
        success: false,
        error: "Either termId or reportCardIds is required",
      }
    }

    // Fetch published report cards under whichever scope was supplied.
    const where: Record<string, unknown> = {
      schoolId,
      isPublished: true,
    }
    if (input.reportCardIds && input.reportCardIds.length > 0) {
      where.id = { in: input.reportCardIds }
    } else if (input.termId) {
      where.termId = input.termId
      if (input.gradeId) {
        where.student = { academicGradeId: input.gradeId }
      }
    }

    const reportCards = await db.reportCard.findMany({
      where,
      select: {
        id: true,
        termId: true,
        studentId: true,
        student: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
          },
        },
        term: { select: { termNumber: true } },
      },
    })

    if (reportCards.length === 0) {
      return { success: true, data: { count: 0 } }
    }

    // Track the batch so admins can audit / retry later. We don't write
    // the rendered title/body here because the actual per-recipient text
    // is locale-resolved inside dispatchTemplated.
    const batch = await db.notificationBatch.create({
      data: {
        schoolId,
        type: input.type,
        title:
          input.type === "report_ready" ? "Report card ready" : "Grade update",
        body: `Batch notification for ${reportCards.length} students`,
        status: "processing",
        totalCount: 0,
        createdBy: session.user.id || "",
      },
    })

    let count = 0

    for (const rc of reportCards) {
      const studentName = `${rc.student.firstName} ${rc.student.lastName}`
      const termName = rc.term ? `Term ${rc.term.termNumber}` : ""
      const recipients: string[] = []
      if (rc.student.userId) recipients.push(rc.student.userId)
      const guardianIds = await getStudentGuardianUserIds(
        rc.studentId,
        schoolId
      )
      recipients.push(...guardianIds)

      const metadata = {
        studentName,
        termName,
        reportCardId: rc.id,
        studentId: rc.studentId,
        termId: rc.termId,
        batchId: batch.id,
        // Deep-link target. Mobile parent app routes on this scheme;
        // web in-app bell derives the in-tab href from the same string.
        deep_link: `hogwarts://parent/children/${rc.studentId}/report-cards/${rc.id}`,
      }

      for (const userId of recipients) {
        const id = await dispatchTemplated({
          schoolId,
          userId,
          type: input.type,
          metadata,
          channels: [...PARENT_CHANNELS],
        })
        if (id) count++
      }
    }

    await db.notificationBatch.update({
      where: { id: batch.id },
      data: { totalCount: count, status: "completed" },
    })

    return { success: true, data: { count } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send batch notifications",
    }
  }
}
