// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Builds SubjectTeacher rows for a school that has none yet — the seed, and
 * the one-off backfill for schools that predate assignments
 * (prisma/scripts/subject-teachers-backfill.ts).
 *
 * Three sources, by what the school already has:
 * - fromSlots      — the timetable already names teachers (the demo): the
 *                    teacher holding most of a subject's periods in a section
 *                    takes that subject there.
 * - fromClasses    — legacy grade-level classes (King Fahd): the class's
 *                    teacher takes the subject in every section of its grade.
 * - fromExpertise  — nothing assigned anywhere (a fresh seed): qualified
 *                    teachers via suggest.ts, a priority teacher first.
 *
 * Each only fills pairs that have no assignment yet, then reconciles the
 * timetable with one batch apply so every period of a pair shows its teacher
 * (swapping periods inside sections where needed). Plain server module;
 * takes a Prisma client so seeds and scripts can pass their own.
 */

import type { PrismaClient } from "@prisma/client"

import { applyAssignmentsBatch } from "./apply"
import { cellKey } from "./keys"
import { suggestAssignments, type WaitingPair } from "./suggest"

type Pair = { sectionId: string; subjectId: string; teacherId: string }

export interface DeriveResult {
  created: number
  reconciled: { assigned: number; moved: number; residual: number }
}

/** Saves new pairs (skipping ones already assigned) and reconciles slots. */
async function saveAndReconcile(
  client: PrismaClient,
  schoolId: string,
  termId: string,
  pairs: Pair[]
): Promise<DeriveResult> {
  const existing = await client.subjectTeacher.findMany({
    where: { schoolId, termId },
    select: { sectionId: true, subjectId: true },
  })
  const taken = new Set(existing.map((e) => cellKey(e.sectionId, e.subjectId)))
  const fresh = pairs.filter(
    (p) => !taken.has(cellKey(p.sectionId, p.subjectId))
  )
  if (fresh.length === 0) {
    return { created: 0, reconciled: { assigned: 0, moved: 0, residual: 0 } }
  }

  const groups = new Map<
    string,
    { teacherId: string; subjectId: string; sectionIds: string[] }
  >()
  for (const p of fresh) {
    const key = `${p.teacherId}|${p.subjectId}`
    const g = groups.get(key) ?? {
      teacherId: p.teacherId,
      subjectId: p.subjectId,
      sectionIds: [],
    }
    g.sectionIds.push(p.sectionId)
    groups.set(key, g)
  }

  // The batch apply writes the SubjectTeacher rows itself, together with the
  // slot changes, in one transaction.
  const { outcomes } = await applyAssignmentsBatch(
    { schoolId, termId, requests: [...groups.values()] },
    client
  )
  const after = await client.subjectTeacher.count({
    where: { schoolId, termId },
  })
  return {
    created: after - existing.length,
    reconciled: {
      assigned: outcomes.reduce((n, o) => n + o.assigned, 0),
      moved: outcomes.reduce((n, o) => n + o.moved, 0),
      residual: outcomes.reduce((n, o) => n + o.residual.length, 0),
    },
  }
}

/** The teacher holding most of a subject's periods in a section takes it. */
export async function deriveFromSlots(
  client: PrismaClient,
  schoolId: string,
  termId: string
): Promise<DeriveResult> {
  const slots = await client.timetable.findMany({
    where: {
      schoolId,
      termId,
      weekOffset: 0,
      sectionId: { not: null },
      subjectId: { not: null },
      teacherId: { not: null },
      teacher: { employmentStatus: "ACTIVE" },
    },
    select: { sectionId: true, subjectId: true, teacherId: true },
  })
  const counts = new Map<string, Map<string, number>>()
  for (const s of slots) {
    const key = cellKey(s.sectionId!, s.subjectId!)
    const byTeacher = counts.get(key) ?? new Map<string, number>()
    byTeacher.set(s.teacherId!, (byTeacher.get(s.teacherId!) ?? 0) + 1)
    counts.set(key, byTeacher)
  }
  const pairs: Pair[] = []
  for (const [key, byTeacher] of counts) {
    const [sectionId, subjectId] = key.split(":")
    const [teacherId] = [...byTeacher.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    )[0]
    pairs.push({ sectionId, subjectId, teacherId })
  }
  return saveAndReconcile(client, schoolId, termId, pairs)
}

/** A legacy grade-level class's teacher takes the subject in every section. */
export async function deriveFromClasses(
  client: PrismaClient,
  schoolId: string,
  termId: string
): Promise<DeriveResult> {
  const [classes, sections] = await Promise.all([
    client.class.findMany({
      where: {
        schoolId,
        gradeId: { not: null },
        teacher: { employmentStatus: "ACTIVE" },
      },
      orderBy: { createdAt: "asc" },
      select: { gradeId: true, subjectId: true, teacherId: true },
    }),
    client.section.findMany({
      where: { schoolId },
      select: { id: true, gradeId: true },
    }),
  ])
  const sectionsOf = new Map<string, string[]>()
  for (const s of sections) {
    sectionsOf.set(s.gradeId, [...(sectionsOf.get(s.gradeId) ?? []), s.id])
  }
  const seen = new Set<string>()
  const pairs: Pair[] = []
  for (const c of classes) {
    for (const sectionId of sectionsOf.get(c.gradeId!) ?? []) {
      const key = cellKey(sectionId, c.subjectId)
      if (seen.has(key)) continue // the oldest class for a pair wins
      seen.add(key)
      pairs.push({ sectionId, subjectId: c.subjectId, teacherId: c.teacherId })
    }
  }
  return saveAndReconcile(client, schoolId, termId, pairs)
}

/**
 * Qualified teachers for every unassigned pair (suggest.ts). A priority
 * teacher (the seed's test teacher) first takes the subjects they're
 * qualified for in one section (the test student's), so the documented
 * teacher / student / parent trio meets in a real class.
 */
export async function deriveFromExpertise(
  client: PrismaClient,
  schoolId: string,
  termId: string,
  priority?: { teacherId: string; sectionId: string } | null
): Promise<DeriveResult> {
  const [sections, selections, teachers, slots, assigned] = await Promise.all([
    client.section.findMany({
      where: { schoolId },
      orderBy: [{ name: "asc" }],
      select: { id: true, gradeId: true },
    }),
    client.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { gradeId: true, catalogSubjectId: true, weeklyPeriods: true },
    }),
    client.teacher.findMany({
      where: { schoolId, employmentStatus: "ACTIVE", wizardStep: null },
      select: {
        id: true,
        subjectExpertise: { where: { schoolId }, select: { subjectId: true } },
      },
    }),
    client.timetable.findMany({
      where: { schoolId, termId, weekOffset: 0, sectionId: { not: null } },
      select: { sectionId: true, subjectId: true, teacherId: true },
    }),
    client.subjectTeacher.findMany({
      where: { schoolId, termId },
      select: { sectionId: true, subjectId: true },
    }),
  ])

  const taken = new Set(assigned.map((a) => cellKey(a.sectionId, a.subjectId)))
  const periodsOf = new Map<string, number>()
  const load = new Map<string, number>()
  for (const s of slots) {
    if (s.sectionId && s.subjectId) {
      const key = cellKey(s.sectionId, s.subjectId)
      periodsOf.set(key, (periodsOf.get(key) ?? 0) + 1)
    }
    if (s.teacherId) load.set(s.teacherId, (load.get(s.teacherId) ?? 0) + 1)
  }
  const weekly = new Map<string, number>()
  for (const sel of selections) {
    const key = `${sel.gradeId}|${sel.catalogSubjectId}`
    weekly.set(key, Math.max(weekly.get(key) ?? 0, sel.weeklyPeriods ?? 0))
  }

  const pairs: Pair[] = []
  const waiting: WaitingPair[] = []
  const qualifiedOf = new Map(
    teachers.map((t) => [
      t.id,
      new Set(t.subjectExpertise.map((e) => e.subjectId)),
    ])
  )
  for (const section of sections) {
    for (const [key, hours] of weekly) {
      const [gradeId, subjectId] = key.split("|")
      if (gradeId !== section.gradeId) continue
      const pk = cellKey(section.id, subjectId)
      if (taken.has(pk)) continue
      const periods = periodsOf.get(pk) ?? hours
      if (
        priority &&
        section.id === priority.sectionId &&
        qualifiedOf.get(priority.teacherId)?.has(subjectId) &&
        (load.get(priority.teacherId) ?? 0) + periods <= 25
      ) {
        pairs.push({
          sectionId: section.id,
          subjectId,
          teacherId: priority.teacherId,
        })
        load.set(
          priority.teacherId,
          (load.get(priority.teacherId) ?? 0) + periods
        )
        continue
      }
      waiting.push({ sectionId: section.id, gradeId, subjectId, periods })
    }
  }

  for (const s of suggestAssignments(
    waiting,
    teachers.map((t) => ({
      teacherId: t.id,
      subjectIds: t.subjectExpertise.map((e) => e.subjectId),
      load: load.get(t.id) ?? 0,
      cap: 25,
    }))
  )) {
    for (const sectionId of s.sectionIds) {
      pairs.push({ sectionId, subjectId: s.subjectId, teacherId: s.teacherId })
    }
  }
  return saveAndReconcile(client, schoolId, termId, pairs)
}

/**
 * Every pair gets a teacher where the school's data allows: first from the
 * teachers already on the timetable, then from qualifications. Idempotent —
 * both steps skip pairs that are already assigned. Used by the seed.
 */
export async function ensureAssignments(
  client: PrismaClient,
  schoolId: string,
  termId: string,
  priority?: { teacherId: string; sectionId: string } | null
): Promise<DeriveResult> {
  const fromSlots = await deriveFromSlots(client, schoolId, termId)
  const fromExpertise = await deriveFromExpertise(
    client,
    schoolId,
    termId,
    priority
  )
  return {
    created: fromSlots.created + fromExpertise.created,
    reconciled: {
      assigned:
        fromSlots.reconciled.assigned + fromExpertise.reconciled.assigned,
      moved: fromSlots.reconciled.moved + fromExpertise.reconciled.moved,
      residual:
        fromSlots.reconciled.residual + fromExpertise.reconciled.residual,
    },
  }
}
