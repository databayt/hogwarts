"use server"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"

/**
 * Fetches catalog-based dashboard data for a user.
 * Returns enrolled courses with progress and available courses.
 *
 * Migration: Replaces getUserDashboardData which queries StreamEnrollment/StreamCourse.
 */
export async function getCatalogDashboardData(
  userId: string,
  schoolId: string
) {
  // Fetch active enrollments in catalog subjects
  const enrollments = await db.enrollment.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ schoolId }, { schoolId: null }],
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageKey: true,
          thumbnailKey: true,
          color: true,
          totalChapters: true,
          totalLessons: true,
          department: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get lesson progress for enrolled subjects
  const enrolledSubjectIds = enrollments.map((e) => e.catalogSubjectId)

  const lessonProgress =
    enrolledSubjectIds.length > 0
      ? await db.lessonProgress.findMany({
          where: {
            userId,
            isCompleted: true,
            lesson: {
              chapter: {
                subjectId: { in: enrolledSubjectIds },
              },
            },
          },
          select: {
            catalogLessonId: true,
            lesson: {
              select: {
                chapter: {
                  select: {
                    subjectId: true,
                  },
                },
              },
            },
          },
        })
      : []

  // Calculate progress per subject
  const progressBySubject = new Map<string, number>()
  for (const progress of lessonProgress) {
    const subjectId = progress.lesson?.chapter?.subjectId
    if (subjectId) {
      progressBySubject.set(
        subjectId,
        (progressBySubject.get(subjectId) || 0) + 1
      )
    }
  }

  const enrolledCourses = enrollments.map((enrollment) => {
    const subject = enrollment.subject
    const completedLessons =
      progressBySubject.get(enrollment.catalogSubjectId) || 0
    const totalLessons = subject.totalLessons || 1
    const progressPercent = Math.round((completedLessons / totalLessons) * 100)

    return {
      id: subject.id,
      title: subject.name,
      slug: subject.slug,
      description: subject.description,
      imageUrl: getCatalogImageUrl(
        subject.thumbnailKey,
        subject.imageKey,
        "original"
      ),
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.createdAt,
      progressPercent,
      completedLessons,
      totalLessons,
      chapters: [] as Array<{ lessons: Array<{ id: string }> }>,
    }
  })

  // Fetch available catalog subjects not yet enrolled
  const availableSubjects = await db.catalogSubject.findMany({
    where: {
      status: "PUBLISHED",
      ...(enrolledSubjectIds.length > 0
        ? { id: { notIn: enrolledSubjectIds } }
        : {}),
    },
    orderBy: { sortOrder: "asc" },
    take: 6,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageKey: true,
      thumbnailKey: true,
      color: true,
      totalChapters: true,
      totalLessons: true,
      department: true,
      usageCount: true,
    },
  })

  const availableCourses = availableSubjects.map((subject) => ({
    id: subject.id,
    title: subject.name,
    slug: subject.slug,
    description: subject.description,
    imageUrl: getCatalogImageUrl(
      subject.thumbnailKey,
      subject.imageKey,
      "original"
    ),
    price: null as number | null,
    chapters: Array.from({ length: subject.totalChapters }, () => ({
      lessons: Array.from(
        {
          length: Math.ceil(
            subject.totalLessons / Math.max(subject.totalChapters, 1)
          ),
        },
        () => ({ id: "" })
      ),
    })),
    _count: {
      enrollments: subject.usageCount,
    },
  }))

  return {
    enrolledCourses,
    availableCourses,
  }
}
