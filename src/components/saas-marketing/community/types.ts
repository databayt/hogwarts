// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Community block types
 *
 * View-model interfaces for the public learning-resource hub. These shapes are
 * what `queries.ts` returns and what the card components consume — they are
 * deliberately narrower than the underlying Prisma models so that we only ship
 * the fields the cards actually render.
 */

export type CommunityResourceType =
  | "textbooks"
  | "exams"
  | "qbank"
  | "videos"
  | "materials"
  | "books"

/** Filter shape shared by every per-type query in `queries.ts` */
export interface CommunityFilters {
  /** matches Subject.curriculum / Curriculum.code (e.g. "national", "us-k12") */
  curriculum?: string
  /** filtered against `Int[]` columns via `{ has: grade }` */
  grade?: number
  /** restrict to rows where row.lang === currentLocale */
  lang?: string
  /** per-resource result cap (default 24) */
  limit?: number
}

/** Options exposed to the `<FilterBar>` client component */
export interface CommunityFilterOptions {
  curricula: Array<{
    id: string
    name: string
    code: string
    country: string
    gradeRange: string | null
  }>
}

/** Cards consumed by `<HubGrid>` for the /community overview */
export interface CommunityCounts {
  textbooks: number
  exams: number
  qbank: number
  videos: number
  materials: number
  books: number
}

// === Card view models — one per resource type ===

export interface CommunityTextbookCard {
  id: string
  title: string
  slug: string
  lang: string
  author: string | null
  publisher: string | null
  pageCount: number | null
  coverKey: string | null
  subjectName: string
  curriculumName: string | null
  grades: number[]
}

export interface CommunityExamCard {
  id: string
  title: string
  description: string | null
  lang: string
  examType: string
  durationMinutes: number | null
  totalMarks: number | null
  totalQuestions: number | null
  subjectName: string
  grades: number[]
}

export interface CommunityQuestionCard {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string
  subjectName: string | null
}

export interface CommunityVideoCard {
  id: string
  title: string
  description: string | null
  lang: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  viewCount: number
  isFeatured: boolean
  subjectName: string
  lessonName: string
}

export interface CommunityMaterialCard {
  id: string
  title: string
  description: string | null
  lang: string
  type: string
  pageCount: number | null
  subjectName: string | null
}

export interface CommunityBookCard {
  id: string
  title: string
  slug: string
  lang: string
  author: string
  genre: string
  gradeLevel: string
  coverKey: string | null
  coverColor: string
  subjectName: string | null
}
