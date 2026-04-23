// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import type { SupportedLanguage } from "@/components/translation/types"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/subjects/:subjectId
 *
 * Returns subject detail with chapters → lessons so mobile can render
 * chapter-grouped topic cards that mirror the web catalog detail view
 * (see src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/[slug]/page.tsx).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId } = auth

    const { subjectId } = await params
    const { searchParams } = new URL(request.url)
    const lang = (searchParams.get("lang") || "en") as SupportedLanguage

    // Prefer school-scoped lookup (confirms the catalog subject is adopted by
    // the caller's school) but fall back to a direct catalog lookup for cases
    // where the client passes an ID the school hasn't explicitly selected.
    const selection = await db.subjectSelection.findFirst({
      where: { schoolId, catalogSubjectId: subjectId, isActive: true },
      select: { customName: true },
    })

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        slug: true,
        lang: true,
        description: true,
        department: true,
        color: true,
        thumbnail: true,
        banner: true,
        levels: true,
        grades: true,
        gradeRange: true,
        curriculum: true,
        country: true,
        tags: true,
        totalChapters: true,
        totalLessons: true,
        totalContent: true,
        usageCount: true,
        averageRating: true,
        ratingCount: true,
        status: true,
        chapters: {
          where: { status: "PUBLISHED" },
          orderBy: { sequenceOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            thumbnail: true,
            totalLessons: true,
            lessons: {
              where: { status: "PUBLISHED" },
              orderBy: { sequenceOrder: "asc" },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                color: true,
                thumbnail: true,
                durationMinutes: true,
                videoCount: true,
                resourceCount: true,
              },
            },
          },
        },
      },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    const srcLang = (subject.lang || "ar") as SupportedLanguage
    const t = (text: string | null | undefined) =>
      getDisplayText(text ?? "", srcLang, lang, schoolId)

    const [name, description, department] = await Promise.all([
      t(selection?.customName || subject.name),
      t(subject.description),
      t(subject.department),
    ])

    const chapters = await Promise.all(
      subject.chapters.map(async (ch) => ({
        id: ch.id,
        name: await t(ch.name),
        slug: ch.slug,
        description: ch.description ? await t(ch.description) : null,
        thumbnail_url: getCatalogImageUrl(ch.thumbnail, "sm"),
        color: ch.color,
        total_lessons: ch.totalLessons,
        lessons: await Promise.all(
          ch.lessons.map(async (l) => ({
            id: l.id,
            title: await t(l.name),
            slug: l.slug,
            description: l.description ? await t(l.description) : null,
            thumbnail_url: getCatalogImageUrl(l.thumbnail, "md"),
            color: l.color,
            duration_minutes: l.durationMinutes,
            video_count: l.videoCount,
            resource_count: l.resourceCount,
          }))
        ),
      }))
    )

    return NextResponse.json({
      id: subject.id,
      name,
      slug: subject.slug,
      description,
      department,
      levels: subject.levels,
      grades: subject.grades,
      grade_range: subject.gradeRange,
      curriculum: subject.curriculum,
      country: subject.country,
      tags: subject.tags,
      color: subject.color,
      thumbnail_url: getCatalogImageUrl(subject.thumbnail, "sm"),
      banner_url: getCatalogImageUrl(subject.banner, "original"),
      total_chapters: subject.totalChapters,
      total_lessons: subject.totalLessons,
      total_content: subject.totalContent,
      usage_count: subject.usageCount,
      average_rating: subject.averageRating,
      rating_count: subject.ratingCount,
      status: subject.status,
      chapters,
    })
  } catch (error) {
    console.error("Mobile subject detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
