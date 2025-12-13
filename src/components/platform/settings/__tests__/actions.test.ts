import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  updateUserRole,
  getSchoolUsers,
  exportSchoolData,
} from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      user: {
        updateMany: vi.fn(),
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

describe("Settings Actions", () => {
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

  describe("updateUserRole", () => {
    it("updates user role within same school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await updateUserRole({
        userId: "user-1",
        role: "TEACHER",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating user from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          user: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        }
        return callback(tx)
      })

      const result = await updateUserRole({
        userId: "user-from-other-school",
        role: "ADMIN",
      })

      expect(result.success).toBe(false)
    })

    it("requires ADMIN role to update user roles", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "TEACHER", // Not admin
        locale: "en",
      })

      const result = await updateUserRole({
        userId: "user-1",
        role: "ADMIN",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("getSchoolUsers", () => {
    it("fetches users scoped to schoolId", async () => {
      const mockUsers = [
        { id: "1", name: "John Doe", role: "TEACHER", schoolId: mockSchoolId },
        { id: "2", name: "Jane Smith", role: "STUDENT", schoolId: mockSchoolId },
      ]

      vi.mocked(db.user.findMany).mockResolvedValue(mockUsers as any)
      vi.mocked(db.user.count).mockResolvedValue(2)

      const result = await getSchoolUsers({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it("applies role filter with schoolId", async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([])
      vi.mocked(db.user.count).mockResolvedValue(0)

      await getSchoolUsers({ role: "TEACHER" })

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            role: "TEACHER",
          }),
        })
      )
    })
  })

  describe("exportSchoolData", () => {
    it("exports data only for current school", async () => {
      vi.mocked(db.school.findFirst).mockResolvedValue({
        id: mockSchoolId,
        name: "Test School",
        students: [],
        teachers: [],
        classes: [],
      } as any)

      const result = await exportSchoolData({
        format: "json",
        includeStudents: true,
        includeTeachers: true,
      })

      expect(result.success).toBe(true)
      expect(db.school.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSchoolId },
        })
      )
    })

    it("returns error when school not found", async () => {
      vi.mocked(db.school.findFirst).mockResolvedValue(null)

      const result = await exportSchoolData({
        format: "json",
      })

      expect(result.success).toBe(false)
    })
  })
})
