"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"

export interface CourseProgressData {
  totalLessons: number
  completedLessons: number
  progressPercent: number
  totalWatchedSeconds: number
  totalDurationSeconds: number
  estimatedRemainingMinutes: number
  lastWatchedAt: Date | null
}

/**
 * Get the current user's progress for a specific course (subject).
 * Returns null if user is not enrolled or not authenticated.
 */
export async function getCourseProgress(
  subjectId: string
): Promise<CourseProgressData | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  // Get all lessons in this subject
  const lessons = await db.lesson.findMany({
    where: {
      chapter: { subjectId },
    },
    select: {
      id: true,
      durationMinutes: true,
    },
  })

  if (lessons.length === 0) return null

  // Get user's progress on these lessons
  const progress = await db.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      catalogLessonId: { in: lessons.map((l) => l.id) },
    },
    select: {
      isCompleted: true,
      watchedSeconds: true,
      totalSeconds: true,
      updatedAt: true,
    },
  })

  if (progress.length === 0) return null

  const completedLessons = progress.filter((p) => p.isCompleted).length
  const totalWatchedSeconds = progress.reduce(
    (sum, p) => sum + (p.watchedSeconds || 0),
    0
  )
  const totalDurationSeconds = lessons.reduce(
    (sum, l) => sum + (l.durationMinutes ?? 0) * 60,
    0
  )
  const estimatedRemainingSeconds = Math.max(
    0,
    totalDurationSeconds - totalWatchedSeconds
  )

  const lastWatchedAt = progress.reduce<Date | null>((latest, p) => {
    if (!latest || p.updatedAt > latest) return p.updatedAt
    return latest
  }, null)

  return {
    totalLessons: lessons.length,
    completedLessons,
    progressPercent:
      lessons.length > 0
        ? Math.round((completedLessons / lessons.length) * 100)
        : 0,
    totalWatchedSeconds,
    totalDurationSeconds,
    estimatedRemainingMinutes: Math.ceil(estimatedRemainingSeconds / 60),
    lastWatchedAt,
  }
}
