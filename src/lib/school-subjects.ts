// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cache } from "react"
import type { CatalogSubject } from "@prisma/client"

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
  imageKey: true,
  thumbnailKey: true,
  status: true,
  totalChapters: true,
  totalLessons: true,
  totalContent: true,
  sortOrder: true,
  clickviewId: true,
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
  imageKey: string | null
  thumbnailKey: string | null
  status: string
  totalChapters: number
  totalLessons: number
  totalContent: number
  sortOrder: number
  clickviewId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Get all active subjects for a school via SchoolSubjectSelection bridge.
 * Returns core CatalogSubject fields (deduplicated by catalogSubjectId).
 * Wrapped with React.cache() for request-level deduplication.
 */
export const getSchoolSubjects = cache(
  async (schoolId: string): Promise<SubjectCore[]> => {
    const selections = await db.schoolSubjectSelection.findMany({
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
): Promise<CatalogSubject[]> {
  const selections = await db.schoolSubjectSelection.findMany({
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
  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: {
      subject: {
        select: {
          id: true,
          name: true,
          department: true,
        },
      },
    },
    distinct: ["catalogSubjectId"],
  })
  return selections.map((s) => s.subject)
})

/**
 * Find a single school subject by CatalogSubject ID.
 * Verifies the school has selected this subject.
 */
export async function getSchoolSubject(
  schoolId: string,
  subjectId: string
): Promise<SubjectCore | null> {
  const selection = await db.schoolSubjectSelection.findFirst({
    where: { schoolId, catalogSubjectId: subjectId, isActive: true },
    select: { subject: { select: SUBJECT_CORE_SELECT } },
  })
  return selection?.subject ?? null
}
