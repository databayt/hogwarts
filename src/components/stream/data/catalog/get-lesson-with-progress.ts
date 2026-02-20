"use server"

import { auth } from "@/auth"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getVideoUrl } from "@/lib/cloudfront"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface CatalogLessonWithProgress {
  id: string
  title: string
  description: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
  duration: number | null
  videoDuration: number | null
  position: number
  isPublished: boolean
  isFree: boolean
  chapter: {
    id: string
    title: string
    position: number
    course: {
      id: string
      title: string
      slug: string
    }
  }
  attachments: Array<{
    id: string
    name: string
    url: string
  }>
  progress: {
    isCompleted: boolean
    watchedSeconds: number
    totalSeconds: number | null
  } | null
  color: string | null
  previousLesson: { id: string; title: string } | null
  nextLesson: { id: string; title: string; videoUrl?: string | null } | null
  siblingLessons: Array<{
    id: string
    title: string
    thumbnailUrl: string | null
    color: string | null
    duration: number | null
    lessonPosition: number
    chapterPosition: number
    watchedMinutes: number | null
  }>
}

/**
 * Fetches catalog lesson with progress data and video sources.
 * Migration: Replaces get-lesson-with-progress.ts which queries StreamLesson.
 */
export async function getCatalogLessonWithProgress(
  lessonId: string
): Promise<CatalogLessonWithProgress | null> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return null
  }

  const lesson = await db.catalogLesson.findFirst({
    where: {
      id: lessonId,
      status: "PUBLISHED",
    },
    include: {
      chapter: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
        },
      },
    },
  })

  if (!lesson) {
    return null
  }

  // Check enrollment (or admin/teacher access)
  const isAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
    session.user.role || ""
  )
  let isEnrolled = false

  if (!isAdmin) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        catalogSubjectId: lesson.chapter.subject.id,
        isActive: true,
      },
      select: { id: true },
    })
    isEnrolled = !!enrollment
  }

  // Check if subject is paid — return null for non-enrolled paid content
  if (!isEnrolled && !isAdmin) {
    const subject = await db.catalogSubject.findUnique({
      where: { id: lesson.chapter.subject.id },
      select: { price: true },
    })
    const isPaid = subject?.price && Number(subject.price) > 0

    // For both free and paid subjects, non-enrolled non-admin users can't access
    return null
  }

  // Get lesson progress
  const progress = await db.lessonProgress.findUnique({
    where: {
      userId_catalogLessonId: {
        userId: session.user.id,
        catalogLessonId: lessonId,
      },
    },
    select: {
      isCompleted: true,
      watchedSeconds: true,
      totalSeconds: true,
    },
  })

  // Get attachments
  const attachments = await db.lessonAttachment.findMany({
    where: { catalogLessonId: lessonId },
    select: {
      id: true,
      name: true,
      url: true,
    },
  })

  // Get the featured/approved video for this lesson
  const video = await db.lessonVideo.findFirst({
    where: {
      catalogLessonId: lessonId,
      approvalStatus: "APPROVED",
      ...(schoolId
        ? { OR: [{ schoolId }, { visibility: "PUBLIC" }] }
        : { visibility: "PUBLIC" }),
    },
    orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
    select: {
      videoUrl: true,
      thumbnailUrl: true,
      durationSeconds: true,
    },
  })

  // Get all lessons in the subject for navigation
  const allLessons = await db.catalogLesson.findMany({
    where: {
      chapter: {
        subjectId: lesson.chapter.subject.id,
      },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      name: true,
      sequenceOrder: true,
      thumbnailKey: true,
      imageKey: true,
      color: true,
      durationMinutes: true,
      chapter: {
        select: {
          sequenceOrder: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [{ chapter: { sequenceOrder: "asc" } }, { sequenceOrder: "asc" }],
  })

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Batch-fetch progress for sibling lessons
  const siblingIds = allLessons
    .filter((l) => l.id !== lessonId)
    .map((l) => l.id)
  const siblingProgress = await db.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      catalogLessonId: { in: siblingIds },
    },
    select: {
      catalogLessonId: true,
      watchedSeconds: true,
    },
  })
  const progressMap = new Map(
    siblingProgress.map((p) => [p.catalogLessonId, p.watchedSeconds])
  )

  // Transform video URL
  const transformedVideoUrl = video?.videoUrl
    ? getVideoUrl(video.videoUrl, { isFree: true })
    : null

  return {
    id: lesson.id,
    title: lesson.name,
    description: lesson.description,
    videoUrl: transformedVideoUrl,
    thumbnailUrl:
      getCatalogImageUrl(lesson.thumbnailKey, lesson.imageKey, "original") ??
      null,
    duration: lesson.durationMinutes,
    videoDuration: video?.durationSeconds ?? null,
    position: lesson.sequenceOrder,
    isPublished: true,
    isFree: true,
    chapter: {
      id: lesson.chapter.id,
      title: lesson.chapter.name,
      position: lesson.chapter.sequenceOrder,
      course: {
        id: lesson.chapter.subject.id,
        title: lesson.chapter.subject.name,
        slug: lesson.chapter.subject.slug,
      },
    },
    color:
      lesson.color ??
      lesson.chapter.color ??
      lesson.chapter.subject.color ??
      null,
    attachments,
    progress: progress
      ? {
          isCompleted: progress.isCompleted,
          watchedSeconds: progress.watchedSeconds,
          totalSeconds: progress.totalSeconds,
        }
      : null,
    previousLesson: previousLesson
      ? { id: previousLesson.id, title: previousLesson.name }
      : null,
    nextLesson: nextLesson
      ? { id: nextLesson.id, title: nextLesson.name }
      : null,
    siblingLessons: allLessons
      .filter((l) => l.id !== lessonId)
      .map((l) => ({
        id: l.id,
        title: l.name,
        thumbnailUrl:
          getCatalogImageUrl(l.thumbnailKey, l.imageKey, "original") ?? null,
        color: l.color ?? l.chapter.color ?? null,
        duration: l.durationMinutes,
        lessonPosition: l.sequenceOrder,
        chapterPosition: l.chapter.sequenceOrder,
        watchedMinutes: progressMap.has(l.id)
          ? Math.floor(progressMap.get(l.id)! / 60)
          : null,
      })),
  }
}
