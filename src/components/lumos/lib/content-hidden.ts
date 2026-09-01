// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * THE per-school hidden-content decision.
 *
 * A school removes catalog content from its own LMS with `ContentOverride`
 * (`isHidden` on a chapter, a lesson, or a single video). Until 2026-08-29 every
 * surface resolved that independently, and they disagreed on the axis that
 * matters most: **listing queries subtracted hidden content, access paths did
 * not.** Hiding a lesson delisted it from the course tree and the sidebar while
 * `getLessonWithProgress` still served it, its video still played, and its quiz
 * still graded into the gradebook — so any student holding the lesson id (a
 * bookmark, browser history, or the Continue Watching row, which never filtered
 * either) kept full access to content the school believed it had removed.
 *
 * Same discipline as `lib/lesson-quiz.ts` and `lib/instructor-policy.ts`: one
 * module, imported by every side, so they cannot drift.
 *
 * NOT a `"use server"` module — these are plain helpers imported by server
 * components and server actions. A directive here would compile each export
 * into a browser-reachable POST stub for no benefit (see this block's CLAUDE.md).
 *
 * Failure policy: every helper FAILS OPEN — a query error resolves to "not
 * hidden" — matching what `get-course.ts` has always done for listings. That is
 * a deliberate availability call, not an oversight. A hide is a *curriculum*
 * decision ("this chapter isn't in our term"), not a security boundary: the
 * actual boundaries are `visibility`, `approvalStatus` and the purchase gate,
 * each enforced by its own query that fails independently. Failing closed here
 * would turn one transient `ContentOverride` error into a 404 on every lesson
 * page at once — a total LMS outage — to avoid briefly serving a de-listed
 * lesson to someone who already holds its id. The outage is both likelier and
 * worse, and nobody can induce the error on demand.
 */

import { db } from "@/lib/db"

export type HiddenContent = {
  hiddenChapterIds: Set<string>
  hiddenLessonIds: Set<string>
}

/**
 * Bulk lookup for LIST surfaces: which of these chapters/lessons has the school
 * hidden? Pass the ids you already hold — this never enumerates the catalog.
 *
 * Fails open (returns empty sets) so a transient failure degrades to "show
 * everything" rather than emptying a course page, which is what `get-course.ts`
 * has always done.
 */
export async function getHiddenContent(
  schoolId: string | null | undefined,
  ids: { chapterIds?: string[]; lessonIds?: string[] }
): Promise<HiddenContent> {
  const chapterIds = ids.chapterIds ?? []
  const lessonIds = ids.lessonIds ?? []

  if (!schoolId || (chapterIds.length === 0 && lessonIds.length === 0)) {
    return { hiddenChapterIds: new Set(), hiddenLessonIds: new Set() }
  }

  // `catalogChapterId` and `catalogLessonId` are separate nullable columns with
  // their own composite indexes, so this rides `[schoolId, catalogChapterId]`
  // and `[schoolId, catalogLessonId]` rather than scanning the school's rows.
  const or: Array<Record<string, unknown>> = []
  if (chapterIds.length > 0) or.push({ catalogChapterId: { in: chapterIds } })
  if (lessonIds.length > 0) or.push({ catalogLessonId: { in: lessonIds } })

  try {
    const overrides = await db.contentOverride.findMany({
      where: { schoolId, isHidden: true, OR: or },
      select: { catalogChapterId: true, catalogLessonId: true },
    })

    const hiddenChapterIds = new Set<string>()
    const hiddenLessonIds = new Set<string>()
    for (const o of overrides) {
      if (o.catalogChapterId) hiddenChapterIds.add(o.catalogChapterId)
      if (o.catalogLessonId) hiddenLessonIds.add(o.catalogLessonId)
    }
    return { hiddenChapterIds, hiddenLessonIds }
  } catch {
    // Listing surfaces degrade to showing everything, as before.
    return { hiddenChapterIds: new Set(), hiddenLessonIds: new Set() }
  }
}

/**
 * ACCESS check for a single lesson: has the school hidden this lesson, either
 * directly or by hiding its parent chapter?
 *
 * `chapterId` is optional only because not every caller already holds it (the
 * quiz lane starts from a lesson id alone). Pass it when you have it — omitting
 * it costs one extra indexed lookup on `Lesson`.
 *
 * Fails open (see the module note): a query error resolves to "not hidden"
 * rather than 404-ing every lesson page in the school at once.
 */
export async function isLessonHidden(
  schoolId: string | null | undefined,
  lessonId: string,
  chapterId?: string | null
): Promise<boolean> {
  if (!schoolId) return false

  try {
    let parentChapterId = chapterId ?? null
    if (!parentChapterId) {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonId },
        select: { chapterId: true },
      })
      parentChapterId = lesson?.chapterId ?? null
    }

    const or: Array<Record<string, unknown>> = [{ catalogLessonId: lessonId }]
    if (parentChapterId) or.push({ catalogChapterId: parentChapterId })

    const hidden = await db.contentOverride.findFirst({
      where: { schoolId, isHidden: true, OR: or },
      select: { id: true },
    })
    return hidden !== null
  } catch {
    // Fail open — see the module note.
    return false
  }
}

/**
 * Prisma `NOT` fragment excluding lessons the school has hidden — directly or
 * through their chapter — for queries rooted on a relation to `Lesson`.
 *
 * Spread it into the `where` of a query whose row has a `lesson` relation, e.g.
 * `LessonProgress`:
 *
 *   where: { userId, ...hiddenLessonExclusion(schoolId) }
 *
 * Returns `{}` when there is no school context, so it is always safe to spread.
 */
export function hiddenLessonExclusion(
  schoolId: string | null | undefined,
  lessonRelation = "lesson"
): Record<string, unknown> {
  if (!schoolId) return {}

  return {
    NOT: {
      [lessonRelation]: {
        OR: [
          { overrides: { some: { schoolId, isHidden: true } } },
          { chapter: { overrides: { some: { schoolId, isHidden: true } } } },
        ],
      },
    },
  }
}

/**
 * The shared `NOT` clause for a query rooted directly on `Lesson`: excludes
 * lessons hidden outright and lessons whose chapter is hidden.
 */
function visibleLessonWhere(
  schoolId: string | null | undefined
): Record<string, unknown> {
  if (!schoolId) return {}
  return {
    NOT: {
      OR: [
        { overrides: { some: { schoolId, isHidden: true } } },
        { chapter: { overrides: { some: { schoolId, isHidden: true } } } },
      ],
    },
  }
}

/**
 * How many of a subject's published lessons this school actually shows — the
 * only correct denominator for a completion percentage.
 *
 * Every progress surface must divide by this, never by `Subject.totalLessons`:
 * that column is the platform-wide denormalized count and by construction
 * cannot reflect any one school's hides, so a student who finishes everything
 * their school shows them is capped below 100% forever.
 */
export async function countVisibleLessons(
  schoolId: string | null | undefined,
  subjectId: string
): Promise<number> {
  return db.lesson.count({
    where: {
      status: "PUBLISHED",
      chapter: { subjectId, status: "PUBLISHED" },
      ...visibleLessonWhere(schoolId),
    },
  })
}

/**
 * Batch form of {@link countVisibleLessons}: visible-lesson counts for many
 * subjects in ONE query, keyed by subject id.
 *
 * Use this on any surface rendering a LIST of courses — calling the single
 * version per row is the N+1 shape that made report-card generation take ~70k
 * queries elsewhere in this repo. Subjects with no visible lessons are present
 * in the map with a `0`, so callers must still guard their own division.
 */
export async function countVisibleLessonsBySubject(
  schoolId: string | null | undefined,
  subjectIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (subjectIds.length === 0) return counts
  for (const id of subjectIds) counts.set(id, 0)

  const rows = await db.lesson.findMany({
    where: {
      status: "PUBLISHED",
      chapter: { subjectId: { in: subjectIds }, status: "PUBLISHED" },
      ...visibleLessonWhere(schoolId),
    },
    select: { chapter: { select: { subjectId: true } } },
  })

  for (const row of rows) {
    const sid = row.chapter?.subjectId
    if (sid) counts.set(sid, (counts.get(sid) ?? 0) + 1)
  }
  return counts
}
