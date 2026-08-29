// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"

/**
 * A student handing in an assignment.
 *
 * Until this module existed there was NO student-side write at all: the
 * teacher's `actions.ts` grades submissions, and every `AssignmentSubmission`
 * row came from seeds. Shared by the `submitAssignment` action (online) and
 * `POST /api/offline/sync` (a replay of work done without a connection).
 *
 * Plain module, NOT `"use server"` — takes a `userId` from the caller.
 */

export type AssignmentSubmitOutcome =
  | { status: "submitted"; submissionStatus: "SUBMITTED" | "LATE_SUBMITTED" }
  /** A replay older than the submission already on file — ignored. */
  | { status: "stale" }
  /** The caller has no student record in this school. */
  | { status: "notStudent" }
  | { status: "notFound" }
  /** Student is not in the assignment's class. */
  | { status: "notInClass" }
  /** Still a draft — not visible to students yet. */
  | { status: "notOpen" }
  /** Graded work is frozen; a re-submission would erase the mark. */
  | { status: "alreadyGraded" }

export const SUBMISSION_CONTENT_MAX = 20_000
export const SUBMISSION_ATTACHMENTS_MAX = 10

/** Shared by the action and the offline sync route — one shape on the wire. */
export const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1).max(64),
  content: z.string().max(SUBMISSION_CONTENT_MAX).optional(),
  attachments: z
    .array(z.string().url().max(2048))
    .max(SUBMISSION_ATTACHMENTS_MAX)
    .optional(),
})

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>

export async function submitAssignmentCore(input: {
  userId: string
  schoolId: string
  assignmentId: string
  content: string | null
  /** Already-uploaded file URLs. Offline capture is text-only for now. */
  attachments: string[]
  /** When the student pressed submit — decides SUBMITTED vs LATE_SUBMITTED. */
  submittedAt: Date
}): Promise<AssignmentSubmitOutcome> {
  const { userId, schoolId, assignmentId, submittedAt } = input

  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })
  if (!student) return { status: "notStudent" }

  const assignment = await db.schoolAssignment.findFirst({
    where: { id: assignmentId, schoolId },
    select: { id: true, classId: true, dueDate: true, status: true },
  })
  if (!assignment) return { status: "notFound" }
  if (assignment.status === "DRAFT") return { status: "notOpen" }

  const membership = await db.studentClass.findFirst({
    where: { schoolId, studentId: student.id, classId: assignment.classId },
    select: { id: true },
  })
  if (!membership) return { status: "notInClass" }

  const key = {
    schoolId_assignmentId_studentId: {
      schoolId,
      assignmentId,
      studentId: student.id,
    },
  }

  const existing = await db.assignmentSubmission.findUnique({
    where: key,
    select: { status: true, submittedAt: true },
  })
  if (existing?.status === "GRADED" || existing?.status === "RETURNED") {
    return { status: "alreadyGraded" }
  }
  if (existing?.submittedAt && existing.submittedAt > submittedAt) {
    return { status: "stale" }
  }

  const submissionStatus =
    submittedAt > assignment.dueDate ? "LATE_SUBMITTED" : "SUBMITTED"

  await db.assignmentSubmission.upsert({
    where: key,
    update: {
      status: submissionStatus,
      submittedAt,
      content: input.content,
      attachments: input.attachments,
    },
    create: {
      schoolId,
      assignmentId,
      studentId: student.id,
      status: submissionStatus,
      submittedAt,
      content: input.content,
      attachments: input.attachments,
    },
    select: { id: true },
  })

  // Route PATTERNS with the route groups omitted — a blended path matches no
  // cache tag.
  revalidatePath("/[lang]/s/[subdomain]/assignments", "page")
  revalidatePath("/[lang]/s/[subdomain]/assignments/[id]", "page")

  return { status: "submitted", submissionStatus }
}

export interface OwnSubmission {
  status: string
  submittedAt: Date | null
  content: string | null
  score: number | null
  feedback: string | null
}

/** What the signed-in student has on file for an assignment, if anything. */
export async function getOwnSubmission(
  userId: string,
  schoolId: string,
  assignmentId: string
): Promise<OwnSubmission | null> {
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })
  if (!student) return null
  const row = await db.assignmentSubmission.findUnique({
    where: {
      schoolId_assignmentId_studentId: {
        schoolId,
        assignmentId,
        studentId: student.id,
      },
    },
    select: {
      status: true,
      submittedAt: true,
      content: true,
      score: true,
      feedback: true,
    },
  })
  if (!row) return null
  return {
    status: row.status,
    submittedAt: row.submittedAt,
    content: row.content,
    score: row.score === null ? null : Number(row.score),
    feedback: row.feedback,
  }
}
