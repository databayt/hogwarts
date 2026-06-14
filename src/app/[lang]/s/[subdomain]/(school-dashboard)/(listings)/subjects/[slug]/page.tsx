// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { getCloudFrontUrl } from "@/lib/cloudfront-url"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { CatalogContentSections } from "@/components/school-dashboard/listings/subjects/catalog-content-sections"
import { CatalogDetailContent } from "@/components/school-dashboard/listings/subjects/catalog-detail"
import { SchoolCatalogCustomization } from "@/components/school-dashboard/listings/subjects/catalog/school-catalog-customization"
import { getText } from "@/components/translation/display"
import type { Lang } from "@/components/translation/types"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function SubjectDetailPage({ params }: Props) {
  const { lang, subdomain, slug } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId, role } = await getTenantContext()
  // ADMIN/DEVELOPER see all content + the customize panel; other roles get
  // the school's ContentOverride-filtered view (hidden chapters/lessons drop).
  const canCustomize = role === "ADMIN" || role === "DEVELOPER"
  const contentLang = (l: string | null | undefined) => (l || "ar") as Lang
  const t = (
    text: string | null | undefined,
    srcLang: string | null | undefined
  ) =>
    schoolId
      ? getText(text ?? "", contentLang(srcLang), lang, schoolId)
      : Promise.resolve(text ?? "")

  // Try catalog slug first, then fallback to school subject by ID
  let subject = await db.subject.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      department: true,
      lang: true,
      color: true,
      thumbnail: true,
      banner: true,
      cover: true,
      pdf: true,
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

  // Fallback: if slug didn't match a catalog subject, try looking up by ID directly
  if (!subject) {
    subject = await db.subject.findUnique({
      where: { id: slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        department: true,
        lang: true,
        color: true,
        thumbnail: true,
        banner: true,
        cover: true,
        pdf: true,
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
  }

  if (!subject) {
    notFound()
  }

  // Extract IDs for content queries
  const chapterIds = subject.chapters.map((ch) => ch.id)
  const lessonIds = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => l.id)
  )

  // Videos that surface to this school per lesson (only needed for the admin
  // customization UI, which exposes a per-video / per-instructor hide toggle).
  const lessonVideos =
    canCustomize && schoolId && lessonIds.length > 0
      ? await db.video.findMany({
          where: {
            catalogLessonId: { in: lessonIds },
            approvalStatus: "APPROVED",
            OR: [
              { schoolId, visibility: { in: ["SCHOOL", "PUBLIC", "PAID"] } },
              { visibility: "PUBLIC" },
              { visibility: "PAID" },
            ],
          },
          select: {
            id: true,
            title: true,
            catalogLessonId: true,
            schoolId: true,
            isFeatured: true,
            user: { select: { username: true } },
          },
        })
      : []
  const videoIds = lessonVideos.map((v) => v.id)

  // This school's hidden chapters/lessons/videos (ContentOverride bridge records)
  const overrideConditions = [
    ...(chapterIds.length > 0
      ? [{ catalogChapterId: { in: chapterIds } }]
      : []),
    ...(lessonIds.length > 0 ? [{ catalogLessonId: { in: lessonIds } }] : []),
    ...(videoIds.length > 0 ? [{ lessonVideoId: { in: videoIds } }] : []),
  ]
  // Fetch all override rows for this scope (a row may set isHidden and/or
  // hideQuiz — so we can't filter on isHidden=true here, or quiz-only rows
  // would be missed).
  const overrides =
    schoolId && overrideConditions.length > 0
      ? await db.contentOverride.findMany({
          where: { schoolId, OR: overrideConditions },
          select: {
            catalogChapterId: true,
            catalogLessonId: true,
            lessonVideoId: true,
            isHidden: true,
            hideQuiz: true,
          },
        })
      : []
  const hiddenChapterIds = new Set(
    overrides
      .filter((o) => o.isHidden)
      .map((o) => o.catalogChapterId)
      .filter(Boolean)
  )
  const hiddenLessonIds = new Set(
    overrides
      .filter((o) => o.isHidden)
      .map((o) => o.catalogLessonId)
      .filter(Boolean)
  )
  const hiddenVideoIds = new Set(
    overrides
      .filter((o) => o.isHidden)
      .map((o) => o.lessonVideoId)
      .filter(Boolean)
  )
  const quizHiddenLessonIds = new Set(
    overrides
      .filter((o) => o.hideQuiz)
      .map((o) => o.catalogLessonId)
      .filter(Boolean)
  )

  // Per-lesson video list for the hide UI (id, title, instructor label, source).
  const videosByLesson = new Map<
    string,
    Array<{
      id: string
      title: string
      instructorName: string
      source: "own-school" | "featured" | "other-school"
      isHidden: boolean
    }>
  >()
  for (const v of lessonVideos) {
    const source: "own-school" | "featured" | "other-school" =
      schoolId && v.schoolId === schoolId
        ? "own-school"
        : v.isFeatured
          ? "featured"
          : "other-school"
    const instructorName =
      v.isFeatured && !v.schoolId
        ? "Hogwarts"
        : (v.user?.username ?? "Instructor")
    const list = videosByLesson.get(v.catalogLessonId) ?? []
    list.push({
      id: v.id,
      title: v.title,
      instructorName,
      source,
      isHidden: hiddenVideoIds.has(v.id),
    })
    videosByLesson.set(v.catalogLessonId, list)
  }

  // Parallel content queries (short-circuit when no lessons/chapters)
  const [materials, exams, questionStats, assignments] = await Promise.all([
    // Materials - linked at subject, chapter, or lesson level
    db.material.findMany({
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
    db.exam.findMany({
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
    db.question
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
    db.assignment.findMany({
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

  const heroImageUrl = getCatalogImageUrl(subject.banner, "original")
  const subjectImageUrl = getCatalogImageUrl(subject.thumbnail, "sm")

  // Translate all content names for the current locale
  const sLang = subject.lang
  const [subjectName, subjectDescription, subjectDepartment] =
    await Promise.all([
      t(subject.name, sLang),
      t(subject.description, sLang),
      t(subject.department, sLang),
    ])

  const allChapters = await Promise.all(
    subject.chapters.map(async (ch) => ({
      id: ch.id,
      name: await t(ch.name, sLang),
      slug: ch.slug,
      description: ch.description,
      totalLessons: ch.totalLessons,
      imageUrl: getCatalogImageUrl(ch.thumbnail, "sm"),
      isHidden: hiddenChapterIds.has(ch.id),
      lessons: await Promise.all(
        ch.lessons.map(async (l) => ({
          id: l.id,
          name: await t(l.name, sLang),
          slug: l.slug,
          description: l.description,
          durationMinutes: l.durationMinutes,
          videoCount: l.videoCount,
          resourceCount: l.resourceCount,
          imageUrl: getCatalogImageUrl(l.thumbnail, "md"),
          isHidden: hiddenLessonIds.has(l.id),
        }))
      ),
    }))
  )

  // Non-customizers (teachers/students/guardians) get the school's curated
  // view — hidden chapters/lessons are dropped entirely.
  const chapters = canCustomize
    ? allChapters
    : allChapters
        .filter((ch) => !ch.isHidden)
        .map((ch) => ({
          ...ch,
          lessons: ch.lessons.filter((l) => !l.isHidden),
        }))

  // Build video cards from ALL lessons (matches stream dashboard "More from X");
  // hidden content drops for non-customizers, same as the chapter list.
  const allLessons = await Promise.all(
    subject.chapters.flatMap((ch) =>
      ch.lessons
        .filter(
          (l) =>
            canCustomize ||
            (!hiddenChapterIds.has(ch.id) && !hiddenLessonIds.has(l.id))
        )
        .map(async (l) => ({
          id: l.id,
          title: await t(l.name, sLang),
          thumbnailUrl: getCatalogImageUrl(l.thumbnail, "original") ?? null,
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
      {/* Admin-only: hide/show chapters & lessons for this school + contribute */}
      {canCustomize && (
        <SchoolCatalogCustomization
          chapters={allChapters.map((ch) => ({
            id: ch.id,
            name: ch.name,
            isHidden: ch.isHidden,
            lessons: ch.lessons.map((l) => ({
              id: l.id,
              name: l.name,
              isHidden: l.isHidden,
              videoCount: l.videoCount,
              videos: videosByLesson.get(l.id) ?? [],
              quizHidden: quizHiddenLessonIds.has(l.id),
            })),
          }))}
          catalogSubjectId={subject.id}
          lang={lang}
        />
      )}
      <CatalogContentSections
        data={contentSections}
        lang={lang}
        subjectColor={subject.color}
        name={subjectName}
        subdomain={subdomain}
        subjectSlug={subject.slug}
        catalogSubjectId={subject.id}
        textbookPdfUrl={subject.pdf ? getCloudFrontUrl(subject.pdf) : null}
        textbookCoverUrl={
          subject.cover ? getCloudFrontUrl(subject.cover) : null
        }
      />
    </>
  )
}
