// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { db } from "@/lib/db"
import { lessonVisibilityFilter } from "@/components/school-dashboard/live/queries"

/**
 * Which lesson a class most likely teaches today. A plain server module,
 * deliberately NOT "use server": it takes a schoolId, and every export of a
 * "use server" file is a public endpoint. The gated actions that call it are
 * `suggestNextLesson` / `getClassLessons` in live/actions/resources.ts.
 */

export interface LessonOption {
  id: string
  name: string
}

/** The subject's lessons this school shows, in book order. */
export async function visibleLessons(
  schoolId: string,
  subjectId: string
): Promise<LessonOption[]> {
  return db.lesson.findMany({
    where: { chapter: { subjectId }, ...lessonVisibilityFilter(schoolId) },
    select: { id: true, name: true },
    orderBy: [
      { chapter: { sequenceOrder: "asc" } },
      { sequenceOrder: "asc" },
    ],
    take: 500,
  })
}

/**
 * The last class of this section + subject that had a lesson set → the next
 * visible lesson after it (the last one stays the last). No history → the
 * subject's first lesson. null when the subject has no visible lessons.
 */
export async function suggestNextLessonFor(
  schoolId: string,
  input: { sectionId: string; subjectId: string }
): Promise<string | null> {
  const [lessons, last] = await Promise.all([
    visibleLessons(schoolId, input.subjectId),
    db.conference.findFirst({
      where: {
        schoolId,
        sectionId: input.sectionId,
        subjectId: input.subjectId,
        deletedAt: null,
        catalogLessonId: { not: null },
      },
      orderBy: { scheduledStart: "desc" },
      select: { catalogLessonId: true },
    }),
  ])
  if (lessons.length === 0) return null
  const at = last?.catalogLessonId
    ? lessons.findIndex((l) => l.id === last.catalogLessonId)
    : -1
  if (at === -1) return lessons[0].id
  return lessons[Math.min(at + 1, lessons.length - 1)].id
}
