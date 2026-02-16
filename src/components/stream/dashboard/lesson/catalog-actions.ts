"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"
import { i18n } from "@/components/internationalization/config"
import { sendCompletionEmail } from "@/components/stream/shared/email-service"

type ApiResponse = {
  status: "success" | "error"
  message: string
}

/**
 * Mark a catalog lesson as complete.
 * Migration: Uses LessonProgress + SubjectCertificate instead of Stream models.
 */
export async function markCatalogLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  try {
    // Verify lesson exists and get subject context
    const lesson = await db.catalogLesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        chapter: {
          select: {
            subjectId: true,
            subject: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return { status: "error", message: "Lesson not found" }
    }

    const subjectId = lesson.chapter.subjectId

    // Check enrollment (or admin/teacher)
    const isAdmin = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
      session.user.role || ""
    )

    if (!isAdmin) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId: session.user.id,
          catalogSubjectId: subjectId,
          isActive: true,
        },
        select: { id: true },
      })

      if (!enrollment) {
        return {
          status: "error",
          message: "You must be enrolled to track progress",
        }
      }
    }

    // Get enrollment for linking
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        catalogSubjectId: subjectId,
        isActive: true,
      },
      select: { id: true, schoolId: true },
    })

    // Upsert lesson progress
    await db.lessonProgress.upsert({
      where: {
        userId_catalogLessonId: {
          userId: session.user.id,
          catalogLessonId: lessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        catalogLessonId: lessonId,
        enrollmentId: enrollment?.id ?? "",
        isCompleted: true,
        completedAt: new Date(),
        lastWatchedAt: new Date(),
      },
    })

    // Check if all lessons in the subject are completed
    const allLessons = await db.catalogLesson.findMany({
      where: {
        chapter: { subjectId },
        status: "PUBLISHED",
      },
      select: { id: true },
    })

    const completedLessons = await db.lessonProgress.count({
      where: {
        userId: session.user.id,
        catalogLessonId: { in: allLessons.map((l) => l.id) },
        isCompleted: true,
      },
    })

    // If all lessons completed, issue certificate
    if (
      completedLessons === allLessons.length &&
      allLessons.length > 0 &&
      enrollment
    ) {
      // Update enrollment to COMPLETED
      await db.enrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED" },
      })

      // Check if certificate already exists
      const existingCert = await db.subjectCertificate.findFirst({
        where: {
          userId: session.user.id,
          catalogSubjectId: subjectId,
        },
      })

      if (!existingCert) {
        const subject = lesson.chapter.subject
        const schoolId = enrollment.schoolId
        const certNumber = `CERT-${(schoolId || "PLAT").slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

        await db.subjectCertificate.create({
          data: {
            userId: session.user.id,
            catalogSubjectId: subjectId,
            enrollmentId: enrollment.id,
            schoolId: schoolId ?? null,
            subjectTitle: subject.name,
            certificateNumber: certNumber,
            completedAt: new Date(),
          },
        })

        // Send completion email
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          select: { email: true, username: true },
        })

        const school = schoolId
          ? await db.school.findUnique({
              where: { id: schoolId },
              select: { name: true },
            })
          : null

        if (user?.email) {
          const locale = i18n.defaultLocale
          sendCompletionEmail({
            to: user.email,
            studentName: user.username || "Student",
            courseTitle: subject.name,
            certificateUrl: `${env.NEXT_PUBLIC_APP_URL}/${locale}/stream/dashboard/${subject.slug}/certificate`,
            schoolName: school?.name || "Platform",
            completionDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          }).catch((err) =>
            console.error("Failed to send completion email:", err)
          )
        }
      }
    }

    revalidatePath(`/[lang]/s/[subdomain]/stream/dashboard/${slug}`)
    return { status: "success", message: "Progress updated" }
  } catch (error) {
    console.error("Failed to mark catalog lesson complete:", error)
    return { status: "error", message: "Failed to update progress" }
  }
}

/**
 * Mark a catalog lesson as incomplete.
 */
export async function markCatalogLessonIncomplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  try {
    await db.lessonProgress.updateMany({
      where: {
        userId: session.user.id,
        catalogLessonId: lessonId,
      },
      data: {
        isCompleted: false,
        completedAt: null,
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/[lang]/s/[subdomain]/stream/dashboard/${slug}`)
    return { status: "success", message: "Progress updated" }
  } catch (error) {
    console.error("Failed to mark catalog lesson incomplete:", error)
    return { status: "error", message: "Failed to update progress" }
  }
}

/**
 * Get catalog lesson progress.
 */
export async function getCatalogLessonProgress(lessonId: string): Promise<{
  isCompleted: boolean
  watchedSeconds: number
  totalSeconds: number | null
}> {
  const session = await auth()

  if (!session?.user) {
    return { isCompleted: false, watchedSeconds: 0, totalSeconds: null }
  }

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

  return {
    isCompleted: progress?.isCompleted ?? false,
    watchedSeconds: progress?.watchedSeconds ?? 0,
    totalSeconds: progress?.totalSeconds ?? null,
  }
}

/**
 * Update video playback progress for resume functionality.
 */
export async function updateCatalogLessonProgress(data: {
  lessonId: string
  watchedSeconds: number
  totalSeconds: number
}): Promise<ApiResponse> {
  const session = await auth()

  if (!session?.user) {
    return { status: "error", message: "Authentication required" }
  }

  try {
    // Get enrollment for linking
    const lesson = await db.catalogLesson.findUnique({
      where: { id: data.lessonId },
      select: { chapter: { select: { subjectId: true } } },
    })

    const enrollment = lesson
      ? await db.enrollment.findFirst({
          where: {
            userId: session.user.id,
            catalogSubjectId: lesson.chapter.subjectId,
            isActive: true,
          },
          select: { id: true },
        })
      : null

    await db.lessonProgress.upsert({
      where: {
        userId_catalogLessonId: {
          userId: session.user.id,
          catalogLessonId: data.lessonId,
        },
      },
      update: {
        watchedSeconds: data.watchedSeconds,
        totalSeconds: data.totalSeconds,
        lastWatchedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        catalogLessonId: data.lessonId,
        enrollmentId: enrollment?.id ?? "",
        watchedSeconds: data.watchedSeconds,
        totalSeconds: data.totalSeconds,
        lastWatchedAt: new Date(),
        watchCount: 1,
        isCompleted: false,
      },
    })

    return { status: "success", message: "Progress saved" }
  } catch (error) {
    console.error("Failed to update catalog lesson progress:", error)
    return { status: "error", message: "Failed to save progress" }
  }
}
