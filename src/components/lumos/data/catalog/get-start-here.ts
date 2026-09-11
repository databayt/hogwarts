// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Render-time read (courses page) — server-only, NOT a "use server" action.
import { cache } from "react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { getHiddenContent } from "@/components/lumos/lib/content-hidden"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import {
  resolveLessonInstructors,
  type LessonInstructor,
} from "./get-continue-watching"

/** How many of the grade's courses to look through before giving up. */
const MAX_CANDIDATE_COURSES = 8

export interface StartHereItem {
  /** The course this lesson belongs to — not always the grade's first. */
  courseId: string
  lessonId: string
  lessonTitle: string
  chapterTitle: string
  thumbnailUrl: string | null
  color: string | null
  courseSlug: string
  instructor: LessonInstructor | null
}

/**
 * The first lesson of a course, for the lead card when the learner has not
 * started anything yet.
 *
 * The card at the top of the catalog used to disappear entirely for a
 * first-time learner, which left the page opening on a shelf — the one reader
 * who most needs a way in got the least direction. This gives that card
 * something true to say instead: the opening lesson of the course the page
 * would recommend first, in the same five-row shape the resume card uses, and
 * linking straight into that lesson rather than at a course landing page.
 *
 * Deliberately NOT "the most popular" or "the highest rated" course — the
 * caller hands over the grade's courses IN ITS OWN ORDER, because this catalog
 * carries no such signal (see `get-course-shelves.ts`). All this does is find
 * the first of them that has a way IN.
 *
 * Hidden content is subtracted the same way every listing surface subtracts it
 * (`getHiddenContent`), so the card can never point a student at a chapter or
 * lesson their school has removed from its LMS.
 */
export const getStartHereLesson = cache(async function getStartHereLesson(
  /** The grade's courses IN ORDER; the first one with a usable lesson wins. */
  candidates: { id: string; slug: string }[],
  lang: string
): Promise<StartHereItem | null> {
  const { schoolId } = await getTenantContext()
  if (!schoolId || candidates.length === 0) return null

  // Walking the list matters: a course whose chapters are all unpublished (or
  // all hidden by this school) would otherwise leave the card absent for the
  // whole grade — the exact hole this fallback exists to close.
  const shortlist = candidates.slice(0, MAX_CANDIDATE_COURSES)

  // Over-fetch a little: the first few chapters of each candidate and their
  // first few lessons, so one hidden opening chapter still yields a card. One
  // query for the shortlist, then the choice is made in memory.
  const chapters = await db.chapter.findMany({
    where: {
      subjectId: { in: shortlist.map((c) => c.id) },
      status: "PUBLISHED",
    },
    orderBy: [{ sequenceOrder: "asc" }, { id: "asc" }],
    take: MAX_CANDIDATE_COURSES * 4,
    select: {
      id: true,
      name: true,
      color: true,
      subjectId: true,
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: [{ sequenceOrder: "asc" }, { id: "asc" }],
        take: 4,
        select: { id: true, name: true, thumbnail: true, color: true },
      },
    },
  })

  if (chapters.length === 0) return null

  const { hiddenChapterIds, hiddenLessonIds } = await getHiddenContent(
    schoolId,
    {
      chapterIds: chapters.map((c) => c.id),
      lessonIds: chapters.flatMap((c) => c.lessons.map((l) => l.id)),
    }
  )

  let chapter: (typeof chapters)[number] | undefined
  let lesson: (typeof chapters)[number]["lessons"][number] | undefined
  let courseSlug: string | undefined

  for (const candidate of shortlist) {
    chapter = chapters.find(
      (c) =>
        c.subjectId === candidate.id &&
        !hiddenChapterIds.has(c.id) &&
        c.lessons.some((l) => !hiddenLessonIds.has(l.id))
    )
    lesson = chapter?.lessons.find((l) => !hiddenLessonIds.has(l.id))
    if (chapter && lesson) {
      courseSlug = candidate.slug
      break
    }
  }

  if (!chapter || !lesson || !courseSlug) return null

  // The same instructor the lesson page will resolve, through the same policy.
  const [instructors, labels] = await Promise.all([
    resolveLessonInstructors([lesson.id], schoolId, null),
    getLabels([chapter.name, lesson.name], (lang || "en") as Lang, schoolId),
  ])

  return {
    courseId: chapter.subjectId,
    lessonId: lesson.id,
    lessonTitle: labels.get(lesson.name) ?? lesson.name,
    chapterTitle: labels.get(chapter.name) ?? chapter.name,
    thumbnailUrl: getCatalogImageUrl(lesson.thumbnail, "original") ?? null,
    color: lesson.color ?? chapter.color ?? null,
    courseSlug,
    instructor: instructors.get(lesson.id) ?? null,
  }
})
