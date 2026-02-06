/**
 * Query builders for Subjects module
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

export type SubjectListFilters = {
  search?: string
  departmentId?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type SubjectQueryParams = SubjectListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const subjectListSelect = {
  id: true,
  subjectName: true,
  createdAt: true,
  department: {
    select: {
      id: true,
      departmentName: true,
    },
  },
  _count: {
    select: {
      classes: true,
    },
  },
} as const

/** Full fields for detail/edit */
export const subjectDetailSelect = {
  id: true,
  schoolId: true,
  subjectName: true,
  departmentId: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: {
      id: true,
      departmentName: true,
    },
  },
  classes: {
    select: {
      id: true,
      name: true,
      courseCode: true,
      teacher: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for subject queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildSubjectWhere(
  schoolId: string,
  filters: SubjectListFilters = {}
): Prisma.SubjectWhereInput {
  const where: Prisma.SubjectWhereInput = { schoolId }

  // Search by name
  if (filters.search) {
    where.subjectName = {
      contains: filters.search,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  // Department filter
  if (filters.departmentId) {
    where.departmentId = filters.departmentId
  }

  return where
}

/**
 * Build order by clause
 */
export function buildSubjectOrderBy(
  sortParams?: SortParam[]
): Prisma.SubjectOrderByWithRelationInput[] {
  if (sortParams?.length) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }
  return [{ subjectName: Prisma.SortOrder.asc }]
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
 * Get subjects list with filtering, sorting, pagination
 */
export async function getSubjectList(
  schoolId: string,
  params: Partial<SubjectQueryParams> = {}
) {
  const where = buildSubjectWhere(schoolId, params)
  const orderBy = buildSubjectOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.subject.findMany({
      where,
      orderBy,
      skip,
      take,
      select: subjectListSelect,
    }),
    db.subject.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single subject by ID
 */
export async function getSubjectDetail(schoolId: string, id: string) {
  return db.subject.findFirst({
    where: { id, schoolId },
    select: subjectDetailSelect,
  })
}

/**
 * Get subjects for a specific department
 */
export async function getDepartmentSubjects(
  schoolId: string,
  departmentId: string
) {
  return db.subject.findMany({
    where: {
      schoolId,
      departmentId,
    },
    orderBy: { subjectName: "asc" },
    select: subjectListSelect,
  })
}

/**
 * Check if subjects exist and belong to school
 */
export async function verifySubjectOwnership(
  schoolId: string,
  subjectIds: string[]
) {
  const subjects = await db.subject.findMany({
    where: {
      id: { in: subjectIds },
      schoolId,
    },
    select: { id: true },
  })

  return subjects.map((s) => s.id)
}

/**
 * Get subject statistics for a school
 * @param schoolId - School ID
 * @returns Promise with statistics
 */
export async function getSubjectStats(schoolId: string) {
  const [total, subjects] = await Promise.all([
    db.subject.count({ where: { schoolId } }),
    db.subject.findMany({
      where: { schoolId },
      select: {
        id: true,
        subjectName: true,
        departmentId: true,
        _count: {
          select: { classes: true },
        },
      },
    }),
  ])

  const byDepartment: Record<string, number> = {}
  let withNoClasses = 0
  let mostClassesSubject = { name: "", count: 0 }

  subjects.forEach((s) => {
    byDepartment[s.departmentId] = (byDepartment[s.departmentId] || 0) + 1
    if (s._count.classes === 0) withNoClasses++
    if (s._count.classes > mostClassesSubject.count) {
      mostClassesSubject = { name: s.subjectName, count: s._count.classes }
    }
  })

  return {
    total,
    byDepartment,
    withNoClasses,
    mostClassesSubject,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format subject display with department
 */
export function formatSubjectWithDepartment(subject: {
  subjectName: string
  department?: { departmentName: string } | null
}): string {
  if (subject.department) {
    return `${subject.subjectName} (${subject.department.departmentName})`
  }
  return subject.subjectName
}
