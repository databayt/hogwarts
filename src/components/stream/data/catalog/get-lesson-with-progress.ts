"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getVideoUrl } from "@/lib/cloudfront"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface AvailableVideo {
  id: string
  videoUrl: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  isFeatured: boolean
  source: "own-school" | "featured" | "other-school"
  instructor: {
    id: string
    name: string | null
    image: string | null
  }
  school: {
    id: string | null
    name: string | null
  }
}

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
      levels: string[]
      grades: number[]
      description: string | null
      objectives: string[]
      prerequisites: string | null
      targetAudience: string | null
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
  year: number | null
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
  availableVideos: AvailableVideo[]
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
              levels: true,
              grades: true,
              description: true,
              objectives: true,
              prerequisites: true,
              targetAudience: true,
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

  // Block non-enrolled users only for paid content; free content is accessible to all
  if (!isEnrolled && !isAdmin) {
    const subject = await db.catalogSubject.findUnique({
      where: { id: lesson.chapter.subject.id },
      select: { price: true },
    })
    const isPaid = subject?.price && Number(subject.price) > 0

    if (isPaid) {
      return null
    }
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

  // Get ALL approved videos for this lesson (multi-instructor support)
  const videos = await db.lessonVideo.findMany({
    where: {
      catalogLessonId: lessonId,
      approvalStatus: "APPROVED",
      ...(schoolId
        ? { OR: [{ schoolId }, { visibility: "PUBLIC" }] }
        : { visibility: "PUBLIC" }),
    },
    orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
    select: {
      id: true,
      videoUrl: true,
      thumbnailUrl: true,
      durationSeconds: true,
      isFeatured: true,
      schoolId: true,
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
      school: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Use the first (highest-ranked) video as default
  const video = videos[0] ?? null

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

  // Map available videos with source labels
  const availableVideos: AvailableVideo[] = videos.map((v) => {
    let source: AvailableVideo["source"] = "other-school"
    if (v.isFeatured) source = "featured"
    else if (schoolId && v.schoolId === schoolId) source = "own-school"

    return {
      id: v.id,
      videoUrl: getVideoUrl(v.videoUrl, { isFree: true }),
      thumbnailUrl: v.thumbnailUrl,
      durationSeconds: v.durationSeconds,
      isFeatured: v.isFeatured,
      source,
      instructor: {
        id: v.user.id,
        name: v.schoolId === null ? "Hogwarts" : v.user.username,
        image: v.schoolId === null ? "/logo.png" : v.user.image,
      },
      school: {
        id: v.school?.id ?? null,
        name: v.school?.name ?? null,
      },
    }
  })

  return {
    id: lesson.id,
    title: lesson.name,
    description: lesson.description,
    videoUrl: transformedVideoUrl,
    thumbnailUrl:
      getCatalogImageUrl(lesson.thumbnailKey, lesson.imageKey, "original") ??
      null,
    duration:
      lesson.durationMinutes ??
      (lesson.videoCount > 0 ? lesson.videoCount * 5 : null),
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
        levels: lesson.chapter.subject.levels as string[],
        grades: lesson.chapter.subject.grades as number[],
        description: lesson.chapter.subject.description,
        objectives: lesson.chapter.subject.objectives,
        prerequisites: lesson.chapter.subject.prerequisites,
        targetAudience: lesson.chapter.subject.targetAudience,
      },
    },
    year: lesson.createdAt ? new Date(lesson.createdAt).getFullYear() : null,
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
    availableVideos,
  }
}
