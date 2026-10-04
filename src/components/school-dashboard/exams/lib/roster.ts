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
import { getStudentScopes, getTeacherPairs } from "@/lib/teaching-scope"

import {
  examRosterWhere,
  studentExamsWhere,
  teacherExamsWhere,
  type ExamAudience,
} from "./audience"

export type ExamAudienceKeys = Pick<
  ExamAudience,
  "classId" | "gradeId" | "sectionId"
> & { subjectId: string; termId?: string | null }

/**
 * User ids for an exam's audience: the students who sit it, optionally their
 * guardians, and the teachers who teach it — the legacy class's teacher, or
 * the subject's teachers in the exam's section or grade.
 */
export async function examAudienceUserIds(
  schoolId: string,
  exam: ExamAudienceKeys,
  include: { students?: boolean; guardians?: boolean; teachers?: boolean }
): Promise<string[]> {
  const wantsStudents = include.students || include.guardians
  const [students, teachers] = await Promise.all([
    wantsStudents
      ? db.student.findMany({
          where: examRosterWhere(schoolId, exam),
          select: {
            userId: true,
            studentGuardians: {
              where: { schoolId },
              select: { guardian: { select: { userId: true } } },
            },
          },
        })
      : Promise.resolve([]),
    include.teachers ? examTeacherUserIds(schoolId, exam) : [],
  ])

  const ids = new Set<string>(teachers)
  for (const s of students) {
    if (include.students && s.userId) ids.add(s.userId)
    if (include.guardians) {
      for (const g of s.studentGuardians) {
        if (g.guardian.userId) ids.add(g.guardian.userId)
      }
    }
  }
  return [...ids]
}

async function examTeacherUserIds(
  schoolId: string,
  exam: ExamAudienceKeys
): Promise<string[]> {
  const [legacy, assigned] = await Promise.all([
    exam.classId
      ? db.class.findFirst({
          where: { id: exam.classId, schoolId },
          select: { teacher: { select: { userId: true } } },
        })
      : null,
    exam.sectionId || exam.gradeId
      ? db.subjectTeacher.findMany({
          where: {
            schoolId,
            subjectId: exam.subjectId,
            ...(exam.termId ? { termId: exam.termId } : {}),
            ...(exam.sectionId
              ? { sectionId: exam.sectionId }
              : { section: { gradeId: exam.gradeId! } }),
          },
          select: { teacher: { select: { userId: true } } },
        })
      : Promise.resolve([]),
  ])
  const ids = assigned.map((a) => a.teacher.userId)
  if (legacy?.teacher?.userId) ids.push(legacy.teacher.userId)
  return [...new Set(ids.filter((id): id is string => !!id))]
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
