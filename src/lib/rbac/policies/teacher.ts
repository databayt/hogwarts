// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// TEACHER owns the classroom: read-wide (roster, schedule, reference data)
// with write access only where they are the responsible party —
//
//   • Classes where Class.teacherId = self OR ClassTeacher.teacherId = self
//   • ExamResults they entered (gradedBy = userId)
//   • Attendance sessions they recorded (recordedBy = userId)
//   • LMS lessons/chapters they authored (createdBy = userId)
//   • Their own profile row (TeacherSelf)
//
// Admissions approval, finance, school settings — all denied. Teacher can
// read their own salary slip if it exists (not other teachers').
export function teacherRules(
  ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  const { schoolId, teacherId, userId } = ctx
  if (!schoolId || !teacherId) {
    return
  }

  // -------------------------------------------------------------------------
  // School-wide reads — a teacher needs the full roster to do their job.
  // -------------------------------------------------------------------------
  can("read", "Student", { schoolId } as Record<string, unknown>)
  can("read", "Teacher", { schoolId } as Record<string, unknown>)
  can("read", "Guardian", { schoolId } as Record<string, unknown>)
  can("read", "Class", { schoolId } as Record<string, unknown>)
  can("read", "Section", { schoolId } as Record<string, unknown>)
  can("read", "Subject", {} as Record<string, unknown>)
  can("read", "Classroom", { schoolId } as Record<string, unknown>)
  can("read", "Announcement", { schoolId } as Record<string, unknown>)
  can("read", "Event", { schoolId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Timetable — teachers see the full school timetable (for coordination)
  // but only edit slots assigned to them.
  // -------------------------------------------------------------------------
  can("read", "Timetable", { schoolId } as Record<string, unknown>)
  can("update", "Timetable", { teacherId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Own profile
  // -------------------------------------------------------------------------
  can("update", "Teacher", { id: teacherId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Classes they teach — primary or co-teacher
  // -------------------------------------------------------------------------
  const ownedClassCondition = {
    OR: [{ teacherId }, { classTeachers: { some: { teacherId } } }],
  }
  can("update", "Class", ownedClassCondition as Record<string, unknown>)

  // Assignments — create/update for classes they own
  can("create", "Assignment", { class: ownedClassCondition } as Record<
    string,
    unknown
  >)
  can("update", "Assignment", { class: ownedClassCondition } as Record<
    string,
    unknown
  >)
  can("delete", "Assignment", { class: ownedClassCondition } as Record<
    string,
    unknown
  >)
  can("read", "Assignment", { schoolId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // ExamResult — ownership by grader. Read any, mutate only own entries.
  // This mirrors the current authorization.ts rule in listings/grades.
  // -------------------------------------------------------------------------
  can("read", "ExamResult", { schoolId } as Record<string, unknown>)
  can("create", "ExamResult", { gradedBy: userId } as Record<string, unknown>)
  can("update", "ExamResult", { gradedBy: userId } as Record<string, unknown>)
  can("delete", "ExamResult", { gradedBy: userId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Attendance — record for classes they teach
  // -------------------------------------------------------------------------
  can("read", "Attendance", { schoolId } as Record<string, unknown>)
  can("create", "Attendance", {
    class: ownedClassCondition,
  } as Record<string, unknown>)
  can("update", "Attendance", {
    class: ownedClassCondition,
  } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // LMS — author their own lessons/chapters
  // -------------------------------------------------------------------------
  can("read", "Lesson", {} as Record<string, unknown>)
  can("read", "Chapter", {} as Record<string, unknown>)
  can("create", "Lesson", {} as Record<string, unknown>)
  can("update", "Lesson", { createdById: userId } as Record<string, unknown>)
  can("delete", "Lesson", { createdById: userId } as Record<string, unknown>)
  can("create", "Chapter", {} as Record<string, unknown>)
  can("update", "Chapter", {} as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Announcements/events — create (for their classes); admin can moderate.
  // -------------------------------------------------------------------------
  can("create", "Announcement", { schoolId } as Record<string, unknown>)
  can("update", "Announcement", { userId } as Record<string, unknown>)
  can("delete", "Announcement", { userId } as Record<string, unknown>)
  can("create", "Event", { schoolId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Messaging
  // -------------------------------------------------------------------------
  can("create", "Message")
  can("read", "Message", { senderId: userId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Finance (own only) — their salary slip, nothing else
  // -------------------------------------------------------------------------
  can("read", "SalarySlip", { teacherId } as Record<string, unknown>)
}
