// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who teaches what to whom, now that classes are retired.
 *
 * A teacher's work is their SubjectTeacher rows (section × subject, per
 * term). A student sits in a section, which belongs to a grade; a student
 * placed in a grade but not yet in a section still counts for that grade.
 *
 * Plain server module, deliberately NOT "use server": every export of a
 * "use server" file is a public endpoint, and these take a schoolId.
 */

import { db } from "@/lib/db"
import {
  audienceRosterWhere,
  offeredToStream,
  type Audience,
} from "@/lib/teaching-audience"
import { resolveActiveTerm } from "@/lib/term-resolver"

/**
 * The sections a teacher works with: their homeroom, a section they hold a
 * timetable period with, or one they are assigned a subject in (which can
 * exist before the term's timetable does). A user with no teacher record
 * gets none — never "the whole school".
 */
export async function getTeacherSectionIds(
  schoolId: string,
  userId: string
): Promise<string[]> {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })
  if (!teacher) return []

  const sections = await db.section.findMany({
    where: {
      schoolId,
      OR: [
        { homeroomTeacherId: teacher.id },
        { timetables: { some: { schoolId, teacherId: teacher.id } } },
        { subjectTeachers: { some: { schoolId, teacherId: teacher.id } } },
      ],
    },
    select: { id: true },
  })
  return sections.map((s) => s.id)
}

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

/** Subjects a teacher teaches: their assignments. */
export async function getTeacherSubjectIds(
  schoolId: string,
  teacherId: string
): Promise<string[]> {
  const assigned = await db.subjectTeacher.findMany({
    where: { schoolId, teacherId },
    distinct: ["subjectId"],
    select: { subjectId: true },
  })
  return assigned.map((a) => a.subjectId)
}

export interface StudentScope {
  studentId: string
  sectionId: string | null
  /** The section's grade, else the grade the student was placed in. */
  gradeId: string | null
}

/** Section and grade for each of the given students. */
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
    },
  })
  return rows.map((r) => ({
    studentId: r.id,
    sectionId: r.sectionId,
    gradeId: r.section?.gradeId ?? r.academicGradeId,
  }))
}

/**
 * The subjects a student studies: their grade's active subjects (the
 * section's grade, else the grade they were placed in), filtered by stream.
 * The school's own name for a subject wins over the catalog's.
 */
export async function getStudentSubjects(
  schoolId: string,
  studentId: string
): Promise<Array<{ id: string; name: string }>> {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: {
      academicGradeId: true,
      academicStreamId: true,
      section: { select: { gradeId: true } },
    },
  })
  const gradeId = student?.section?.gradeId ?? student?.academicGradeId
  if (!student || !gradeId) return []

  const rows = await db.subjectSelection.findMany({
    where: { schoolId, gradeId, isActive: true },
    select: {
      streamId: true,
      customName: true,
      subject: { select: { id: true, name: true } },
    },
    orderBy: { subject: { name: "asc" } },
  })
  const subjects = new Map<string, { id: string; name: string }>()
  for (const row of rows) {
    if (!offeredToStream(row.streamId, student.academicStreamId)) continue
    if (subjects.has(row.subject.id)) continue
    subjects.set(row.subject.id, {
      id: row.subject.id,
      name: row.customName || row.subject.name,
    })
  }
  return [...subjects.values()]
}

/**
 * User ids for a piece of work's audience (an exam, an assignment, a
 * notice): the students it's for, optionally their guardians, and the
 * teachers who teach it — for work with a subject, that subject's teachers in its section or grade (that term's,
 * when the work names one); for a notice with no subject, the section's or
 * grade's homeroom and subject teachers this term.
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
  const [assigned, staffed] = await Promise.all([
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
    !work.subjectId && (work.sectionId || work.gradeId)
      ? sectionsTeacherUserIds(schoolId, work)
      : Promise.resolve([]),
  ])
  const ids = [...assigned.map((a) => a.teacher.userId), ...staffed]
  return [...new Set(ids.filter((id): id is string => !!id))]
}

/** A section's (or a grade's sections') homeroom and this term's subject teachers. */
async function sectionsTeacherUserIds(
  schoolId: string,
  work: {
    sectionId: string | null
    gradeId: string | null
    termId?: string | null
  }
): Promise<string[]> {
  const termId = work.termId ?? (await resolveActiveTerm(schoolId)).term?.id
  const sections = await db.section.findMany({
    where: work.sectionId
      ? { id: work.sectionId, schoolId }
      : { gradeId: work.gradeId!, schoolId },
    select: {
      homeroomTeacher: { select: { userId: true } },
      subjectTeachers: {
        where: { schoolId, ...(termId ? { termId } : {}) },
        select: { teacher: { select: { userId: true } } },
      },
    },
  })
  return sections
    .flatMap((s) => [
      s.homeroomTeacher?.userId ?? null,
      ...s.subjectTeachers.map((t) => t.teacher.userId),
    ])
    .filter((id): id is string => !!id)
}
