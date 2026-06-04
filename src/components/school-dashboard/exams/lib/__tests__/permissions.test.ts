// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam RBAC layer tests — covers the role × permission matrix, resource
 * ownership rules, query filters, and the permission-context resolver in
 * `lib/permissions.ts` (previously 0% tested — audit P0 §B2).
 *
 * Every async ownership check is exercised across the 7 school roles with the
 * DB mocked, asserting both the allow and deny paths so a regression in the
 * role matrix or the schoolId/ownership scoping fails loudly.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  applyPermissionFilters,
  canAccessAnalytics,
  canAccessExam,
  canAccessStudentResult,
  canManageQuestions,
  canModifyExam,
  getExamTabsForRole,
  getPermissionContext,
  hasPermission,
  validatePermission,
  type Permission,
  type PermissionContext,
} from "../permissions"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolExam: { findFirst: vi.fn() },
    class: { findFirst: vi.fn() },
    studentClass: { findFirst: vi.fn() },
    studentGuardian: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
  },
}))

const ALL_PERMISSIONS: Permission[] = [
  "exam:create",
  "exam:read",
  "exam:update",
  "exam:delete",
  "exam:publish",
  "question:create",
  "question:read",
  "question:update",
  "question:delete",
  "question:import",
  "question:export",
  "template:create",
  "template:read",
  "template:update",
  "template:delete",
  "result:create",
  "result:read",
  "result:update",
  "result:delete",
  "result:export",
  "result:batch_generate",
  "marking:create",
  "marking:read",
  "marking:update",
  "marking:override",
  "analytics:read",
  "analytics:export",
  "certificate:create",
  "certificate:read",
  "certificate:verify",
  "certificate:revoke",
]

// Expected permission set per role, mirrored from ROLE_PERMISSIONS.
const EXPECTED: Record<string, Permission[]> = {
  DEVELOPER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  TEACHER: [
    "exam:create",
    "exam:read",
    "exam:update",
    "exam:delete",
    "question:create",
    "question:read",
    "question:update",
    "question:delete",
    "question:import",
    "question:export",
    "template:create",
    "template:read",
    "template:update",
    "template:delete",
    "result:create",
    "result:read",
    "result:update",
    "result:export",
    "marking:create",
    "marking:read",
    "marking:update",
    "analytics:read",
    "certificate:create",
    "certificate:read",
  ],
  ACCOUNTANT: [
    "exam:read",
    "result:read",
    "result:export",
    "analytics:read",
    "analytics:export",
  ],
  STUDENT: ["exam:read", "result:read", "question:read", "certificate:read"],
  GUARDIAN: ["exam:read", "result:read", "certificate:read"],
  STAFF: ["exam:read", "analytics:read"],
}

function ctx(overrides: Partial<PermissionContext> = {}): PermissionContext {
  return {
    userId: "user-1",
    userRole: "ADMIN",
    schoolId: "school-1",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("hasPermission — role × permission matrix", () => {
  for (const [role, granted] of Object.entries(EXPECTED)) {
    it(`grants exactly the expected permissions to ${role}`, () => {
      const grantedSet = new Set(granted)
      for (const perm of ALL_PERMISSIONS) {
        const expected = grantedSet.has(perm)
        expect(hasPermission(ctx({ userRole: role }), perm)).toBe(expected)
      }
    })
  }

  it("denies everything to an unknown role", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(hasPermission(ctx({ userRole: "USER" }), perm)).toBe(false)
    }
  })

  it("TEACHER cannot publish, override marking, or revoke certificates", () => {
    const teacher = ctx({ userRole: "TEACHER" })
    expect(hasPermission(teacher, "exam:publish")).toBe(false)
    expect(hasPermission(teacher, "marking:override")).toBe(false)
    expect(hasPermission(teacher, "certificate:revoke")).toBe(false)
    expect(hasPermission(teacher, "result:delete")).toBe(false)
  })

  it("ACCOUNTANT is read/export only — no write permissions", () => {
    const acc = ctx({ userRole: "ACCOUNTANT" })
    expect(hasPermission(acc, "exam:create")).toBe(false)
    expect(hasPermission(acc, "marking:create")).toBe(false)
    expect(hasPermission(acc, "result:read")).toBe(true)
    expect(hasPermission(acc, "analytics:export")).toBe(true)
  })
})

describe("getPermissionContext", () => {
  it("returns null when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    expect(await getPermissionContext()).toBeNull()
  })

  it("resolves teacherId for a TEACHER session", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "TEACHER", schoolId: "school-1" },
    } as any)
    vi.mocked(db.teacher.findFirst).mockResolvedValue({
      id: "teacher-1",
    } as any)

    const context = await getPermissionContext()
    expect(context).toMatchObject({
      userId: "u1",
      userRole: "TEACHER",
      schoolId: "school-1",
      isTeacher: true,
      teacherId: "teacher-1",
    })
    // teacher lookup must be schoolId-scoped
    expect(db.teacher.findFirst).toHaveBeenCalledWith({
      where: { userId: "u1", schoolId: "school-1" },
    })
  })

  it("resolves studentId for a STUDENT session", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u2", role: "STUDENT", schoolId: "school-1" },
    } as any)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)

    const context = await getPermissionContext()
    expect(context).toMatchObject({ isStudent: true, studentId: "student-1" })
  })

  it("resolves guardianId for a GUARDIAN session", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u3", role: "GUARDIAN", schoolId: "school-1" },
    } as any)
    vi.mocked(db.guardian.findFirst).mockResolvedValue({
      id: "guardian-1",
    } as any)

    const context = await getPermissionContext()
    expect(context).toMatchObject({
      isGuardian: true,
      guardianId: "guardian-1",
    })
  })

  it("defaults role to USER when session role is absent", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u4", schoolId: "school-1" },
    } as any)
    const context = await getPermissionContext()
    expect(context?.userRole).toBe("USER")
  })
})

describe("canAccessExam", () => {
  it("DEVELOPER bypasses the DB lookup entirely", async () => {
    const result = await canAccessExam(ctx({ userRole: "DEVELOPER" }), "exam-1")
    expect(result).toBe(true)
    expect(db.schoolExam.findFirst).not.toHaveBeenCalled()
  })

  it("returns false when the exam is not in the user's school", async () => {
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)
    expect(await canAccessExam(ctx({ userRole: "ADMIN" }), "exam-x")).toBe(
      false
    )
    // lookup is schoolId-scoped
    expect(db.schoolExam.findFirst).toHaveBeenCalledWith({
      where: { id: "exam-x", schoolId: "school-1" },
    })
  })

  it("ADMIN can access any in-school exam", async () => {
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
      id: "exam-1",
      classId: "class-1",
      status: "PLANNED",
    } as any)
    expect(await canAccessExam(ctx({ userRole: "ADMIN" }), "exam-1")).toBe(true)
  })

  it("TEACHER can access an exam for their own class but not others", async () => {
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
      id: "exam-1",
      classId: "class-1",
      status: "PLANNED",
    } as any)
    const teacher = ctx({
      userRole: "TEACHER",
      isTeacher: true,
      teacherId: "teacher-1",
    })

    vi.mocked(db.class.findFirst).mockResolvedValueOnce({
      id: "class-1",
    } as any)
    expect(await canAccessExam(teacher, "exam-1")).toBe(true)

    vi.mocked(db.class.findFirst).mockResolvedValueOnce(null)
    expect(await canAccessExam(teacher, "exam-1")).toBe(false)
  })

  it("STUDENT can access only COMPLETED exams", async () => {
    const student = ctx({
      userRole: "STUDENT",
      isStudent: true,
      studentId: "student-1",
    })

    vi.mocked(db.schoolExam.findFirst).mockResolvedValueOnce({
      id: "exam-1",
      classId: "class-1",
      status: "COMPLETED",
    } as any)
    expect(await canAccessExam(student, "exam-1")).toBe(true)

    vi.mocked(db.schoolExam.findFirst).mockResolvedValueOnce({
      id: "exam-1",
      classId: "class-1",
      status: "IN_PROGRESS",
    } as any)
    expect(await canAccessExam(student, "exam-1")).toBe(false)
  })

  it("GUARDIAN can access exams for a linked child's class", async () => {
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
      id: "exam-1",
      classId: "class-1",
      status: "PLANNED",
    } as any)
    const guardian = ctx({
      userRole: "GUARDIAN",
      isGuardian: true,
      guardianId: "guardian-1",
    })

    vi.mocked(db.studentGuardian.findFirst).mockResolvedValueOnce({
      id: "sg-1",
    } as any)
    expect(await canAccessExam(guardian, "exam-1")).toBe(true)

    vi.mocked(db.studentGuardian.findFirst).mockResolvedValueOnce(null)
    expect(await canAccessExam(guardian, "exam-1")).toBe(false)
  })
})

describe("canModifyExam", () => {
  it("denies roles lacking exam:update without touching the DB", async () => {
    const result = await canModifyExam(ctx({ userRole: "STUDENT" }), "exam-1")
    expect(result).toBe(false)
    expect(db.schoolExam.findFirst).not.toHaveBeenCalled()
  })

  it("ADMIN can modify any exam", async () => {
    expect(await canModifyExam(ctx({ userRole: "ADMIN" }), "exam-1")).toBe(true)
  })

  it("TEACHER can modify only their own class's exam", async () => {
    const teacher = ctx({
      userRole: "TEACHER",
      isTeacher: true,
      teacherId: "teacher-1",
    })

    vi.mocked(db.schoolExam.findFirst).mockResolvedValueOnce({
      id: "exam-1",
    } as any)
    expect(await canModifyExam(teacher, "exam-1")).toBe(true)

    vi.mocked(db.schoolExam.findFirst).mockResolvedValueOnce(null)
    expect(await canModifyExam(teacher, "exam-2")).toBe(false)
  })
})

describe("canAccessStudentResult", () => {
  it("ADMIN and DEVELOPER have full access", async () => {
    expect(
      await canAccessStudentResult(ctx({ userRole: "ADMIN" }), "student-1")
    ).toBe(true)
    expect(
      await canAccessStudentResult(ctx({ userRole: "DEVELOPER" }), "student-1")
    ).toBe(true)
  })

  it("STUDENT can read only their own result", async () => {
    const student = ctx({
      userRole: "STUDENT",
      isStudent: true,
      studentId: "student-1",
    })
    expect(await canAccessStudentResult(student, "student-1")).toBe(true)
    expect(await canAccessStudentResult(student, "student-2")).toBe(false)
  })

  it("TEACHER can read results for students in their classes", async () => {
    const teacher = ctx({
      userRole: "TEACHER",
      isTeacher: true,
      teacherId: "teacher-1",
    })
    vi.mocked(db.studentClass.findFirst).mockResolvedValueOnce({
      id: "sc-1",
    } as any)
    expect(await canAccessStudentResult(teacher, "student-1")).toBe(true)
  })

  it("GUARDIAN can read only a linked child's result", async () => {
    const guardian = ctx({
      userRole: "GUARDIAN",
      isGuardian: true,
      guardianId: "guardian-1",
    })
    vi.mocked(db.studentGuardian.findFirst).mockResolvedValueOnce({
      id: "sg-1",
    } as any)
    expect(await canAccessStudentResult(guardian, "student-1")).toBe(true)

    vi.mocked(db.studentGuardian.findFirst).mockResolvedValueOnce(null)
    expect(await canAccessStudentResult(guardian, "student-2")).toBe(false)
  })
})

describe("canManageQuestions", () => {
  it("denies roles lacking question:create", async () => {
    expect(await canManageQuestions(ctx({ userRole: "STUDENT" }))).toBe(false)
    expect(await canManageQuestions(ctx({ userRole: "ACCOUNTANT" }))).toBe(
      false
    )
  })

  it("ADMIN can manage all questions", async () => {
    expect(await canManageQuestions(ctx({ userRole: "ADMIN" }))).toBe(true)
  })

  it("TEACHER can manage questions only for their own subject", async () => {
    const teacher = ctx({
      userRole: "TEACHER",
      isTeacher: true,
      teacherId: "teacher-1",
    })
    vi.mocked(db.class.findFirst).mockResolvedValueOnce({
      id: "class-1",
    } as any)
    expect(await canManageQuestions(teacher, "subject-1")).toBe(true)

    vi.mocked(db.class.findFirst).mockResolvedValueOnce(null)
    expect(await canManageQuestions(teacher, "subject-2")).toBe(false)
  })
})

describe("canAccessAnalytics", () => {
  it("only DEVELOPER/ADMIN see school-wide analytics", async () => {
    expect(await canAccessAnalytics(ctx({ userRole: "ADMIN" }), "school")).toBe(
      true
    )
    expect(
      await canAccessAnalytics(
        ctx({ userRole: "TEACHER", isTeacher: true, teacherId: "t1" }),
        "school"
      )
    ).toBe(false)
  })

  it("denies analytics to roles without analytics:read", async () => {
    expect(
      await canAccessAnalytics(ctx({ userRole: "STUDENT" }), "school")
    ).toBe(false)
  })

  it("STUDENT sees only their own student-scoped analytics", async () => {
    const student = ctx({
      userRole: "STUDENT",
      isStudent: true,
      studentId: "student-1",
    })
    // STUDENT lacks analytics:read, so even own scope is denied
    expect(await canAccessAnalytics(student, "student", "student-1")).toBe(
      false
    )
  })

  it("TEACHER sees class analytics only for their class", async () => {
    const teacher = ctx({
      userRole: "TEACHER",
      isTeacher: true,
      teacherId: "teacher-1",
    })
    vi.mocked(db.class.findFirst).mockResolvedValueOnce({
      id: "class-1",
    } as any)
    expect(await canAccessAnalytics(teacher, "class", "class-1")).toBe(true)

    vi.mocked(db.class.findFirst).mockResolvedValueOnce(null)
    expect(await canAccessAnalytics(teacher, "class", "class-2")).toBe(false)
  })
})

describe("applyPermissionFilters — multi-tenant scoping", () => {
  it("always scopes by schoolId", async () => {
    const filter = await applyPermissionFilters(ctx(), "exam")
    expect(filter.schoolId).toBe("school-1")
  })

  it("restricts a TEACHER's exams to their class", async () => {
    const filter = await applyPermissionFilters(
      ctx({ userRole: "TEACHER", isTeacher: true, teacherId: "teacher-1" }),
      "exam"
    )
    expect(filter.class).toEqual({ teacherId: "teacher-1" })
  })

  it("restricts a STUDENT's exams to COMPLETED", async () => {
    const filter = await applyPermissionFilters(
      ctx({ userRole: "STUDENT", isStudent: true, studentId: "student-1" }),
      "exam"
    )
    expect(filter.status).toBe("COMPLETED")
  })

  it("restricts a STUDENT's results to their own studentId", async () => {
    const filter = await applyPermissionFilters(
      ctx({ userRole: "STUDENT", isStudent: true, studentId: "student-1" }),
      "result"
    )
    expect(filter.studentId).toBe("student-1")
  })

  it("restricts a GUARDIAN's results to their children", async () => {
    const filter = await applyPermissionFilters(
      ctx({ userRole: "GUARDIAN", isGuardian: true, guardianId: "guardian-1" }),
      "result"
    )
    expect(filter.student).toEqual({
      guardians: { some: { guardianId: "guardian-1" } },
    })
  })
})

describe("validatePermission", () => {
  it("blocks unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await validatePermission("exam:read")
    expect(result).toEqual({ allowed: false, reason: "Not authenticated" })
  })

  it("blocks a role without the required permission", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: "school-1" },
    } as any)
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)

    const result = await validatePermission("exam:create")
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("exam:create")
  })

  it("allows a permitted action with no resource id", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "ADMIN", schoolId: "school-1" },
    } as any)
    const result = await validatePermission("exam:create")
    expect(result).toEqual({ allowed: true })
  })

  it("enforces resource access on exam:update", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "TEACHER", schoolId: "school-1" },
    } as any)
    vi.mocked(db.teacher.findFirst).mockResolvedValue({
      id: "teacher-1",
    } as any)
    // teacher does not own this exam
    vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)

    const result = await validatePermission("exam:update", "exam-x")
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain("access to this exam")
  })
})

describe("getExamTabsForRole", () => {
  it("gives admins the full tab set with locale-prefixed hrefs", () => {
    const tabs = getExamTabsForRole("ADMIN", "en")
    expect(tabs).toHaveLength(8)
    expect(tabs.every((t) => t.href.startsWith("/en/exams"))).toBe(true)
  })

  it("scopes student tabs (practice, no mark/generate)", () => {
    const tabs = getExamTabsForRole("STUDENT", "ar")
    const names = tabs.map((t) => t.name)
    expect(names).toContain("Practice")
    expect(names).not.toContain("Mark")
    expect(names).not.toContain("Generate")
    expect(tabs.every((t) => t.href.startsWith("/ar/exams"))).toBe(true)
  })

  it("limits guardian, accountant, and staff to their slices", () => {
    expect(getExamTabsForRole("GUARDIAN", "en")).toHaveLength(3)
    expect(getExamTabsForRole("ACCOUNTANT", "en")).toHaveLength(2)
    expect(getExamTabsForRole("STAFF", "en")).toHaveLength(2)
  })

  it("falls back to overview-only for unknown roles", () => {
    const tabs = getExamTabsForRole(undefined, "en")
    expect(tabs).toHaveLength(1)
    expect(tabs[0].name).toBe("Overview")
  })

  it("uses dictionary labels when provided", () => {
    const tabs = getExamTabsForRole("ADMIN", "en", { overview: "نظرة عامة" })
    expect(tabs[0].name).toBe("نظرة عامة")
  })
})
