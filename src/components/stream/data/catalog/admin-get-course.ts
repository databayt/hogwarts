"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"

/**
 * Fetches a catalog subject by ID for admin viewing/editing.
 * Catalog subjects are global (no schoolId), but returns school-specific
 * content overrides when schoolId is provided.
 */
export async function adminGetCatalogCourse(
  subjectId: string,
  schoolId: string | null
) {
  // Admin-only accessor (exposes unpublished chapters/lessons + hidden-content
  // override flags), so it must never be reachable by students/teachers or
  // anonymous callers. notFound() (404) avoids leaking whether the subject exists.
  const session = await auth()
  const role = session?.user?.role
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    notFound()
  }

  const subject = await db.subject.findFirst({
    where: {
      id: subjectId,
      status: { not: "ARCHIVED" },
    },
    include: {
      chapters: {
        include: {
          lessons: {
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              sequenceOrder: true,
              durationMinutes: true,
              status: true,
              description: true,
            },
          },
        },
        orderBy: { sequenceOrder: "asc" },
      },
    },
  })

  if (!subject) {
    notFound()
  }

  // Get school-specific overrides if schoolId provided
  const overrides = schoolId
    ? await db.contentOverride.findMany({
        where: { schoolId, isHidden: true },
        select: {
          catalogChapterId: true,
          catalogLessonId: true,
        },
      })
    : []

  const hiddenChapterIds = new Set(
    overrides.filter((o) => o.catalogChapterId).map((o) => o.catalogChapterId!)
  )
  const hiddenLessonIds = new Set(
    overrides.filter((o) => o.catalogLessonId).map((o) => o.catalogLessonId!)
  )

  // Return Stream-compatible shape with catalog extras
  return {
    id: subject.id,
    title: subject.name,
    slug: subject.slug,
    description: subject.description,
    imageUrl: getCatalogImageUrl(subject.thumbnail) ?? null,
    isPublished: subject.status === "PUBLISHED",
    schoolId: null as string | null,
    category: { name: subject.department },
    chapters: subject.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.name,
      position: chapter.sequenceOrder,
      isPublished: chapter.status === "PUBLISHED",
      _isHidden: hiddenChapterIds.has(chapter.id),
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.name,
        description: lesson.description,
        position: lesson.sequenceOrder,
        isPublished: lesson.status === "PUBLISHED",
        isFree: true,
        duration: lesson.durationMinutes,
        videoUrl: null as string | null,
        _isHidden: hiddenLessonIds.has(lesson.id),
      })),
    })),
    _catalog: {
      status: subject.status,
      department: subject.department,
      levels: subject.levels,
      color: subject.color,
      thumbnail: subject.thumbnail,
      totalChapters: subject.totalChapters,
      totalLessons: subject.totalLessons,
    },
  }
}
