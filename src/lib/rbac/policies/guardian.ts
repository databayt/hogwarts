// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// GUARDIAN sees their children. One guardian can have many students
// (StudentGuardian many-to-many). Today's UX is the aggregated view —
// every page lists rows for every child, prefixed with the child's name
// (decision: keep that; no child switcher).
//
// Rule shape: every "child-scoped" subject is conditioned on the student
// belonging to this guardian, expressed as a nested `some` predicate on
// StudentGuardian:
//
//   student: { guardians: { some: { guardianId: ctx.guardianId } } }
//
// CASL turns this into a Prisma where clause with the same shape.
export function guardianRules(
  ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  const { schoolId, guardianId, userId } = ctx
  if (!schoolId || !guardianId) {
    return
  }

  const myChildren = {
    guardians: { some: { guardianId } },
  }

  const aboutMyChildren = {
    student: { guardians: { some: { guardianId } } },
  }

  // -------------------------------------------------------------------------
  // Children — read-only
  // -------------------------------------------------------------------------
  can("read", "Student", myChildren as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Academic records — their children's only
  // -------------------------------------------------------------------------
  can("read", "ExamResult", aboutMyChildren as Record<string, unknown>)
  can("read", "Attendance", aboutMyChildren as Record<string, unknown>)

  // Assignments/timetable via child's class/section
  can("read", "Assignment", {
    class: { studentClasses: { some: aboutMyChildren } },
  } as Record<string, unknown>)
  can("read", "Timetable", {
    section: { students: { some: myChildren } },
  } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Finance — read their children's invoices/payments; create payments
  // against their children's invoices (actual payment processing still
  // goes through a dedicated server action).
  // -------------------------------------------------------------------------
  can("read", "Invoice", aboutMyChildren as Record<string, unknown>)
  can("read", "Payment", {
    invoice: aboutMyChildren,
  } as Record<string, unknown>)
  can("create", "Payment", {
    invoice: aboutMyChildren,
  } as Record<string, unknown>)
  can("read", "Scholarship", aboutMyChildren as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Own profile
  // -------------------------------------------------------------------------
  can("update", "Guardian", { id: guardianId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Communications — school-wide announcements/events, messaging
  // -------------------------------------------------------------------------
  can("read", "Announcement", { schoolId } as Record<string, unknown>)
  can("read", "Event", { schoolId } as Record<string, unknown>)
  can("create", "Message")
  can("read", "Message", { senderId: userId } as Record<string, unknown>)

  // Guardians never see internal directory; denied by default (no
  // `can("read", "Teacher")` — CASL defaults to deny).
}
