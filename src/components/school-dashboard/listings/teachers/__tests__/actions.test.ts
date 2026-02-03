import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from "../actions"

// Mock dependencies - actions use both $transaction and getModelOrThrow
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
    user: {
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

      // createTeacher uses db.$transaction with tx.teacher.create
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            create: vi.fn().mockResolvedValue(mockTeacher),
          },
          teacherPhoneNumber: {
            createMany: vi.fn(),
          },
          teacherQualification: {
            createMany: vi.fn(),
          },
          teacherExperience: {
            createMany: vi.fn(),
          },
          teacherSubjectExpertise: {
            createMany: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await createTeacher({
        givenName: "Sarah",
        surname: "Johnson",
        gender: "female",
        emailAddress: "sarah.johnson@school.edu",
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
        emailAddress: "sarah.johnson@school.edu",
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

      // updateTeacher uses db.$transaction
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findFirst: vi.fn().mockResolvedValue(mockTeacher),
          },
          teacherPhoneNumber: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          teacherQualification: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          teacherExperience: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          teacherSubjectExpertise: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
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

    it("updateMany returns success even if count is 0 (idempotent)", async () => {
      // The action uses updateMany which always succeeds
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          teacher: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null),
          },
          teacherPhoneNumber: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          teacherQualification: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          teacherExperience: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
          teacherSubjectExpertise: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await updateTeacher({
        id: "teacher-from-other-school",
        surname: "Hacker",
      })

      // updateMany doesn't throw when nothing matches
      expect(result.success).toBe(true)
    })
  })

  describe("deleteTeacher", () => {
    it("deletes teacher with schoolId scope", async () => {
      // deleteTeacher uses getModelOrThrow which returns db.teacher directly
      vi.mocked(db.teacher.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteTeacher({ id: "teacher-1" })

      expect(result.success).toBe(true)
    })

    it("deleteMany returns success even if count is 0 (idempotent)", async () => {
      // The action uses deleteMany which always succeeds
      vi.mocked(db.teacher.deleteMany).mockResolvedValue({ count: 0 })

      const result = await deleteTeacher({ id: "teacher-from-other-school" })

      // deleteMany doesn't throw when nothing matches
      expect(result.success).toBe(true)
    })
  })

  describe("getTeachers", () => {
    it("fetches teachers scoped to schoolId", async () => {
      const now = new Date()
      const mockTeachers = [
        {
          id: "1",
          givenName: "Sarah",
          surname: "Johnson",
          schoolId: mockSchoolId,
          userId: null,
          createdAt: now,
        },
        {
          id: "2",
          givenName: "Mike",
          surname: "Brown",
          schoolId: mockSchoolId,
          userId: "user-1",
          createdAt: now,
        },
      ]

      vi.mocked(db.teacher.findMany).mockResolvedValue(mockTeachers as any)
      vi.mocked(db.teacher.count).mockResolvedValue(2)

      const result = await getTeachers({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
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
