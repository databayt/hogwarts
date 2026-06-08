// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read-only query builders for live classes.
 *
 * Single-Language Storage:
 * - Conference has title, description, and a `lang` field
 * - Content is stored in one language; translate on demand for display
 *
 * Multi-tenant: every where clause includes `schoolId` and `deletedAt: null`.
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type LiveClassListFilters = {
  title?: string // Searches title field
  status?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc: boolean
}

export type LiveClassQueryParams = LiveClassListFilters &
  PaginationParams & { sort?: SortParam[] }

// Relations included for display (teacher name, subject name, section name).
const liveClassListInclude = {
  teacher: {
    select: { id: true, firstName: true, lastName: true },
  },
  subject: {
    select: { id: true, name: true },
  },
  section: {
    select: { id: true, name: true },
  },
} as const

// ============================================================================
// Query builders
// ============================================================================

export function buildLiveClassWhere(
  schoolId: string,
  filters: LiveClassListFilters = {}
): Prisma.ConferenceWhereInput {
  const where: Prisma.ConferenceWhereInput = {
    schoolId,
    deletedAt: null,
  }

  if (filters.title) {
    where.title = {
      contains: filters.title,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.status) {
    where.status = filters.status as Prisma.ConferenceWhereInput["status"]
  }

  return where
}

export function buildLiveClassOrderBy(
  sortParams?: SortParam[]
): Prisma.ConferenceOrderByWithRelationInput[] {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }

  // Default: upcoming sessions first (most recent scheduledStart desc).
  return [{ scheduledStart: Prisma.SortOrder.desc }]
}

export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query functions
// ============================================================================

/**
 * Get live classes list with filtering, sorting, and pagination.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param params - Filters, sort, and pagination
 * @returns { rows, count }
 */
export async function getLiveClassesList(
  schoolId: string,
  params: Partial<LiveClassQueryParams> = {}
) {
  const where = buildLiveClassWhere(schoolId, params)
  const orderBy = buildLiveClassOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.conference.findMany({
      where,
      orderBy,
      skip,
      take,
      include: liveClassListInclude,
    }),
    db.conference.count({ where }),
  ])

  return { rows, count }
}

export type LiveClassFormOptions = {
  teachers: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  sections: { id: string; name: string }[]
}

/**
 * Dropdown options for the create/edit form (teachers, subjects, sections),
 * all scoped to the school. Resolved on the server and passed to the form as
 * props — the client must NOT re-fetch these on mount, or a parent re-render
 * loop turns into a request storm + flickering selects.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 */
export async function getLiveClassFormOptions(
  schoolId: string
): Promise<LiveClassFormOptions> {
  const [teachers, subjects, sections] = await Promise.all([
    db.teacher.findMany({
      where: { schoolId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    // Catalog Subject is global (no schoolId) — scope to the subjects this
    // school offers via the SubjectSelection bridge. A subject can be selected
    // for multiple grades, so dedupe by catalogSubjectId.
    db.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { subject: { select: { id: true, name: true } } },
      distinct: ["catalogSubjectId"],
      orderBy: { subject: { name: "asc" } },
    }),
    db.section.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return {
    teachers: teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim(),
    })),
    subjects: subjects.map((s) => ({ id: s.subject.id, name: s.subject.name })),
    sections: sections.map((s) => ({ id: s.id, name: s.name })),
  }
}

/**
 * Get a single live class by ID, scoped by school. Excludes soft-deleted rows.
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param id - Live class session ID
 */
export async function getLiveClassDetail(schoolId: string, id: string) {
  return db.conference.findFirst({
    where: {
      id,
      schoolId,
      deletedAt: null,
    },
    include: liveClassListInclude,
  })
}
