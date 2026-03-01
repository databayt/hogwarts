// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogContentSections } from "@/components/school-dashboard/listings/subjects/catalog-content-sections"
import { CatalogDetailContent } from "@/components/school-dashboard/listings/subjects/catalog-detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function CatalogSubjectDetailPage({ params }: Props) {
  const { lang, subdomain, slug } = await params

  // Try catalog slug first, then fallback to school subject by ID
  let subject = await db.catalogSubject.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      department: true,
      color: true,
      imageKey: true,
      thumbnailKey: true,
      bannerUrl: true,
      levels: true,
      grades: true,
      totalChapters: true,
      totalLessons: true,
      averageRating: true,
      usageCount: true,
      ratingCount: true,
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          color: true,
          imageKey: true,
          thumbnailKey: true,
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
              imageKey: true,
              thumbnailKey: true,
              durationMinutes: true,
              videoCount: true,
              resourceCount: true,
            },
          },
        },
      },
    },
  })

  // Fallback: if slug didn't match a catalog subject, check if it's a school subject ID
  // that links to a catalog subject via catalogSubjectId
  if (!subject) {
    const schoolSubject = await db.subject.findFirst({
      where: { id: slug },
      select: { catalogSubjectId: true },
    })

    if (schoolSubject?.catalogSubjectId) {
      subject = await db.catalogSubject.findUnique({
        where: { id: schoolSubject.catalogSubjectId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          department: true,
          color: true,
          imageKey: true,
          thumbnailKey: true,
          bannerUrl: true,
          levels: true,
          grades: true,
          totalChapters: true,
          totalLessons: true,
          averageRating: true,
          usageCount: true,
          ratingCount: true,
          chapters: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              color: true,
              imageKey: true,
              thumbnailKey: true,
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
                  imageKey: true,
                  thumbnailKey: true,
                  durationMinutes: true,
                  videoCount: true,
                  resourceCount: true,
                },
              },
            },
          },
        },
      })
    }
  }

  if (!subject) {
    notFound()
  }

  // Extract IDs for content queries
  const chapterIds = subject.chapters.map((ch) => ch.id)
  const lessonIds = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => l.id)
  )

  // Parallel content queries (short-circuit when no lessons/chapters)
  const [materials, exams, questionStats, assignments] = await Promise.all([
    // Materials - linked at subject, chapter, or lesson level
    db.catalogMaterial.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { catalogSubjectId: subject.id },
          ...(chapterIds.length > 0
            ? [{ catalogChapterId: { in: chapterIds } }]
            : []),
          ...(lessonIds.length > 0
            ? [{ catalogLessonId: { in: lessonIds } }]
            : []),
        ],
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

    // Exams - linked at subject level (no take limit — aggregate by type in UI)
    db.catalogExam.findMany({
      where: {
        subjectId: subject.id,
        status: "PUBLISHED",
      },
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

    // Questions - count + groupBy for summary card
    db.catalogQuestion
      .groupBy({
        by: ["questionType", "difficulty"],
        where: {
          approvalStatus: "APPROVED",
          visibility: { in: ["PUBLIC", "SCHOOL"] },
          OR: [
            { catalogSubjectId: subject.id },
            ...(chapterIds.length > 0
              ? [{ catalogChapterId: { in: chapterIds } }]
              : []),
            ...(lessonIds.length > 0
              ? [{ catalogLessonId: { in: lessonIds } }]
              : []),
          ],
        },
        _count: true,
      })
      .then((groups) => {
        const total = groups.reduce((sum, g) => sum + g._count, 0)
        const typeMap: Record<
          string,
          { count: number; byDifficulty: Record<string, number> }
        > = {}
        for (const g of groups) {
          if (!typeMap[g.questionType]) {
            typeMap[g.questionType] = { count: 0, byDifficulty: {} }
          }
          typeMap[g.questionType].count += g._count
          typeMap[g.questionType].byDifficulty[g.difficulty] =
            (typeMap[g.questionType].byDifficulty[g.difficulty] ?? 0) + g._count
        }
        const cards = Object.entries(typeMap)
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.count - a.count)
        return { total, cards }
      }),

    // Assignments - linked at subject, chapter, or lesson level
    db.catalogAssignment.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { catalogSubjectId: subject.id },
          ...(chapterIds.length > 0
            ? [{ catalogChapterId: { in: chapterIds } }]
            : []),
          ...(lessonIds.length > 0
            ? [{ catalogLessonId: { in: lessonIds } }]
            : []),
        ],
      },
      orderBy: { usageCount: "desc" },
      take: 6,
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

  const heroImageUrl = getCatalogImageUrl(subject.bannerUrl, null, "original")
  const subjectImageUrl = getCatalogImageUrl(
    subject.thumbnailKey,
    subject.imageKey,
    "sm"
  )

  const chapters = subject.chapters.map((ch) => ({
    id: ch.id,
    name: ch.name,
    slug: ch.slug,
    description: ch.description,
    totalLessons: ch.totalLessons,
    imageUrl: getCatalogImageUrl(ch.thumbnailKey, ch.imageKey, "sm"),
    lessons: ch.lessons.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      description: l.description,
      durationMinutes: l.durationMinutes,
      videoCount: l.videoCount,
      resourceCount: l.resourceCount,
      imageUrl: getCatalogImageUrl(l.thumbnailKey, l.imageKey, "md"),
    })),
  }))

  // Build video cards from ALL lessons (matches stream dashboard "More from X")
  const allLessons = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => ({
      id: l.id,
      title: l.name,
      thumbnailUrl:
        getCatalogImageUrl(l.thumbnailKey, l.imageKey, "original") ?? null,
      durationSeconds: (l.durationMinutes ?? 0) * 60,
      viewCount: 0,
      isFeatured: false,
      provider: "catalog",
      catalogLessonId: l.id,
      color: l.color ?? ch.color ?? null,
    }))
  )

  const contentSections = {
    videos: allLessons,
    materials,
    exams,
    questionStats,
    assignments: assignments.map((a) => ({
      ...a,
      totalPoints: a.totalPoints ? Number(a.totalPoints) : null,
    })),
  }

  return (
    <>
      <PageHeadingSetter title="" />
      <BreadcrumbTitle title={subject.name} />
      <CatalogDetailContent
        subject={{
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          department: subject.department,
          color: subject.color,
          heroImageUrl,
          imageUrl: subjectImageUrl,
          levels: subject.levels,
          grades: subject.grades,
          totalChapters: subject.totalChapters,
          totalLessons: subject.totalLessons,
          averageRating: subject.averageRating,
          usageCount: subject.usageCount,
          ratingCount: subject.ratingCount,
        }}
        chapters={chapters}
        lang={lang}
      />
      <CatalogContentSections
        data={contentSections}
        lang={lang}
        subjectColor={subject.color}
        subjectName={subject.name}
        subdomain={subdomain}
        subjectSlug={subject.slug}
        catalogSubjectId={subject.id}
      />
    </>
  )
}
