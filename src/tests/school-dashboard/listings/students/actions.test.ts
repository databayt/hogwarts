// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createStudent,
  deleteStudent,
  getStudents,
  registerStudent,
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

  describe("createStudent", () => {
    it("creates student with schoolId for multi-tenant isolation", async () => {
      const mockStudent = {
        id: "student-1",
        firstName: "John",
        lastName: "Doe",
        schoolId: mockSchoolId,
      }

      // createStudent uses getModelOrThrow which returns db.student directly
      vi.mocked(db.student.create).mockResolvedValue(mockStudent as any)

      const result = await createStudent({
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        dateOfBirth: "2010-05-15",
      })

      expect(result.success).toBe(true)
    })

    it("returns error when no schoolId in tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createStudent({
        firstName: "John",
        lastName: "Doe",
        gender: "male",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("MISSING_SCHOOL")
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
  // Founder-contract convergence: every student-create / grade-update path
  // that knows the student's grade MUST end with ensureStudentFeeAssignments.
  // These are the regression guards for the fee-provisioning fix — the
  // registration form previously created students with zero fees.
  // ==========================================================================
  describe("founder-contract: fee auto-assignment convergence", () => {
    const mockAcademicGradeId = "grade-7"

    it("registerStudent provisions fees with { schoolId, studentId, academicGradeId }", async () => {
      const mockStudent = { id: "student-reg-1", schoolId: mockSchoolId }
      // registerStudent generates a GR number from the latest student, then
      // creates the student row.
      vi.mocked(db.student.findFirst).mockResolvedValue(null)
      vi.mocked(db.student.create).mockResolvedValue(mockStudent as any)

      const result = await registerStudent({
        firstName: "Reg",
        lastName: "Student",
        dateOfBirth: "2012-03-01",
        gender: "male",
        academicGradeId: mockAcademicGradeId,
      })

      expect(result.success).toBe(true)
      expect(ensureStudentFeeAssignments).toHaveBeenCalledTimes(1)
      expect(ensureStudentFeeAssignments).toHaveBeenCalledWith({
        schoolId: mockSchoolId,
        studentId: mockStudent.id,
        academicGradeId: mockAcademicGradeId,
      })
    })

    it("registerStudent does NOT provision fees when no academicGradeId is set", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)
      vi.mocked(db.student.create).mockResolvedValue({
        id: "student-reg-2",
        schoolId: mockSchoolId,
      } as any)

      const result = await registerStudent({
        firstName: "NoGrade",
        lastName: "Student",
        dateOfBirth: "2012-03-01",
        gender: "female",
      })

      expect(result.success).toBe(true)
      expect(ensureStudentFeeAssignments).not.toHaveBeenCalled()
    })

    it("createStudent provisions fees when academicGradeId is supplied", async () => {
      const mockStudent = { id: "student-create-1", schoolId: mockSchoolId }
      vi.mocked(db.student.create).mockResolvedValue(mockStudent as any)

      const result = await createStudent({
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        dateOfBirth: "2010-05-15",
        academicGradeId: mockAcademicGradeId,
      })

      expect(result.success).toBe(true)
      expect(ensureStudentFeeAssignments).toHaveBeenCalledTimes(1)
      expect(ensureStudentFeeAssignments).toHaveBeenCalledWith({
        schoolId: mockSchoolId,
        studentId: mockStudent.id,
        academicGradeId: mockAcademicGradeId,
      })
    })

    it("createStudent does NOT provision fees without an academicGradeId", async () => {
      vi.mocked(db.student.create).mockResolvedValue({
        id: "student-create-2",
        schoolId: mockSchoolId,
      } as any)

      const result = await createStudent({
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        dateOfBirth: "2010-05-15",
      })

      expect(result.success).toBe(true)
      expect(ensureStudentFeeAssignments).not.toHaveBeenCalled()
    })

    it("createStudent persists email + mobileNumber in the create payload", async () => {
      vi.mocked(db.student.create).mockResolvedValue({
        id: "student-create-3",
        schoolId: mockSchoolId,
      } as any)

      const result = await createStudent({
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        dateOfBirth: "2010-05-15",
        email: "john.doe@example.com",
        mobileNumber: "+966500000000",
      })

      expect(result.success).toBe(true)
      expect(db.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            email: "john.doe@example.com",
            mobileNumber: "+966500000000",
          }),
        })
      )
    })

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
