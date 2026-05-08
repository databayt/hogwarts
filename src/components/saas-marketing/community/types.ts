// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Community block types
 *
 * View-model interfaces for the public learning-resource hub. These shapes are
 * what `queries.ts` returns and what UI components consume — narrower than the
 * underlying Prisma models so we only ship the fields that actually render.
 */

export type CommunityResourceType =
  | "textbooks"
  | "exams"
  | "qbank"
  | "videos"
  | "materials"
  | "books"

/** Filter shape shared across the community queries. */
export interface CommunityFilters {
  /** matches Subject.curriculum / Curriculum.code (e.g. "national", "us-k12") */
  curriculum?: string
  /** filtered against `Int[]` columns via `{ has: grade }` */
  grade?: number
  /** restrict to rows where row.lang === currentLocale */
  lang?: string
  /** narrow per-resource queries to a single subject — used by the detail page */
  subjectId?: string
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

// === Subject card view-model — drives the SubjectsGrid on /community ===
//
// Mirrors the `SubjectItem` shape from
// `src/components/school-dashboard/listings/subjects/catalog-subjects-grid.tsx:14-29`
// so the existing client grid component can be reused without forking.
export interface CommunitySubjectCard {
  id: string
  slug: string
  name: string
  department: string
  level: string
  levels: string[]
  grades: number[]
  color: string | null
  imageUrl: string | null
  totalChapters: number
  totalLessons: number
  averageRating: number
  usageCount: number
  ratingCount: number
}

// === Resource card view models — used by the subject detail page ===

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
