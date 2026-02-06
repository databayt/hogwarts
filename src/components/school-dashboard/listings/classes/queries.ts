/**
 * Query builders for Classes module
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

export type ClassListFilters = {
  search?: string
  subjectId?: string
  teacherId?: string
  termId?: string
  evaluationType?: "NORMAL" | "GPA" | "CWA" | "CCE"
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type ClassQueryParams = ClassListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const classListSelect = {
  id: true,
  name: true,
  courseCode: true,
  credits: true,
  evaluationType: true,
  maxCapacity: true,
  createdAt: true,
  subject: {
    select: {
      id: true,
      subjectName: true,
    },
  },
  teacher: {
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  },
  term: {
    select: {
      id: true,
      termName: true,
    },
  },
  _count: {
    select: {
      studentClasses: true,
    },
  },
} as const

/** Full fields for detail/edit */
export const classDetailSelect = {
  id: true,
  schoolId: true,
  name: true,
  courseCode: true,
  credits: true,
  evaluationType: true,
  minCapacity: true,
  maxCapacity: true,
  duration: true,
  prerequisiteId: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: {
      id: true,
      subjectName: true,
    },
  },
  teacher: {
    select: {
      id: true,
      givenName: true,
      surname: true,
      emailAddress: true,
    },
  },
  term: {
    select: {
      id: true,
      termName: true,
    },
  },
  startPeriod: {
    select: {
      id: true,
      periodName: true,
    },
  },
  endPeriod: {
    select: {
      id: true,
      periodName: true,
    },
  },
  classroom: {
    select: {
      id: true,
      roomName: true,
    },
  },
  prerequisite: {
    select: {
      id: true,
      name: true,
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
  subjectTeachers: {
    include: {
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

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for class queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildClassWhere(
  schoolId: string,
  filters: ClassListFilters = {}
): Prisma.ClassWhereInput {
  const where: Prisma.ClassWhereInput = { schoolId }

  // Search by name or course code
  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        courseCode: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  // Subject filter
  if (filters.subjectId) {
    where.subjectId = filters.subjectId
  }

  // Teacher filter
  if (filters.teacherId) {
    where.teacherId = filters.teacherId
  }

  // Term filter
  if (filters.termId) {
    where.termId = filters.termId
  }

  // Evaluation type filter
  if (filters.evaluationType) {
    where.evaluationType = filters.evaluationType
  }

  return where
}

/**
 * Build order by clause
 */
export function buildClassOrderBy(
  sortParams?: SortParam[]
): Prisma.ClassOrderByWithRelationInput[] {
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
 * Get classes list with filtering, sorting, pagination
 */
export async function getClassList(
  schoolId: string,
  params: Partial<ClassQueryParams> = {}
) {
  const where = buildClassWhere(schoolId, params)
  const orderBy = buildClassOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.class.findMany({
      where,
      orderBy,
      skip,
      take,
      select: classListSelect,
    }),
    db.class.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single class by ID
 */
export async function getClassDetail(schoolId: string, id: string) {
  return db.class.findFirst({
    where: { id, schoolId },
    select: classDetailSelect,
  })
}

/**
 * Get classes for a specific teacher
 */
export async function getTeacherClasses(schoolId: string, teacherId: string) {
  return db.class.findMany({
    where: {
      schoolId,
      teacherId,
    },
    orderBy: { name: "asc" },
    select: classListSelect,
  })
}

/**
 * Get classes for a specific subject
 */
export async function getSubjectClasses(schoolId: string, subjectId: string) {
  return db.class.findMany({
    where: {
      schoolId,
      subjectId,
    },
    orderBy: { name: "asc" },
    select: classListSelect,
  })
}

/**
 * Check if classes exist and belong to school
 */
export async function verifyClassOwnership(
  schoolId: string,
  classIds: string[]
) {
  const classes = await db.class.findMany({
    where: {
      id: { in: classIds },
      schoolId,
    },
    select: { id: true },
  })

  return classes.map((c) => c.id)
}

/**
 * Get class statistics for a school
 * @param schoolId - School ID
 * @returns Promise with statistics
 */
export async function getClassStats(schoolId: string) {
  const [total, byTerm, classes] = await Promise.all([
    db.class.count({ where: { schoolId } }),
    db.class.groupBy({
      by: ["termId"],
      where: { schoolId },
      _count: { termId: true },
    }),
    db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        maxCapacity: true,
        _count: {
          select: { studentClasses: true },
        },
      },
    }),
  ])

  const totalEnrollment = classes.reduce(
    (sum, c) => sum + c._count.studentClasses,
    0
  )
  const avgUtilization =
    classes.length > 0
      ? classes.reduce((sum, c) => {
          const capacity = c.maxCapacity || 50
          return sum + (c._count.studentClasses / capacity) * 100
        }, 0) / classes.length
      : 0
  const atCapacity = classes.filter(
    (c) => c._count.studentClasses >= (c.maxCapacity || 50)
  ).length

  return {
    total,
    totalEnrollment,
    avgUtilization: Math.round(avgUtilization * 10) / 10,
    atCapacity,
    byTerm: byTerm.reduce(
      (acc, item) => {
        acc[item.termId] = item._count.termId
        return acc
      },
      {} as Record<string, number>
    ),
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format class display name with subject
 */
export function formatClassName(cls: {
  name: string
  subject?: { subjectName: string } | null
}): string {
  if (cls.subject) {
    return `${cls.name} - ${cls.subject.subjectName}`
  }
  return cls.name
}

/**
 * Get enrollment status text
 */
export function getEnrollmentStatus(
  enrolled: number,
  maxCapacity: number | null
): string {
  if (!maxCapacity) return `${enrolled} enrolled`
  return `${enrolled}/${maxCapacity}`
}
