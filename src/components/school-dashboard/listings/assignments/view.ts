// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `/assignments` is one page that shows each role its own side of homework.
 * This is the whole switch, kept pure so the page and its tests agree.
 *
 *  staff     — manage: the table, create, export, review hand-ins
 *  student   — their own list with hand-in
 *  guardian  — their children's, read-only
 *  none      — signed in but has no homework surface (accountant, user, …)
 */
export type AssignmentsView = "staff" | "student" | "guardian" | "none"

const STAFF_ROLES: ReadonlySet<string> = new Set([
  "DEVELOPER",
  "ADMIN",
  "PRINCIPAL",
  "TEACHER",
  "STAFF",
])

export function assignmentsViewForRole(
  role: string | null | undefined
): AssignmentsView {
  if (!role) return "none"
  if (STAFF_ROLES.has(role)) return "staff"
  if (role === "STUDENT") return "student"
  if (role === "GUARDIAN") return "guardian"
  return "none"
}
