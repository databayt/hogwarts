// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Render-time read (courses page) — server-only, NOT a "use server" action.
// A directive here would compile it into a browser-reachable POST stub and
// defeat the cache() wrapper below.
import { cache } from "react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { ensureSubjectSelections } from "@/components/catalog/setup"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import {
  subjectSelect,
  toCourseShape,
  type CatalogCourseType,
} from "./get-all-courses"

/**
 * Ceiling on the browse lane. Comfortably above a full K-12 catalog (~120
 * rows today) and low enough that reading it all in one go stays cheap. A
 * school that exceeds it loses the tail of its highest grades from the
 * shelves — the grade badges and the search still reach every course — so
 * raise it rather than adding pagination if a real catalog gets there.
 */
const MAX_SHELF_COURSES = 400

export interface CourseShelf {
  /** The grade this shelf collects. Doubles as the `?level=` drill-down. */
  grade: number
  courses: CatalogCourseType[]
}

export interface CourseShelves {
  shelves: CourseShelf[]
  /** Every course the school offers, ordered as the shelves are. */
  total: number
}

/**
 * Every course the school offers, bucketed into one shelf per grade.
 *
 * ONE query for the whole page, not one per shelf. The catalog stores a
 * separate Subject row per subject PER GRADE — a school teaching 12 grades
 * holds ~120 of them — so twelve shelves off twelve queries would be twelve
 * round trips plus twelve translation batches for a set small enough to hold
 * in memory. This reads them all once, translates once, and buckets in JS.
 *
 * Deliberately NOT paginated. `getAllCatalogCourses` still owns the paginated,
 * searchable, single-grade lane that the flat grid and the typeahead use; this
 * is the browse lane, and a shelf that pages is not a shelf. The cap below is
 * the guard against a catalog that outgrows the assumption.
 *
 * Ordering signals we deliberately do NOT build a shelf from: `averageRating`
 * is 0 on every catalog row and `usageCount` is uniform, so "top rated" and
 * "most popular" shelves would be arbitrary orderings wearing a meaningful
 * label. `createdAt` ties across bulk-seeded rows, which rules out "recently
 * added" the same way. Grade is the one axis this data actually varies on.
 */
export const getCourseShelves = cache(async function getCourseShelves(
  lang: string
): Promise<CourseShelves> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { shelves: [], total: 0 }

  const displayLang = (lang || "en") as Lang

  let selections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: { catalogSubjectId: true, customName: true },
  })

  // Same auto-provision the paginated fetcher does — a school that has never
  // opened the subjects page still gets a catalog rather than an empty page.
  if (selections.length === 0) {
    try {
      const { provisioned } = await ensureSubjectSelections(schoolId)
      if (provisioned) {
        selections = await db.subjectSelection.findMany({
          where: { schoolId, isActive: true },
          select: { catalogSubjectId: true, customName: true },
        })
      }
    } catch {
      // Fall through with empty selections.
    }
  }

  const subjectIds = [...new Set(selections.map((s) => s.catalogSubjectId))]
  if (subjectIds.length === 0) return { shelves: [], total: 0 }

  const customNames = new Map(
    selections
      .filter((s) => s.customName)
      .map((s) => [s.catalogSubjectId, s.customName!])
  )

  const subjects = await db.subject.findMany({
    where: { id: { in: subjectIds }, status: "PUBLISHED" },
    // `id` breaks the tie: catalog rows are bulk-seeded and share a sortOrder
    // (and a createdAt to the millisecond), so without it the shelf order
    // wobbles between renders.
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: MAX_SHELF_COURSES,
    select: subjectSelect,
  })

  const [localized, labels] = await Promise.all([
    localize("Subject", subjects, { schoolId, lang: displayLang }),
    getLabels(
      [
        ...subjects
          .filter((s) => customNames.has(s.id))
          .map((s) => customNames.get(s.id)),
        ...subjects.map((s) => s.department),
      ],
      displayLang,
      schoolId
    ),
  ])

  const rows = localized.map((s) => {
    const customName = customNames.get(s.id)
    return toCourseShape(s, {
      title: customName ? (labels.get(customName) ?? customName) : s.name,
      description: s.description ?? "",
      departmentName: s.department
        ? (labels.get(s.department) ?? s.department)
        : s.department,
    })
  })

  // A Subject carries `grades: number[]`, but the seeded catalog writes exactly
  // one grade per row. A row listing several lands on the lowest, so a
  // cross-grade subject appears once rather than in every shelf it touches.
  const byGrade = new Map<number, CatalogCourseType[]>()
  for (const row of rows) {
    const grade = [...(row._catalog.grades ?? [])].sort((a, b) => a - b)[0]
    if (grade == null) continue
    const bucket = byGrade.get(grade)
    if (bucket) bucket.push(row)
    else byGrade.set(grade, [row])
  }

  const shelves = [...byGrade.entries()]
    .sort(([a], [b]) => a - b)
    .map(([grade, courses]) => ({ grade, courses }))

  return { shelves, total: rows.length }
})
