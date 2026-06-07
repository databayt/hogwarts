// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { subject } from "@casl/ability"
import { describe, expect, it } from "vitest"

import { buildAbility } from "@/lib/rbac/ability"
import type { PolicyContext, Role } from "@/lib/rbac/types"

// ---------------------------------------------------------------------------
// Policies are pure functions of PolicyContext, so every test below drives
// buildAbility() directly — no session mock, no DB. If a test starts needing
// a DB, that means a rule has leaked side effects and should be refactored.
// ---------------------------------------------------------------------------

const SCHOOL_A = "school-a"
const SCHOOL_B = "school-b"

function makeContext(overrides: Partial<PolicyContext> = {}): PolicyContext {
  const role: Role = overrides.role ?? "USER"
  return {
    userId: "user-1",
    role,
    email: null,
    schoolId: SCHOOL_A,
    ...overrides,
  }
}

describe("buildAbility — DEVELOPER", () => {
  const ability = buildAbility(
    makeContext({ role: "DEVELOPER", schoolId: null })
  )

  it("can manage any subject in any school", () => {
    expect(ability.can("read", "Student")).toBe(true)
    expect(ability.can("update", "Invoice")).toBe(true)
    expect(ability.can("delete", "Teacher")).toBe(true)
    expect(ability.can("manage", "School")).toBe(true)
  })

  it("ignores tenant scoping — can touch any school's data", () => {
    const row = subject("Student", {
      id: "s-1",
      schoolId: SCHOOL_B,
    } as never)
    expect(ability.can("read", row)).toBe(true)
    expect(ability.can("update", row)).toBe(true)
  })
})

describe("buildAbility — USER (pre-school)", () => {
  const ability = buildAbility(makeContext({ role: "USER", schoolId: null }))

  it("can create and read their own School during onboarding", () => {
    expect(ability.can("create", "School")).toBe(true)
    expect(ability.can("read", "School")).toBe(true)
  })

  it("is denied every school-scoped action", () => {
    expect(ability.can("read", "Student")).toBe(false)
    expect(ability.can("update", "Invoice")).toBe(false)
    expect(ability.can("read", "ExamResult")).toBe(false)
    expect(ability.can("delete", "School")).toBe(false)
  })
})

describe("buildAbility — ADMIN", () => {
  it("can manage school-scoped subjects when schoolId resolves", () => {
    const ability = buildAbility(makeContext({ role: "ADMIN" }))
    expect(ability.can("manage", "Student")).toBe(true)
    expect(ability.can("manage", "Teacher")).toBe(true)
    expect(ability.can("manage", "Invoice")).toBe(true)
    expect(ability.can("manage", "ExamResult")).toBe(true)
  })

  it("is completely inert without schoolId (fail-closed)", () => {
    const ability = buildAbility(makeContext({ role: "ADMIN", schoolId: null }))
    expect(ability.can("read", "Student")).toBe(false)
    expect(ability.can("manage", "Invoice")).toBe(false)
  })

  it("cannot touch a different school's School row", () => {
    const ability = buildAbility(makeContext({ role: "ADMIN" }))
    const otherSchool = subject("School", { id: "other" } as never)
    expect(ability.can("update", otherSchool)).toBe(false)
  })
})

describe("buildAbility — TEACHER", () => {
  const TEACHER_ID = "teacher-1"
  const USER_ID = "user-teacher"
  const buildTeacher = () =>
    buildAbility(
      makeContext({
        role: "TEACHER",
        userId: USER_ID,
        teacherId: TEACHER_ID,
      })
    )

  it("reads the school-wide roster and reference data", () => {
    const ability = buildTeacher()
    expect(ability.can("read", "Student")).toBe(true)
    expect(ability.can("read", "Teacher")).toBe(true)
    expect(ability.can("read", "Class")).toBe(true)
    expect(ability.can("read", "Subject")).toBe(true)
    expect(ability.can("read", "Classroom")).toBe(true)
  })

  it("cannot mutate other teachers' exam results", () => {
    const ability = buildTeacher()
    const ownResult = subject("ExamResult", {
      id: "r-1",
      schoolId: SCHOOL_A,
      gradedBy: USER_ID,
    } as never)
    const foreignResult = subject("ExamResult", {
      id: "r-2",
      schoolId: SCHOOL_A,
      gradedBy: "another-teacher",
    } as never)
    expect(ability.can("update", ownResult)).toBe(true)
    expect(ability.can("update", foreignResult)).toBe(false)
    expect(ability.can("delete", foreignResult)).toBe(false)
  })

  it("cannot edit classes they do not teach", () => {
    const ability = buildTeacher()
    const ownClass = subject("Class", {
      id: "c-1",
      schoolId: SCHOOL_A,
      teacherId: TEACHER_ID,
    } as never)
    const foreignClass = subject("Class", {
      id: "c-2",
      schoolId: SCHOOL_A,
      teacherId: "other-teacher",
      classTeachers: [],
    } as never)
    expect(ability.can("update", ownClass)).toBe(true)
    expect(ability.can("update", foreignClass)).toBe(false)
  })

  it("can read their own salary slip only", () => {
    const ability = buildTeacher()
    const ownSlip = subject("SalarySlip", {
      id: "s-1",
      teacherId: TEACHER_ID,
    } as never)
    const foreignSlip = subject("SalarySlip", {
      id: "s-2",
      teacherId: "other-teacher",
    } as never)
    expect(ability.can("read", ownSlip)).toBe(true)
    expect(ability.can("read", foreignSlip)).toBe(false)
  })

  it("is denied finance writes entirely", () => {
    const ability = buildTeacher()
    expect(ability.can("update", "Invoice")).toBe(false)
    expect(ability.can("create", "Payment")).toBe(false)
    expect(ability.can("manage", "BankAccount")).toBe(false)
  })
})

describe("buildAbility — STUDENT", () => {
  const STUDENT_ID = "student-1"
  const USER_ID = "user-student"
  const buildStudent = (overrides: Partial<PolicyContext> = {}) =>
    buildAbility(
      makeContext({
        role: "STUDENT",
        userId: USER_ID,
        studentId: STUDENT_ID,
        sectionId: "section-1",
        academicGradeNumber: 7,
        ...overrides,
      })
    )

  it("reads only their own exam results and attendance", () => {
    const ability = buildStudent()
    const own = subject("ExamResult", { studentId: STUDENT_ID } as never)
    const foreign = subject("ExamResult", { studentId: "other" } as never)
    expect(ability.can("read", own)).toBe(true)
    expect(ability.can("read", foreign)).toBe(false)
  })

  it("reads LMS lessons for their grade only", () => {
    const ability = buildStudent({ academicGradeNumber: 7 })
    const sameGrade = subject("Lesson", { grades: [7, 8] } as never)
    const otherGrade = subject("Lesson", { grades: [9] } as never)
    expect(ability.can("read", sameGrade)).toBe(true)
    expect(ability.can("read", otherGrade)).toBe(false)
  })

  it("withholds LMS content when grade cannot be resolved", () => {
    const ability = buildStudent({ academicGradeNumber: null })
    expect(ability.can("read", "Lesson")).toBe(false)
    expect(ability.can("read", "Chapter")).toBe(false)
  })

  it("never sees other students' PII", () => {
    const ability = buildStudent()
    const otherStudent = subject("Student", { id: "other" } as never)
    expect(ability.can("read", otherStudent)).toBe(false)
  })

  it("is denied all write paths outside their own records", () => {
    const ability = buildStudent()
    expect(ability.can("create", "ExamResult")).toBe(false)
    expect(ability.can("update", "Assignment")).toBe(false)
    expect(ability.can("delete", "Attendance")).toBe(false)
    expect(ability.can("create", "Invoice")).toBe(false)
  })

  it("fails closed without studentId (e.g., USER wearing STUDENT role)", () => {
    const ability = buildAbility(
      makeContext({ role: "STUDENT", studentId: undefined })
    )
    expect(ability.can("read", "ExamResult")).toBe(false)
    expect(ability.can("read", "Student")).toBe(false)
  })
})

describe("buildAbility — GUARDIAN", () => {
  const GUARDIAN_ID = "guardian-1"
  const USER_ID = "user-guardian"
  const buildGuardian = () =>
    buildAbility(
      makeContext({
        role: "GUARDIAN",
        userId: USER_ID,
        guardianId: GUARDIAN_ID,
      })
    )

  // NOTE: Guardian rules use Prisma's `some` operator for nested StudentGuardian
  // checks — e.g., `student: { guardians: { some: { guardianId } } }`. That
  // shape is what `accessibleBy()` needs to emit correct SQL, but CASL's
  // runtime matcher (@casl/prisma) cannot evaluate `some` against in-memory
  // objects. Runtime row-level matching for guardians is covered by e2e tests
  // (tests/e2e/epic-4-rbac/guardian.spec.ts). Unit tests stay at the coarser
  // subject-type level and the "no ownership context" branches below.
  it("has read access to child-scoped subjects", () => {
    const ability = buildGuardian()
    // Subject-type access — conditions narrow the set, they don't gate it.
    expect(ability.can("read", "ExamResult")).toBe(true)
    expect(ability.can("read", "Attendance")).toBe(true)
    expect(ability.can("read", "Assignment")).toBe(true)
    expect(ability.can("read", "Invoice")).toBe(true)
    expect(ability.can("read", "Payment")).toBe(true)
    expect(ability.can("read", "Scholarship")).toBe(true)
  })

  it("cannot update children's finance records (create Payment only)", () => {
    const ability = buildGuardian()
    expect(ability.can("update", "Invoice")).toBe(false)
    expect(ability.can("delete", "Invoice")).toBe(false)
    expect(ability.can("update", "Payment")).toBe(false)
    // Guardians can create Payment (pay on behalf of their child)
    expect(ability.can("create", "Payment")).toBe(true)
  })

  it("fails closed without guardianId", () => {
    const ability = buildAbility(
      makeContext({ role: "GUARDIAN", guardianId: undefined })
    )
    expect(ability.can("read", "ExamResult")).toBe(false)
    expect(ability.can("read", "Invoice")).toBe(false)
  })
})

describe("buildAbility — ACCOUNTANT", () => {
  const STAFF_ID = "staff-1"
  const buildAccountant = () =>
    buildAbility(makeContext({ role: "ACCOUNTANT", staffMemberId: STAFF_ID }))

  it("has full finance manage within school", () => {
    const ability = buildAccountant()
    expect(ability.can("manage", "Invoice")).toBe(true)
    expect(ability.can("manage", "Payment")).toBe(true)
    expect(ability.can("manage", "Expense")).toBe(true)
    expect(ability.can("manage", "Budget")).toBe(true)
    expect(ability.can("manage", "BankAccount")).toBe(true)
    expect(ability.can("manage", "SalarySlip")).toBe(true)
  })

  it("reads directory data needed to attribute money", () => {
    const ability = buildAccountant()
    expect(ability.can("read", "Student")).toBe(true)
    expect(ability.can("read", "Teacher")).toBe(true)
    expect(ability.can("read", "Guardian")).toBe(true)
    expect(ability.can("read", "StaffMember")).toBe(true)
  })

  it("cannot grade or run curriculum", () => {
    const ability = buildAccountant()
    expect(ability.can("create", "ExamResult")).toBe(false)
    expect(ability.can("update", "Assignment")).toBe(false)
    expect(ability.can("create", "Lesson")).toBe(false)
  })

  it("views FinancePermission but cannot grant (admin-only)", () => {
    const ability = buildAccountant()
    expect(ability.can("read", "FinancePermission")).toBe(true)
    expect(ability.can("create", "FinancePermission")).toBe(false)
    expect(ability.can("update", "FinancePermission")).toBe(false)
  })
})

describe("buildAbility — STAFF (office/reception)", () => {
  const STAFF_ID = "staff-2"
  const buildStaff = () =>
    buildAbility(makeContext({ role: "STAFF", staffMemberId: STAFF_ID }))

  it("reads the directory and can record attendance", () => {
    const ability = buildStaff()
    expect(ability.can("read", "Student")).toBe(true)
    expect(ability.can("read", "Teacher")).toBe(true)
    expect(ability.can("create", "Attendance")).toBe(true)
    expect(ability.can("update", "Attendance")).toBe(true)
  })

  it("posts announcements and events", () => {
    const ability = buildStaff()
    expect(ability.can("create", "Announcement")).toBe(true)
    expect(ability.can("create", "Event")).toBe(true)
  })

  it("cannot write to finance or grades", () => {
    const ability = buildStaff()
    expect(ability.can("update", "Invoice")).toBe(false)
    expect(ability.can("create", "Payment")).toBe(false)
    expect(ability.can("create", "ExamResult")).toBe(false)
    expect(ability.can("update", "ExamResult")).toBe(false)
  })
})

describe("buildAbility — tenant isolation", () => {
  it("non-DEVELOPER abilities degrade to zero when schoolId is null", () => {
    const nullSchoolRoles: Role[] = [
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "ACCOUNTANT",
      "STAFF",
    ]
    for (const role of nullSchoolRoles) {
      const ability = buildAbility(makeContext({ role, schoolId: null }))
      expect(ability.can("read", "Student")).toBe(false)
      expect(ability.can("read", "Invoice")).toBe(false)
    }
  })
})
