import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createStudent,
  updateStudent,
  deleteStudent,
  getStudents,
} from "../actions"

// Mock dependencies
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
    yearLevel: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      student: {
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    })),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          student: {
            create: vi.fn().mockResolvedValue(mockStudent),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
          },
        }
        return callback(tx)
      })

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
      const mockStudent = {
        id: "student-1",
        givenName: "Jane",
        surname: "Doe",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          student: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findFirst: vi.fn().mockResolvedValue(mockStudent),
          },
        }
        return callback(tx)
      })

      const result = await updateStudent({
        id: "student-1",
        givenName: "Jane",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating student from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          student: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await updateStudent({
        id: "student-from-other-school",
        givenName: "Jane",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteStudent", () => {
    it("deletes student with schoolId scope using deleteMany", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          student: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteStudent({ id: "student-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting student from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          student: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteStudent({ id: "student-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getStudents", () => {
    it("fetches students scoped to schoolId", async () => {
      const mockStudents = [
        { id: "1", givenName: "John", surname: "Doe", schoolId: mockSchoolId },
        { id: "2", givenName: "Jane", surname: "Smith", schoolId: mockSchoolId },
      ]

      vi.mocked(db.student.findMany).mockResolvedValue(mockStudents as any)
      vi.mocked(db.student.count).mockResolvedValue(2)

      const result = await getStudents({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it("applies search filter with schoolId", async () => {
      vi.mocked(db.student.findMany).mockResolvedValue([])
      vi.mocked(db.student.count).mockResolvedValue(0)

      await getStudents({ search: "John" })

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
