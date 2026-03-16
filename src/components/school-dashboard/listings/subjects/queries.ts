// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Query builders for Subjects module
 *
 * Since the Subject model has been removed, all queries now go through
 * SchoolSubjectSelection (bridge) → CatalogSubject.
 *
 * Centralizes query logic for:
 * - Filtering, sorting, pagination
 * - Multi-tenant safety (schoolId)
 */

import { db } from "@/lib/db"
import { getSchoolSubjects } from "@/lib/school-subjects"

// ============================================================================
// Types
// ============================================================================

export type SubjectListFilters = {
  search?: string
  department?: string
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
// Query Functions
// ============================================================================

/**
 * Get subjects list with filtering, sorting, pagination.
 * Uses SchoolSubjectSelection → CatalogSubject.
 */
export async function getSubjectList(
  schoolId: string,
  params: Partial<SubjectQueryParams> = {}
) {
  const allSubjects = await getSchoolSubjects(schoolId)

  // Apply filters
  let filtered = allSubjects

  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        (s.department && s.department.toLowerCase().includes(searchLower))
    )
  }

  if (params.department) {
    filtered = filtered.filter((s) => s.department === params.department)
  }

  // Sort
  const sortParams = params.sort
  if (sortParams?.length) {
    filtered.sort((a, b) => {
      for (const s of sortParams) {
        const key = s.id as keyof typeof a
        const aVal = String(a[key] ?? "")
        const bVal = String(b[key] ?? "")
        const cmp = aVal.localeCompare(bVal)
        if (cmp !== 0) return s.desc ? -cmp : cmp
      }
      return 0
    })
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Paginate
  const page = params.page ?? 1
  const perPage = params.perPage ?? 20
  const skip = (page - 1) * perPage
  const rows = filtered.slice(skip, skip + perPage)

  return { rows, count: filtered.length }
}

/**
 * Get single subject by CatalogSubject ID (verified for school).
 */
export async function getSubjectDetail(schoolId: string, id: string) {
  const selection = await db.schoolSubjectSelection.findFirst({
    where: { schoolId, catalogSubjectId: id, isActive: true },
    include: {
      subject: true,
    },
  })
  return selection?.subject ?? null
}

/**
 * Get subjects for a specific department
 */
export async function getDepartmentSubjects(
  schoolId: string,
  department: string
) {
  const allSubjects = await getSchoolSubjects(schoolId)
  return allSubjects
    .filter((s) => s.department === department)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Check if subjects exist and belong to school
 */
export async function verifySubjectOwnership(
  schoolId: string,
  subjectIds: string[]
) {
  const selections = await db.schoolSubjectSelection.findMany({
    where: {
      schoolId,
      catalogSubjectId: { in: subjectIds },
      isActive: true,
    },
    select: { catalogSubjectId: true },
  })
  return selections.map((s) => s.catalogSubjectId)
}

/**
 * Get subject statistics for a school
 */
export async function getSubjectStats(schoolId: string) {
  const allSubjects = await getSchoolSubjects(schoolId)

  const byDepartment: Record<string, number> = {}
  for (const s of allSubjects) {
    const dept = s.department || "Unknown"
    byDepartment[dept] = (byDepartment[dept] || 0) + 1
  }

  return {
    total: allSubjects.length,
    byDepartment,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format subject display with department
 */
export function formatSubjectWithDepartment(subject: {
  name: string
  department?: string | null
}): string {
  if (subject.department) {
    return `${subject.name} (${subject.department})`
  }
  return subject.name
}
