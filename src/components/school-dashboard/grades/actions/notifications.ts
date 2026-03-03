"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
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

async function getStudentUserId(studentId: string): Promise<string | null> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  })
  return student?.userId ?? null
}

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
          select: { id: true, userId: true, givenName: true, surname: true },
        },
        class: { include: { subject: { select: { subjectName: true } } } },
      },
    })

    if (!result) return { success: false, error: "Result not found" }

    const studentName = `${result.student.givenName} ${result.student.surname}`
    const subjectName = result.class?.subject?.subjectName || "a subject"

    const recipients: string[] = []

    // Add student
    if (result.student.userId) recipients.push(result.student.userId)

    // Add guardians
    const guardianIds = await getStudentGuardianUserIds(
      result.studentId,
      schoolId
    )
    recipients.push(...guardianIds)

    const notifications = await Promise.all(
      recipients.map((userId) =>
        db.notification.create({
          data: {
            schoolId,
            userId,
            title: `Grade Posted: ${subjectName}`,
            body: `${studentName} received ${result.grade || `${result.score}/${result.maxScore}`} in ${subjectName}`,
            type: "grade_posted",
            metadata: {
              resultId: input.resultId,
              studentId: result.studentId,
            },
          },
        })
      )
    )

    return { success: true, data: { count: notifications.length } }
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
  termId: string
  type: "report_ready" | "grade_posted"
  gradeId?: string
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Not authenticated" }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    // Fetch published report cards for this term
    const where: Record<string, unknown> = {
      schoolId,
      termId: input.termId,
      isPublished: true,
    }
    if (input.gradeId) {
      where.student = { academicGradeId: input.gradeId }
    }

    const reportCards = await db.reportCard.findMany({
      where,
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            userId: true,
            givenName: true,
            surname: true,
          },
        },
      },
    })

    if (reportCards.length === 0) {
      return { success: true, data: { count: 0 } }
    }

    const titleText =
      input.type === "report_ready" ? "Report Card Ready" : "Grade Update"
    const bodyFn =
      input.type === "report_ready"
        ? (name: string) => `${name}'s report card is now available for viewing`
        : (name: string) => `A grade update is available for ${name}`

    // Create notification batch
    const batch = await db.notificationBatch.create({
      data: {
        schoolId,
        type: input.type,
        title: titleText,
        body: `Batch notification for ${reportCards.length} students`,
        status: "processing",
        totalCount: 0,
        createdBy: session.user.id || "",
      },
    })

    let count = 0

    for (const rc of reportCards) {
      const studentName = `${rc.student.givenName} ${rc.student.surname}`
      const recipients: string[] = []

      if (rc.student.userId) recipients.push(rc.student.userId)
      const guardianIds = await getStudentGuardianUserIds(
        rc.studentId,
        schoolId
      )
      recipients.push(...guardianIds)

      for (const userId of recipients) {
        await db.notification.create({
          data: {
            schoolId,
            userId,
            title: titleText,
            body: bodyFn(studentName),
            type: input.type,
            metadata: {
              batchId: batch.id,
              studentId: rc.studentId,
              termId: input.termId,
            },
          },
        })
        count++
      }
    }

    // Update batch count
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
