// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Query builders for Finance Fees module
 * Pattern follows students module for consistency
 *
 * Centralizes query logic for:
 * - Filtering, sorting, pagination
 * - Select objects (list views)
 * - Multi-tenant safety (schoolId)
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type FeeListFilters = {
  search?: string
  status?: string
  academicYear?: string
  classId?: string
  isActive?: boolean
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type FeeQueryParams = FeeListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for fee structure list display */
export const feeStructureListSelect = {
  id: true,
  name: true,
  academicYear: true,
  stream: true,
  description: true,
  tuitionFee: true,
  admissionFee: true,
  registrationFee: true,
  examFee: true,
  libraryFee: true,
  laboratoryFee: true,
  sportsFee: true,
  transportFee: true,
  hostelFee: true,
  totalAmount: true,
  installments: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  class: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      feeAssignments: true,
    },
  },
} as const

/** Minimal fields for fee assignment list display */
export const feeAssignmentListSelect = {
  id: true,
  academicYear: true,
  customAmount: true,
  finalAmount: true,
  totalDiscount: true,
  status: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  },
  feeStructure: {
    select: {
      id: true,
      name: true,
    },
  },
  payments: {
    select: {
      amount: true,
      status: true,
    },
  },
  scholarship: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      payments: true,
    },
  },
} as const

/** Minimal fields for payment list display */
export const paymentListSelect = {
  id: true,
  paymentNumber: true,
  amount: true,
  paymentDate: true,
  paymentMethod: true,
  transactionId: true,
  bankName: true,
  chequeNumber: true,
  cardLastFour: true,
  receiptNumber: true,
  receiptUrl: true,
  status: true,
  verifiedBy: true,
  remarks: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  },
  feeAssignment: {
    select: {
      id: true,
      feeStructure: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const

/** Minimal fields for scholarship list display */
export const scholarshipListSelect = {
  id: true,
  name: true,
  description: true,
  coverageType: true,
  coverageAmount: true,
  academicYear: true,
  startDate: true,
  endDate: true,
  maxBeneficiaries: true,
  currentBeneficiaries: true,
  isActive: true,
  createdAt: true,
  _count: {
    select: {
      applications: true,
    },
  },
} as const

/** Minimal fields for fine list display */
export const fineListSelect = {
  id: true,
  fineType: true,
  amount: true,
  reason: true,
  dueDate: true,
  isPaid: true,
  paidAmount: true,
  paidDate: true,
  isWaived: true,
  waivedBy: true,
  waivedDate: true,
  waiverReason: true,
  createdAt: true,
  student: {
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for fee structure queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildFeeStructureWhere(
  schoolId: string,
  filters: FeeListFilters = {}
): Prisma.FeeStructureWhereInput {
  const where: Prisma.FeeStructureWhereInput = {
    schoolId,
  }

  if (filters.search) {
    where.OR = [
      {
        name: {
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
    ]
  }

  if (filters.academicYear) {
    where.academicYear = filters.academicYear
  }

  if (filters.classId) {
    where.classId = filters.classId
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  return where
}

/**
 * Build where clause for fee assignment queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildFeeAssignmentWhere(
  schoolId: string,
  filters: FeeListFilters = {}
): Prisma.FeeAssignmentWhereInput {
  const where: Prisma.FeeAssignmentWhereInput = {
    schoolId,
  }

  if (filters.search) {
    where.OR = [
      {
        student: {
          givenName: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        student: {
          surname: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        feeStructure: {
          name: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
    ]
  }

  if (filters.status) {
    where.status = filters.status as Prisma.EnumFeeStatusFilter["equals"]
  }

  if (filters.academicYear) {
    where.academicYear = filters.academicYear
  }

  return where
}

/**
 * Build where clause for payment queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildPaymentWhere(
  schoolId: string,
  filters: FeeListFilters = {}
): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {
    schoolId,
  }

  if (filters.search) {
    where.OR = [
      {
        student: {
          givenName: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        student: {
          surname: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        receiptNumber: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        transactionId: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  if (filters.status) {
    where.status = filters.status as Prisma.EnumPaymentStatusFilter["equals"]
  }

  return where
}

/**
 * Build where clause for scholarship queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildScholarshipWhere(
  schoolId: string,
  filters: FeeListFilters = {}
): Prisma.ScholarshipWhereInput {
  const where: Prisma.ScholarshipWhereInput = {
    schoolId,
  }

  if (filters.search) {
    where.OR = [
      {
        name: {
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
    ]
  }

  if (filters.academicYear) {
    where.academicYear = filters.academicYear
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  return where
}

/**
 * Build where clause for fine queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildFineWhere(
  schoolId: string,
  filters: FeeListFilters = {}
): Prisma.FineWhereInput {
  const where: Prisma.FineWhereInput = {
    schoolId,
  }

  if (filters.search) {
    where.OR = [
      {
        student: {
          givenName: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        student: {
          surname: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        reason: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  if (filters.status === "paid") {
    where.isPaid = true
  } else if (filters.status === "unpaid") {
    where.isPaid = false
    where.isWaived = false
  } else if (filters.status === "waived") {
    where.isWaived = true
  }

  return where
}

/**
 * Build order by clause for fee-related queries
 */
export function buildFeeOrderBy(
  sortParams?: SortParam[]
): Record<string, Prisma.SortOrder>[] {
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
 * Get fee structures list with filtering, sorting, pagination
 */
export async function getFeeStructureList(
  schoolId: string,
  params: Partial<FeeQueryParams> = {}
) {
  const where = buildFeeStructureWhere(schoolId, params)
  const orderBy = buildFeeOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.feeStructure.findMany({
      where,
      orderBy,
      skip,
      take,
      select: feeStructureListSelect,
    }),
    db.feeStructure.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get fee assignments list with filtering, sorting, pagination
 */
export async function getFeeAssignmentList(
  schoolId: string,
  params: Partial<FeeQueryParams> = {}
) {
  const where = buildFeeAssignmentWhere(schoolId, params)
  const orderBy = buildFeeOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.feeAssignment.findMany({
      where,
      orderBy,
      skip,
      take,
      select: feeAssignmentListSelect,
    }),
    db.feeAssignment.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get payments list with filtering, sorting, pagination
 */
export async function getPaymentList(
  schoolId: string,
  params: Partial<FeeQueryParams> = {}
) {
  const where = buildPaymentWhere(schoolId, params)
  const orderBy = buildFeeOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy,
      skip,
      take,
      select: paymentListSelect,
    }),
    db.payment.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get scholarships list with filtering, sorting, pagination
 */
export async function getScholarshipList(
  schoolId: string,
  params: Partial<FeeQueryParams> = {}
) {
  const where = buildScholarshipWhere(schoolId, params)
  const orderBy = buildFeeOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.scholarship.findMany({
      where,
      orderBy,
      skip,
      take,
      select: scholarshipListSelect,
    }),
    db.scholarship.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get fines list with filtering, sorting, pagination
 */
export async function getFineList(
  schoolId: string,
  params: Partial<FeeQueryParams> = {}
) {
  const where = buildFineWhere(schoolId, params)
  const orderBy = buildFeeOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.fine.findMany({
      where,
      orderBy,
      skip,
      take,
      select: fineListSelect,
    }),
    db.fine.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get fee statistics for a school
 * @param schoolId - School ID
 * @returns Promise with fee statistics
 */
export async function getFeeStats(schoolId: string) {
  const [
    totalStructures,
    activeStructures,
    assignmentsByStatus,
    totalCollected,
    totalPending,
    totalScholarships,
    totalFines,
    unpaidFines,
  ] = await Promise.all([
    db.feeStructure.count({ where: { schoolId } }),
    db.feeStructure.count({ where: { schoolId, isActive: true } }),
    db.feeAssignment.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { status: true },
      _sum: { finalAmount: true },
    }),
    db.payment.aggregate({
      where: { schoolId, status: "SUCCESS" },
      _sum: { amount: true },
    }),
    db.feeAssignment.aggregate({
      where: { schoolId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
      _sum: { finalAmount: true },
    }),
    db.scholarship.count({ where: { schoolId, isActive: true } }),
    db.fine.count({ where: { schoolId } }),
    db.fine.count({ where: { schoolId, isPaid: false, isWaived: false } }),
  ])

  return {
    totalStructures,
    activeStructures,
    assignmentsByStatus: assignmentsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = {
          count: item._count.status,
          amount: item._sum.finalAmount?.toNumber() ?? 0,
        }
        return acc
      },
      {} as Record<string, { count: number; amount: number }>
    ),
    totalCollected: totalCollected._sum.amount?.toNumber() ?? 0,
    totalPending: totalPending._sum.finalAmount?.toNumber() ?? 0,
    totalScholarships,
    totalFines,
    unpaidFines,
  }
}
