// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cache } from "react"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { getText } from "@/components/translation/display"
import { localize } from "@/components/translation/localize"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

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
            const brandName = lang === "ar" ? "هوغورتس" : "Hogwarts"
            const topCreatorSchoolId = groups[0]?.schoolId ?? null
            if (!topCreatorSchoolId) return brandName
            const school = await db.school.findUnique({
              where: { id: topCreatorSchoolId },
              select: { name: true, preferredLanguage: true },
            })
            if (!school?.name) return brandName
            const storedLang = (school.preferredLanguage || "ar") as "ar" | "en"
            const displayLang = (lang === "ar" ? "ar" : "en") as "ar" | "en"
            if (storedLang === displayLang) return school.name
            return getText(
              school.name,
              storedLang,
              displayLang,
              topCreatorSchoolId
            )
          })
      : Promise.resolve(lang === "ar" ? "هوغورتس" : "Hogwarts")
    ).catch(() => (lang === "ar" ? "هوغورتس" : "Hogwarts")),
  ])

  // Batched translation — one localize() call per model instead of N×M getText.
  const displayLang = (lang === "ar" ? "ar" : "en") as Lang
  const cacheSchoolId = schoolId || subject.id // fallback for cache key

  const visibleChapters = subject.chapters.filter(
    (c) => !hiddenChapterIds.has(c.id)
  )
  const allVisibleLessons = visibleChapters.flatMap((c) =>
    c.lessons.filter((l) => !hiddenLessonIds.has(l.id))
  )

  // Subject, Chapters, Lessons all translated in one parallel batch.
  const [localizedSubjects, localizedChapters, localizedLessons, deptLabels] =
    await Promise.all([
      localize("Subject", [subject], {
        schoolId: cacheSchoolId,
        lang: displayLang,
      }),
      localize("Chapter", visibleChapters, {
        schoolId: cacheSchoolId,
        lang: displayLang,
      }),
      localize("Lesson", allVisibleLessons, {
        schoolId: cacheSchoolId,
        lang: displayLang,
      }),
      getLabels([subject.department], displayLang, cacheSchoolId),
    ])

  const ls = localizedSubjects[0] ?? subject
  const title = ls.name
  const description = ls.description ?? ""
  const departmentName = subject.department
    ? (deptLabels.get(subject.department) ?? subject.department)
    : subject.department

  // Map localized chapter / lesson arrays back into the tree shape.
  const lessonMap = new Map(localizedLessons.map((l) => [l.id, l]))
  const chapterMap = new Map(localizedChapters.map((c) => [c.id, c]))

  const translatedChapters = visibleChapters.map((chapter) => {
    const lc = chapterMap.get(chapter.id) ?? chapter
    const visibleLessons = chapter.lessons.filter(
      (l) => !hiddenLessonIds.has(l.id)
    )
    return {
      id: chapter.id,
      title: lc.name,
      description: chapter.description,
      position: chapter.sequenceOrder,
      isPublished: true,
      isFree: true,
      imageUrl: getCatalogImageUrl(chapter.thumbnail, "sm"),
      color: chapter.color,
      lessons: visibleLessons.map((lesson) => {
        const ll = lessonMap.get(lesson.id) ?? lesson
        return {
          id: lesson.id,
          title: ll.name,
          description: lesson.description,
          position: lesson.sequenceOrder,
          duration: lesson.durationMinutes,
          isFree: true,
          imageUrl: getCatalogImageUrl(lesson.thumbnail, "md"),
        }
      }),
    }
  })

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
