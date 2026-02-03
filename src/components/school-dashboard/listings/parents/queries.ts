/**
 * Query builders for Parents (Guardians) module
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

export type ParentListFilters = {
  search?: string
  status?: "active" | "inactive"
  guardianTypeId?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type ParentQueryParams = ParentListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const parentListSelect = {
  id: true,
  givenName: true,
  surname: true,
  emailAddress: true,
  phoneNumber: true,
  userId: true,
  createdAt: true,
  studentGuardians: {
    select: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
      relationshipType: true,
    },
    take: 3,
  },
} as const

/** Full fields for detail/edit */
export const parentDetailSelect = {
  id: true,
  schoolId: true,
  givenName: true,
  middleName: true,
  surname: true,
  emailAddress: true,
  phoneNumber: true,
  alternativePhone: true,
  address: true,
  city: true,
  state: true,
  country: true,
  occupation: true,
  workplaceAddress: true,
  workPhone: true,
  emergencyContact: true,
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
  studentGuardians: {
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
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for parent queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildParentWhere(
  schoolId: string,
  filters: ParentListFilters = {}
): Prisma.GuardianWhereInput {
  const where: Prisma.GuardianWhereInput = { schoolId }

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

  // Guardian type filter
  if (filters.guardianTypeId) {
    where.studentGuardians = {
      some: {
        guardianTypeId: filters.guardianTypeId,
      },
    }
  }

  return where
}

/**
 * Build order by clause
 */
export function buildParentOrderBy(
  sortParams?: SortParam[]
): Prisma.GuardianOrderByWithRelationInput[] {
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
 * Get parents list with filtering, sorting, pagination
 */
export async function getParentList(
  schoolId: string,
  params: Partial<ParentQueryParams> = {}
) {
  const where = buildParentWhere(schoolId, params)
  const orderBy = buildParentOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.guardian.findMany({
      where,
      orderBy,
      skip,
      take,
      select: parentListSelect,
    }),
    db.guardian.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single parent by ID
 */
export async function getParentDetail(schoolId: string, id: string) {
  return db.guardian.findFirst({
    where: { id, schoolId },
    select: parentDetailSelect,
  })
}

/**
 * Get parents for a specific student
 */
export async function getStudentParents(schoolId: string, studentId: string) {
  return db.guardian.findMany({
    where: {
      schoolId,
      studentGuardians: {
        some: {
          studentId,
        },
      },
    },
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    select: parentListSelect,
  })
}

/**
 * Check if parents exist and belong to school
 */
export async function verifyParentOwnership(
  schoolId: string,
  parentIds: string[]
) {
  const parents = await db.guardian.findMany({
    where: {
      id: { in: parentIds },
      schoolId,
    },
    select: { id: true },
  })

  return parents.map((p) => p.id)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format parent full name
 */
export function formatParentName(parent: {
  givenName: string
  middleName?: string | null
  surname: string
}): string {
  return [parent.givenName, parent.middleName, parent.surname]
    .filter(Boolean)
    .join(" ")
}

/**
 * Get parent initials for avatar
 */
export function getParentInitials(parent: {
  givenName: string
  surname: string
}): string {
  return `${parent.givenName.charAt(0)}${parent.surname.charAt(0)}`.toUpperCase()
}
