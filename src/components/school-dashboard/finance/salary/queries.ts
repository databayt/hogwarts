// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Query builders for Finance Salary module
 * Pattern follows fees module for consistency
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

export type SalaryListFilters = {
  search?: string
  status?: string
  teacherId?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type SalaryQueryParams = SalaryListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for salary structure list display */
export const salaryStructureListSelect = {
  id: true,
  teacherId: true,
  baseSalary: true,
  currency: true,
  payFrequency: true,
  effectiveFrom: true,
  effectiveTo: true,
  isActive: true,
  notes: true,
  createdAt: true,
  teacher: {
    select: {
      id: true,
      givenName: true,
      surname: true,
      employeeId: true,
    },
  },
  _count: {
    select: {
      allowances: true,
      deductions: true,
      salarySlips: true,
    },
  },
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for salary structure queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildSalaryStructureWhere(
  schoolId: string,
  filters: SalaryListFilters = {}
): Prisma.SalaryStructureWhereInput {
  const where: Prisma.SalaryStructureWhereInput = {
    schoolId,
  }

  if (filters.search) {
    where.OR = [
      {
        teacher: {
          givenName: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        teacher: {
          surname: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
      {
        teacher: {
          employeeId: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      },
    ]
  }

  if (filters.teacherId) {
    where.teacherId = filters.teacherId
  }

  if (filters.status === "active") {
    where.isActive = true
  } else if (filters.status === "inactive") {
    where.isActive = false
  }

  return where
}

/**
 * Build order by clause for salary-related queries
 */
export function buildSalaryOrderBy(
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
 * Get salary structures list with filtering, sorting, pagination
 */
export async function getSalaryStructureList(
  schoolId: string,
  params: Partial<SalaryQueryParams> = {}
) {
  const where = buildSalaryStructureWhere(schoolId, params)
  const orderBy = buildSalaryOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.salaryStructure.findMany({
      where,
      orderBy,
      skip,
      take,
      select: salaryStructureListSelect,
    }),
    db.salaryStructure.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get salary statistics for a school
 * @param schoolId - School ID
 * @returns Promise with salary statistics
 */
export async function getSalaryStats(schoolId: string) {
  const [
    totalStructures,
    activeStructures,
    totalBaseSalary,
    totalAllowances,
    totalDeductions,
    totalSlips,
  ] = await Promise.all([
    db.salaryStructure.count({ where: { schoolId } }),
    db.salaryStructure.count({ where: { schoolId, isActive: true } }),
    db.salaryStructure.aggregate({
      where: { schoolId, isActive: true },
      _sum: { baseSalary: true },
    }),
    db.salaryAllowance.aggregate({
      where: { schoolId },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.salaryDeduction.aggregate({
      where: { schoolId },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.salarySlip.count({ where: { schoolId } }),
  ])

  return {
    totalStructures,
    activeStructures,
    totalBaseSalary: totalBaseSalary._sum.baseSalary?.toNumber() ?? 0,
    totalAllowances: {
      count: totalAllowances._count.id,
      amount: totalAllowances._sum.amount?.toNumber() ?? 0,
    },
    totalDeductions: {
      count: totalDeductions._count.id,
      amount: totalDeductions._sum.amount?.toNumber() ?? 0,
    },
    totalSlips,
  }
}
