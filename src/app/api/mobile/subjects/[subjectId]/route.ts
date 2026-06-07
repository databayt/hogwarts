// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { getText } from "@/components/translation/display"
import type { Lang } from "@/components/translation/types"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/subjects/:subjectId
 *
 * Returns subject detail with chapters → lessons AND the content-section
 * aggregates (videos, materials, exams, question stats, assignments) so the
 * mobile detail screen can mirror the web catalog detail view at
 * src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/[slug]/page.tsx.
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
    const lang = (searchParams.get("lang") || "en") as Lang

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

    const srcLang = (subject.lang || "ar") as Lang
    const t = (text: string | null | undefined) =>
      getText(text ?? "", srcLang, lang, schoolId)

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

    // Videos: flatten all lessons into video cards. Matches the derivation
    // in src/app/[lang]/.../subjects/[slug]/page.tsx lines 304–318.
    const videos = subject.chapters.flatMap((ch) =>
      ch.lessons.map((l) => ({
        id: l.id,
        title: "",
        thumbnail_url: getCatalogImageUrl(l.thumbnail, "original"),
        duration_seconds: (l.durationMinutes ?? 0) * 60,
        view_count: 0,
        is_featured: false,
        provider: "catalog",
        catalog_lesson_id: l.id,
        color: l.color ?? ch.color ?? null,
      }))
    )
    // Translate video titles (fetch once, map back by id for preserved order).
    const videoTitleMap = new Map<string, string>()
    await Promise.all(
      subject.chapters.flatMap((ch) =>
        ch.lessons.map(async (l) => {
          videoTitleMap.set(l.id, await t(l.name))
        })
      )
    )
    for (const v of videos) v.title = videoTitleMap.get(v.id) ?? ""

    const chapterIds = subject.chapters.map((ch) => ch.id)
    const lessonIds = subject.chapters.flatMap((ch) =>
      ch.lessons.map((l) => l.id)
    )

    const contentOr = [
      { catalogSubjectId: subject.id },
      ...(chapterIds.length > 0
        ? [{ catalogChapterId: { in: chapterIds } }]
        : []),
      ...(lessonIds.length > 0 ? [{ catalogLessonId: { in: lessonIds } }] : []),
    ]

    const [rawMaterials, rawExams, questionGroups, rawAssignments] =
      await Promise.all([
        db.material.findMany({
          where: {
            status: "PUBLISHED",
            OR: contentOr,
          },
          orderBy: { downloadCount: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            pageCount: true,
            downloadCount: true,
            fileSize: true,
            mimeType: true,
          },
        }),
        db.exam.findMany({
          where: { subjectId: subject.id, status: "PUBLISHED" },
          orderBy: { usageCount: "desc" },
          select: {
            id: true,
            title: true,
            examType: true,
            durationMinutes: true,
            totalMarks: true,
            totalQuestions: true,
            usageCount: true,
          },
        }),
        db.question.groupBy({
          by: ["questionType", "difficulty"],
          where: {
            approvalStatus: "APPROVED",
            visibility: { in: ["PUBLIC", "SCHOOL"] },
            OR: contentOr,
          },
          _count: true,
        }),
        db.assignment.findMany({
          where: { status: "PUBLISHED", OR: contentOr },
          orderBy: { usageCount: "desc" },
          take: 20,
          select: {
            id: true,
            title: true,
            assignmentType: true,
            estimatedTime: true,
            totalPoints: true,
            usageCount: true,
          },
        }),
      ])

    const materials = await Promise.all(
      rawMaterials.map(async (m) => ({
        id: m.id,
        title: await t(m.title),
        description: m.description ? await t(m.description) : null,
        type: m.type,
        page_count: m.pageCount,
        download_count: m.downloadCount,
        file_size: m.fileSize,
        mime_type: m.mimeType,
      }))
    )

    const exams = await Promise.all(
      rawExams.map(async (e) => ({
        id: e.id,
        title: await t(e.title),
        exam_type: e.examType,
        duration_minutes: e.durationMinutes,
        total_marks: e.totalMarks,
        total_questions: e.totalQuestions,
        usage_count: e.usageCount,
      }))
    )

    const assignments = await Promise.all(
      rawAssignments.map(async (a) => ({
        id: a.id,
        title: await t(a.title),
        assignment_type: a.assignmentType,
        estimated_time: a.estimatedTime,
        total_points: a.totalPoints != null ? Number(a.totalPoints) : null,
        usage_count: a.usageCount,
      }))
    )

    // Aggregate question groupBy rows into the shape the mobile card expects:
    // {total, cards: [{type, count, by_difficulty: {EASY/MEDIUM/HARD}}]}
    const typeMap: Record<
      string,
      { count: number; byDifficulty: Record<string, number> }
    > = {}
    let total = 0
    for (const g of questionGroups) {
      total += g._count
      const t = g.questionType
      if (!typeMap[t]) typeMap[t] = { count: 0, byDifficulty: {} }
      typeMap[t].count += g._count
      typeMap[t].byDifficulty[g.difficulty] =
        (typeMap[t].byDifficulty[g.difficulty] ?? 0) + g._count
    }
    const questionCards = Object.entries(typeMap)
      .map(([type, d]) => ({
        type,
        count: d.count,
        by_difficulty: d.byDifficulty,
      }))
      .sort((a, b) => b.count - a.count)

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
      videos,
      materials,
      exams,
      assignments,
      question_stats: { total, cards: questionCards },
    })
  } catch (error) {
    console.error("Mobile subject detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
