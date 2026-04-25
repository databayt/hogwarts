// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { toCloudFrontUrl } from "@/lib/cloudfront-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { SupportedLanguage } from "@/components/translation/types"

import { verifyToken } from "../../../auth/jwt"

/**
 * Mobile Catalog Subject Detail API
 *
 * Returns a single catalog subject with chapters and lessons.
 * Respects school's content overrides (hidden chapters/lessons).
 *
 * GET /api/mobile/catalog/subjects/[slug]
 * Query params: lang
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let payload
    try {
      const result = await verifyToken(token)
      payload = result.payload
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const schoolId = payload.schoolId as string | null
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const lang = (searchParams.get("lang") || "en") as SupportedLanguage

    // Fetch subject with chapters and lessons
    const subject = await db.subject.findFirst({
      where: { slug, status: "PUBLISHED" },
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
                thumbnail: true,
                videoCount: true,
              },
            },
          },
          orderBy: { sequenceOrder: "asc" },
        },
      },
    })

    if (!subject) {
      // Try by ID as fallback
      const byId = await db.subject.findFirst({
        where: { id: slug, status: "PUBLISHED" },
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
                  thumbnail: true,
                  videoCount: true,
                },
              },
            },
            orderBy: { sequenceOrder: "asc" },
          },
        },
      })

      if (!byId) {
        return NextResponse.json(
          { error: "Subject not found" },
          { status: 404 }
        )
      }

      return buildResponse(byId, schoolId, lang)
    }

    return buildResponse(subject, schoolId, lang)
  } catch (error) {
    console.error("Mobile catalog subject detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function buildResponse(
  subject: {
    id: string
    name: string
    slug: string
    description: string | null
    lang: string
    department: string
    thumbnail: string | null
    banner: string | null
    color: string | null
    objectives: string[] | null
    prerequisites: string | null
    targetAudience: string | null
    totalChapters: number
    totalLessons: number
    averageRating: number
    chapters: {
      id: string
      name: string
      description: string | null
      sequenceOrder: number
      thumbnail: string | null
      color: string | null
      lessons: {
        id: string
        name: string
        description: string | null
        sequenceOrder: number
        durationMinutes: number | null
        thumbnail: string | null
        videoCount: number
      }[]
    }[]
  },
  schoolId: string | null,
  lang: SupportedLanguage
) {
  // Check content overrides for this school
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
        select: { catalogChapterId: true, catalogLessonId: true },
      })

      for (const o of overrides) {
        if (o.catalogChapterId) hiddenChapterIds.add(o.catalogChapterId)
        if (o.catalogLessonId) hiddenLessonIds.add(o.catalogLessonId)
      }
    } catch {
      // Show all content on error
    }
  }

  // Translate
  const srcLang = (subject.lang || "ar") as SupportedLanguage
  const cacheKey = schoolId || subject.id
  const t = (text: string | null | undefined) =>
    getDisplayText(text ?? "", srcLang, lang, cacheKey)

  const [title, description, departmentName] = await Promise.all([
    t(subject.name),
    t(subject.description),
    t(subject.department),
  ])

  // Fetch best video per lesson for this school
  const allLessonIds = subject.chapters
    .filter((c) => !hiddenChapterIds.has(c.id))
    .flatMap((c) =>
      c.lessons.filter((l) => !hiddenLessonIds.has(l.id)).map((l) => l.id)
    )

  const videos =
    allLessonIds.length > 0
      ? await db.video.findMany({
          where: {
            catalogLessonId: { in: allLessonIds },
            approvalStatus: "APPROVED",
            OR: schoolId
              ? [{ schoolId }, { visibility: "PUBLIC" }]
              : [{ visibility: "PUBLIC" }],
          },
          orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
          select: {
            catalogLessonId: true,
            videoUrl: true,
            user: { select: { username: true } },
          },
        })
      : []

  // Map: lessonId -> best video URL + instructor name
  const videoByLesson = new Map<string, { url: string; instructor: string }>()
  for (const v of videos) {
    if (!videoByLesson.has(v.catalogLessonId)) {
      videoByLesson.set(v.catalogLessonId, {
        url: toCloudFrontUrl(v.videoUrl),
        instructor: v.user?.username || "",
      })
    }
  }

  // Collect unique instructor names for subject-level attribution
  const instructorNames = [
    ...new Set(videos.map((v) => v.user?.username).filter(Boolean)),
  ]

  // Translate chapters and lessons
  const chapters = await Promise.all(
    subject.chapters
      .filter((c) => !hiddenChapterIds.has(c.id))
      .map(async (chapter) => {
        const [chTitle, translatedLessons] = await Promise.all([
          t(chapter.name),
          Promise.all(
            chapter.lessons
              .filter((l) => !hiddenLessonIds.has(l.id))
              .map(async (lesson) => {
                const lessonVideo = videoByLesson.get(lesson.id)
                const lessonType = lesson.videoCount > 0 ? "VIDEO" : "TEXT"
                return {
                  id: lesson.id,
                  chapter_id: chapter.id,
                  title: await t(lesson.name),
                  type: lessonType,
                  duration: lesson.durationMinutes
                    ? `${lesson.durationMinutes}m`
                    : "",
                  content_url: lessonVideo?.url ?? null,
                  // Web parity: the catalog lesson row renders a square
                  // thumbnail. Same `md` size the web's get-course loader uses.
                  thumbnail_url: getCatalogImageUrl(lesson.thumbnail, "md"),
                  order_index: lesson.sequenceOrder,
                  is_completed: false,
                  is_locked: false,
                }
              })
          ),
        ])

        return {
          id: chapter.id,
          course_id: subject.id,
          title: chTitle,
          order_index: chapter.sequenceOrder,
          lesson_count: translatedLessons.length,
          completed_lessons: 0,
          lessons: translatedLessons,
        }
      })
  )

  const totalLessons = chapters.reduce((sum, c) => sum + c.lessons.length, 0)
  const totalDurationMin = subject.chapters
    .flatMap((c) => c.lessons)
    .reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
  const hours = Math.floor(totalDurationMin / 60)
  const mins = totalDurationMin % 60
  const totalDuration =
    hours > 0 ? `${hours}h ${mins}m` : mins > 0 ? `${mins}m` : ""

  return NextResponse.json({
    id: subject.id,
    school_id: schoolId || "",
    title,
    slug: subject.slug,
    description: description || "",
    instructor_name: instructorNames.join(", "),
    thumbnail_url: getCatalogImageUrl(
      subject.banner ?? subject.thumbnail,
      "original"
    ),
    category: departmentName || subject.department,
    enrollment_count: 0,
    lesson_count: totalLessons,
    total_duration: totalDuration,
    status: "PUBLISHED",
    progress: 0,
    chapters,
  })
}
