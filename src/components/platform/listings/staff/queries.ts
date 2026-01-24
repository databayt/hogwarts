/**
 * Query builders for Staff module
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

export type StaffListFilters = {
  search?: string
  status?: "active" | "inactive"
  employmentStatus?: "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "RETIRED"
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY"
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

export type StaffQueryParams = StaffListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const staffListSelect = {
  id: true,
  employeeId: true,
  givenName: true,
  surname: true,
  emailAddress: true,
  gender: true,
  position: true,
  employmentStatus: true,
  employmentType: true,
  userId: true,
  createdAt: true,
  department: {
    select: {
      id: true,
      departmentName: true,
    },
  },
} as const

/** Full fields for detail/edit */
export const staffDetailSelect = {
  id: true,
  schoolId: true,
  employeeId: true,
  givenName: true,
  surname: true,
  gender: true,
  emailAddress: true,
  birthDate: true,
  joiningDate: true,
  employmentStatus: true,
  employmentType: true,
  contractStartDate: true,
  contractEndDate: true,
  profilePhotoUrl: true,
  position: true,
  departmentId: true,
  phoneNumber: true,
  alternatePhone: true,
  address: true,
  city: true,
  state: true,
  country: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelation: true,
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
  department: {
    select: {
      id: true,
      departmentName: true,
    },
  },
  qualifications: {
    select: {
      id: true,
      qualificationType: true,
      name: true,
      institution: true,
      dateObtained: true,
    },
  },
  experiences: {
    select: {
      id: true,
      organization: true,
      position: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for staff queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildStaffWhere(
  schoolId: string,
  filters: StaffListFilters = {}
): Prisma.StaffMemberWhereInput {
  const where: Prisma.StaffMemberWhereInput = { schoolId }

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
      {
        position: {
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

  // Employment status filter
  if (filters.employmentStatus) {
    where.employmentStatus = filters.employmentStatus
  }

  // Employment type filter
  if (filters.employmentType) {
    where.employmentType = filters.employmentType
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
export function buildStaffOrderBy(
  sortParams?: SortParam[]
): Prisma.StaffMemberOrderByWithRelationInput[] {
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
 * Get staff list with filtering, sorting, pagination
 */
export async function getStaffList(
  schoolId: string,
  params: Partial<StaffQueryParams> = {}
) {
  const where = buildStaffWhere(schoolId, params)
  const orderBy = buildStaffOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.staffMember.findMany({
      where,
      orderBy,
      skip,
      take,
      select: staffListSelect,
    }),
    db.staffMember.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single staff member by ID
 */
export async function getStaffDetail(schoolId: string, id: string) {
  return db.staffMember.findFirst({
    where: { id, schoolId },
    select: staffDetailSelect,
  })
}

/**
 * Get staff members by department
 */
export async function getDepartmentStaff(
  schoolId: string,
  departmentId: string
) {
  return db.staffMember.findMany({
    where: {
      schoolId,
      departmentId,
    },
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    select: staffListSelect,
  })
}

/**
 * Get active staff members
 */
export async function getActiveStaff(schoolId: string) {
  return db.staffMember.findMany({
    where: {
      schoolId,
      employmentStatus: "ACTIVE",
    },
    orderBy: [{ surname: "asc" }, { givenName: "asc" }],
    select: staffListSelect,
  })
}

/**
 * Check if staff members exist and belong to school
 */
export async function verifyStaffOwnership(
  schoolId: string,
  staffIds: string[]
) {
  const staff = await db.staffMember.findMany({
    where: {
      id: { in: staffIds },
      schoolId,
    },
    select: { id: true },
  })

  return staff.map((s) => s.id)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format staff full name
 */
export function formatStaffName(staff: {
  givenName: string
  surname: string
}): string {
  return `${staff.givenName} ${staff.surname}`
}

/**
 * Get staff initials for avatar
 */
export function getStaffInitials(staff: {
  givenName: string
  surname: string
}): string {
  return `${staff.givenName.charAt(0)}${staff.surname.charAt(0)}`.toUpperCase()
}
