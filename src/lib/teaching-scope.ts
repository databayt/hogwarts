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
