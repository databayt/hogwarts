"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface VideoAnalyticsData {
  lessons: Array<{
    id: string
    title: string
    chapterTitle: string
    totalWatchers: number
    avgCompletionPercent: number
    avgWatchedSeconds: number
    totalSeconds: number | null
    completedCount: number
  }>
  topWatched: Array<{
    id: string
    title: string
    watchCount: number
  }>
  overall: {
    totalLessons: number
    totalWatchSessions: number
    avgCompletionPercent: number
    activeStudentsLast7Days: number
  }
}

/**
 * Aggregate video watch analytics from StreamLessonProgress data
 */
export async function getVideoAnalytics(
  courseId: string
): Promise<VideoAnalyticsData | null> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user) return null
    if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || ""))
      return null

    // Get all lessons in the course with their progress data
    const lessons = await db.streamLesson.findMany({
      where: {
        chapter: {
          course: {
            id: courseId,
            schoolId: schoolId || undefined,
          },
        },
      },
      include: {
        chapter: { select: { title: true } },
        progress: {
          select: {
            isCompleted: true,
            watchedSeconds: true,
            totalSeconds: true,
            watchCount: true,
            lastWatchedAt: true,
            userId: true,
          },
        },
      },
      orderBy: [{ chapter: { position: "asc" } }, { position: "asc" }],
    })

    // Per-lesson analytics
    const lessonAnalytics = lessons.map((lesson) => {
      const progresses = lesson.progress
      const totalWatchers = progresses.length
      const completedCount = progresses.filter((p) => p.isCompleted).length

      const avgWatchedSeconds =
        totalWatchers > 0
          ? progresses.reduce((sum, p) => sum + p.watchedSeconds, 0) /
            totalWatchers
          : 0

      // Use first available totalSeconds as the video duration
      const totalSeconds =
        progresses.find((p) => p.totalSeconds)?.totalSeconds ?? null

      const avgCompletionPercent =
        totalWatchers > 0 && totalSeconds
          ? (progresses.reduce(
              (sum, p) => sum + p.watchedSeconds / (p.totalSeconds || 1),
              0
            ) /
              totalWatchers) *
            100
          : 0

      return {
        id: lesson.id,
        title: lesson.title,
        chapterTitle: lesson.chapter.title,
        totalWatchers,
        avgCompletionPercent: Math.round(avgCompletionPercent),
        avgWatchedSeconds: Math.round(avgWatchedSeconds),
        totalSeconds,
        completedCount,
      }
    })

    // Top watched lessons (by total watch count)
    const topWatched = lessons
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        watchCount: lesson.progress.reduce((sum, p) => sum + p.watchCount, 0),
      }))
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, 10)

    // Overall stats
    const allProgresses = lessons.flatMap((l) => l.progress)
    const totalWatchSessions = allProgresses.reduce(
      (sum, p) => sum + p.watchCount,
      0
    )

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeStudentsLast7Days = new Set(
      allProgresses
        .filter((p) => p.lastWatchedAt >= sevenDaysAgo)
        .map((p) => p.userId)
    ).size

    const overallCompletionPercent =
      allProgresses.length > 0
        ? allProgresses.filter((p) => p.isCompleted).length /
          allProgresses.length
        : 0

    return {
      lessons: lessonAnalytics,
      topWatched,
      overall: {
        totalLessons: lessons.length,
        totalWatchSessions,
        avgCompletionPercent: Math.round(overallCompletionPercent * 100),
        activeStudentsLast7Days,
      },
    }
  } catch (error) {
    console.error("Video analytics error:", error)
    return null
  }
}

/**
 * Get top watched lessons across all courses for a school
 */
export async function getTopWatchedLessons(
  limit = 10
): Promise<
  Array<{ id: string; title: string; courseTitle: string; watchCount: number }>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user) return []
    if (!["ADMIN", "TEACHER", "DEVELOPER"].includes(session.user.role || ""))
      return []

    const lessons = await db.streamLesson.findMany({
      where: {
        chapter: {
          course: {
            schoolId: schoolId || undefined,
          },
        },
        progress: { some: {} },
      },
      include: {
        chapter: {
          include: {
            course: { select: { title: true } },
          },
        },
        progress: {
          select: { watchCount: true },
        },
      },
    })

    return lessons
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        courseTitle: lesson.chapter.course.title,
        watchCount: lesson.progress.reduce((sum, p) => sum + p.watchCount, 0),
      }))
      .sort((a, b) => b.watchCount - a.watchCount)
      .slice(0, limit)
  } catch (error) {
    console.error("Top watched lessons error:", error)
    return []
  }
}
