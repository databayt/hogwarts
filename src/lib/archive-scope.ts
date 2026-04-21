// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Archive scope helper for archivable listing models.
 *
 * Listing models (Student, Teacher, Class, etc.) have an `archivedAt` field
 * that is null for active records and a timestamp for archived records. Queries
 * must explicitly declare which scope they want — the DB layer does NOT auto-filter.
 * This prevents accidental filtering on relation includes (e.g., you want to see
 * the attendance history of an archived student, not an empty array).
 *
 * Default scope is "active" — most list UIs want only live records.
 */

export type ArchiveScope = "active" | "archived" | "all"

/**
 * Merges an archive-scope filter into a Prisma `where` object.
 *
 * @example
 *   db.student.findMany({
 *     where: withArchiveScope({ schoolId }, "active")
 *   })
 */
export function withArchiveScope<W extends Record<string, unknown>>(
  where: W,
  scope: ArchiveScope = "active"
): W {
  if (scope === "active") return { ...where, archivedAt: null }
  if (scope === "archived") return { ...where, archivedAt: { not: null } }
  return where
}

/**
 * Models that use the `archivedAt` lifecycle pattern. Referenced by the dev-mode
 * observer in `src/lib/db.ts` to warn about archivable queries that omit the
 * scope filter.
 */
export const ARCHIVABLE_MODELS = new Set([
  "Student",
  "Guardian",
  "Teacher",
  "Class",
  "Classroom",
  "StaffMember",
  "Announcement",
  "SchoolAssignment",
  "Event",
  "AcademicGrade",
])
