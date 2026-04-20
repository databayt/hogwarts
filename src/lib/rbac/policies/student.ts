// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { AbilityBuilder } from "@casl/ability"

import type { AppAbility, PolicyContext } from "../types"

// STUDENT is grade-locked by design — no cross-grade view (per plan decision).
// The shape of a student's access is:
//
//   • OWN records: read anything tied to their studentId / userId; write
//     only a narrow set (submissions, lesson progress, messages, a few
//     profile fields).
//   • SCHOOL-WIDE reads: reference data they need to function — subjects,
//     announcements, events, classrooms, teacher roster (public profile).
//   • LMS: lesson/chapter content filtered by their grade number via the
//     existing catalog.Lesson.grades Int[] field.
//
// Write denials are broad and explicit: a STUDENT cannot mutate anything
// related to other students, teachers, grades, finance (other than their
// own payments, if that's ever implemented).
export function studentRules(
  ctx: PolicyContext,
  { can }: AbilityBuilder<AppAbility>
) {
  const { schoolId, studentId, userId, academicGradeNumber } = ctx
  if (!schoolId || !studentId) {
    // STUDENT without schoolId or a Student row — can't safely scope
    // anything. Fail closed.
    return
  }

  // -------------------------------------------------------------------------
  // Own identity / academic record
  // -------------------------------------------------------------------------
  can("read", "Student", { id: studentId } as Record<string, unknown>)
  // Self-edit is intentionally narrow — full Student.update would let a
  // learner change their own grade or section. The self-profile form
  // should enforce the same at the input layer; this is defense-in-depth.
  // (Field-level rules are a Phase 6 addition; for now update any field
  // only via a server action that checks the field list separately.)

  can("read", "ExamResult", { studentId } as Record<string, unknown>)
  can("read", "Attendance", { studentId } as Record<string, unknown>)

  // Timetable for their section (if assigned)
  if (ctx.sectionId) {
    can("read", "Timetable", { sectionId: ctx.sectionId } as Record<
      string,
      unknown
    >)
  }

  // -------------------------------------------------------------------------
  // Assignments & submissions
  // -------------------------------------------------------------------------
  // Can see any assignment for a class they're enrolled in. The Class has
  // `studentClasses` — we express that via a nested `some` check so CASL
  // generates the right Prisma where clause.
  can("read", "Assignment", {
    class: { studentClasses: { some: { studentId } } },
  } as Record<string, unknown>)
  // Creating a submission is owned by the student — the server action also
  // validates that the assignment's class includes this student.
  // (AssignmentSubmission isn't yet a top-level subject — when it lands,
  // add it to types.ts AppSubjects and a rule here.)

  // -------------------------------------------------------------------------
  // Finance — read-only, own invoices/payments/scholarships only
  // -------------------------------------------------------------------------
  can("read", "Invoice", { studentId } as Record<string, unknown>)
  can("read", "Payment", {
    invoice: { studentId },
  } as Record<string, unknown>)
  can("read", "Scholarship", { studentId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // School-wide reference data (non-PII)
  // -------------------------------------------------------------------------
  can("read", "Announcement", { schoolId } as Record<string, unknown>)
  can("read", "Event", { schoolId } as Record<string, unknown>)
  can("read", "Subject", {} as Record<string, unknown>)
  can("read", "Class", { schoolId } as Record<string, unknown>)
  can("read", "Section", { schoolId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // LMS — grade-filtered. The catalog.Lesson.grades is an Int[] array;
  // Prisma exposes a `has` filter. A null gradeNumber means the student's
  // grade wasn't resolved (freshly imported CSV student, etc.) — in that
  // case we withhold LMS content until the grade is set, rather than
  // leaking all grades.
  // -------------------------------------------------------------------------
  if (academicGradeNumber !== null && academicGradeNumber !== undefined) {
    can("read", "Lesson", { grades: { has: academicGradeNumber } } as Record<
      string,
      unknown
    >)
    can("read", "Chapter", {} as Record<string, unknown>)
  }

  // Enrollment & progress — always by userId (catalog.Enrollment.userId)
  can("read", "Enrollment", { userId } as Record<string, unknown>)
  can("create", "Enrollment", { userId } as Record<string, unknown>)
  can("read", "LessonProgress", { userId } as Record<string, unknown>)
  can("create", "LessonProgress", { userId } as Record<string, unknown>)
  can("update", "LessonProgress", { userId } as Record<string, unknown>)

  // -------------------------------------------------------------------------
  // Messaging — send messages, read own threads
  // -------------------------------------------------------------------------
  can("create", "Message")
  can("read", "Message", { senderId: userId } as Record<string, unknown>)

  // Note: "cannot" rules are intentionally absent. CASL defaults to deny,
  // so anything not explicitly allowed is already forbidden. Adding a
  // blanket `cannot("manage", "all")` here would shadow DEVELOPER checks
  // that happen upstream — don't.
}
