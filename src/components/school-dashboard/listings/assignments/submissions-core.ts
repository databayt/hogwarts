// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The teacher's view of who handed in what. A plain server module (it takes
// a schoolId), called only from the assignment page after the session's role
// is known — never a server action.

import "server-only"

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { audienceRosterWhere } from "@/lib/teaching-audience"
import { getTeacherPairs } from "@/lib/teaching-scope"
import { signAttachmentUrls } from "@/lib/tenant-storage"

import { teacherAssignmentsWhere } from "./queries"

export interface SubmissionReviewRow {
  id: string
  studentName: string
  status: string
  submittedAt: string | null
  content: string | null
  /** Short-lived signed links (null when signing is unavailable). */
  attachments: Array<{ url: string | null; name: string }>
  score: number | null
  feedback: string | null
}

export interface SubmissionReview {
  rows: SubmissionReviewRow[]
  /** Students the assignment is for. */
  rosterCount: number
  /** Of those, how many handed something in. */
  handedIn: number
}

/**
 * Every hand-in for an assignment, newest first, plus the roster size so
 * the teacher sees "12 of 25". The web Submissions tab was a placeholder —
 * grading existed only on the phone. A TEACHER sees only work they teach
 * (the mobile route's rule); ADMIN and DEVELOPER see the school's.
 */
export async function loadSubmissionReview(input: {
  schoolId: string
  userId: string
  role: string
  assignmentId: string
}): Promise<SubmissionReview | null> {
  const { schoolId, userId, role, assignmentId } = input
  if (!["TEACHER", "ADMIN", "DEVELOPER"].includes(role)) return null

  let scope = {}
  if (role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!teacher) return null
    const pairs = await getTeacherPairs(schoolId, teacher.id)
    scope = teacherAssignmentsWhere({ teacherId: teacher.id, userId, pairs })
  }

  const assignment = await db.schoolAssignment.findFirst({
    where: { id: assignmentId, schoolId, ...scope },
    select: { id: true, gradeId: true, sectionId: true },
  })
  if (!assignment) return null

  const [rows, rosterCount, nameDisplay] = await Promise.all([
    db.assignmentSubmission.findMany({
      where: {
        schoolId,
        assignmentId,
        status: { notIn: ["NOT_SUBMITTED", "DRAFT"] },
      },
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      take: 500,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        content: true,
        attachments: true,
        score: true,
        feedback: true,
        student: {
          select: { firstName: true, middleName: true, lastName: true },
        },
      },
    }),
    db.student.count({ where: audienceRosterWhere(schoolId, assignment) }),
    schoolNameDisplay(schoolId),
  ])

  return {
    rosterCount,
    handedIn: rows.length,
    rows: await Promise.all(
      rows.map(async (r) => {
        const signed = await signAttachmentUrls(r.attachments)
        return {
          id: r.id,
          studentName: displayName(r.student, nameDisplay),
          status: String(r.status),
          submittedAt: r.submittedAt?.toISOString() ?? null,
          content: r.content,
          attachments: r.attachments.map((raw, i) => ({
            url: signed[i] ?? null,
            name: decodeURIComponent(raw.split("/").pop() ?? "file"),
          })),
          score: r.score === null ? null : Number(r.score),
          feedback: r.feedback,
        }
      })
    ),
  }
}
