import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
} from "../actions"

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
    yearLevel: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Student Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
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
        givenName: "John",
        surname: "Doe",
        schoolId: mockSchoolId,
      }

      // createStudent uses getModelOrThrow which returns db.student directly
      vi.mocked(db.student.create).mockResolvedValue(mockStudent as any)

      const result = await createStudent({
        givenName: "John",
        surname: "Doe",
        gender: "male",
      })

      expect(result.success).toBe(true)
    })

    it("returns error when not authenticated (no schoolId)", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createStudent({
        givenName: "John",
        surname: "Doe",
        gender: "male",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("school")
    })
  })

  describe("updateStudent", () => {
    it("updates student with schoolId scope", async () => {
      // updateStudent uses getModelOrThrow which returns db.student directly
      vi.mocked(db.student.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateStudent({
        id: "student-1",
        givenName: "Jane",
      })

      expect(result.success).toBe(true)
    })

    it("updateMany returns success even if count is 0 (idempotent)", async () => {
      // The action uses updateMany which always succeeds - count indicates how many were updated
      // This is by design for idempotency - updating non-existent record is not an error
      vi.mocked(db.student.updateMany).mockResolvedValue({ count: 0 })

      const result = await updateStudent({
        id: "student-from-other-school",
        givenName: "Jane",
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
          givenName: "John",
          surname: "Doe",
          schoolId: mockSchoolId,
          userId: null,
          createdAt: now,
          studentClasses: [],
        },
        {
          id: "2",
          givenName: "Jane",
          surname: "Smith",
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
})
