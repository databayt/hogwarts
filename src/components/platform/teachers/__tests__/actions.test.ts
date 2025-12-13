import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachers,
} from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    teacher: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      teacher: {
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

describe("Teacher Actions", () => {
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

  describe("createTeacher", () => {
    it("creates teacher with schoolId for multi-tenant isolation", async () => {
      const mockTeacher = {
        id: "teacher-1",
        givenName: "Sarah",
        surname: "Johnson",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            create: vi.fn().mockResolvedValue(mockTeacher),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await createTeacher({
        givenName: "Sarah",
        surname: "Johnson",
        gender: "female",
      })

      expect(result.success).toBe(true)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createTeacher({
        givenName: "Sarah",
        surname: "Johnson",
        gender: "female",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateTeacher", () => {
    it("updates teacher with schoolId scope", async () => {
      const mockTeacher = {
        id: "teacher-1",
        givenName: "Sarah",
        surname: "Williams",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findFirst: vi.fn().mockResolvedValue(mockTeacher),
          },
        }
        return callback(tx)
      })

      const result = await updateTeacher({
        id: "teacher-1",
        surname: "Williams",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating teacher from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await updateTeacher({
        id: "teacher-from-other-school",
        surname: "Hacker",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteTeacher", () => {
    it("deletes teacher with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteTeacher({ id: "teacher-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting teacher from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteTeacher({ id: "teacher-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getTeachers", () => {
    it("fetches teachers scoped to schoolId", async () => {
      const mockTeachers = [
        { id: "1", givenName: "Sarah", surname: "Johnson", schoolId: mockSchoolId },
        { id: "2", givenName: "Mike", surname: "Brown", schoolId: mockSchoolId },
      ]

      vi.mocked(db.teacher.findMany).mockResolvedValue(mockTeachers as any)
      vi.mocked(db.teacher.count).mockResolvedValue(2)

      const result = await getTeachers({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it("applies department filter with schoolId", async () => {
      vi.mocked(db.teacher.findMany).mockResolvedValue([])
      vi.mocked(db.teacher.count).mockResolvedValue(0)

      await getTeachers({ departmentId: "dept-1" })

      expect(db.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })
})
