import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamDashboardContent } from "@/components/stream/dashboard/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.dashboard?.title || "My Learning Dashboard",
    description:
      dictionary.stream?.dashboard?.description ||
      "Track your learning progress",
  }
}

async function getUserDashboardData(userId: string, schoolId: string) {
  // Fetch enrolled courses with progress
  const enrollments = await db.streamEnrollment.findMany({
    where: {
      userId,
      schoolId,
      isActive: true,
    },
    include: {
      course: {
        include: {
          chapters: {
            include: {
              lessons: true,
            },
            orderBy: { position: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get lesson progress for enrolled courses
  const enrolledCourseIds = enrollments.map((e) => e.courseId)
  const lessonProgress = await db.streamLessonProgress.findMany({
    where: {
      userId,
      lesson: {
        chapter: {
          courseId: { in: enrolledCourseIds },
        },
      },
      isCompleted: true,
    },
    select: {
      lessonId: true,
      lesson: {
        select: {
          chapter: {
            select: {
              courseId: true,
            },
          },
        },
      },
    },
  })

  // Calculate progress for each course
  const progressByCourse = new Map<string, number>()
  for (const progress of lessonProgress) {
    const courseId = progress.lesson.chapter.courseId
    progressByCourse.set(courseId, (progressByCourse.get(courseId) || 0) + 1)
  }

  const enrolledCourses = enrollments.map((enrollment) => {
    const totalLessons = enrollment.course.chapters.reduce(
      (sum, chapter) => sum + chapter.lessons.length,
      0
    )
    const completedLessons = progressByCourse.get(enrollment.courseId) || 0
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return {
      ...enrollment.course,
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.createdAt,
      progressPercent,
      completedLessons,
      totalLessons,
    }
  })

  // Fetch available courses (published, not enrolled)
  const availableCourses = await db.streamCourse.findMany({
    where: {
      schoolId,
      isPublished: true,
      id: { notIn: enrolledCourseIds },
    },
    include: {
      chapters: {
        include: {
          lessons: true,
        },
      },
      _count: {
        select: {
          enrollments: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  })

  return {
    enrolledCourses,
    availableCourses,
  }
}

export default async function StreamDashboardPage({ params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`)
  }

  // Fetch dashboard data
  const dashboardData = schoolId
    ? await getUserDashboardData(session.user.id, schoolId)
    : { enrolledCourses: [], availableCourses: [] }

  return (
    <StreamDashboardContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
      enrolledCourses={dashboardData.enrolledCourses}
      availableCourses={dashboardData.availableCourses}
    />
  )
}
