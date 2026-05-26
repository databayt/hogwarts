// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog coverage helpers.
 *
 * Reads the existing Curriculum / Subject / Chapter / Lesson schema and
 * reports what's populated per curriculum. Powers the eventual catalog
 * browse + bridge UI (sprint Epic 15) and surfaces a quick "what's
 * actually seeded" answer for any admin or CI smoke test.
 *
 * Pure reads — no auth, no React, no side effects.
 */

import { db } from "@/lib/db"

export interface CurriculumCoverage {
  curriculum: {
    id: string
    name: string
    slug: string
    country: string
    code: string
  }
  subjects: {
    total: number
    /** Distribution of subjects covering each grade index (1..12). */
    byGrade: Record<number, number>
    /** Distribution by `department` (e.g. "العلوم", "Mathematics"). */
    byDepartment: Record<string, number>
    withChapters: number
    withoutChapters: number
  }
  chapters: {
    total: number
    withLessons: number
    withoutLessons: number
  }
  lessons: {
    total: number
  }
}

export interface CurriculumSummary {
  id: string
  name: string
  slug: string
  country: string
  subjectCount: number
  /** Sorted unique grade indices covered by at least one subject. */
  gradeCoverage: number[]
}

/**
 * Detailed coverage for a single curriculum. Returns null when no
 * curriculum row matches the given id — callers should treat that as
 * "unknown curriculum" rather than throwing.
 */
export async function getCurriculumCoverage(
  curriculumId: string
): Promise<CurriculumCoverage | null> {
  const curriculum = await db.curriculum.findUnique({
    where: { id: curriculumId },
    select: { id: true, name: true, slug: true, country: true, code: true },
  })
  if (!curriculum) return null

  // Pull every subject in this curriculum with just the fields needed to
  // compute the distributions. The bridge models (SubjectSelection) are
  // not consulted here — coverage is about what content exists, not
  // what schools have adopted.
  const subjects = await db.subject.findMany({
    where: { curriculumId },
    select: {
      id: true,
      grades: true,
      department: true,
      totalChapters: true,
      totalLessons: true,
    },
  })

  const byGrade: Record<number, number> = {}
  const byDepartment: Record<string, number> = {}
  let withChapters = 0
  let withoutChapters = 0
  let chapterTotal = 0
  let lessonTotal = 0

  for (const subj of subjects) {
    for (const grade of subj.grades ?? []) {
      byGrade[grade] = (byGrade[grade] ?? 0) + 1
    }
    byDepartment[subj.department] = (byDepartment[subj.department] ?? 0) + 1
    if ((subj.totalChapters ?? 0) > 0) {
      withChapters += 1
      chapterTotal += subj.totalChapters
    } else {
      withoutChapters += 1
    }
    lessonTotal += subj.totalLessons ?? 0
  }

  // For the chapter-level coverage we need an actual chapter join. The
  // denormalized totalChapters on Subject doesn't say "how many of the
  // chapters have any lessons attached", which is the UI's typical
  // empty-state question.
  const subjectIds = subjects.map((s) => s.id)
  const chapters = subjectIds.length
    ? await db.chapter.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { id: true, _count: { select: { lessons: true } } },
      })
    : []

  let chaptersWithLessons = 0
  let chaptersWithoutLessons = 0
  for (const ch of chapters) {
    if (ch._count.lessons > 0) chaptersWithLessons += 1
    else chaptersWithoutLessons += 1
  }

  return {
    curriculum,
    subjects: {
      total: subjects.length,
      byGrade,
      byDepartment,
      withChapters,
      withoutChapters,
    },
    chapters: {
      total: chapterTotal || chapters.length,
      withLessons: chaptersWithLessons,
      withoutLessons: chaptersWithoutLessons,
    },
    lessons: { total: lessonTotal },
  }
}

/**
 * Lightweight listing for the catalog browse landing — every curriculum
 * with its subject count and the sorted set of grade indices it covers.
 * One query each for curricula + subjects so the cost is O(2) regardless
 * of how many curricula are seeded.
 */
export async function listCurriculaWithCoverage(): Promise<CurriculumSummary[]> {
  const curricula = await db.curriculum.findMany({
    select: { id: true, name: true, slug: true, country: true },
    orderBy: { name: "asc" },
  })

  if (curricula.length === 0) return []

  const subjects = await db.subject.findMany({
    where: { curriculumId: { in: curricula.map((c) => c.id) } },
    select: { curriculumId: true, grades: true },
  })

  const byCurriculum = new Map<
    string,
    { subjectCount: number; grades: Set<number> }
  >()
  for (const c of curricula) {
    byCurriculum.set(c.id, { subjectCount: 0, grades: new Set() })
  }
  for (const s of subjects) {
    if (!s.curriculumId) continue
    const bucket = byCurriculum.get(s.curriculumId)
    if (!bucket) continue
    bucket.subjectCount += 1
    for (const g of s.grades ?? []) bucket.grades.add(g)
  }

  return curricula.map((c) => {
    const bucket = byCurriculum.get(c.id)!
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      country: c.country,
      subjectCount: bucket.subjectCount,
      gradeCoverage: [...bucket.grades].sort((a, b) => a - b),
    }
  })
}
