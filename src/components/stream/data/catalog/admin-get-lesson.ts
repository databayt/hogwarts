"use server"

import { notFound } from "next/navigation"

import { db } from "@/lib/db"

/**
 * Fetches a catalog lesson by ID for admin viewing/editing.
 * Includes videos, attachments, and school-specific content.
 */
export async function adminGetCatalogLesson(
  lessonId: string,
  schoolId: string | null
) {
  const lesson = await db.catalogLesson.findFirst({
    where: {
      id: lessonId,
    },
    include: {
      chapter: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
            },
          },
        },
      },
    },
  })

  if (!lesson) {
    notFound()
  }

  // Get all videos for this lesson (admin sees all, not just approved)
  const videos = await db.lessonVideo.findMany({
    where: {
      catalogLessonId: lessonId,
      ...(schoolId ? { OR: [{ schoolId }, { visibility: "PUBLIC" }] } : {}),
    },
    include: {
      user: {
        select: { username: true, email: true },
      },
    },
    orderBy: [
      { isFeatured: "desc" },
      { approvalStatus: "asc" },
      { viewCount: "desc" },
    ],
  })

  // Get attachments
  const attachments = await db.lessonAttachment.findMany({
    where: { catalogLessonId: lessonId },
    select: {
      id: true,
      name: true,
      url: true,
      fileType: true,
      fileSize: true,
    },
  })

  // Return Stream-compatible shape
  return {
    id: lesson.id,
    title: lesson.name,
    description: lesson.description,
    position: lesson.sequenceOrder,
    isPublished: lesson.status === "PUBLISHED",
    isFree: true,
    duration: lesson.durationMinutes,
    videoUrl:
      videos.find((v) => v.isFeatured)?.videoUrl ?? videos[0]?.videoUrl ?? null,
    chapter: {
      id: lesson.chapter.id,
      title: lesson.chapter.name,
      course: {
        id: lesson.chapter.subject.id,
        title: lesson.chapter.subject.name,
        slug: lesson.chapter.subject.slug,
        schoolId: null as string | null,
      },
    },
    attachments,
    _catalog: {
      status: lesson.status,
      objectives: lesson.objectives,
      levels: lesson.levels,
      gradeRange: lesson.gradeRange,
      videos: videos.map((v) => ({
        id: v.id,
        title: v.title,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
        provider: v.provider,
        visibility: v.visibility,
        approvalStatus: v.approvalStatus,
        isFeatured: v.isFeatured,
        viewCount: v.viewCount,
        averageRating: v.averageRating,
        uploader: v.user
          ? { username: v.user.username, email: v.user.email }
          : null,
      })),
    },
  }
}
