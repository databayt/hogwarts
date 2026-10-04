// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Starting a new term from the last one: who teaches what carries over, and
 * so does the timetable. Plain server module (not "use server"); called after
 * a term is activated.
 *
 * - Assignments (SubjectTeacher) copy from the most recent earlier term that
 *   has any, for teachers still active.
 * - Slots, only if the new term has none: same school year (same periods) →
 *   copy the old term's week with the carried teachers; a new year → build it
 *   with the generator, which keeps the carried assignments.
 *
 * Idempotent: copies use skipDuplicates and slots are only made for an empty
 * term, so activating a term twice changes nothing the second time.
 */

import { db } from "@/lib/db"

import { applyAssignmentsBatch } from "./apply"
import { cellKey } from "./keys"

export interface PrepareTermResult {
  sourceTermId: string | null
  assignmentsCopied: number
  slotsCopied: number
  slotsGenerated: number
}

export async function prepareTerm(
  schoolId: string,
  toTermId: string
): Promise<PrepareTermResult> {
  const empty: PrepareTermResult = {
    sourceTermId: null,
    assignmentsCopied: 0,
    slotsCopied: 0,
    slotsGenerated: 0,
  }
  const toTerm = await db.term.findFirst({
    where: { id: toTermId, schoolId },
    select: { id: true, yearId: true, startDate: true },
  })
  if (!toTerm) return empty

  // The most recent earlier term with anything to carry.
  const earlier = await db.term.findMany({
    where: { schoolId, startDate: { lt: toTerm.startDate } },
    orderBy: { startDate: "desc" },
    select: { id: true, yearId: true },
  })
  let source: { id: string; yearId: string } | null = null
  for (const t of earlier) {
    const [assignments, slots] = await Promise.all([
      db.subjectTeacher.count({ where: { schoolId, termId: t.id } }),
      db.timetable.count({ where: { schoolId, termId: t.id } }),
    ])
    if (assignments > 0 || slots > 0) {
      source = t
      break
    }
  }

  let assignmentsCopied = 0
  if (source) {
    const rows = await db.subjectTeacher.findMany({
      where: {
        schoolId,
        termId: source.id,
        teacher: { employmentStatus: "ACTIVE" },
      },
      select: { sectionId: true, subjectId: true, teacherId: true },
    })
    if (rows.length > 0) {
      const created = await db.subjectTeacher.createMany({
        data: rows.map((r) => ({ ...r, schoolId, termId: toTerm.id })),
        skipDuplicates: true,
      })
      assignmentsCopied = created.count
    }
  }

  const existingSlots = await db.timetable.count({
    where: { schoolId, termId: toTerm.id },
  })
  if (existingSlots > 0) {
    // The term already has a week: put the carried teachers on it, moving
    // periods inside each section where they clash (one batch transaction).
    if (assignmentsCopied > 0) {
      const carried = await db.subjectTeacher.findMany({
        where: { schoolId, termId: toTerm.id },
        select: { sectionId: true, subjectId: true, teacherId: true },
      })
      const groups = new Map<
        string,
        { teacherId: string; subjectId: string; sectionIds: string[] }
      >()
      for (const a of carried) {
        const key = `${a.teacherId}|${a.subjectId}`
        const g = groups.get(key) ?? {
          teacherId: a.teacherId,
          subjectId: a.subjectId,
          sectionIds: [],
        }
        g.sectionIds.push(a.sectionId)
        groups.set(key, g)
      }
      await applyAssignmentsBatch({
        schoolId,
        termId: toTerm.id,
        requests: [...groups.values()],
      })
    }
    return {
      sourceTermId: source?.id ?? null,
      assignmentsCopied,
      slotsCopied: 0,
      slotsGenerated: 0,
    }
  }

  // Same year → same periods: copy the week, teachers from the carried
  // assignments (a teacher who left is dropped, the period waits).
  if (source && source.yearId === toTerm.yearId) {
    const [slots, assignments] = await Promise.all([
      db.timetable.findMany({
        where: {
          schoolId,
          termId: source.id,
          weekOffset: 0,
          sectionId: { not: null },
        },
        select: {
          dayOfWeek: true,
          periodId: true,
          sectionId: true,
          subjectId: true,
          classroomId: true,
          rotationWeek: true,
        },
      }),
      db.subjectTeacher.findMany({
        where: { schoolId, termId: toTerm.id },
        select: { sectionId: true, subjectId: true, teacherId: true },
      }),
    ])
    const teacherOf = new Map(
      assignments.map((a) => [cellKey(a.sectionId, a.subjectId), a.teacherId])
    )
    const created = await db.timetable.createMany({
      data: slots.map((s) => ({
        schoolId,
        termId: toTerm.id,
        dayOfWeek: s.dayOfWeek,
        periodId: s.periodId,
        sectionId: s.sectionId,
        subjectId: s.subjectId,
        teacherId:
          s.sectionId && s.subjectId
            ? (teacherOf.get(cellKey(s.sectionId, s.subjectId)) ?? null)
            : null,
        classroomId: s.classroomId,
        rotationWeek: s.rotationWeek,
        weekOffset: 0,
      })),
      skipDuplicates: true,
    })
    return {
      sourceTermId: source.id,
      assignmentsCopied,
      slotsCopied: created.count,
      slotsGenerated: 0,
    }
  }

  // A new year (different periods) or nothing to copy: build it. The
  // generator keeps the carried assignments.
  const { autoGenerateTimetableForSchool } =
    await import("@/components/catalog/provision")
  const generated = await autoGenerateTimetableForSchool(schoolId, {
    termId: toTerm.id,
  })
  return {
    sourceTermId: source?.id ?? null,
    assignmentsCopied,
    slotsCopied: 0,
    slotsGenerated: generated.slotsCreated,
  }
}
