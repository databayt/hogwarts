// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Pure query helpers for the quiz catalog page. Deliberately NOT "use server":
// plain functions so the where/paging logic is testable without a database.

export const QUIZ_EXAM_TYPES = ["quiz", "diagnostic"]
export const QUIZ_PAGE_SIZE = 24

/** `catalog` = every catalog subject (staff only), still paginated. */
export const CATALOG_SCOPE = "catalog"

export interface QuizFilters {
  /** One catalog subject; wins over the scope. */
  catalogSubjectId?: string
  examType?: string
  /** The viewer's default scope: catalog subject ids. Undefined = unscoped. */
  enrolledSubjectIds?: string[]
  page?: number
  pageSize?: number
}

export function buildQuizWhere(filters?: QuizFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    examType: { in: QUIZ_EXAM_TYPES },
  }
  if (filters?.catalogSubjectId) {
    where.subjectId = filters.catalogSubjectId
  } else if (filters?.enrolledSubjectIds) {
    where.subjectId = { in: filters.enrolledSubjectIds }
  }
  if (filters?.examType && QUIZ_EXAM_TYPES.includes(filters.examType)) {
    where.examType = filters.examType
  }
  return where
}

/** Where for the question bank over the same subject scope. */
export function buildQuestionWhere(
  catalogSubjectId?: string,
  enrolledSubjectIds?: string[]
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    approvalStatus: "APPROVED",
  }
  if (catalogSubjectId) {
    where.catalogSubjectId = catalogSubjectId
  } else if (enrolledSubjectIds) {
    where.catalogSubjectId = { in: enrolledSubjectIds }
  }
  return where
}

export function clampPage(page: unknown): number {
  const n = Number(page)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

export function pageArgs(page?: number, pageSize: number = QUIZ_PAGE_SIZE) {
  const p = clampPage(page)
  return { page: p, take: pageSize, skip: (p - 1) * pageSize }
}
