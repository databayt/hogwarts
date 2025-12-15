"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

type ApiResponse = {
  status: "success" | "error"
  message: string
}

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return {
      status: "error",
      message: "Authentication required",
    }
  }

  try {
    // Verify user has access to this lesson through enrollment
    const lesson = await db.streamLesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        chapter: {
          select: {
            course: {
              select: {
                id: true,
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
      },
    })

    if (!lesson) {
      return {
        status: "error",
        message: "Lesson not found",
      }
    }

    // Check if user is enrolled (or is admin/teacher)
    const isEnrolled = lesson.chapter.course.enrollments.length > 0
    const isAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
      session.user.role || ""
    )

    if (!isEnrolled && !isAdmin) {
      return {
        status: "error",
        message: "You must be enrolled in this course to track progress",
      }
    }

    // Upsert lesson progress
    await db.streamLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
      update: {
        isCompleted: true,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        isCompleted: true,
      },
    })

    // Check if all lessons in the course are completed
    const courseId = lesson.chapter.course.id
    const schoolId = lesson.chapter.course.schoolId

    const allLessons = await db.streamLesson.findMany({
      where: {
        chapter: {
          courseId: courseId,
        },
      },
      select: { id: true },
    })

    const completedLessons = await db.streamLessonProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { in: allLessons.map((l) => l.id) },
        isCompleted: true,
      },
    })

    // If all lessons completed, update enrollment status and potentially issue certificate
    if (completedLessons === allLessons.length && allLessons.length > 0) {
      // Update enrollment to COMPLETED
      await db.streamEnrollment.updateMany({
        where: {
          userId: session.user.id,
          courseId: courseId,
          schoolId: schoolId,
          isActive: true,
        },
        data: {
          status: "COMPLETED",
        },
      })

      // Check if certificate already exists
      const existingCert = await db.streamCertificate.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId,
          schoolId: schoolId,
        },
      })

      if (!existingCert) {
        // Get course title for certificate
        const course = await db.streamCourse.findUnique({
          where: { id: courseId },
          select: { title: true },
        })

        // Generate certificate
        const certNumber = `CERT-${schoolId.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

        await db.streamCertificate.create({
          data: {
            userId: session.user.id,
            courseId: courseId,
            schoolId: schoolId,
            courseTitle: course?.title || "Course",
            certificateNumber: certNumber,
            completedAt: new Date(),
          },
        })
      }
    }

    revalidatePath(`/[lang]/s/[subdomain]/stream/dashboard/${slug}`)

    return {
      status: "success",
      message: "Progress updated",
    }
  } catch (error) {
    console.error("Failed to mark lesson complete:", error)
    return {
      status: "error",
      message: "Failed to update progress",
    }
  }
}

export async function markLessonIncomplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return {
      status: "error",
      message: "Authentication required",
    }
  }

  try {
    await db.streamLessonProgress.updateMany({
      where: {
        userId: session.user.id,
        lessonId: lessonId,
      },
      data: {
        isCompleted: false,
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/[lang]/s/[subdomain]/stream/dashboard/${slug}`)

    return {
      status: "success",
      message: "Progress updated",
    }
  } catch (error) {
    console.error("Failed to mark lesson incomplete:", error)
    return {
      status: "error",
      message: "Failed to update progress",
    }
  }
}

export async function getLessonProgress(lessonId: string): Promise<{
  isCompleted: boolean
}> {
  const session = await auth()

  if (!session?.user) {
    return { isCompleted: false }
  }

  const progress = await db.streamLessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: session.user.id,
        lessonId: lessonId,
      },
    },
    select: { isCompleted: true },
  })

  return { isCompleted: progress?.isCompleted ?? false }
}
