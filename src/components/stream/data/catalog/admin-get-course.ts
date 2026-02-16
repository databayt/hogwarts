"use server"

import { notFound } from "next/navigation"

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
  const subject = await db.catalogSubject.findFirst({
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
    ? await db.schoolContentOverride.findMany({
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
    imageUrl: subject.imageKey
      ? subject.imageKey.startsWith("/")
        ? subject.imageKey
        : `/subjects/${subject.imageKey}.png`
      : null,
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
      imageKey: subject.imageKey,
      totalChapters: subject.totalChapters,
      totalLessons: subject.totalLessons,
    },
  }
}
