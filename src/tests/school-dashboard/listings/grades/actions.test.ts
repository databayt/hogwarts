// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  bulkDeleteResults,
  createResult,
  deleteResult,
  getResult,
  getResults,
  getResultsCSV,
  updateResult,
} from "@/components/school-dashboard/listings/grades/actions"

vi.mock("@/lib/db", () => ({
  db: {
    result: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    guardian: { findFirst: vi.fn() },
    studentGuardian: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const SCHOOL = "school-1"
const USER = "user-1"

function asAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER, role: "ADMIN", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    requestId: "rid",
    role: "ADMIN" as any,
    isPlatformAdmin: false,
  } as any)
}

function asTeacher(userId = USER) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, role: "TEACHER", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    requestId: "rid",
    role: "TEACHER" as any,
    isPlatformAdmin: false,
  } as any)
}

function asUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    requestId: "rid",
    role: null as any,
    isPlatformAdmin: false,
  } as any)
}

const validInput = {
  studentId: "stu-1",
  assignmentId: "as-1",
  classId: "cl-1",
  score: 85,
  maxScore: 100,
  grade: "A",
  feedback: "Great",
}

beforeEach(() => {
  vi.clearAllMocks()
})

// NOTE: actions.ts currently mixes ACTION_ERRORS codes (NOT_AUTHENTICATED,
// MISSING_SCHOOL, NOT_FOUND, UNKNOWN) with hardcoded English fallback strings
// for permission and DB-level failures. Tests below reflect the current
// behavior — they're not asserting an aspirational i18n state.

describe("createResult", () => {
  it("returns NOT_AUTHENTICATED when no session", async () => {
    asUnauthenticated()
    const r = await createResult(validInput)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL when no schoolId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, role: "ADMIN", schoolId: null },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      requestId: "rid",
      role: "ADMIN" as any,
      isPlatformAdmin: false,
    } as any)
    const r = await createResult(validInput)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("MISSING_SCHOOL")
  })

  it("blocks USER role with hardcoded permission message", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, role: "USER", schoolId: SCHOOL },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      requestId: "rid",
      role: "USER" as any,
      isPlatformAdmin: false,
    } as any)
    const r = await createResult(validInput)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("unauthorized")
  })

  it("creates a result with schoolId, computes percentage, sets gradedBy", async () => {
    asTeacher()
    vi.mocked(db.student.findFirst).mockResolvedValue({
      academicGrade: { yearLevelId: "y1" },
    } as any)
    vi.mocked(db.result.create).mockResolvedValue({ id: "r-1" } as any)

    const r = await createResult(validInput)
    expect(r.success).toBe(true)

    expect(db.result.create).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(db.result.create).mock.calls[0][0]
    expect(arg.data.schoolId).toBe(SCHOOL)
    expect(arg.data.studentId).toBe("stu-1")
    expect(arg.data.assignmentId).toBe("as-1")
    expect(arg.data.percentage).toBe(85)
    expect(arg.data.gradedBy).toBe(USER)
    expect(arg.data.yearLevelId).toBe("y1")
  })

  it("returns a Validation error when score > maxScore", async () => {
    asTeacher()
    const r = await createResult({ ...validInput, score: 150, maxScore: 100 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("validation")
  })

  it("returns a Validation error when assignmentId is missing", async () => {
    asTeacher()
    const { assignmentId: _omit, ...rest } = validInput
    const r = await createResult(rest as any)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("validation")
  })

  it("returns a generic error on unexpected DB error", async () => {
    asTeacher()
    vi.mocked(db.student.findFirst).mockResolvedValue(null as any)
    vi.mocked(db.result.create).mockRejectedValue(new Error("boom"))
    const r = await createResult(validInput)
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBeTruthy()
  })
})

describe("updateResult", () => {
  it("scopes lookup and update by schoolId", async () => {
    asAdmin()
    vi.mocked(db.result.findFirst).mockResolvedValue({
      id: "r1",
      gradedBy: USER,
      schoolId: SCHOOL,
      score: 80,
      maxScore: 100,
    } as any)
    vi.mocked(db.result.updateMany).mockResolvedValue({ count: 1 } as any)

    const r = await updateResult({ id: "r1", score: 90 })
    expect(r.success).toBe(true)

    const findArg = vi.mocked(db.result.findFirst).mock.calls[0][0]
    expect(findArg?.where).toMatchObject({ id: "r1", schoolId: SCHOOL })

    const updateArg = vi.mocked(db.result.updateMany).mock.calls[0][0]
    expect(updateArg.where).toMatchObject({ id: "r1", schoolId: SCHOOL })
  })

  it("returns NOT_FOUND when result missing", async () => {
    asAdmin()
    vi.mocked(db.result.findFirst).mockResolvedValue(null as any)
    const r = await updateResult({ id: "missing", score: 90 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_FOUND")
  })

  it("recomputes percentage when score changes", async () => {
    asAdmin()
    vi.mocked(db.result.findFirst)
      .mockResolvedValueOnce({
        id: "r1",
        gradedBy: USER,
        schoolId: SCHOOL,
      } as any)
      .mockResolvedValueOnce({ score: 80, maxScore: 100 } as any)
    vi.mocked(db.result.updateMany).mockResolvedValue({ count: 1 } as any)

    const r = await updateResult({ id: "r1", score: 50 })
    expect(r.success).toBe(true)

    const updateArg = vi.mocked(db.result.updateMany).mock.calls[0][0]
    expect(updateArg.data.percentage).toBe(50)
  })

  it("blocks TEACHER updating another teacher's grade", async () => {
    asTeacher()
    vi.mocked(db.result.findFirst).mockResolvedValue({
      id: "r1",
      gradedBy: "another-teacher",
      schoolId: SCHOOL,
    } as any)
    const r = await updateResult({ id: "r1", score: 90 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("unauthorized")
    expect(db.result.updateMany).not.toHaveBeenCalled()
  })

  it("allows TEACHER updating their own grade", async () => {
    asTeacher()
    vi.mocked(db.result.findFirst).mockResolvedValue({
      id: "r1",
      gradedBy: USER,
      schoolId: SCHOOL,
    } as any)
    vi.mocked(db.result.updateMany).mockResolvedValue({ count: 1 } as any)
    const r = await updateResult({ id: "r1", feedback: "Updated" })
    expect(r.success).toBe(true)
  })

  it("returns NOT_AUTHENTICATED when no session", async () => {
    asUnauthenticated()
    const r = await updateResult({ id: "r1", score: 90 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns a Validation error on bad payload", async () => {
    asAdmin()
    const r = await updateResult({ id: "" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("validation")
  })
})

describe("deleteResult", () => {
  it("scopes by schoolId", async () => {
    asAdmin()
    vi.mocked(db.result.findFirst).mockResolvedValue({
      id: "r1",
      gradedBy: USER,
      schoolId: SCHOOL,
    } as any)
    vi.mocked(db.result.deleteMany).mockResolvedValue({ count: 1 } as any)

    const r = await deleteResult({ id: "r1" })
    expect(r.success).toBe(true)
    expect(db.result.deleteMany).toHaveBeenCalledWith({
      where: { id: "r1", schoolId: SCHOOL },
    })
  })

  it("returns NOT_FOUND when result is missing", async () => {
    asAdmin()
    vi.mocked(db.result.findFirst).mockResolvedValue(null as any)
    const r = await deleteResult({ id: "missing" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_FOUND")
  })

  it("blocks TEACHER deleting another teacher's grade", async () => {
    asTeacher()
    vi.mocked(db.result.findFirst).mockResolvedValue({
      id: "r1",
      gradedBy: "other",
      schoolId: SCHOOL,
    } as any)
    const r = await deleteResult({ id: "r1" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("unauthorized")
    expect(db.result.deleteMany).not.toHaveBeenCalled()
  })

  it("returns a Validation error for empty id", async () => {
    asAdmin()
    const r = await deleteResult({ id: "" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("validation")
  })
})

describe("getResult", () => {
  it("scopes by schoolId and maps fields", async () => {
    asAdmin()
    const mocked = {
      id: "r1",
      schoolId: SCHOOL,
      studentId: "stu-1",
      assignmentId: "as-1",
      classId: "cl-1",
      score: 85,
      maxScore: 100,
      percentage: 85,
      grade: "A",
      feedback: "ok",
      submittedAt: null,
      gradedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(db.result.findFirst).mockResolvedValue(mocked as any)

    const r = await getResult({ id: "r1" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).not.toBeNull()
      expect(r.data?.id).toBe("r1")
      expect(r.data?.schoolId).toBe(SCHOOL)
      expect(typeof r.data?.score).toBe("number")
    }
  })

  it("returns null data for missing record", async () => {
    asAdmin()
    vi.mocked(db.result.findFirst).mockResolvedValue(null as any)
    const r = await getResult({ id: "missing" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toBeNull()
  })

  it("returns NOT_AUTHENTICATED when no session", async () => {
    asUnauthenticated()
    const r = await getResult({ id: "r1" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_AUTHENTICATED")
  })
})

describe("getResults", () => {
  it("scopes the query by schoolId and parses defaults", async () => {
    asAdmin()
    vi.mocked(db.result.findMany).mockResolvedValue([] as any)
    vi.mocked(db.result.count).mockResolvedValue(0 as any)

    const r = await getResults({})
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.rows).toEqual([])
      expect(r.data.total).toBe(0)
    }
    const firstArg = vi.mocked(db.result.findMany).mock.calls[0]?.[0]
    expect(firstArg?.where).toMatchObject({
      schoolId: SCHOOL,
      wizardStep: null,
    })
  })

  it("requires authentication", async () => {
    asUnauthenticated()
    const r = await getResults({})
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_AUTHENTICATED")
  })

  // GUARDIAN must only see their own children's grades. Before this hotfix,
  // /grades returned every grade in the school to any GUARDIAN — a multi-tenant
  // leak inside the same tenant. These tests pin the new behavior.
  describe("auto-scopes results for GUARDIAN role", () => {
    function asGuardian() {
      vi.mocked(auth).mockResolvedValue({
        user: { id: USER, role: "GUARDIAN", schoolId: SCHOOL },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL,
        requestId: "rid",
        role: "GUARDIAN" as any,
        isPlatformAdmin: false,
      } as any)
    }

    it("restricts the query to the guardian's children", async () => {
      asGuardian()
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "guardian-1",
      } as any)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
        { studentId: "child-a" },
        { studentId: "child-b" },
      ] as any)
      vi.mocked(db.result.findMany).mockResolvedValue([] as any)
      vi.mocked(db.result.count).mockResolvedValue(0 as any)

      const r = await getResults({})
      expect(r.success).toBe(true)

      const where = vi.mocked(db.result.findMany).mock.calls[0]?.[0]?.where
      expect(where).toMatchObject({
        schoolId: SCHOOL,
        studentId: { in: ["child-a", "child-b"] },
      })
    })

    it("returns an empty list without hitting the DB when guardian has no children", async () => {
      asGuardian()
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "guardian-2",
      } as any)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([] as any)

      const r = await getResults({})
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.rows).toEqual([])
        expect(r.data.total).toBe(0)
      }
      // Critical: do not run an unscoped query.
      expect(db.result.findMany).not.toHaveBeenCalled()
    })

    it("returns empty when the user is not actually a guardian in this school", async () => {
      asGuardian()
      vi.mocked(db.guardian.findFirst).mockResolvedValue(null as any)

      const r = await getResults({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.rows).toEqual([])
      expect(db.result.findMany).not.toHaveBeenCalled()
    })
  })

  // STUDENT must only see their own grades. Same shape as GUARDIAN but keyed
  // off Student.userId = auth.userId instead of the guardian link.
  describe("auto-scopes results for STUDENT role", () => {
    function asStudent() {
      vi.mocked(auth).mockResolvedValue({
        user: { id: USER, role: "STUDENT", schoolId: SCHOOL },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL,
        requestId: "rid",
        role: "STUDENT" as any,
        isPlatformAdmin: false,
      } as any)
    }

    it("restricts the query to the student's own record", async () => {
      asStudent()
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as any)
      vi.mocked(db.result.findMany).mockResolvedValue([] as any)
      vi.mocked(db.result.count).mockResolvedValue(0 as any)

      const r = await getResults({})
      expect(r.success).toBe(true)

      const where = vi.mocked(db.result.findMany).mock.calls[0]?.[0]?.where
      expect(where).toMatchObject({
        schoolId: SCHOOL,
        studentId: { in: ["stu-1"] },
      })
    })

    it("returns empty when no Student record exists for this user", async () => {
      asStudent()
      vi.mocked(db.student.findFirst).mockResolvedValue(null as any)

      const r = await getResults({})
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.rows).toEqual([])
      expect(db.result.findMany).not.toHaveBeenCalled()
    })
  })
})

describe("getResultsCSV", () => {
  it("returns CSV string for ADMIN", async () => {
    asAdmin()
    vi.mocked(db.result.findMany).mockResolvedValue([
      {
        id: "r1",
        score: 85,
        maxScore: 100,
        percentage: 85,
        grade: "A",
        createdAt: new Date("2026-01-15T00:00:00Z"),
        student: { firstName: "Ada", lastName: "Lovelace" },
        class: { name: "Math 101" },
        assignment: { title: "HW 1" },
        exam: null,
      },
    ] as any)
    vi.mocked(db.result.count).mockResolvedValue(1 as any)

    const r = await getResultsCSV()
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).toContain("ID,Student,Assignment,Class,Score")
      expect(r.data).toContain("r1")
      expect(r.data).toContain("Ada Lovelace")
      expect(r.data).toContain("HW 1")
    }
  })

  it("blocks STAFF from exporting", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, role: "STAFF", schoolId: SCHOOL },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      requestId: "rid",
      role: "STAFF" as any,
      isPlatformAdmin: false,
    } as any)
    const r = await getResultsCSV()
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("unauthorized")
  })
})

describe("bulkDeleteResults", () => {
  it("deletes many scoped by schoolId for ADMIN", async () => {
    asAdmin()
    vi.mocked(db.result.deleteMany).mockResolvedValue({ count: 3 } as any)
    const r = await bulkDeleteResults({ ids: ["r1", "r2", "r3"] })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.count).toBe(3)
    expect(db.result.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["r1", "r2", "r3"] }, schoolId: SCHOOL },
    })
  })

  it("blocks TEACHER from bulk delete", async () => {
    asTeacher()
    const r = await bulkDeleteResults({ ids: ["r1"] })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.toLowerCase()).toContain("unauthorized")
    expect(db.result.deleteMany).not.toHaveBeenCalled()
  })

  it("returns NOT_AUTHENTICATED without session", async () => {
    asUnauthenticated()
    const r = await bulkDeleteResults({ ids: ["r1"] })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("NOT_AUTHENTICATED")
  })
})
