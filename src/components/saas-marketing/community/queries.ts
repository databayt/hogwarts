// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

import { DEFAULT_RESOURCE_LIMIT } from "./config"
import type {
  CommunityBookCard,
  CommunityCounts,
  CommunityExamCard,
  CommunityFilterOptions,
  CommunityFilters,
  CommunityMaterialCard,
  CommunityQuestionCard,
  CommunityTextbookCard,
  CommunityVideoCard,
} from "./types"

/**
 * Community block — server-only data layer for the public learning hub.
 *
 * No `auth()` and no `getTenantContext()` — this entire surface is anonymous.
 * Every query follows the public-content gate from
 * `src/app/api/mobile/catalog/subjects/[slug]/route.ts:215-217`:
 *
 *   - `status: "PUBLISHED"`     (when the model has it)
 *   - `approvalStatus: "APPROVED"` (when the model has it)
 *   - `visibility: "PUBLIC"`    (when the model has it)
 *
 * Textbook is the lone exception — it has only `status` (no community
 * approval pipeline) so the filter degrades gracefully.
 *
 * Curriculum filtering matches the legacy string column on `Subject.curriculum`
 * (values: "national" | "us-k12" | "british" | "ib" — see catalog.prisma:156).
 * Grade filtering uses `{ grades: { has: grade } }` against the `Int[]` columns
 * on Subject / Textbook. Books skip grade filtering because `Book.gradeLevel`
 * is a `String`, not an `Int[]`.
 */

// ============================================================================
// Filter options for the dropdowns
// ============================================================================

export async function getCommunityFilterOptions(): Promise<CommunityFilterOptions> {
  const curricula = await db.curriculum.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      code: true,
      country: true,
      gradeRange: true,
    },
    orderBy: { name: "asc" },
  })
  return { curricula }
}

// ============================================================================
// Counts (cheap, used by the hub /community to show "12 textbooks")
// ============================================================================

export async function getCommunityCounts(
  filters: CommunityFilters
): Promise<CommunityCounts> {
  const [textbooks, exams, qbank, videos, materials, books] = await Promise.all(
    [
      db.textbook.count({ where: textbookWhere(filters) }),
      db.exam.count({ where: examWhere(filters) }),
      db.question.count({ where: questionWhere(filters) }),
      db.video.count({ where: videoWhere(filters) }),
      db.material.count({ where: materialWhere(filters) }),
      db.book.count({ where: bookWhere(filters) }),
    ]
  )
  return { textbooks, exams, qbank, videos, materials, books }
}

// ============================================================================
// Per-type list queries (one per drill-down page)
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
// Where-clause builders (kept private — count() and findMany() share them)
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
  if (filters.curriculum) {
    // Match either the FK relation (Curriculum.code) OR the legacy string
    // column on Subject so older textbook rows are still discoverable.
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
  const subj = subjectFilter(filters)
  if (subj) where.subject = subj
  return where
}

function questionWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  const subj = subjectFilter(filters)
  if (subj) where.catalogSubject = subj
  return where
}

function videoWhere(filters: CommunityFilters) {
  const where: Record<string, unknown> = {
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.lang) where.lang = filters.lang
  const subj = subjectFilter(filters)
  if (subj) {
    where.lesson = { chapter: { subject: subj } }
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
  const subj = subjectFilter(filters)
  if (subj) where.catalogSubject = subj
  return where
}

function bookWhere(filters: CommunityFilters) {
  // Book.gradeLevel is a String (e.g. "GENERAL"), not an Int[] — grade filter
  // is intentionally skipped. Curriculum still flows through catalogSubject.
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
    visibility: "PUBLIC",
  }
  if (filters.lang) where.lang = filters.lang
  if (filters.curriculum) {
    where.catalogSubject = { curriculum: filters.curriculum }
  }
  return where
}
