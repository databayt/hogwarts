// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Database side of `audience.ts`: who an exam reaches — the accounts to tell,
 * and whether given students sit it.
 *
 * Plain server module, deliberately NOT "use server" — it takes a schoolId,
 * and every export of a "use server" file is a public endpoint.
 */

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import {
  audienceUserIds,
  getStudentScopes,
  getTeacherPairs,
} from "@/lib/teaching-scope"

import {
  studentExamsWhere,
  teacherExamsWhere,
  type ExamAudience,
} from "./audience"

export type ExamAudienceKeys = Pick<ExamAudience, "gradeId" | "sectionId"> & {
  subjectId: string
  termId?: string | null
}

/**
 * User ids for an exam's audience: the students who sit it, optionally their
 * guardians, and the teachers who teach it — see `audienceUserIds`.
 */
export async function examAudienceUserIds(
  schoolId: string,
  exam: ExamAudienceKeys,
  include: { students?: boolean; guardians?: boolean; teachers?: boolean }
): Promise<string[]> {
  return audienceUserIds(schoolId, exam, include)
}

/**
 * Whether the exam is set for any of these students — one student taking it,
 * or a guardian's children.
 */
export async function examReachesStudents(
  schoolId: string,
  examId: string,
  studentIds: readonly string[]
): Promise<boolean> {
  const scopes = await getStudentScopes(schoolId, studentIds)
  if (scopes.length === 0) return false
  const exam = await db.schoolExam.findFirst({
    where: { id: examId, schoolId, ...studentExamsWhere(scopes) },
    select: { id: true },
  })
  return !!exam
}

/**
 * The exams a TEACHER user may open (see `teacherExamsWhere`); nothing when
 * the user has no teacher record in the school.
 */
export async function teacherUserExamsWhere(
  schoolId: string,
  userId: string
): Promise<Prisma.SchoolExamWhereInput> {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })
  if (!teacher) return { id: { in: [] } }
  return teacherExamsWhere({
    teacherId: teacher.id,
    userId,
    pairs: await getTeacherPairs(schoolId, teacher.id),
  })
}
