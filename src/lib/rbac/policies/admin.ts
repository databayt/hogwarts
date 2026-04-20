// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// ADMIN owns a single school. They can do anything inside it, but nothing
// outside. Every rule is schoolId-scoped via CASL conditions so that
// accessibleBy(ability).<Model> returns a Prisma where clause that pins
// queries to the admin's school automatically.
export function adminRules(
  ctx: PolicyContext,
  { can, cannot }: AbilityBuilder<AppAbility>
) {
  const schoolId = ctx.schoolId
  if (!schoolId) {
    // An ADMIN with no schoolId is an invariant violation — the auth
    // refresh flow forces a DB re-read when this happens (see auth.ts
    // lines 532-652). Fail closed: grant nothing.
    return
  }

  // Blanket write access scoped to their school, on every subject they own.
  const schoolScoped = [
    "Student",
    "Teacher",
    "Guardian",
    "StaffMember",
    "Class",
    "Section",
    "Subject",
    "Assignment",
    "Attendance",
    "ExamResult",
    "Timetable",
    "Chapter",
    "Lesson",
    "Enrollment",
    "LessonProgress",
    "Announcement",
    "Event",
    "Message",
    "Invoice",
    "Payment",
    "Scholarship",
    "Expense",
    "Budget",
    "BankAccount",
    "SalarySlip",
    "FinancePermission",
  ] as const

  for (const subject of schoolScoped) {
    can("manage", subject, { schoolId } as Record<string, unknown>)
  }

  // ADMIN can read their own school but never mutate another. School
  // updates happen via onboarding/settings actions that have their own
  // guard rails.
  can("read", "School", { id: schoolId } as Record<string, unknown>)
  can("update", "School", { id: schoolId } as Record<string, unknown>)

  // Explicit denies — even if a future bug widens the rules above, these
  // wire ADMIN out of platform-level concerns. Cross-school access, any
  // kind of platform admin toggling, stays DEVELOPER-only.
  cannot("manage", "School", { id: { not: schoolId } } as Record<
    string,
    unknown
  >)
}
