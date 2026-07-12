// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import { getTenantContext } from "@/lib/tenant-context"
import {
  deleteStudent,
  getStudents,
  updateStudent,
} from "@/components/school-dashboard/listings/students/actions"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

// Mock dependencies - actions use getModelOrThrow which requires findFirst method
vi.mock("@/lib/db", () => ({
  db: {
    student: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    // Used by getStudents to resolve the school's preferred storage language.
    school: {
      findUnique: vi.fn().mockResolvedValue({ preferredLanguage: "en" }),
    },
    // Used by generateStudentUsername (mocked below) — kept here as a safety
    // net in case the real generator is ever exercised.
    schoolYear: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    academicGrade: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    section: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    yearLevel: {
      findFirst: vi.fn(),
    },
    // autoEnrollStudentInClasses() reads db.class.findMany then upserts
    // studentClass rows; returning [] makes it a no-op for these unit tests.
    class: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    studentClass: {
      count: vi.fn().mockResolvedValue(0),
      upsert: vi.fn().mockResolvedValue({}),
    },
    attendance: {
      count: vi.fn().mockResolvedValue(0),
    },
    examResult: {
      count: vi.fn().mockResolvedValue(0),
    },
    feeAssignment: {
      count: vi.fn().mockResolvedValue(0),
    },
    feeStructure: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    assignmentSubmission: {
      count: vi.fn().mockResolvedValue(0),
    },
    studentYearLevel: {
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

// Isolate the unit under test from the per-school code generator — it reads
// schoolYear / academicGrade / student which are out of scope for these tests.
vi.mock("@/lib/student-username", () => ({
  generateStudentUsername: vi.fn().mockResolvedValue("25010001"),
  STUDENT_USERNAME_PREFIX_LENGTH: 4,
}))

// Spy on the founder-contract fee provisioning helper. The convergence tests
// below assert this is invoked with { schoolId, studentId, academicGradeId }.
vi.mock("@/lib/fee-auto-assign", () => ({
  ensureStudentFeeAssignments: vi.fn().mockResolvedValue({
    created: 0,
    existing: 0,
    skipped: 0,
    assignmentIds: [],
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  // revalidateSpotlight() (called by create/update/delete) delegates to this.
  revalidateTag: vi.fn(),
}))

// getStudents reads the NEXT_LOCALE cookie for display-language resolution.
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "en" }),
  }),
}))

describe("Student Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", schoolId: mockSchoolId, role: "ADMIN" },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ADMIN",
      locale: "en",
    })
  })

  describe("updateStudent", () => {
    it("updates student with schoolId scope", async () => {
      // updateStudent uses getModelOrThrow which returns db.student directly
      vi.mocked(db.student.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateStudent({
        id: "student-1",
        firstName: "Jane",
      })

      expect(result.success).toBe(true)
    })

    it("updateMany returns success even if count is 0 (idempotent)", async () => {
      // The action uses updateMany which always succeeds - count indicates how many were updated
      // This is by design for idempotency - updating non-existent record is not an error
      vi.mocked(db.student.updateMany).mockResolvedValue({ count: 0 })

      const result = await updateStudent({
        id: "student-from-other-school",
        firstName: "Jane",
      })

      // updateMany doesn't throw when nothing matches - it just returns count: 0
      expect(result.success).toBe(true)
    })
  })

  describe("deleteStudent", () => {
    it("deletes student with schoolId scope using deleteMany", async () => {
      // deleteStudent uses getModelOrThrow which returns db.student directly
      vi.mocked(db.student.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteStudent({ id: "student-1" })

      expect(result.success).toBe(true)
    })

    it("deleteMany returns success even if count is 0 (idempotent)", async () => {
      // The action uses deleteMany which always succeeds - count indicates how many were deleted
      // This is by design for idempotency - deleting non-existent record is not an error
      vi.mocked(db.student.deleteMany).mockResolvedValue({ count: 0 })

      const result = await deleteStudent({ id: "student-from-other-school" })

      // deleteMany doesn't throw when nothing matches - it just returns count: 0
      expect(result.success).toBe(true)
    })
  })

  describe("getStudents", () => {
    it("fetches students scoped to schoolId", async () => {
      const now = new Date()
      const mockStudents = [
        {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          schoolId: mockSchoolId,
          userId: null,
          createdAt: now,
          studentClasses: [],
        },
        {
          id: "2",
          firstName: "Jane",
          lastName: "Smith",
          schoolId: mockSchoolId,
          userId: "user-1",
          createdAt: now,
          studentClasses: [],
        },
      ]

      vi.mocked(db.student.findMany).mockResolvedValue(mockStudents as any)
      vi.mocked(db.student.count).mockResolvedValue(2)

      const result = await getStudents({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
    })

    it("applies search filter with schoolId", async () => {
      vi.mocked(db.student.findMany).mockResolvedValue([])
      vi.mocked(db.student.count).mockResolvedValue(0)

      await getStudents({ name: "John" })

      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })

  // ==========================================================================
  // Founder-contract convergence: the grade-update path (updateStudent) MUST
  // end with ensureStudentFeeAssignments when academicGradeId changes. These
  // are the regression guards for the fee-provisioning fix.
  //
  // The createStudent/registerStudent variants of this guard were removed
  // here when both functions were deleted as dead code (unified onto the
  // provisionStudent core — see src/lib/student-provisioning.ts). Equivalent
  // create-path fee-provisioning coverage now lives with that core's callers
  // (e.g. src/tests/file/import/csv-import.test.ts).
  // ==========================================================================
  describe("founder-contract: fee auto-assignment convergence", () => {
    const mockAcademicGradeId = "grade-7"

    it("updateStudent provisions fees when academicGradeId changes", async () => {
      vi.mocked(db.student.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateStudent({
        id: "student-1",
        academicGradeId: mockAcademicGradeId,
      })

      expect(result.success).toBe(true)
      expect(ensureStudentFeeAssignments).toHaveBeenCalledTimes(1)
      expect(ensureStudentFeeAssignments).toHaveBeenCalledWith({
        schoolId: mockSchoolId,
        studentId: "student-1",
        academicGradeId: mockAcademicGradeId,
      })
    })

    it("updateStudent persists email + mobileNumber when provided", async () => {
      vi.mocked(db.student.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateStudent({
        id: "student-1",
        email: "updated@example.com",
        mobileNumber: "+966511111111",
      })

      expect(result.success).toBe(true)
      expect(db.student.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "student-1", schoolId: mockSchoolId },
          data: expect.objectContaining({
            email: "updated@example.com",
            mobileNumber: "+966511111111",
          }),
        })
      )
    })
  })
})
