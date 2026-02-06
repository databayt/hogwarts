"use server"

import { auth } from "@/auth"

import { getVideoUrl } from "@/lib/cloudfront"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export interface LessonWithProgress {
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
  // Navigation helpers
  previousLesson: { id: string; title: string } | null
  nextLesson: { id: string; title: string; videoUrl?: string | null } | null
}

export async function getLessonWithProgress(
  lessonId: string
): Promise<LessonWithProgress | null> {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!session?.user) {
    return null
  }

  const lesson = await db.streamLesson.findFirst({
    where: {
      id: lessonId,
      chapter: {
        course: {
          schoolId: schoolId || undefined,
        },
      },
    },
    include: {
      chapter: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              schoolId: true,
              enrollments: {
                where: {
                  userId: session.user.id,
                  isActive: true,
                },
                select: { id: true },
              },
            },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
      progress: {
        where: {
          userId: session.user.id,
        },
        select: {
          isCompleted: true,
          watchedSeconds: true,
          totalSeconds: true,
        },
      },
    },
  })

  if (!lesson) {
    return null
  }

  // Check access - must be enrolled or be admin/teacher
  const isEnrolled = lesson.chapter.course.enrollments.length > 0
  const isAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
    session.user.role || ""
  )

  if (!isEnrolled && !isAdmin && !lesson.isFree) {
    return null
  }

  // Get all lessons in the course for navigation
  const allLessons = await db.streamLesson.findMany({
    where: {
      chapter: {
        courseId: lesson.chapter.course.id,
      },
    },
    select: {
      id: true,
      title: true,
      videoUrl: true,
      isFree: true,
      position: true,
      chapter: {
        select: {
          position: true,
        },
      },
    },
    orderBy: [{ chapter: { position: "asc" } }, { position: "asc" }],
  })

  // Find current lesson index
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Transform video URL: signed for paid, unsigned for free, passthrough for YouTube/Vimeo
  const transformedVideoUrl = lesson.videoUrl
    ? getVideoUrl(lesson.videoUrl, { isFree: lesson.isFree })
    : null

  // Get next lesson video URL for prefetching (unsigned is fine for prefetch hints)
  const nextLessonVideoUrl = nextLesson?.videoUrl
    ? getVideoUrl(nextLesson.videoUrl, { isFree: nextLesson.isFree })
    : null

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    videoUrl: transformedVideoUrl,
    thumbnailUrl: lesson.thumbnailUrl ?? null,
    duration: lesson.duration,
    videoDuration: lesson.videoDuration ?? null,
    position: lesson.position,
    isPublished: lesson.isPublished,
    isFree: lesson.isFree,
    chapter: {
      id: lesson.chapter.id,
      title: lesson.chapter.title,
      position: lesson.chapter.position,
      course: {
        id: lesson.chapter.course.id,
        title: lesson.chapter.course.title,
        slug: lesson.chapter.course.slug,
      },
    },
    attachments: lesson.attachments,
    progress: lesson.progress[0]
      ? {
          isCompleted: lesson.progress[0].isCompleted,
          watchedSeconds: lesson.progress[0].watchedSeconds,
          totalSeconds: lesson.progress[0].totalSeconds,
        }
      : null,
    previousLesson: previousLesson
      ? { id: previousLesson.id, title: previousLesson.title }
      : null,
    nextLesson: nextLesson
      ? {
          id: nextLesson.id,
          title: nextLesson.title,
          videoUrl: nextLessonVideoUrl,
        }
      : null,
  }
}
