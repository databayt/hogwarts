"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

/**
 * Compute a quality score (0-100) based on engagement metrics.
 * Used for ranking content in browse views.
 */
export function computeQualityScore(metrics: {
  usageCount: number
  averageRating: number
  ratingCount: number
}): number {
  const { usageCount, averageRating, ratingCount } = metrics

  // Weighted score: 40% rating quality, 30% usage, 30% rating volume
  const ratingScore = ratingCount > 0 ? (averageRating / 5) * 100 : 50
  const usageScore = Math.min(usageCount / 100, 1) * 100
  const volumeScore = Math.min(ratingCount / 50, 1) * 100

  return Math.round(ratingScore * 0.4 + usageScore * 0.3 + volumeScore * 0.3)
}

/**
 * Get ranked catalog subjects by engagement.
 */
export async function getRankedSubjects(options?: {
  limit?: number
  country?: string
  system?: string
}) {
  const { limit = 20, country, system } = options ?? {}

  const where: Record<string, unknown> = { status: "PUBLISHED" }
  if (country) where.country = country
  if (system) where.system = system

  const subjects = await db.catalogSubject.findMany({
    where,
    orderBy: [
      { usageCount: "desc" },
      { averageRating: "desc" },
      { ratingCount: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      department: true,
      levels: true,
      country: true,
      system: true,
      thumbnailKey: true,
      color: true,
      usageCount: true,
      averageRating: true,
      ratingCount: true,
      totalChapters: true,
      totalLessons: true,
    },
  })

  return subjects
}

/**
 * Get ranked content for a specific type.
 */
export async function getRankedContent(
  type: "subjects" | "chapters" | "lessons",
  options?: { limit?: number; subjectId?: string }
) {
  const { limit = 20, subjectId } = options ?? {}

  switch (type) {
    case "subjects":
      return getRankedSubjects({ limit })

    case "chapters":
      return db.catalogChapter.findMany({
        where: {
          status: "PUBLISHED",
          ...(subjectId ? { subjectId } : {}),
        },
        orderBy: [{ usageCount: "desc" }, { averageRating: "desc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          subjectId: true,
          usageCount: true,
          averageRating: true,
          ratingCount: true,
          totalLessons: true,
        },
      })

    case "lessons":
      return db.catalogLesson.findMany({
        where: {
          status: "PUBLISHED",
          ...(subjectId ? { chapter: { subjectId } } : {}),
        },
        orderBy: [{ usageCount: "desc" }, { averageRating: "desc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          chapterId: true,
          usageCount: true,
          averageRating: true,
          ratingCount: true,
          videoCount: true,
          resourceCount: true,
        },
      })
  }
}

/**
 * Rate a catalog item (subject, chapter, or lesson).
 * Updates running average rating.
 */
export async function rateContent(
  type: "subject" | "chapter" | "lesson",
  id: string,
  rating: number
) {
  const session = await auth()
  if (!session?.user) throw new Error("Authentication required")

  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1-5")

  const updateRating = (current: number, count: number, newRating: number) => {
    // Running average
    const newCount = count + 1
    const newAverage = (current * count + newRating) / newCount
    return {
      averageRating: Math.round(newAverage * 100) / 100,
      ratingCount: newCount,
    }
  }

  switch (type) {
    case "subject": {
      const item = await db.catalogSubject.findUniqueOrThrow({
        where: { id },
        select: { averageRating: true, ratingCount: true },
      })
      const data = updateRating(item.averageRating, item.ratingCount, rating)
      await db.catalogSubject.update({ where: { id }, data })
      return data
    }
    case "chapter": {
      const item = await db.catalogChapter.findUniqueOrThrow({
        where: { id },
        select: { averageRating: true, ratingCount: true },
      })
      const data = updateRating(item.averageRating, item.ratingCount, rating)
      await db.catalogChapter.update({ where: { id }, data })
      return data
    }
    case "lesson": {
      const item = await db.catalogLesson.findUniqueOrThrow({
        where: { id },
        select: { averageRating: true, ratingCount: true },
      })
      const data = updateRating(item.averageRating, item.ratingCount, rating)
      await db.catalogLesson.update({ where: { id }, data })
      return data
    }
  }
}

/**
 * Increment usage count for a catalog item.
 */
export async function recordContentUsage(
  type: "subject" | "chapter" | "lesson",
  id: string
) {
  switch (type) {
    case "subject":
      await db.catalogSubject.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
      break
    case "chapter":
      await db.catalogChapter.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
      break
    case "lesson":
      await db.catalogLesson.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
      break
  }
}

/**
 * Get engagement summary stats for the analytics dashboard.
 */
export async function getEngagementSummary() {
  const [
    totalSubjects,
    totalChapters,
    totalLessons,
    topSubjects,
    topLessons,
    lowestRated,
  ] = await Promise.all([
    db.catalogSubject.count({ where: { status: "PUBLISHED" } }),
    db.catalogChapter.count({ where: { status: "PUBLISHED" } }),
    db.catalogLesson.count({ where: { status: "PUBLISHED" } }),
    db.catalogSubject.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { usageCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        usageCount: true,
        averageRating: true,
        ratingCount: true,
        country: true,
        system: true,
      },
    }),
    db.catalogLesson.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { usageCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        usageCount: true,
        averageRating: true,
        videoCount: true,
        chapter: {
          select: {
            name: true,
            subject: { select: { name: true } },
          },
        },
      },
    }),
    db.catalogSubject.findMany({
      where: {
        status: "PUBLISHED",
        ratingCount: { gt: 0 },
      },
      orderBy: { averageRating: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        averageRating: true,
        ratingCount: true,
      },
    }),
  ])

  return {
    totalSubjects,
    totalChapters,
    totalLessons,
    topSubjects,
    topLessons,
    lowestRated,
  }
}
