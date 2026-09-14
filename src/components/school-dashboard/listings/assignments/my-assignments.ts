// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

import {
  ownSubmissionSelect,
  toOwnSubmission,
  type StudentSubmission,
} from "./submit-core"

export interface MyAssignment {
  id: string
  title: string
  description: string | null
  instructions: string | null
  type: string
  status: string
  totalPoints: number
  dueDate: Date
  classId: string
  className: string
  subjectName: string | null
  submission: StudentSubmission | null
}

/**
 * The signed-in student's assignments: every non-draft assignment of a class
 * they belong to, with their own submission (if any) alongside. Plain module
 * — takes a `userId`, so never re-export it from a `"use server"` file.
 */
export async function getMyAssignments(
  userId: string,
  schoolId: string
): Promise<MyAssignment[]> {
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })
  if (!student) return []
  return getAssignmentsForStudent(schoolId, student.id)
}

/**
 * The same list for a known student — what a guardian (or the mobile app on a
 * guardian's behalf) sees for one child. Callers own the access check.
 */
export async function getAssignmentsForStudent(
  schoolId: string,
  studentId: string
): Promise<MyAssignment[]> {
  const classes = await db.studentClass.findMany({
    where: { schoolId, studentId },
    select: { classId: true },
  })
  if (classes.length === 0) return []

  const rows = await db.schoolAssignment.findMany({
    where: {
      schoolId,
      classId: { in: classes.map((c) => c.classId) },
      status: { not: "DRAFT" },
    },
    orderBy: [{ dueDate: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      instructions: true,
      type: true,
      status: true,
      totalPoints: true,
      dueDate: true,
      class: {
        select: { id: true, name: true, subject: { select: { name: true } } },
      },
      submissions: {
        where: { studentId },
        select: ownSubmissionSelect,
        take: 1,
      },
    },
  })

  return rows.map((r) => {
    const s = r.submissions[0]
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      instructions: r.instructions,
      type: r.type,
      status: r.status,
      totalPoints: Number(r.totalPoints),
      dueDate: r.dueDate,
      classId: r.class.id,
      className: r.class.name,
      subjectName: r.class.subject?.name ?? null,
      submission: s ? toOwnSubmission(s) : null,
    }
  })
}
