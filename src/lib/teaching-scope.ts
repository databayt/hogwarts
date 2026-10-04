// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who teaches what to whom, now that classes are retired.
 *
 * A teacher's work is their SubjectTeacher rows (section × subject, per
 * term). A student sits in a section, which belongs to a grade; a student
 * placed in a grade but not yet in a section still counts for that grade.
 * Legacy class enrollments are returned for history only — nothing new
 * writes one.
 *
 * Plain server module, deliberately NOT "use server": every export of a
 * "use server" file is a public endpoint, and these take a schoolId.
 */

import { db } from "@/lib/db"
import { audienceRosterWhere, type Audience } from "@/lib/teaching-audience"

export interface TeachingPair {
  sectionId: string
  subjectId: string
  gradeId: string
  termId: string
}

/**
 * The (section, subject) pairs a teacher is assigned. Every term unless one
 * is given: a teacher keeps access to what they taught last term.
 */
export async function getTeacherPairs(
  schoolId: string,
  teacherId: string,
  opts: { termId?: string } = {}
): Promise<TeachingPair[]> {
  const rows = await db.subjectTeacher.findMany({
    where: {
      schoolId,
      teacherId,
      ...(opts.termId ? { termId: opts.termId } : {}),
    },
    select: {
      sectionId: true,
      subjectId: true,
      termId: true,
      section: { select: { gradeId: true } },
    },
  })
  return rows.map((r) => ({
    sectionId: r.sectionId,
    subjectId: r.subjectId,
    termId: r.termId,
    gradeId: r.section.gradeId,
  }))
}

/** Subjects a teacher teaches: assignments, plus any legacy classes. */
export async function getTeacherSubjectIds(
  schoolId: string,
  teacherId: string
): Promise<string[]> {
  const [assigned, classes] = await Promise.all([
    db.subjectTeacher.findMany({
      where: { schoolId, teacherId },
      distinct: ["subjectId"],
      select: { subjectId: true },
    }),
    db.class.findMany({
      where: { schoolId, teacherId },
      select: { subjectId: true },
    }),
  ])
  return [
    ...new Set([
      ...assigned.map((a) => a.subjectId),
      ...classes.map((c) => c.subjectId),
    ]),
  ]
}

export interface StudentScope {
  studentId: string
  sectionId: string | null
  /** The section's grade, else the grade the student was placed in. */
  gradeId: string | null
  /** Legacy class enrollments (history). */
  classIds: string[]
}

/** Section, grade and legacy classes for each of the given students. */
export async function getStudentScopes(
  schoolId: string,
  studentIds: readonly string[]
): Promise<StudentScope[]> {
  if (studentIds.length === 0) return []
  const rows = await db.student.findMany({
    where: { schoolId, id: { in: [...studentIds] } },
    select: {
      id: true,
      sectionId: true,
      academicGradeId: true,
      section: { select: { gradeId: true } },
      studentClasses: { where: { schoolId }, select: { classId: true } },
    },
  })
  return rows.map((r) => ({
    studentId: r.id,
    sectionId: r.sectionId,
    gradeId: r.section?.gradeId ?? r.academicGradeId,
    classIds: r.studentClasses.map((c) => c.classId),
  }))
}

/**
 * User ids for a piece of work's audience (an exam, an assignment): the
 * students it's for, optionally their guardians, and the teachers who teach
 * it — the legacy class's teacher, or the subject's teachers in its section
 * or grade (that term's, when the work names one).
 */
export async function audienceUserIds(
  schoolId: string,
  work: Audience & { subjectId?: string | null; termId?: string | null },
  include: { students?: boolean; guardians?: boolean; teachers?: boolean }
): Promise<string[]> {
  const wantsStudents = include.students || include.guardians
  const [students, teachers] = await Promise.all([
    wantsStudents
      ? db.student.findMany({
          where: audienceRosterWhere(schoolId, work),
          select: {
            userId: true,
            studentGuardians: {
              where: { schoolId },
              select: { guardian: { select: { userId: true } } },
            },
          },
        })
      : Promise.resolve([]),
    include.teachers ? audienceTeacherUserIds(schoolId, work) : [],
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

async function audienceTeacherUserIds(
  schoolId: string,
  work: Audience & { subjectId?: string | null; termId?: string | null }
): Promise<string[]> {
  const [legacy, assigned] = await Promise.all([
    work.classId
      ? db.class.findFirst({
          where: { id: work.classId, schoolId },
          select: { teacher: { select: { userId: true } } },
        })
      : null,
    work.subjectId && (work.sectionId || work.gradeId)
      ? db.subjectTeacher.findMany({
          where: {
            schoolId,
            subjectId: work.subjectId,
            ...(work.termId ? { termId: work.termId } : {}),
            ...(work.sectionId
              ? { sectionId: work.sectionId }
              : { section: { gradeId: work.gradeId! } }),
          },
          select: { teacher: { select: { userId: true } } },
        })
      : Promise.resolve([]),
  ])
  const ids = assigned.map((a) => a.teacher.userId)
  if (legacy?.teacher?.userId) ids.push(legacy.teacher.userId)
  return [...new Set(ids.filter((id): id is string => !!id))]
}
