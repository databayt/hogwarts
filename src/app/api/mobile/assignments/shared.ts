// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import type { MyAssignment } from "@/components/school-dashboard/listings/assignments/my-assignments"
import {
  assignmentListSelect,
  teachesClass,
} from "@/components/school-dashboard/listings/assignments/queries"
import type { StudentSubmission } from "@/components/school-dashboard/listings/assignments/submit-core"

import type { MobileAuthContext } from "../lib/authenticate"
import { hasRole } from "../lib/roles"
import { canAccessStudent } from "../lib/student-access"

/**
 * Shared pieces of the mobile assignments routes: DTO mappers and the one
 * access rule every `/assignments/:id/*` route applies.
 */

export function submissionDto(s: StudentSubmission | null) {
  if (!s) return null
  return {
    id: s.id,
    status: s.status,
    submitted_at: s.submittedAt,
    content: s.content,
    attachments: s.attachments,
    score: s.score,
    feedback: s.feedback,
    graded_at: s.gradedAt,
  }
}

/** A student's own row: the assignment plus their submission, if any. */
export function studentAssignmentDto(a: MyAssignment) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    instructions: a.instructions,
    type: a.type,
    status: a.status,
    total_points: a.totalPoints,
    due_date: a.dueDate,
    is_overdue: a.dueDate < new Date(),
    class_id: a.classId,
    class_name: a.className,
    subject_name: a.subjectName,
    submission: submissionDto(a.submission),
  }
}

export const assignmentDetailFields = {
  ...assignmentListSelect,
  classId: true,
  description: true,
  instructions: true,
} as const

type AssignmentRow = {
  id: string
  title: string
  type: string
  status: string
  totalPoints: unknown
  weight: unknown
  dueDate: Date
  publishDate: Date | null
  createdAt: Date
  class: {
    id: string
    name: string
    teacher: { id: string; firstName: string; lastName: string } | null
    subject: { id: string; name: string } | null
  }
  _count: { submissions: number }
  description?: string | null
  instructions?: string | null
}

/** Staff-side row (list + detail). */
export function assignmentDto(a: AssignmentRow) {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? null,
    instructions: a.instructions ?? null,
    type: a.type,
    status: a.status,
    total_points: Number(a.totalPoints),
    weight: Number(a.weight),
    due_date: a.dueDate,
    publish_date: a.publishDate,
    is_overdue: a.dueDate < new Date(),
    class_id: a.class.id,
    class_name: a.class.name,
    subject_name: a.class.subject?.name ?? null,
    teacher_name: a.class.teacher
      ? `${a.class.teacher.firstName} ${a.class.teacher.lastName}`.trim()
      : null,
    submissions_count: a._count.submissions,
    created_at: a.createdAt,
  }
}

export type AssignmentAccess =
  | {
      ok: true
      mode: "staff"
      assignment: AssignmentRow & { classId: string }
    }
  | {
      ok: true
      mode: "student" | "guardian"
      assignment: AssignmentRow & { classId: string }
      studentId: string
    }
  | { ok: false; response: NextResponse }

const deny = (status: number, error: string): AssignmentAccess => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
})

/**
 * Who may open an assignment:
 *  - ADMIN / DEVELOPER — any in their school
 *  - TEACHER — assignments of classes they lead or co-teach
 *  - STUDENT — published (non-draft) assignments of their own classes
 *  - GUARDIAN — the same, for a linked child named by `studentId`
 * Another school's id is a 404, never a 403 (no existence oracle).
 */
export async function resolveAssignmentAccess(
  auth: MobileAuthContext,
  assignmentId: string,
  guardianStudentId: string | null
): Promise<AssignmentAccess> {
  const assignment = await db.schoolAssignment.findFirst({
    where: { id: assignmentId, schoolId: auth.schoolId, wizardStep: null },
    select: assignmentDetailFields,
  })
  if (!assignment) return deny(404, "Assignment not found")

  if (hasRole(auth, "ADMIN", "DEVELOPER")) {
    return { ok: true, mode: "staff", assignment }
  }

  if (hasRole(auth, "TEACHER")) {
    const teacher = await db.teacher.findFirst({
      where: { userId: auth.userId, schoolId: auth.schoolId },
      select: { id: true },
    })
    if (
      !teacher ||
      !(await teachesClass(auth.schoolId, teacher.id, assignment.classId))
    ) {
      return deny(403, "Forbidden")
    }
    return { ok: true, mode: "staff", assignment }
  }

  if (hasRole(auth, "STUDENT", "GUARDIAN")) {
    let studentId: string
    if (hasRole(auth, "STUDENT")) {
      const student = await db.student.findFirst({
        where: { userId: auth.userId, schoolId: auth.schoolId },
        select: { id: true },
      })
      if (!student) return deny(403, "Forbidden")
      studentId = student.id
    } else {
      if (!guardianStudentId) return deny(400, "student_id is required")
      if (!(await canAccessStudent(auth, guardianStudentId))) {
        return deny(403, "Forbidden")
      }
      studentId = guardianStudentId
    }

    if (assignment.status === "DRAFT") return deny(404, "Assignment not found")
    const member = await db.studentClass.findFirst({
      where: {
        schoolId: auth.schoolId,
        studentId,
        classId: assignment.classId,
      },
      select: { id: true },
    })
    if (!member) return deny(403, "Forbidden")

    return {
      ok: true,
      mode: hasRole(auth, "STUDENT") ? "student" : "guardian",
      assignment,
      studentId,
    }
  }

  return deny(403, "Forbidden")
}

export function pageParams(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1)
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("per_page") || "20") || 20)
  )
  return { page, perPage }
}
