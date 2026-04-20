// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// ACCOUNTANT runs the finance side — full access across the finance
// subject set (fees, invoices, payments, scholarships, expenses, budgets,
// banking, payroll), read access to the people the money relates to
// (students, teachers, guardians, staff, classes), and nothing else.
//
// NOTE: FinancePermission DB overrides (src/lib/finance-roles.ts) layer
// async checks on top of this baseline — some finance actions can be
// narrowed per-user via that table. The policy gives the baseline;
// hasFinancePermission() remains the final check in action handlers that
// use it today. Full consolidation is Phase 3 of the plan.
export function accountantRules(
  ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  const { schoolId, staffMemberId } = ctx
  if (!schoolId) {
    return
  }

  // -------------------------------------------------------------------------
  // Finance — full manage within school
  // -------------------------------------------------------------------------
  const financeSubjects = [
    "Invoice",
    "Payment",
    "Scholarship",
    "Expense",
    "Budget",
    "BankAccount",
    "SalarySlip",
  ] as const
  for (const subject of financeSubjects) {
    can("manage", subject, { schoolId } as Record<string, unknown>)
  }

  // -------------------------------------------------------------------------
  // Directory reads — needed to attribute money to people
  // -------------------------------------------------------------------------
  can("read", "Student", { schoolId } as Record<string, unknown>)
  can("read", "Teacher", { schoolId } as Record<string, unknown>)
  can("read", "Guardian", { schoolId } as Record<string, unknown>)
  can("read", "StaffMember", { schoolId } as Record<string, unknown>)
  can("read", "Class", { schoolId } as Record<string, unknown>)
  can("read", "Section", { schoolId } as Record<string, unknown>)
  can("read", "Enrollment", {} as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Own profile
  // -------------------------------------------------------------------------
  if (staffMemberId) {
    can("update", "StaffMember", { id: staffMemberId } as Record<
      string,
      unknown
    >)
  }

  // -------------------------------------------------------------------------
  // Communications
  // -------------------------------------------------------------------------
  can("read", "Announcement", { schoolId } as Record<string, unknown>)
  can("read", "Event", { schoolId } as Record<string, unknown>)
  can("create", "Message")
  can("read", "Message", { senderId: ctx.userId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // FinancePermission — accountants can view overrides but not grant them
  // (granting is an ADMIN responsibility).
  // -------------------------------------------------------------------------
  can("read", "FinancePermission", { schoolId } as Record<string, unknown>)

  // Academic mutation stays denied by default. If a pure accountant ever
  // needs to touch grades/exams/curriculum, that's either a role change
  // (they're actually STAFF) or a custom permission (needs FinancePermission
  // extension to cover academic actions — out of scope).
}
