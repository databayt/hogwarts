// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"

import type { OwnSubmission } from "./submit-core"

export interface MyAssignment {
  id: string
  title: string
  description: string | null
  instructions: string | null
  type: string
  status: string
  totalPoints: number
  dueDate: Date
  className: string
  submission: OwnSubmission | null
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
    select: { id: true, studentClasses: { select: { classId: true } } },
  })
  if (!student || student.studentClasses.length === 0) return []

  const rows = await db.schoolAssignment.findMany({
    where: {
      schoolId,
      classId: { in: student.studentClasses.map((c) => c.classId) },
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
      class: { select: { name: true } },
      submissions: {
        where: { studentId: student.id },
        select: {
          status: true,
          submittedAt: true,
          content: true,
          score: true,
          feedback: true,
        },
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
      className: r.class.name,
      submission: s
        ? {
            status: s.status,
            submittedAt: s.submittedAt,
            content: s.content,
            score: s.score === null ? null : Number(s.score),
            feedback: s.feedback,
          }
        : null,
    }
  })
}
