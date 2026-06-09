// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"
import { getCatalogImageUrl } from "@/components/catalog/image-url"

import { DEFAULT_RESOURCE_LIMIT } from "./config"
import type {
  CommunityBookCard,
  CommunityExamCard,
  CommunityFilterOptions,
  CommunityFilters,
  CommunityMaterialCard,
  CommunityQuestionCard,
  CommunitySubjectCard,
  CommunityTextbookCard,
  CommunityVideoCard,
} from "./types"

/**
 * Community block — server-only data layer for the public learning hub.
 *
 * No `auth()` and no `getTenantContext()` — this entire surface is anonymous.
 * Public-content gate (per `src/app/api/mobile/catalog/subjects/[slug]/route.ts:215-217`):
 *   - `status: "PUBLISHED"`     (when the model has it)
 *   - `approvalStatus: "APPROVED"` (when the model has it)
 *   - `visibility: "PUBLIC"`    (when the model has it)
 *
 * Textbook is the lone exception — only `status` (no community approval pipeline).
 *
 * Curriculum filtering matches the `Subject.curriculum` string column (canonical
 * codes: ISO country "US"/"SD"/"GB"/… or "IB-DP"/"CAIE-IGCSE" — see catalog.prisma).
 * Grade filtering uses `{ grades: { has: grade } }` on the `Int[]` columns.
 * Books skip grade filtering — `Book.gradeLevel` is `String`, not `Int[]`.
 */

// ============================================================================
// Filter options (curriculum dropdown)
// ============================================================================

export async function getCommunityFilterOptions(): Promise<CommunityFilterOptions> {
  const curricula = await db.curriculum.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      slug: true,
      code: true,
      country: true,
      gradeRange: true,
    },
    orderBy: { name: "asc" },
  })
  return { curricula }
}

// ============================================================================
// Subject queries — drive the hub grid + slug detail page
// ============================================================================

export async function getCommunitySubjects(
  filters: CommunityFilters
): Promise<CommunitySubjectCard[]> {
  const where: Record<string, unknown> = { status: "PUBLISHED" }
  if (filters.curriculum) where.curriculum = filters.curriculum
  if (filters.grade) where.grades = { has: filters.grade }
  if (filters.lang) where.lang = filters.lang

  const rows = await db.subject.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      department: true,
      lang: true,
      color: true,
      thumbnail: true,
      levels: true,
      grades: true,
      totalChapters: true,
      totalLessons: true,
      averageRating: true,
      usageCount: true,
      ratingCount: true,
    },
  })

  return rows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    department: s.department,
    // The school-dashboard SubjectsGrid expects a singular `level` for display
    // (badge text). Take the first; full array stays in `levels` for filtering.
    level: s.levels[0] ?? "",
    levels: s.levels,
    grades: s.grades,
    color: s.color,
    imageUrl: getCatalogImageUrl(s.thumbnail, "sm"),
    totalChapters: s.totalChapters,
    totalLessons: s.totalLessons,
    averageRating: s.averageRating,
    usageCount: s.usageCount,
    ratingCount: s.ratingCount,
  }))
}

/** Hero data for /community/[slug] — full subject + chapter + lesson tree. */
export async function getCommunitySubjectBySlug(slug: string) {
  return db.subject.findUnique({
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
      clickviewId: true,
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

/** Other-grade variants of the same subject (e.g. Arts G1 → G2/G3/...). */
export async function getCommunitySubjectGradeSiblings(
  clickviewId: string | null
): Promise<{ grade: number; slug: string }[]> {
  if (!clickviewId) return []
  const siblings = await db.subject.findMany({
    where: { clickviewId, status: "PUBLISHED" },
    select: { grades: true, slug: true },
    orderBy: { sortOrder: "asc" },
  })
  return siblings
    .filter((s) => s.grades.length > 0)
    .map((s) => ({ grade: s.grades[0], slug: s.slug }))
    .sort((a, b) => a.grade - b.grade)
}

/**
 * Resource bundle for /community/[slug] — mirrors the parallel batch in
 * `src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/[slug]/page.tsx:156-266`,
 * minus the schoolId-gated translation step. Public content only.
 */
export async function getCommunitySubjectResources(args: {
  subjectId: string
  chapterIds: string[]
  lessonIds: string[]
}) {
  const { subjectId, chapterIds, lessonIds } = args
  const hierarchyOR = [
    { catalogSubjectId: subjectId },
    ...(chapterIds.length > 0
      ? [{ catalogChapterId: { in: chapterIds } }]
      : []),
    ...(lessonIds.length > 0 ? [{ catalogLessonId: { in: lessonIds } }] : []),
  ]

  const [materials, exams, questionStats, assignments] = await Promise.all([
    db.material.findMany({
      where: {
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        OR: hierarchyOR,
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
      where: {
        subjectId,
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
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

    db.question
      .groupBy({
        by: ["questionType", "difficulty"],
        where: {
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          OR: hierarchyOR,
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

    db.assignment.findMany({
      where: {
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        OR: hierarchyOR,
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

  return {
    materials,
    exams,
    questionStats,
    assignments: assignments.map((a) => ({
      ...a,
      // CatalogContentSections expects totalPoints as a plain number (not Decimal)
      totalPoints: a.totalPoints ? Number(a.totalPoints) : null,
    })),
  }
}

// ============================================================================
// Per-resource list queries (kept from Phase 1 — usable when caller wants a
// flat list narrowed by `subjectId` etc.)
// ============================================================================

export async function getCommunityTextbooks(
  filters: CommunityFilters
): Promise<CommunityTextbookCard[]> {
  const rows = await db.textbook.findMany({
    where: textbookWhere(filters),
    select: {
      id: true,
      title: true,
      slug: true,
      lang: true,
      author: true,
      publisher: true,
      pageCount: true,
      coverKey: true,
      grades: true,
      subject: { select: { name: true } },
      curriculum: { select: { name: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: filters.limit ?? DEFAULT_RESOURCE_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    lang: r.lang,
    author: r.author,
    publisher: r.publisher,
    pageCount: r.pageCount,
    coverKey: r.coverKey,
    subjectName: r.subject.name,
    curriculumName: r.curriculum?.name ?? null,
    grades: r.grades,
  }))
}

export async function getCommunityExams(
  filters: CommunityFilters
): Promise<CommunityExamCard[]> {
  const rows = await db.exam.findMany({
    where: examWhere(filters),
    select: {
      id: true,
      title: true,
      description: true,
      lang: true,
      examType: true,
      durationMinutes: true,
      totalMarks: true,
      totalQuestions: true,
      subject: { select: { name: true, grades: true } },
    },
    orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
    take: filters.limit ?? DEFAULT_RESOURCE_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    lang: r.lang,
    examType: r.examType,
    durationMinutes: r.durationMinutes,
    totalMarks: r.totalMarks,
    totalQuestions: r.totalQuestions,
    subjectName: r.subject.name,
    grades: r.subject.grades,
  }))
}

export async function getCommunityQuestions(
  filters: CommunityFilters
): Promise<CommunityQuestionCard[]> {
  const rows = await db.question.findMany({
    where: questionWhere(filters),
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      bloomLevel: true,
      catalogSubject: { select: { name: true } },
    },
    orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
    take: filters.limit ?? DEFAULT_RESOURCE_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    questionText: r.questionText,
    questionType: r.questionType,
    difficulty: r.difficulty,
    bloomLevel: r.bloomLevel,
    subjectName: r.catalogSubject?.name ?? null,
  }))
}

export async function getCommunityVideos(
  filters: CommunityFilters
): Promise<CommunityVideoCard[]> {
  const rows = await db.video.findMany({
    where: videoWhere(filters),
    select: {
      id: true,
      title: true,
      description: true,
      lang: true,
      thumbnailUrl: true,
      durationSeconds: true,
      viewCount: true,
      isFeatured: true,
      lesson: {
        select: {
          name: true,
          chapter: { select: { subject: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
    take: filters.limit ?? DEFAULT_RESOURCE_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    lang: r.lang,
    thumbnailUrl: r.thumbnailUrl,
    durationSeconds: r.durationSeconds,
    viewCount: r.viewCount,
    isFeatured: r.isFeatured,
    subjectName: r.lesson.chapter.subject.name,
    lessonName: r.lesson.name,
  }))
}

export async function getCommunityMaterials(
  filters: CommunityFilters
): Promise<CommunityMaterialCard[]> {
  const rows = await db.material.findMany({
    where: materialWhere(filters),
    select: {
      id: true,
      title: true,
      description: true,
      lang: true,
      type: true,
      pageCount: true,
      catalogSubject: { select: { name: true } },
    },
    orderBy: [{ downloadCount: "desc" }, { updatedAt: "desc" }],
    take: filters.limit ?? DEFAULT_RESOURCE_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    lang: r.lang,
    type: r.type,
    pageCount: r.pageCount,
    subjectName: r.catalogSubject?.name ?? null,
  }))
}

export async function getCommunityBooks(
  filters: CommunityFilters
): Promise<CommunityBookCard[]> {
  const rows = await db.book.findMany({
    where: bookWhere(filters),
    select: {
      id: true,
      title: true,
      slug: true,
      lang: true,
      author: true,
      genre: true,
      gradeLevel: true,
      coverKey: true,
      coverColor: true,
      catalogSubject: { select: { name: true } },
    },
    orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
    take: filters.limit ?? DEFAULT_RESOURCE_LIMIT,
  })
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    lang: r.lang,
    author: r.author,
    genre: r.genre,
    gradeLevel: r.gradeLevel,
    coverKey: r.coverKey,
    coverColor: r.coverColor,
    subjectName: r.catalogSubject?.name ?? null,
  }))
}

// ============================================================================
// Where-clause builders (private — shared by count() and findMany())
// ============================================================================

function subjectFilter(filters: CommunityFilters) {
  const where: { curriculum?: string; grades?: { has: number } } = {}
  if (filters.curriculum) where.curriculum = filters.curriculum
  if (filters.grade) where.grades = { has: filters.grade }
  return Object.keys(where).length ? where : undefined
}

function textbookWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = { status: "PUBLISHED" }
  if (filters.lang) where.lang = filters.lang
  if (filters.grade) where.grades = { has: filters.grade }
  if (filters.subjectId) where.subjectId = filters.subjectId
  if (filters.curriculum) {
    where.OR = [
      { curriculum: { code: filters.curriculum } },
      { subject: { curriculum: filters.curriculum } },
    ]
  }
  return where
}

function examWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.lang) where.lang = filters.lang
  if (filters.subjectId) where.subjectId = filters.subjectId
  const subj = subjectFilter(filters)
  if (subj && !filters.subjectId) where.subject = subj
  return where
}

function questionWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.subjectId) where.catalogSubjectId = filters.subjectId
  const subj = subjectFilter(filters)
  if (subj && !filters.subjectId) where.catalogSubject = subj
  return where
}

function videoWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.lang) where.lang = filters.lang
  if (filters.subjectId) {
    where.lesson = { chapter: { subjectId: filters.subjectId } }
  } else {
    const subj = subjectFilter(filters)
    if (subj) where.lesson = { chapter: { subject: subj } }
  }
  return where
}

function materialWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.lang) where.lang = filters.lang
  if (filters.subjectId) where.catalogSubjectId = filters.subjectId
  const subj = subjectFilter(filters)
  if (subj && !filters.subjectId) where.catalogSubject = subj
  return where
}

function bookWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.lang) where.lang = filters.lang
  if (filters.subjectId) where.catalogSubjectId = filters.subjectId
  if (filters.curriculum && !filters.subjectId) {
    where.catalogSubject = { curriculum: filters.curriculum }
  }
  return where
}
