// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogContentSections } from "@/components/school-dashboard/listings/subjects/catalog-content-sections"
import { CatalogDetailContent } from "@/components/school-dashboard/listings/subjects/catalog-detail"
import type { SupportedLanguage } from "@/components/translation/types"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function CatalogSubjectDetailPage({ params }: Props) {
  const { lang, subdomain, slug } = await params
  const { schoolId } = await getTenantContext()
  const contentLang = (l: string | null | undefined) =>
    (l || "ar") as SupportedLanguage
  const t = (
    text: string | null | undefined,
    srcLang: string | null | undefined
  ) =>
    schoolId
      ? getDisplayText(text ?? "", contentLang(srcLang), lang, schoolId)
      : Promise.resolve(text ?? "")

  // Try catalog slug first, then fallback to school subject by ID
  let subject = await db.catalogSubject.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      department: true,
      lang: true,
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

  // Fallback: if slug didn't match a catalog subject, try looking up by ID directly
  if (!subject) {
    subject = await db.catalogSubject.findUnique({
      where: { id: slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        department: true,
        lang: true,
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

  // Translate all content names for the current locale
  const sLang = subject.lang
  const [subjectName, subjectDescription, subjectDepartment] =
    await Promise.all([
      t(subject.name, sLang),
      t(subject.description, sLang),
      t(subject.department, sLang),
    ])

  const chapters = await Promise.all(
    subject.chapters.map(async (ch) => ({
      id: ch.id,
      name: await t(ch.name, sLang),
      slug: ch.slug,
      description: ch.description,
      totalLessons: ch.totalLessons,
      imageUrl: getCatalogImageUrl(ch.thumbnailKey, ch.imageKey, "sm"),
      lessons: await Promise.all(
        ch.lessons.map(async (l) => ({
          id: l.id,
          name: await t(l.name, sLang),
          slug: l.slug,
          description: l.description,
          durationMinutes: l.durationMinutes,
          videoCount: l.videoCount,
          resourceCount: l.resourceCount,
          imageUrl: getCatalogImageUrl(l.thumbnailKey, l.imageKey, "md"),
        }))
      ),
    }))
  )

  // Build video cards from ALL lessons (matches stream dashboard "More from X")
  const allLessons = await Promise.all(
    subject.chapters.flatMap((ch) =>
      ch.lessons.map(async (l) => ({
        id: l.id,
        title: await t(l.name, sLang),
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
  )

  const [translatedMaterials, translatedExams, translatedAssignments] =
    await Promise.all([
      Promise.all(
        materials.map(async (m) => ({
          ...m,
          title: await t(m.title, sLang),
        }))
      ),
      Promise.all(
        exams.map(async (e) => ({
          ...e,
          title: await t(e.title, sLang),
        }))
      ),
      Promise.all(
        assignments.map(async (a) => ({
          ...a,
          title: await t(a.title, sLang),
          totalPoints: a.totalPoints ? Number(a.totalPoints) : null,
        }))
      ),
    ])

  const contentSections = {
    videos: allLessons,
    materials: translatedMaterials,
    exams: translatedExams,
    questionStats,
    assignments: translatedAssignments,
  }

  return (
    <>
      <PageHeadingSetter title="" />
      <BreadcrumbTitle title={subjectName} />
      <CatalogDetailContent
        subject={{
          name: subjectName,
          slug: subject.slug,
          description: subjectDescription,
          department: subjectDepartment,
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
        name={subjectName}
        subdomain={subdomain}
        subjectSlug={subject.slug}
        catalogSubjectId={subject.id}
      />
    </>
  )
}
