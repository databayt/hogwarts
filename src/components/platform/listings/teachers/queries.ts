/**
 * Query builders for Teachers module
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

export type TeacherListFilters = {
  search?: string
  status?: "active" | "inactive"
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

export type TeacherQueryParams = TeacherListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const teacherListSelect = {
  id: true,
  givenName: true,
  surname: true,
  emailAddress: true,
  gender: true,
  userId: true,
  createdAt: true,
} as const

/** Full fields for detail/edit */
export const teacherDetailSelect = {
  id: true,
  schoolId: true,
  givenName: true,
  middleName: true,
  surname: true,
  gender: true,
  dateOfBirth: true,
  emailAddress: true,
  phoneNumber: true,
  address: true,
  city: true,
  state: true,
  country: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelation: true,
  nationality: true,
  highestDegree: true,
  specialization: true,
  certifications: true,
  yearsOfExperience: true,
  previousSchools: true,
  subjectExpertise: true,
  gradeExpertise: true,
  employmentType: true,
  startDate: true,
  endDate: true,
  salary: true,
  bankName: true,
  accountNumber: true,
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
  classes: {
    select: {
      id: true,
      name: true,
    },
    take: 5,
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for teacher queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildTeacherWhere(
  schoolId: string,
  filters: TeacherListFilters = {}
): Prisma.TeacherWhereInput {
  const where: Prisma.TeacherWhereInput = { schoolId }

  // Search by name or email
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
      {
        emailAddress: {
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

  return where
}

/**
 * Build order by clause
 */
export function buildTeacherOrderBy(
  sortParams?: SortParam[]
): Prisma.TeacherOrderByWithRelationInput[] {
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
 * Get teachers list with filtering, sorting, pagination
 */
export async function getTeacherList(
  schoolId: string,
  params: Partial<TeacherQueryParams> = {}
) {
  const where = buildTeacherWhere(schoolId, params)
  const orderBy = buildTeacherOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.teacher.findMany({
      where,
      orderBy,
      skip,
      take,
      select: teacherListSelect,
    }),
    db.teacher.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single teacher by ID
 */
export async function getTeacherDetail(schoolId: string, id: string) {
  return db.teacher.findFirst({
    where: { id, schoolId },
    select: teacherDetailSelect,
  })
}

/**
 * Get teachers for a specific class
 */
export async function getClassTeachers(schoolId: string, classId: string) {
  return db.teacher.findMany({
    where: {
      schoolId,
      classes: {
        some: {
          id: classId,
        },
      },
    },
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    select: teacherListSelect,
  })
}

/**
 * Check if teachers exist and belong to school
 */
export async function verifyTeacherOwnership(
  schoolId: string,
  teacherIds: string[]
) {
  const teachers = await db.teacher.findMany({
    where: {
      id: { in: teacherIds },
      schoolId,
    },
    select: { id: true },
  })

  return teachers.map((t) => t.id)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format teacher full name
 */
export function formatTeacherName(teacher: {
  givenName: string
  middleName?: string | null
  surname: string
}): string {
  return [teacher.givenName, teacher.middleName, teacher.surname]
    .filter(Boolean)
    .join(" ")
}

/**
 * Get teacher initials for avatar
 */
export function getTeacherInitials(teacher: {
  givenName: string
  surname: string
}): string {
  return `${teacher.givenName.charAt(0)}${teacher.surname.charAt(0)}`.toUpperCase()
}
