// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PrismaAbility, Subjects } from "@casl/prisma"
import type {
  Announcement,
  Assignment,
  Attendance,
  BankAccount,
  Budget,
  Subject as CatalogSubject,
  Chapter,
  Class,
  Classroom,
  Enrollment,
  Event,
  ExamResult,
  Expense,
  FinancePermission,
  Guardian,
  Invoice,
  Lesson,
  LessonProgress,
  Message,
  Payment,
  SalarySlip,
  Scholarship,
  School,
  Section,
  StaffMember,
  Student,
  Teacher,
  Timetable,
  UserRole,
} from "@prisma/client"

// ---------------------------------------------------------------------------
// Roles — mirror of Prisma UserRole enum, kept as string-literal union so
// Edge runtime code (proxy, client hooks) can import without dragging the
// Prisma client. Must stay in sync with prisma/models/auth.prisma.
// ---------------------------------------------------------------------------

export type Role =
  | "DEVELOPER"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"
  | "USER"

export const ALL_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
] as const satisfies readonly Role[]

// ---------------------------------------------------------------------------
// PolicyContext — everything we need to evaluate a rule without hitting the
// DB again. Resolved once per request (React cache) by getPolicyContext().
// Role-specific IDs are undefined when the role doesn't own that entity
// (e.g., studentId is undefined for TEACHER).
// ---------------------------------------------------------------------------

export interface PolicyContext {
  userId: string
  role: Role
  email: string | null
  // null for DEVELOPER and USER; required for every other role
  schoolId: string | null
  // Resolved for STUDENT
  studentId?: string
  sectionId?: string | null
  academicGradeId?: string | null
  academicGradeNumber?: number | null
  // Resolved for TEACHER
  teacherId?: string
  // Resolved for GUARDIAN
  guardianId?: string
  // Resolved for STAFF / ACCOUNTANT (both use StaffMember table)
  staffMemberId?: string
}

// ---------------------------------------------------------------------------
// Actions — coarse verbs. CASL expands "manage" to cover all others.
// "read", "create", "update", "delete" cover 99% of cases; "export" and
// "import" gate CSV/bulk flows that often have stricter rules than plain
// reads/writes.
// ---------------------------------------------------------------------------

export type AppAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "import"
  | "manage"

// ---------------------------------------------------------------------------
// Subjects — Prisma model types wired into CASL. Names match Prisma model
// names (PascalCase) so that `accessibleBy(ability).Student` lines up with
// `db.student.findMany({ where: accessibleBy(ability).Student })`.
//
// IMPORTANT: every subject that can appear in a rule condition must be
// listed here. If you add a new Prisma model and want to gate access to it,
// add the import above and the entry here in the same PR.
// ---------------------------------------------------------------------------

export type AppSubjects =
  | Subjects<{
      // Identity / directory
      Student: Student
      Teacher: Teacher
      Guardian: Guardian
      StaffMember: StaffMember
      // Academic structure
      Class: Class
      Classroom: Classroom
      Section: Section
      Subject: CatalogSubject
      // Academic work
      Assignment: Assignment
      Attendance: Attendance
      ExamResult: ExamResult
      Timetable: Timetable
      // Content / LMS
      Chapter: Chapter
      Lesson: Lesson
      Enrollment: Enrollment
      LessonProgress: LessonProgress
      // Communication
      Announcement: Announcement
      Event: Event
      Message: Message
      // Finance
      Invoice: Invoice
      Payment: Payment
      Scholarship: Scholarship
      Expense: Expense
      Budget: Budget
      BankAccount: BankAccount
      SalarySlip: SalarySlip
      FinancePermission: FinancePermission
      // Platform
      School: School
    }>
  | "all"

export type AppAbility = PrismaAbility<[AppAction, AppSubjects]>

// ---------------------------------------------------------------------------
// Error codes — client maps these via ErrorHelper in the dictionary system.
// Never return hardcoded English from policy checks. See .claude/rules/translation.md.
// ---------------------------------------------------------------------------

export const POLICY_ERROR_CODES = {
  NOT_AUTHENTICATED: "POLICY_NOT_AUTHENTICATED",
  MISSING_SCHOOL_CONTEXT: "POLICY_MISSING_SCHOOL_CONTEXT",
  DENIED: "POLICY_DENIED",
  DENIED_OWNERSHIP: "POLICY_DENIED_OWNERSHIP",
  DENIED_SCHOOL_SCOPE: "POLICY_DENIED_SCHOOL_SCOPE",
} as const

export type PolicyErrorCode =
  (typeof POLICY_ERROR_CODES)[keyof typeof POLICY_ERROR_CODES]

// Narrow compile-time check that Role and Prisma's UserRole stay aligned.
// If Prisma adds/removes a role, this breaks the build until Role is updated.
type AssertRolesMatch = UserRole extends Role
  ? Role extends UserRole
    ? true
    : false
  : false
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ROLES_MATCH: AssertRolesMatch = true
