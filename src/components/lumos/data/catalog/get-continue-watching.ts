// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Render-time read (home page) — wrapped in React cache() for request-level
// dedupe. Server-only; not a "use server" action.
import { cache } from "react"
import { auth } from "@/auth"

import { asset } from "@/lib/asset-url"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { hiddenLessonExclusion } from "@/components/lumos/lib/content-hidden"
import {
  applyInstructorPolicy,
  getInstructorPolicy,
  videoVisibilityWhere,
} from "@/components/lumos/lib/instructor-policy"

export interface LessonInstructor {
  name: string | null
  image: string | null
}

export interface ContinueWatchingItem {
  lessonId: string
  lessonTitle: string
  thumbnailUrl: string | null
  color: string | null
  watchedSeconds: number
  totalSeconds: number
  progressPercent: number
  chapterTitle: string
  chapterPosition: number
  lessonPosition: number
  courseTitle: string
  courseSlug: string
  /** The subject's grade, for the card's badge. Null when the row lists none. */
  grade: number | null
  /**
   * Who teaches the video this lesson would actually play for this school —
   * the same instructor the lesson page resolves, through the same policy.
   * Null when the lesson has no video the viewer may reach, which is ordinary.
   */
  instructor: LessonInstructor | null
  lastWatchedAt: Date
}

/**
 * Fetches in-progress lessons for "Continue Watching" row.
 * Returns lessons where the user has started watching but not completed,
 * ordered by most recently watched.
 */
export const getContinueWatching = cache(async function getContinueWatching(
  limit = 10
): Promise<ContinueWatchingItem[]> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user?.id || !schoolId) {
    return []
  }

  const progress = await db.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      watchedSeconds: { gt: 0 },
      totalSeconds: { gt: 0 },
      // `schoolId` used to gate only the early return above, so this row kept
      // surfacing lessons the school had hidden — and the card linked straight
      // into them.
      ...hiddenLessonExclusion(schoolId),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      catalogLessonId: true,
      watchedSeconds: true,
      totalSeconds: true,
      updatedAt: true,
      lesson: {
        select: {
          id: true,
          name: true,
          thumbnail: true,
          color: true,
          sequenceOrder: true,
          chapter: {
            select: {
              name: true,
              color: true,
              sequenceOrder: true,
              subject: {
                select: {
                  name: true,
                  slug: true,
                  color: true,
                  grades: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const instructors = await resolveLessonInstructors(
    progress.filter((p) => p.lesson != null).map((p) => p.lesson.id),
    schoolId,
    session.user.id
  )

  return progress
    .filter((p) => p.lesson != null)
    .map((p) => ({
      lessonId: p.lesson.id,
      lessonTitle: p.lesson.name,
      thumbnailUrl: getCatalogImageUrl(p.lesson.thumbnail, "original") ?? null,
      color:
        p.lesson.color ??
        p.lesson.chapter.color ??
        p.lesson.chapter.subject.color ??
        null,
      watchedSeconds: p.watchedSeconds,
      totalSeconds: p.totalSeconds!,
      progressPercent: Math.round(
        (p.watchedSeconds / (p.totalSeconds ?? 1)) * 100
      ),
      chapterTitle: p.lesson.chapter.name,
      chapterPosition: p.lesson.chapter.sequenceOrder,
      lessonPosition: p.lesson.sequenceOrder,
      courseTitle: p.lesson.chapter.subject.name,
      courseSlug: p.lesson.chapter.subject.slug,
      // Lowest, matching how the shelves bucket a multi-grade subject.
      grade:
        [...(p.lesson.chapter.subject.grades ?? [])].sort((a, b) => a - b)[0] ??
        null,
      instructor: instructors.get(p.lesson.id) ?? null,
      lastWatchedAt: p.updatedAt,
    }))
})

/**
 * Who teaches each of these lessons, for the resume card's byline.
 *
 * ONE query for every lesson on the list, then the school's instructor policy
 * applied per lesson in memory — the same `applyInstructorPolicy` the lesson
 * page and the mobile routes use, so the byline names whoever the learner will
 * actually see when they open the lesson. Resolving it any other way would let
 * the card and the player disagree about who is teaching.
 *
 * The visibility gate and the platform-attribution rule ("balqalam" with the
 * product mark, for a featured video belonging to no school) are both lifted
 * from `get-lesson-with-progress.ts`. A lesson with no reachable video simply
 * gets no entry, and the card drops the row.
 */
export async function resolveLessonInstructors(
  lessonIds: string[],
  schoolId: string,
  /** Null for a viewer-agnostic read: only the owner arm of the gate drops. */
  userId: string | null
): Promise<Map<string, LessonInstructor>> {
  const out = new Map<string, LessonInstructor>()
  if (lessonIds.length === 0) return out

  const [videos, policy] = await Promise.all([
    db.video.findMany({
      where: {
        catalogLessonId: { in: lessonIds },
        approvalStatus: "APPROVED",
        ...videoVisibilityWhere(schoolId, userId),
        NOT: { overrides: { some: { schoolId, isHidden: true } } },
      },
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
      select: {
        catalogLessonId: true,
        isFeatured: true,
        schoolId: true,
        userId: true,
        user: { select: { id: true, username: true, image: true } },
        school: { select: { name: true } },
      },
    }),
    getInstructorPolicy(schoolId),
  ])

  const byLesson = new Map<string, typeof videos>()
  for (const video of videos) {
    const key = video.catalogLessonId
    if (!key) continue
    const bucket = byLesson.get(key)
    if (bucket) bucket.push(video)
    else byLesson.set(key, [video])
  }

  for (const [lessonId, bucket] of byLesson) {
    const chosen = applyInstructorPolicy(bucket, policy)[0]
    if (!chosen) continue
    const isPlatform = chosen.isFeatured && !chosen.schoolId
    out.set(lessonId, {
      name: isPlatform
        ? "balqalam"
        : (chosen.user?.username ?? chosen.school?.name ?? null),
      image: isPlatform
        ? asset("/icons/logo.png")
        : (chosen.user?.image ?? null),
    })
  }

  return out
}
