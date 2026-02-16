"use server"

import { notFound } from "next/navigation"

import { db } from "@/lib/db"

/**
 * Fetches catalog subject structure for sidebar navigation.
 * Migration: Replaces get-course-sidebar-data.ts which queries StreamCourse.
 */
export async function getCatalogCourseSidebarData(
  slug: string,
  schoolId: string | null
) {
  const subject = await db.catalogSubject.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: {
      chapters: {
        where: { status: "PUBLISHED" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              name: true,
              sequenceOrder: true,
              durationMinutes: true,
              status: true,
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

  // Map to Stream-compatible shape
  return {
    course: {
      id: subject.id,
      title: subject.name,
      slug: subject.slug,
      description: subject.description,
      imageUrl: subject.imageKey
        ? subject.imageKey.startsWith("/")
          ? subject.imageKey
          : `/subjects/${subject.imageKey}.png`
        : null,
      isPublished: true,
      schoolId: null as string | null,
      chapters: subject.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.name,
        position: chapter.sequenceOrder,
        isPublished: true,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.name,
          position: lesson.sequenceOrder,
          isPublished: true,
          isFree: true,
          duration: lesson.durationMinutes,
          videoUrl: null as string | null,
        })),
      })),
      // Backward compatibility alias
      chapter: subject.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.name,
        position: chapter.sequenceOrder,
        isPublished: true,
        lessons: chapter.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.name,
          position: lesson.sequenceOrder,
          isPublished: true,
          isFree: true,
          duration: lesson.durationMinutes,
          videoUrl: null as string | null,
        })),
      })),
    },
  }
}
