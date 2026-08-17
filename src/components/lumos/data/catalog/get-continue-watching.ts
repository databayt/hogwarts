// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Render-time read (home page) — wrapped in React cache() for request-level
// dedupe. Server-only; not a "use server" action.
import { cache } from "react"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"

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
                },
              },
            },
          },
        },
      },
    },
  })

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
      lastWatchedAt: p.updatedAt,
    }))
})
