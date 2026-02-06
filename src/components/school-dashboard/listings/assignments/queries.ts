/**
 * Query builders for Assignments module
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

export type AssignmentListFilters = {
  search?: string
  classId?: string
  type?:
    | "HOMEWORK"
    | "QUIZ"
    | "TEST"
    | "MIDTERM"
    | "FINAL_EXAM"
    | "PROJECT"
    | "LAB_REPORT"
    | "ESSAY"
    | "PRESENTATION"
  status?: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "GRADED"
  dueDateFrom?: Date
  dueDateTo?: Date
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type AssignmentQueryParams = AssignmentListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const assignmentListSelect = {
  id: true,
  title: true,
  type: true,
  status: true,
  totalPoints: true,
  weight: true,
  dueDate: true,
  publishDate: true,
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
  _count: {
    select: {
      submissions: true,
    },
  },
} as const

/** Full fields for detail/edit */
export const assignmentDetailSelect = {
  id: true,
  schoolId: true,
  classId: true,
  title: true,
  description: true,
  type: true,
  status: true,
  totalPoints: true,
  weight: true,
  dueDate: true,
  publishDate: true,
  instructions: true,
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
  submissions: {
    include: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
    },
    orderBy: {
      submittedAt: Prisma.SortOrder.desc,
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for assignment queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildAssignmentWhere(
  schoolId: string,
  filters: AssignmentListFilters = {}
): Prisma.AssignmentWhereInput {
  const where: Prisma.AssignmentWhereInput = { schoolId }

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

  // Type filter
  if (filters.type) {
    where.type = filters.type
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status
  }

  // Due date range filter
  if (filters.dueDateFrom || filters.dueDateTo) {
    where.dueDate = {}
    if (filters.dueDateFrom) {
      where.dueDate.gte = filters.dueDateFrom
    }
    if (filters.dueDateTo) {
      where.dueDate.lte = filters.dueDateTo
    }
  }

  return where
}

/**
 * Build order by clause
 */
export function buildAssignmentOrderBy(
  sortParams?: SortParam[]
): Prisma.AssignmentOrderByWithRelationInput[] {
  if (sortParams?.length) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }
  return [{ dueDate: Prisma.SortOrder.asc }]
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
 * Get assignments list with filtering, sorting, pagination
 */
export async function getAssignmentList(
  schoolId: string,
  params: Partial<AssignmentQueryParams> = {}
) {
  const where = buildAssignmentWhere(schoolId, params)
  const orderBy = buildAssignmentOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.assignment.findMany({
      where,
      orderBy,
      skip,
      take,
      select: assignmentListSelect,
    }),
    db.assignment.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single assignment by ID
 */
export async function getAssignmentDetail(schoolId: string, id: string) {
  return db.assignment.findFirst({
    where: { id, schoolId },
    select: assignmentDetailSelect,
  })
}

/**
 * Get assignments for a specific class
 */
export async function getClassAssignments(schoolId: string, classId: string) {
  return db.assignment.findMany({
    where: {
      schoolId,
      classId,
    },
    orderBy: [{ dueDate: "asc" }],
    select: assignmentListSelect,
  })
}

/**
 * Get upcoming assignments (due soon)
 */
export async function getUpcomingAssignments(schoolId: string, limit = 5) {
  const now = new Date()

  return db.assignment.findMany({
    where: {
      schoolId,
      dueDate: { gte: now },
      status: { in: ["PUBLISHED", "IN_PROGRESS"] },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
    select: assignmentListSelect,
  })
}

/**
 * Get overdue assignments
 */
export async function getOverdueAssignments(schoolId: string) {
  const now = new Date()

  return db.assignment.findMany({
    where: {
      schoolId,
      dueDate: { lt: now },
      status: { in: ["PUBLISHED", "IN_PROGRESS"] },
    },
    orderBy: { dueDate: "asc" },
    select: assignmentListSelect,
  })
}

/**
 * Check if assignments exist and belong to school
 */
export async function verifyAssignmentOwnership(
  schoolId: string,
  assignmentIds: string[]
) {
  const assignments = await db.assignment.findMany({
    where: {
      id: { in: assignmentIds },
      schoolId,
    },
    select: { id: true },
  })

  return assignments.map((a) => a.id)
}

/**
 * Get assignment statistics for a school
 * @param schoolId - School ID
 * @returns Promise with statistics
 */
export async function getAssignmentStats(schoolId: string) {
  const now = new Date()

  const [total, byStatus, byType, overdue] = await Promise.all([
    db.assignment.count({ where: { schoolId } }),
    db.assignment.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { status: true },
    }),
    db.assignment.groupBy({
      by: ["type"],
      where: { schoolId },
      _count: { type: true },
    }),
    db.assignment.count({
      where: {
        schoolId,
        dueDate: { lt: now },
        status: { not: "COMPLETED" },
      },
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
    byType: byType.reduce(
      (acc, item) => {
        acc[item.type] = item._count.type
        return acc
      },
      {} as Record<string, number>
    ),
    overdue,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get assignment type display label
 */
export function getAssignmentTypeLabel(
  type:
    | "HOMEWORK"
    | "QUIZ"
    | "TEST"
    | "MIDTERM"
    | "FINAL_EXAM"
    | "PROJECT"
    | "LAB_REPORT"
    | "ESSAY"
    | "PRESENTATION"
): string {
  const labels: Record<string, string> = {
    HOMEWORK: "Homework",
    QUIZ: "Quiz",
    TEST: "Test",
    MIDTERM: "Midterm",
    FINAL_EXAM: "Final Exam",
    PROJECT: "Project",
    LAB_REPORT: "Lab Report",
    ESSAY: "Essay",
    PRESENTATION: "Presentation",
  }
  return labels[type] || type
}

/**
 * Get assignment status color
 */
export function getAssignmentStatusColor(
  status: "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED" | "GRADED"
): string {
  switch (status) {
    case "DRAFT":
      return "gray"
    case "PUBLISHED":
      return "blue"
    case "IN_PROGRESS":
      return "yellow"
    case "COMPLETED":
      return "green"
    case "GRADED":
      return "purple"
    default:
      return "gray"
  }
}

/**
 * Check if assignment is overdue
 */
export function isAssignmentOverdue(dueDate: Date): boolean {
  return new Date() > dueDate
}

/**
 * Get submission status text
 */
export function getSubmissionStatus(submitted: number, total: number): string {
  return `${submitted}/${total} submitted`
}
