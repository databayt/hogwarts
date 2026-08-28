// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const studentsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  name: parseAsString.withDefault(""),
  className: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  scope: parseAsStringLiteral([
    "active",
    "archived",
    "all",
  ] as const).withDefault("active"),
  /**
   * "Unplaced" = no homeroom seat OR no grade. Both matter, and the second is
   * the dangerous one: `ensureStudentFeeAssignments` short-circuits to
   * `{ skipped: 1 }` when `academicGradeId` is null, silently and with no
   * warning — so a gradeless student is assigned no fees, gets no invoices,
   * and is never chased by the fee-due/fee-overdue crons. They fall out of the
   * money flow entirely, and until this filter nothing surfaced them.
   *
   * Setting a grade from the student list calls `ensureStudentFeeAssignments`
   * again (`actions.ts` `updateStudent`), which backfills what was missed.
   */
  unplaced: parseAsStringLiteral([
    "",
    "seat",
    "grade",
    "any",
  ] as const).withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type StudentsSearch = Awaited<
  ReturnType<typeof studentsSearchParams.parse>
>

/**
 * Map a table sort id to a Prisma `orderBy` clause.
 *
 * Sorting here is server-side (`manualSorting`), and the sort id used to be
 * spread straight into `orderBy` as `{ [s.id]: dir }`. That works only while
 * every sortable column IS a Student scalar — and four of them are not:
 * `name` is composed from firstName/lastName, `gradeName` comes from the
 * related AcademicGrade, `classroom` from Section -> Classroom, and `phone`
 * from mobileNumber. Prisma rejects all four ("Unknown argument `name`"), and
 * `StudentsContent` has no try/catch, so any URL carrying one of those sorts —
 * a shared link, a reload after clicking the header, a back-button — took the
 * whole page down.
 *
 * Returns an array because one visible column can need several keys: sorting
 * by "name" has to order on first name then last.
 */
function studentSortKey(
  id: string,
  dir: "asc" | "desc"
): Record<string, unknown>[] {
  switch (id) {
    case "name":
      return [{ firstName: dir }, { lastName: dir }]
    case "gradeName":
      return [{ academicGrade: { gradeNumber: dir } }]
    case "classroom":
      return [{ section: { classroom: { roomName: dir } } }]
    case "phone":
      return [{ mobileNumber: dir }]
    default:
      // Real Student scalars pass through, but only from the allowlist below —
      // `sort` arrives from the URL, so an unrecognised id would otherwise be
      // spread into `orderBy` verbatim and crash the page just as the derived
      // columns did.
      return SORTABLE_SCALARS.has(id) ? [{ [id]: dir }] : []
  }
}

/** Student scalars the table exposes as sortable columns. */
const SORTABLE_SCALARS = new Set([
  "studentId",
  "status",
  "createdAt",
  "dateOfBirth",
  "enrollmentDate",
])

/**
 * Build the full `orderBy` for a students query, falling back to newest-first.
 * Shared by the server-rendered first page (`content.tsx`) and the load-more /
 * search action (`actions.ts`) so the two can never disagree about ordering.
 */
export function buildStudentOrderBy(sort: unknown): Record<string, unknown>[] {
  if (!Array.isArray(sort) || sort.length === 0) {
    return [{ createdAt: "desc" }]
  }
  const clauses = sort.flatMap((s) => {
    // `sort` is parsed from the URL, so entries can be anything at all —
    // null, a number, an object with no id. Reject before destructuring.
    if (typeof s !== "object" || s === null) return []
    const { id, desc } = s as { id?: unknown; desc?: unknown }
    if (typeof id !== "string" || !id) return []
    return studentSortKey(id, desc ? "desc" : "asc")
  })
  // Every id was unrecognised — order by something rather than nothing, or the
  // page number stops meaning anything across requests.
  return clauses.length > 0 ? clauses : [{ createdAt: "desc" }]
}

/**
 * Prisma filter for the "unplaced" toolbar chip. Kept next to the parser so the
 * two cannot drift, mirroring `buildStudentOrderBy`.
 */
export function buildUnplacedFilter(
  unplaced: StudentsSearch["unplaced"]
): Record<string, unknown> {
  switch (unplaced) {
    case "seat":
      return { sectionId: null }
    case "grade":
      return { academicGradeId: null }
    case "any":
      return { OR: [{ sectionId: null }, { academicGradeId: null }] }
    default:
      return {}
  }
}
