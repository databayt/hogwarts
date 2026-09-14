// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"

/**
 * Grading a submission — shared by the `gradeSubmission` action and the
 * mobile grading route.
 *
 * Plain module, NOT `"use server"`: the caller resolves who is grading and
 * whether they may, then hands over the school and the grader's user id.
 */

export const gradeSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().min(0),
  feedback: z.string().max(10_000).optional(),
})

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>

export type GradeSubmissionOutcome =
  | {
      status: "graded"
      submissionId: string
      assignmentId: string
      score: number
      totalPoints: number
      gradedAt: Date
    }
  | { status: "notFound" }
  | { status: "scoreAboveTotal"; totalPoints: number }

export async function gradeSubmissionCore(input: {
  schoolId: string
  /** User.id of whoever grades — stored as `gradedBy`. */
  graderUserId: string
  submissionId: string
  score: number
  feedback?: string | null
  /** When set, the submission must belong to this assignment. */
  assignmentId?: string
}): Promise<GradeSubmissionOutcome> {
  const { schoolId, submissionId, score } = input

  const submission = await db.assignmentSubmission.findFirst({
    where: {
      id: submissionId,
      schoolId,
      ...(input.assignmentId ? { assignmentId: input.assignmentId } : {}),
    },
    select: {
      id: true,
      assignment: {
        select: { id: true, title: true, totalPoints: true },
      },
      student: {
        select: { userId: true },
      },
    },
  })
  if (!submission) return { status: "notFound" }

  const totalPoints = Number(submission.assignment.totalPoints)
  if (score > totalPoints) return { status: "scoreAboveTotal", totalPoints }

  const gradedAt = new Date()
  await db.assignmentSubmission.updateMany({
    where: { id: submissionId, schoolId },
    data: {
      score,
      feedback: input.feedback || null,
      status: "GRADED",
      gradedAt,
      gradedBy: input.graderUserId,
    },
  })

  // Notify the student that their assignment was graded (non-blocking)
  if (submission.student.userId) {
    dispatchNotification({
      schoolId,
      userId: submission.student.userId,
      type: "assignment_graded",
      title: `تم تصحيح الواجب: ${submission.assignment.title}`,
      body: `حصلت على ${score}/${totalPoints} في "${submission.assignment.title}"`,
      priority: "normal",
      channels: ["in_app"],
      metadata: {
        assignmentId: submission.assignment.id,
        submissionId,
        score,
        totalPoints,
        url: `/assignments/${submission.assignment.id}`,
      },
    }).catch((err) =>
      console.error("[gradeSubmission] Notification error:", err)
    )
  }

  revalidatePath("/assignments")

  return {
    status: "graded",
    submissionId,
    assignmentId: submission.assignment.id,
    score,
    totalPoints,
    gradedAt,
  }
}
