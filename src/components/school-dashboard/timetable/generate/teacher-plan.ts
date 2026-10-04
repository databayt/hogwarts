// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Teacher plan for section timetable generation.
 *
 * The generator only keeps two sections apart when the same teacher has to
 * teach both. A school that has no teachers yet (every new school: onboarding
 * builds the timetable before anyone is hired) therefore got parallel sections
 * as exact copies, with 7-A and 7-B on Math at the same period all week. When
 * one real teacher later takes Math for both sections, every period clashes.
 *
 * The fix is input shaping. Each (grade, subject) gets a placeholder teacher
 * shared by that grade's sections, so the algorithm spreads their periods
 * apart exactly as it would for one real teacher. A grade whose weekly load for
 * a subject exceeds one teacher's cap gets more placeholders, filled in section
 * order. Placeholders never reach the database: `stripPlaceholderTeachers`
 * turns them back into `teacherId: null` ("waiting for a teacher").
 *
 * Real qualified teachers keep priority. A subject's placeholder is listed
 * after them, so it only claims periods no real teacher can take.
 */

import type {
  GeneratedSlot,
  SectionRequirement,
  TeacherAvailability,
} from "./algorithm"

export const PLACEHOLDER_TEACHER_PREFIX = "placeholder:"

export function isPlaceholderTeacherId(
  id: string | null | undefined
): id is string {
  return typeof id === "string" && id.startsWith(PLACEHOLDER_TEACHER_PREFIX)
}

export interface TeacherCap {
  perWeek: number
  perDay: number
  consecutive: number
}

export interface TeacherPlan {
  sections: SectionRequirement[]
  teachers: TeacherAvailability[]
  placeholderCount: number
}

/**
 * Splits a grade's sections into groups whose combined weekly hours fit one
 * teacher's cap, keeping section order (7-A, 7-B, … stay together). A section
 * heavier than the cap on its own gets its own group.
 */
export function bucketSections(
  items: ReadonlyArray<{ sectionId: string; hours: number }>,
  perWeek: number
): string[][] {
  const buckets: string[][] = []
  let current: string[] = []
  let load = 0

  for (const item of items) {
    if (current.length > 0 && load + item.hours > perWeek) {
      buckets.push(current)
      current = []
      load = 0
    }
    current.push(item.sectionId)
    load += item.hours
  }
  if (current.length > 0) buckets.push(current)

  return buckets
}

function placeholderId(gradeId: string, subjectId: string, index: number) {
  return `${PLACEHOLDER_TEACHER_PREFIX}${gradeId}:${subjectId}:${index}`
}

/**
 * Adds a placeholder teacher per (grade, subject) group and lists it after the
 * real qualified teachers on every subject allocation. `sections` must already
 * be in a stable order (grade, then section letter); the result is
 * deterministic for the same input.
 */
export function buildTeacherPlan(input: {
  sections: SectionRequirement[]
  teachers: TeacherAvailability[]
  cap: TeacherCap
}): TeacherPlan {
  const { sections, teachers, cap } = input

  // gradeId → subjectId → [{ sectionId, hours }] in section order
  const demand = new Map<
    string,
    Map<string, Array<{ sectionId: string; hours: number }>>
  >()
  for (const section of sections) {
    let bySubject = demand.get(section.gradeId)
    if (!bySubject) {
      bySubject = new Map()
      demand.set(section.gradeId, bySubject)
    }
    for (const subject of section.subjects) {
      const list = bySubject.get(subject.subjectId) ?? []
      list.push({ sectionId: section.sectionId, hours: subject.hoursPerWeek })
      bySubject.set(subject.subjectId, list)
    }
  }

  const placeholders: TeacherAvailability[] = []
  // `${sectionId}:${subjectId}` → placeholder teacher id
  const placeholderByPair = new Map<string, string>()

  for (const [gradeId, bySubject] of demand) {
    for (const [subjectId, items] of bySubject) {
      const buckets = bucketSections(items, cap.perWeek)
      buckets.forEach((sectionIds, index) => {
        const id = placeholderId(gradeId, subjectId, index)
        placeholders.push({
          teacherId: id,
          teacherName: "",
          maxPeriodsPerDay: cap.perDay,
          maxPeriodsPerWeek: cap.perWeek,
          maxConsecutive: cap.consecutive,
          subjectExpertise: [subjectId],
          unavailableBlocks: [],
          preferredPeriods: [],
          avoidedPeriods: [],
        })
        for (const sectionId of sectionIds) {
          placeholderByPair.set(`${sectionId}:${subjectId}`, id)
        }
      })
    }
  }

  const planned: SectionRequirement[] = sections.map((section) => ({
    ...section,
    subjects: section.subjects.map((subject) => {
      const placeholder = placeholderByPair.get(
        `${section.sectionId}:${subject.subjectId}`
      )
      return {
        ...subject,
        preferredTeacherIds: placeholder
          ? [...subject.preferredTeacherIds, placeholder]
          : subject.preferredTeacherIds,
      }
    }),
  }))

  return {
    sections: planned,
    teachers: [...teachers, ...placeholders],
    placeholderCount: placeholders.length,
  }
}

/** Turns placeholder teachers back into unassigned (`null`) slots. */
export function stripPlaceholderTeachers(
  slots: GeneratedSlot[]
): GeneratedSlot[] {
  return slots.map((slot) => {
    if (!isPlaceholderTeacherId(slot.teacherId)) return slot
    return {
      ...slot,
      teacherId: null,
      violations: slot.violations.includes("unassigned_teacher")
        ? slot.violations
        : [...slot.violations, "unassigned_teacher"],
    }
  })
}
