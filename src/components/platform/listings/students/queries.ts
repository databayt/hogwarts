/**
 * Query builders for Students module
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

export type StudentListFilters = {
  search?: string
  status?: "active" | "inactive"
  classId?: string
  yearLevel?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type StudentQueryParams = StudentListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const studentListSelect = {
  id: true,
  givenName: true,
  middleName: true,
  surname: true,
  gender: true,
  userId: true,
  enrollmentDate: true,
  createdAt: true,
  studentClasses: {
    select: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 1,
  },
} as const

/** Full fields for detail/edit */
export const studentDetailSelect = {
  id: true,
  schoolId: true,
  givenName: true,
  middleName: true,
  surname: true,
  dateOfBirth: true,
  gender: true,
  enrollmentDate: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      image: true,
    },
  },
  studentClasses: {
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  studentGuardians: {
    include: {
      guardian: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          emailAddress: true,
        },
      },
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for student queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildStudentWhere(
  schoolId: string,
  filters: StudentListFilters = {}
): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = { schoolId }

  // Search by name
  if (filters.search) {
    where.OR = [
      {
        givenName: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        surname: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  // Status filter (active = has userId, inactive = no userId)
  if (filters.status === "active") {
    where.NOT = { userId: null }
  } else if (filters.status === "inactive") {
    where.userId = null
  }

  // Class filter
  if (filters.classId) {
    where.studentClasses = {
      some: {
        classId: filters.classId,
      },
    }
  }

  return where
}

/**
 * Build order by clause
 */
export function buildStudentOrderBy(
  sortParams?: SortParam[]
): Prisma.StudentOrderByWithRelationInput[] {
  if (sortParams?.length) {
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
 * Get students list with filtering, sorting, pagination
 */
export async function getStudentList(
  schoolId: string,
  params: Partial<StudentQueryParams> = {}
) {
  const where = buildStudentWhere(schoolId, params)
  const orderBy = buildStudentOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.student.findMany({
      where,
      orderBy,
      skip,
      take,
      select: studentListSelect,
    }),
    db.student.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single student by ID
 */
export async function getStudentDetail(schoolId: string, id: string) {
  return db.student.findFirst({
    where: { id, schoolId },
    select: studentDetailSelect,
  })
}

/**
 * Get students for a specific class
 */
export async function getClassStudents(schoolId: string, classId: string) {
  return db.student.findMany({
    where: {
      schoolId,
      studentClasses: {
        some: {
          classId,
        },
      },
    },
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    select: studentListSelect,
  })
}

/**
 * Check if students exist and belong to school
 */
export async function verifyStudentOwnership(
  schoolId: string,
  studentIds: string[]
) {
  const students = await db.student.findMany({
    where: {
      id: { in: studentIds },
      schoolId,
    },
    select: { id: true },
  })

  return students.map((s) => s.id)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format student full name
 */
export function formatStudentName(student: {
  givenName: string
  middleName?: string | null
  surname: string
}): string {
  return [student.givenName, student.middleName, student.surname]
    .filter(Boolean)
    .join(" ")
}

/**
 * Get student initials for avatar
 */
export function getStudentInitials(student: {
  givenName: string
  surname: string
}): string {
  return `${student.givenName.charAt(0)}${student.surname.charAt(0)}`.toUpperCase()
}
