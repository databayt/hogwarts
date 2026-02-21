"use server"

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"

/**
 * Fetches individual catalog subject with chapters and lessons.
 * Returns data shaped like IndividualCourseType for backward compatibility.
 *
 * Migration: Replaces get-course.ts which queries StreamCourse.
 */
export async function getCatalogCourse(
  slug: string,
  schoolId: string | null,
  lang: string = "en"
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
              description: true,
              sequenceOrder: true,
              durationMinutes: true,
              status: true,
              imageKey: true,
              thumbnailKey: true,
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

  // If school context, check for content overrides
  let hiddenChapterIds = new Set<string>()
  let hiddenLessonIds = new Set<string>()

  if (schoolId) {
    const overrides = await db.schoolContentOverride.findMany({
      where: {
        schoolId,
        isHidden: true,
        OR: [
          { catalogChapterId: { in: subject.chapters.map((c) => c.id) } },
          {
            catalogLessonId: {
              in: subject.chapters.flatMap((c) => c.lessons.map((l) => l.id)),
            },
          },
        ],
      },
      select: {
        catalogChapterId: true,
        catalogLessonId: true,
      },
    })

    for (const o of overrides) {
      if (o.catalogChapterId) hiddenChapterIds.add(o.catalogChapterId)
      if (o.catalogLessonId) hiddenLessonIds.add(o.catalogLessonId)
    }
  }

  // Parallelize enrollment count, quiz count, and school name
  const [enrollmentCount, quizCount, schoolName] = await Promise.all([
    db.enrollment.count({
      where: { catalogSubjectId: subject.id, isActive: true },
    }),
    db.catalogExam.count({
      where: { subjectId: subject.id, status: "PUBLISHED" },
    }),
    schoolId
      ? db.school
          .findUnique({
            where: { id: schoolId },
            select: { name: true, preferredLanguage: true },
          })
          .then(async (s) => {
            if (!s?.name) return null
            const storedLang = (s.preferredLanguage || "ar") as "ar" | "en"
            const displayLang = (lang === "ar" ? "ar" : "en") as "ar" | "en"
            if (storedLang === displayLang) return s.name
            return getDisplayText(s.name, storedLang, displayLang, schoolId)
          })
      : Promise.resolve(null),
  ])

  // Map to Stream-compatible shape
  return {
    id: subject.id,
    title: subject.name,
    slug: subject.slug,
    description: subject.description,
    objectives: subject.objectives,
    prerequisites: subject.prerequisites,
    targetAudience: subject.targetAudience,
    imageUrl: getCatalogImageUrl(
      subject.bannerUrl ?? subject.thumbnailKey,
      subject.imageKey,
      "original"
    ),
    price: subject.price ? Number(subject.price) : null,
    currency: subject.currency || "USD",
    isPublished: true,
    lang: subject.lang,
    level: null,
    status: subject.status,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
    category: {
      name: subject.department,
    },
    chapters: subject.chapters
      .filter((c) => !hiddenChapterIds.has(c.id))
      .map((chapter) => ({
        id: chapter.id,
        title: chapter.name,
        description: chapter.description,
        position: chapter.sequenceOrder,
        isPublished: true,
        isFree: true,
        imageUrl: getCatalogImageUrl(
          chapter.thumbnailKey,
          chapter.imageKey,
          "sm"
        ),
        color: chapter.color,
        lessons: chapter.lessons
          .filter((l) => !hiddenLessonIds.has(l.id))
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.name,
            description: lesson.description,
            position: lesson.sequenceOrder,
            duration: lesson.durationMinutes,
            isFree: true,
            imageUrl: getCatalogImageUrl(
              lesson.thumbnailKey,
              lesson.imageKey,
              "md"
            ),
          })),
      })),
    _count: {
      enrollments: enrollmentCount,
    },
    _catalog: {
      color: subject.color,
      bannerUrl: subject.bannerUrl,
      imageKey: subject.imageKey,
      thumbnailKey: subject.thumbnailKey,
      totalChapters: subject.totalChapters,
      totalLessons: subject.totalLessons,
      averageRating: subject.averageRating,
      quizCount,
      schoolName,
    },
  }
}

export type CatalogIndividualCourseType = Awaited<
  ReturnType<typeof getCatalogCourse>
>
