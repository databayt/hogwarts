/**
 * Shared query builders and utilities for Stream LMS courses
 * Consolidates query logic to eliminate duplication and improve maintainability
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type CourseListFilters = {
  title?: string
  category?: string
  level?: string
  isPublished?: string
  lang?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc: boolean
}

export type CourseSortParams = {
  sort?: SortParam[]
}

export type CourseQueryParams = CourseListFilters &
  PaginationParams &
  CourseSortParams

// ============================================================================
// Select Types
// ============================================================================

export const courseListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  imageUrl: true,
  price: true,
  lang: true,
  isPublished: true,
  level: true,
  status: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      chapters: { where: { isPublished: true } },
      enrollments: {
        where: { isActive: true },
      },
    },
  },
} as const

export const courseDetailSelect = {
  id: true,
  schoolId: true,
  title: true,
  slug: true,
  description: true,
  imageUrl: true,
  price: true,
  lang: true,
  isPublished: true,
  level: true,
  status: true,
  userId: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
    },
  },
  chapters: {
    orderBy: { position: Prisma.SortOrder.asc },
    select: {
      id: true,
      title: true,
      position: true,
      isPublished: true,
      isFree: true,
      lessons: {
        orderBy: { position: Prisma.SortOrder.asc },
        select: {
          id: true,
          title: true,
          position: true,
          videoUrl: true,
          duration: true,
          isPublished: true,
          isFree: true,
        },
      },
    },
  },
  _count: {
    select: {
      enrollments: {
        where: { isActive: true },
      },
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for course queries
 * @param schoolId - School ID for multi-tenant filtering
 * @param filters - Additional filters
 * @returns Prisma where input
 */
export function buildCourseWhere(
  schoolId: string,
  filters: CourseListFilters = {}
): Prisma.StreamCourseWhereInput {
  const where: Prisma.StreamCourseWhereInput = {
    schoolId,
  }

  if (filters.title) {
    where.title = {
      contains: filters.title,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.category) {
    where.categoryId = filters.category
  }

  if (filters.level) {
    where.level = filters.level as any
  }

  if (filters.isPublished) {
    where.isPublished = filters.isPublished === "true"
  }

  if (filters.lang) {
    where.lang = filters.lang
  }

  return where
}

/**
 * Build order by clause for course queries
 */
export function buildCourseOrderBy(
  sortParams?: SortParam[]
): Prisma.StreamCourseOrderByWithRelationInput[] {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }

  return [{ createdAt: Prisma.SortOrder.desc }]
}

/**
 * Build pagination params
 */
export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get published courses list with filtering, sorting, and pagination
 * Used for public course browsing
 */
export async function getCoursesList(
  schoolId: string,
  params: Partial<CourseQueryParams> = {}
) {
  const filters = { ...params, isPublished: "true" }
  const where = buildCourseWhere(schoolId, filters)
  const orderBy = buildCourseOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 12)

  const [rows, count] = await Promise.all([
    db.streamCourse.findMany({
      where,
      orderBy,
      skip,
      take,
      select: courseListSelect,
    }),
    db.streamCourse.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get admin courses list with filtering, sorting, and pagination
 * Includes drafts and all statuses
 */
export async function getAdminCoursesList(
  schoolId: string,
  params: Partial<CourseQueryParams> = {}
) {
  const where = buildCourseWhere(schoolId, params)
  const orderBy = buildCourseOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 12)

  const [rows, count] = await Promise.all([
    db.streamCourse.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        ...courseListSelect,
        chapters: {
          select: {
            id: true,
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    }),
    db.streamCourse.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get a single course by slug with full details
 */
export async function getCourseDetail(schoolId: string, slug: string) {
  return db.streamCourse.findFirst({
    where: {
      slug,
      schoolId,
    },
    select: courseDetailSelect,
  })
}

/**
 * Get course statistics for a school
 */
export async function getCourseStats(schoolId: string) {
  const [total, published, draft, totalEnrollments] = await Promise.all([
    db.streamCourse.count({ where: { schoolId } }),
    db.streamCourse.count({ where: { schoolId, isPublished: true } }),
    db.streamCourse.count({ where: { schoolId, isPublished: false } }),
    db.streamEnrollment.count({ where: { schoolId, isActive: true } }),
  ])

  return { total, published, draft, totalEnrollments }
}
