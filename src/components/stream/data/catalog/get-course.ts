// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cache } from "react"
import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { SupportedLanguage } from "@/components/translation/types"

/**
 * Fetches individual catalog subject with chapters and lessons.
 * Returns data shaped like IndividualCourseType for backward compatibility.
 *
 * Migration: Replaces get-course.ts which queries StreamCourse.
 */
export const getCatalogCourse = cache(async function getCatalogCourse(
  slug: string,
  schoolId: string | null,
  lang: string = "en"
) {
  const subject = await db.subject.findFirst({
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
              thumbnail: true,
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
    try {
      const overrides = await db.contentOverride.findMany({
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
    } catch {
      // Content overrides failed — show all content (no filtering)
    }
  }

  // Collect all lesson IDs for creator attribution
  const allLessonIds = subject.chapters.flatMap((c) =>
    c.lessons.map((l) => l.id)
  )

  // Parallelize enrollment count, quiz count, and course creator
  const [enrollmentCount, quizCount, schoolName] = await Promise.all([
    db.enrollment
      .count({
        where: { catalogSubjectId: subject.id, isActive: true },
      })
      .catch(() => 0),
    db.exam
      .count({
        where: { subjectId: subject.id, status: "PUBLISHED" },
      })
      .catch(() => 0),
    // Dynamic creator attribution — find who contributed the most videos
    (allLessonIds.length > 0
      ? db.video
          .groupBy({
            by: ["schoolId"],
            where: {
              catalogLessonId: { in: allLessonIds },
              approvalStatus: "APPROVED",
            },
            _count: true,
            orderBy: { _count: { schoolId: "desc" } },
            take: 1,
          })
          .then(async (groups) => {
            const topCreatorSchoolId = groups[0]?.schoolId ?? null
            if (!topCreatorSchoolId) return "Hogwarts"
            const school = await db.school.findUnique({
              where: { id: topCreatorSchoolId },
              select: { name: true, preferredLanguage: true },
            })
            if (!school?.name) return "Hogwarts"
            const storedLang = (school.preferredLanguage || "ar") as "ar" | "en"
            const displayLang = (lang === "ar" ? "ar" : "en") as "ar" | "en"
            if (storedLang === displayLang) return school.name
            return getDisplayText(
              school.name,
              storedLang,
              displayLang,
              topCreatorSchoolId
            )
          })
      : Promise.resolve("Hogwarts")
    ).catch(() => "Hogwarts"),
  ])

  // Translate all content names for the current locale
  const srcLang = (subject.lang || "ar") as SupportedLanguage
  const displayLang = (lang === "ar" ? "ar" : "en") as SupportedLanguage
  const cacheSchoolId = schoolId || subject.id // fallback for cache key
  const t = (text: string | null | undefined) =>
    getDisplayText(text ?? "", srcLang, displayLang, cacheSchoolId)

  const [title, description, departmentName] = await Promise.all([
    t(subject.name),
    t(subject.description),
    t(subject.department),
  ])

  // Translate chapters and lessons in parallel
  const translatedChapters = await Promise.all(
    subject.chapters
      .filter((c) => !hiddenChapterIds.has(c.id))
      .map(async (chapter) => {
        const [chTitle, translatedLessons] = await Promise.all([
          t(chapter.name),
          Promise.all(
            chapter.lessons
              .filter((l) => !hiddenLessonIds.has(l.id))
              .map(async (lesson) => ({
                id: lesson.id,
                title: await t(lesson.name),
                description: lesson.description,
                position: lesson.sequenceOrder,
                duration: lesson.durationMinutes,
                isFree: true,
                imageUrl: getCatalogImageUrl(lesson.thumbnail, "md"),
              }))
          ),
        ])
        return {
          id: chapter.id,
          title: chTitle,
          description: chapter.description,
          position: chapter.sequenceOrder,
          isPublished: true,
          isFree: true,
          imageUrl: getCatalogImageUrl(chapter.thumbnail, "sm"),
          color: chapter.color,
          lessons: translatedLessons,
        }
      })
  )

  // Map to Stream-compatible shape
  return {
    id: subject.id,
    title,
    slug: subject.slug,
    description,
    objectives: subject.objectives,
    prerequisites: subject.prerequisites,
    targetAudience: subject.targetAudience,
    imageUrl: getCatalogImageUrl(
      subject.banner ?? subject.thumbnail,
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
      name: departmentName,
    },
    chapters: translatedChapters,
    _count: {
      enrollments: enrollmentCount,
    },
    _catalog: {
      color: subject.color,
      banner: subject.banner,
      thumbnail: subject.thumbnail,
      totalChapters: subject.totalChapters,
      totalLessons: subject.totalLessons,
      averageRating: subject.averageRating,
      quizCount,
      schoolName,
    },
  }
})

export type CatalogIndividualCourseType = Awaited<
  ReturnType<typeof getCatalogCourse>
>
