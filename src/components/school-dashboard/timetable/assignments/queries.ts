// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read models for subject-teacher assignment: the school-wide board and the
 * per-teacher editor (wizard step, teachers row dialog).
 *
 * Plain server module (not "use server"); callers authorize and resolve the
 * school + term. Every query is scoped by schoolId.
 */

import { db } from "@/lib/db"
import { getSchoolGradeCountry } from "@/lib/grade/school"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { getLabels, getNames } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { cellKey } from "./keys"

const DEFAULT_PER_WEEK = 25

export interface AssignmentSubject {
  subjectId: string
  name: string
  weeklyPeriods: number
  /** Catalog thumbnail (CDN), null when the subject has none. */
  imageUrl: string | null
}

export interface AssignmentSection {
  sectionId: string
  name: string
  /** Short label for chips (أ, ب / A, B). */
  letter: string
}

export interface AssignmentGrade {
  gradeId: string
  name: string
  gradeNumber: number
  sections: AssignmentSection[]
  subjects: AssignmentSubject[]
}

export interface AssignmentTeacher {
  teacherId: string
  name: string
  /** Periods a week this term. */
  load: number
  cap: number
  /** Subjects the teacher is qualified for (suggestions sort these first). */
  subjectIds: string[]
}

export interface AssignmentCell {
  /** Who teaches this subject in this section; null = waiting for a teacher. */
  teacherId: string | null
  /** Periods of it in the timetable. */
  scheduled: number
  /** Of those, how many the assigned teacher actually teaches. */
  taught: number
}

export interface AssignmentBoardData {
  termId: string
  grades: AssignmentGrade[]
  /** Keyed `${sectionId}:${subjectId}`. */
  cells: Record<string, AssignmentCell>
  teachers: AssignmentTeacher[]
  /** Subject-in-section pairs nobody teaches yet. */
  waitingPairs: number
  /** Timetable periods with no teacher. */
  waitingPeriods: number
}

/**
 * Grades → sections + subjects, who teaches each pair, and every teacher's
 * load. Names come back in the display language.
 */
export async function getAssignmentBoardData(params: {
  schoolId: string
  termId: string
  lang: Lang
}): Promise<AssignmentBoardData> {
  const { schoolId, termId, lang } = params

  const [grades, selections, assignments, slots, teachers, workload] =
    await Promise.all([
      db.academicGrade.findMany({
        where: { schoolId },
        orderBy: { gradeNumber: "asc" },
        select: {
          id: true,
          name: true,
          gradeNumber: true,
          sections: {
            orderBy: [{ letter: "asc" }, { name: "asc" }],
            select: { id: true, name: true, letter: true },
          },
        },
      }),
      db.subjectSelection.findMany({
        where: { schoolId, isActive: true },
        select: {
          gradeId: true,
          catalogSubjectId: true,
          customName: true,
          weeklyPeriods: true,
          subject: { select: { name: true, thumbnail: true } },
        },
      }),
      db.subjectTeacher.findMany({
        where: { schoolId, termId },
        select: { sectionId: true, subjectId: true, teacherId: true },
      }),
      db.timetable.findMany({
        where: { schoolId, termId, weekOffset: 0, sectionId: { not: null } },
        select: { sectionId: true, subjectId: true, teacherId: true },
      }),
      db.teacher.findMany({
        where: { schoolId, employmentStatus: "ACTIVE", wizardStep: null },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          subjectExpertise: {
            where: { schoolId },
            select: { subjectId: true },
          },
          constraints: {
            where: { schoolId, OR: [{ termId }, { termId: null }] },
            orderBy: { termId: "desc" },
            take: 1,
            select: { maxPeriodsPerWeek: true },
          },
        },
      }),
      db.workloadConfig.findUnique({
        where: { schoolId },
        select: { maxPeriodsPerWeek: true },
      }),
    ])

  // One entry per (grade, subject): stream-specific selections can repeat a
  // subject; keep the largest weekly load and the school's custom name.
  const subjectsByGrade = new Map<string, Map<string, AssignmentSubject>>()
  for (const sel of selections) {
    const bySubject = subjectsByGrade.get(sel.gradeId) ?? new Map()
    const name = sel.customName || sel.subject?.name || ""
    const prev = bySubject.get(sel.catalogSubjectId)
    bySubject.set(sel.catalogSubjectId, {
      subjectId: sel.catalogSubjectId,
      name: prev?.name || name,
      weeklyPeriods: Math.max(prev?.weeklyPeriods ?? 0, sel.weeklyPeriods ?? 0),
      imageUrl:
        prev?.imageUrl ?? getCatalogImageUrl(sel.subject?.thumbnail, "sm"),
    })
    subjectsByGrade.set(sel.gradeId, bySubject)
  }

  const [labels, names] = await Promise.all([
    getLabels(
      [
        ...grades.map((g) => g.name),
        ...grades.flatMap((g) => g.sections.map((s) => s.name)),
        ...selections.map((s) => s.customName || s.subject?.name),
      ],
      lang,
      schoolId
    ),
    getNames(teachers, (t) => t, lang, schoolId),
  ])
  const label = (v: string) => labels.get(v) ?? v

  const assigned = new Map(
    assignments.map((a) => [cellKey(a.sectionId, a.subjectId), a.teacherId])
  )
  const cells: Record<string, AssignmentCell> = {}
  const loads = new Map<string, number>()
  let waitingPeriods = 0
  for (const s of slots) {
    if (s.teacherId) loads.set(s.teacherId, (loads.get(s.teacherId) ?? 0) + 1)
    else waitingPeriods++
    if (!s.sectionId || !s.subjectId) continue
    const key = cellKey(s.sectionId, s.subjectId)
    const teacherId = assigned.get(key) ?? null
    const cell = (cells[key] ??= { teacherId, scheduled: 0, taught: 0 })
    cell.scheduled++
    if (teacherId && s.teacherId === teacherId) cell.taught++
  }

  let waitingPairs = 0
  const boardGrades: AssignmentGrade[] = grades.map((g) => {
    const subjects = [...(subjectsByGrade.get(g.id)?.values() ?? [])]
      .map((s) => ({ ...s, name: label(s.name) }))
      .sort(
        (a, b) =>
          b.weeklyPeriods - a.weeklyPeriods || a.name.localeCompare(b.name)
      )
    for (const section of g.sections) {
      for (const subject of subjects) {
        const key = cellKey(section.id, subject.subjectId)
        const teacherId = assigned.get(key) ?? null
        cells[key] ??= { teacherId, scheduled: 0, taught: 0 }
        if (!teacherId) waitingPairs++
      }
    }
    return {
      gradeId: g.id,
      name: label(g.name),
      gradeNumber: g.gradeNumber,
      sections: g.sections.map((s) => ({
        sectionId: s.id,
        name: label(s.name),
        letter: s.letter,
      })),
      subjects,
    }
  })

  const defaultCap = workload?.maxPeriodsPerWeek ?? DEFAULT_PER_WEEK
  return {
    termId,
    grades: boardGrades.filter((g) => g.sections.length > 0),
    cells,
    teachers: teachers.map((t) => {
      const raw = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim()
      return {
        teacherId: t.id,
        name: names.get(raw) ?? raw,
        load: loads.get(t.id) ?? 0,
        cap: t.constraints[0]?.maxPeriodsPerWeek || defaultCap,
        subjectIds: t.subjectExpertise.map((e) => e.subjectId),
      }
    }),
    waitingPairs,
    waitingPeriods,
  }
}

export interface TeacherEditorData {
  termId: string
  teacher: AssignmentTeacher
  grades: AssignmentGrade[]
  /** Keyed `${sectionId}:${subjectId}`: who teaches it now (null = nobody). */
  holders: Record<string, { teacherId: string; name: string } | null>
  /** Keyed `${sectionId}:${subjectId}`: timetable periods per pair. */
  cells: Record<string, AssignmentCell>
  /** School country for grade naming (`@/lib/grade`). */
  gradeCountry: string | null
}

/** One teacher's view: every grade's subjects × sections and who holds each. */
export async function getTeacherEditorData(params: {
  schoolId: string
  termId: string
  teacherId: string
  lang: Lang
}): Promise<TeacherEditorData | null> {
  const [board, gradeCountry] = await Promise.all([
    getAssignmentBoardData(params),
    getSchoolGradeCountry(params.schoolId).catch(() => null),
  ])
  // The editor also opens for a teacher still in the add wizard (a draft),
  // whom the board leaves out.
  let teacher = board.teachers.find((t) => t.teacherId === params.teacherId)
  if (!teacher) {
    const row = await db.teacher.findFirst({
      where: { id: params.teacherId, schoolId: params.schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        subjectExpertise: {
          where: { schoolId: params.schoolId },
          select: { subjectId: true },
        },
      },
    })
    if (!row) return null
    const load = await db.timetable.count({
      where: {
        schoolId: params.schoolId,
        termId: params.termId,
        weekOffset: 0,
        teacherId: row.id,
      },
    })
    teacher = {
      teacherId: row.id,
      name: `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
      load,
      cap: board.teachers[0]?.cap ?? DEFAULT_PER_WEEK,
      subjectIds: row.subjectExpertise.map((e) => e.subjectId),
    }
  }

  const nameOf = new Map(board.teachers.map((t) => [t.teacherId, t.name]))
  const holders: TeacherEditorData["holders"] = {}
  for (const [key, cell] of Object.entries(board.cells)) {
    holders[key] = cell.teacherId
      ? { teacherId: cell.teacherId, name: nameOf.get(cell.teacherId) ?? "" }
      : null
  }

  return {
    termId: board.termId,
    teacher,
    grades: board.grades,
    holders,
    cells: board.cells,
    gradeCountry,
  }
}
