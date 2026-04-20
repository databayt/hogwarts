// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// STAFF is non-teaching, non-finance — reception, registrar, office ops.
// They shepherd people and information through the school: admissions,
// attendance records, communications. They never grade, never move money,
// never delete anything permanent.
export function staffRules(
  ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  const { schoolId, staffMemberId } = ctx
  if (!schoolId) {
    return
  }

  // -------------------------------------------------------------------------
  // Directory reads
  // -------------------------------------------------------------------------
  can("read", "Student", { schoolId } as Record<string, unknown>)
  can("read", "Teacher", { schoolId } as Record<string, unknown>)
  can("read", "Guardian", { schoolId } as Record<string, unknown>)
  can("read", "StaffMember", { schoolId } as Record<string, unknown>)
  can("read", "Class", { schoolId } as Record<string, unknown>)
  can("read", "Section", { schoolId } as Record<string, unknown>)
  can("read", "Subject", {} as Record<string, unknown>)
  can("read", "Timetable", { schoolId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Admission — staff process incoming applications. Admission isn't a
  // top-level subject yet; when it is, add a rule here. For now this file
  // documents the intent; admission server actions still delegate to
  // admission/authorization.ts (deleted in Phase 4).
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Attendance — staff can record and update (office can enter attendance
  // for classes where the teacher was absent).
  // -------------------------------------------------------------------------
  can("create", "Attendance", { schoolId } as Record<string, unknown>)
  can("update", "Attendance", { schoolId } as Record<string, unknown>)
  can("read", "Attendance", { schoolId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Communications — post announcements/events for the school.
  // -------------------------------------------------------------------------
  can("read", "Announcement", { schoolId } as Record<string, unknown>)
  can("create", "Announcement", { schoolId } as Record<string, unknown>)
  can("update", "Announcement", { userId: ctx.userId } as Record<
    string,
    unknown
  >)
  can("read", "Event", { schoolId } as Record<string, unknown>)
  can("create", "Event", { schoolId } as Record<string, unknown>)

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
  // Messaging
  // -------------------------------------------------------------------------
  can("create", "Message")
  can("read", "Message", { senderId: ctx.userId } as Record<string, unknown>)

  // Read their own salary (StaffMember-side SalarySlip)
  if (staffMemberId) {
    can("read", "SalarySlip", { staffMemberId } as Record<string, unknown>)
  }

  // Grading, finance writes, curriculum — not listed; CASL denies by default.
}
