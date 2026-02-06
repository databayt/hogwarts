/**
 * Query builders for Lessons module
 * Pattern follows grades module for consistency
 *
 * Centralizes query logic for:
 * - Filtering, sorting, pagination
 * - Select objects (list vs detail)
 * - Multi-tenant safety (schoolId)
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type LessonListFilters = {
  search?: string
  classId?: string
  status?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  dateFrom?: Date
  dateTo?: Date
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type LessonQueryParams = LessonListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const lessonListSelect = {
  id: true,
  title: true,
  lessonDate: true,
  startTime: true,
  endTime: true,
  status: true,
  createdAt: true,
  class: {
    select: {
      id: true,
      name: true,
      teacher: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
      subject: {
        select: {
          id: true,
          subjectName: true,
        },
      },
    },
  },
} as const

/** Full fields for detail/edit */
export const lessonDetailSelect = {
  id: true,
  schoolId: true,
  classId: true,
  title: true,
  description: true,
  lessonDate: true,
  startTime: true,
  endTime: true,
  objectives: true,
  materials: true,
  activities: true,
  assessment: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  class: {
    select: {
      id: true,
      name: true,
      teacher: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          emailAddress: true,
        },
      },
      subject: {
        select: {
          id: true,
          subjectName: true,
        },
      },
      studentClasses: {
        include: {
          student: {
            select: {
              id: true,
              givenName: true,
              surname: true,
            },
          },
        },
      },
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for lesson queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildLessonWhere(
  schoolId: string,
  filters: LessonListFilters = {}
): Prisma.LessonWhereInput {
  const where: Prisma.LessonWhereInput = { schoolId }

  // Search by title, description, or class name
  if (filters.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        description: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        class: {
          name: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
    ]
  }

  // Class filter
  if (filters.classId) {
    where.classId = filters.classId
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.lessonDate = {}
    if (filters.dateFrom) {
      where.lessonDate.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.lessonDate.lte = filters.dateTo
    }
  }

  return where
}

/**
 * Build order by clause
 */
export function buildLessonOrderBy(
  sortParams?: SortParam[]
): Prisma.LessonOrderByWithRelationInput[] {
  if (sortParams?.length) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }
  return [{ lessonDate: Prisma.SortOrder.desc }]
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
 * Get lessons list with filtering, sorting, pagination
 */
export async function getLessonList(
  schoolId: string,
  params: Partial<LessonQueryParams> = {}
) {
  const where = buildLessonWhere(schoolId, params)
  const orderBy = buildLessonOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.lesson.findMany({
      where,
      orderBy,
      skip,
      take,
      select: lessonListSelect,
    }),
    db.lesson.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single lesson by ID
 */
export async function getLessonDetail(schoolId: string, id: string) {
  return db.lesson.findFirst({
    where: { id, schoolId },
    select: lessonDetailSelect,
  })
}

/**
 * Get lessons for a specific class
 */
export async function getClassLessons(schoolId: string, classId: string) {
  return db.lesson.findMany({
    where: {
      schoolId,
      classId,
    },
    orderBy: [{ lessonDate: "asc" }, { startTime: "asc" }],
    select: lessonListSelect,
  })
}

/**
 * Get lessons for a specific date
 */
export async function getDayLessons(schoolId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return db.lesson.findMany({
    where: {
      schoolId,
      lessonDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: [{ startTime: "asc" }],
    select: lessonListSelect,
  })
}

/**
 * Check if lessons exist and belong to school
 */
export async function verifyLessonOwnership(
  schoolId: string,
  lessonIds: string[]
) {
  const lessons = await db.lesson.findMany({
    where: {
      id: { in: lessonIds },
      schoolId,
    },
    select: { id: true },
  })

  return lessons.map((l) => l.id)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format lesson time range
 */
export function formatLessonTime(lesson: {
  startTime: string
  endTime: string
}): string {
  return `${lesson.startTime} - ${lesson.endTime}`
}

/**
 * Get lesson status color
 */
export function getLessonStatusColor(
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
): string {
  switch (status) {
    case "PLANNED":
      return "blue"
    case "IN_PROGRESS":
      return "yellow"
    case "COMPLETED":
      return "green"
    case "CANCELLED":
      return "red"
    default:
      return "gray"
  }
}

/**
 * Get lesson statistics for a school
 * @param schoolId - School ID
 * @returns Promise with statistics
 */
export async function getLessonStats(schoolId: string) {
  const now = new Date()
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const [total, byStatus, thisWeek, completed] = await Promise.all([
    db.lesson.count({ where: { schoolId } }),
    db.lesson.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { status: true },
    }),
    db.lesson.count({
      where: {
        schoolId,
        lessonDate: { gte: now, lte: weekFromNow },
      },
    }),
    db.lesson.count({
      where: { schoolId, status: "COMPLETED" },
    }),
  ])

  return {
    total,
    byStatus: byStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<string, number>
    ),
    thisWeek,
    completionRate:
      total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0,
  }
}
