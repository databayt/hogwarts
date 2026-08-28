// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cache } from "react"
import type { Subject } from "@prisma/client"

import { db } from "@/lib/db"

/** Narrow select for most callers — avoids loading heavy text/array columns */
const SUBJECT_CORE_SELECT = {
  id: true,
  name: true,
  slug: true,
  lang: true,
  department: true,
  levels: true,
  grades: true,
  country: true,
  curriculum: true,
  color: true,
  thumbnail: true,
  status: true,
  totalChapters: true,
  totalLessons: true,
  totalContent: true,
  sortOrder: true,
  subjectGroupId: true,
  createdAt: true,
  updatedAt: true,
} as const

export type SubjectCore = {
  id: string
  name: string
  slug: string
  lang: string
  department: string
  levels: string[]
  grades: number[]
  country: string
  curriculum: string
  color: string | null
  thumbnail: string | null
  status: string
  totalChapters: number
  totalLessons: number
  totalContent: number
  sortOrder: number
  subjectGroupId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all active subjects for a school via SubjectSelection bridge.
 * Returns core Subject fields (deduplicated by catalogSubjectId).
 * Wrapped with React.cache() for request-level deduplication.
 */
export const getSchoolSubjects = cache(
  async (schoolId: string): Promise<SubjectCore[]> => {
    const selections = await db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { subject: { select: SUBJECT_CORE_SELECT } },
      distinct: ["catalogSubjectId"],
    })
    return selections.map((s) => s.subject)
  }
)

/**
 * Get all active subjects with ALL columns (for callers that need full data).
 */
export async function getSchoolSubjectsFull(
  schoolId: string
): Promise<Subject[]> {
  const selections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    include: { subject: true },
    distinct: ["catalogSubjectId"],
  })
  return selections.map((s) => s.subject)
}

/**
 * Get school subjects as options for dropdowns.
 * Returns { id, name, department } for each subject.
 */
export const getSchoolSubjectOptions = cache(async (schoolId: string) => {
  const selections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: {
      // The grade is NOT decoration. The catalog seeds ONE Subject per grade
      // and deliberately leaves the grade out of `Subject.name`, so a school
      // teaching 12 grades holds ~120 selections in which the same name
      // recurs — 26 of 123 names are duplicated on the demo school alone.
      // A subject picker that renders names without their grade is a coin
      // flip. Authoritative source is the school's own selection; the
      // catalog's `Subject.grades` tag is the fallback.
      grade: { select: { gradeNumber: true } },
      subject: {
        select: {
          id: true,
          name: true,
          department: true,
          grades: true,
        },
      },
    },
    distinct: ["catalogSubjectId"],
  })
  return selections.map((s) => ({
    ...s.subject,
    gradeNumber: s.grade?.gradeNumber ?? s.subject.grades?.[0] ?? null,
  }))
})

/**
 * Label a subject option so two same-named subjects can be told apart.
 *
 * The grade label is DERIVED from the number, never from `AcademicGrade.name`
 * (Abdout, 2026-08-12): school grade names are prose ("الصف الحادي عشر"),
 * translate inconsistently, and don't sort visually. Zero-padded so the list
 * orders the way it reads. Same rule the Lumos upload picker follows.
 */
export function subjectOptionLabel(
  name: string,
  gradeNumber: number | null | undefined,
  lang?: string
): string {
  if (gradeNumber == null || gradeNumber <= 0) return name
  const n = String(gradeNumber).padStart(2, "0")
  return lang === "ar" ? `الصف ${n} · ${name}` : `Grade ${n} · ${name}`
}

/**
 * Find a single school subject by Subject ID.
 * Verifies the school has selected this subject.
 */
export async function getSchoolSubject(
  schoolId: string,
  subjectId: string
): Promise<SubjectCore | null> {
  const selection = await db.subjectSelection.findFirst({
    where: { schoolId, catalogSubjectId: subjectId, isActive: true },
    select: { subject: { select: SUBJECT_CORE_SELECT } },
  })
  return selection?.subject ?? null
}
