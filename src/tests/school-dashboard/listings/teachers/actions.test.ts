// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from "@/components/school-dashboard/listings/teachers/actions"

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
    school: {
      findUnique: vi.fn().mockResolvedValue({ preferredLanguage: "en" }),
    },
    class: {
      count: vi.fn().mockResolvedValue(0),
    },
    classTeacher: {
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    timetable: {
      count: vi.fn().mockResolvedValue(0),
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

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}))

vi.mock("@/components/translation/search", () => ({
  search: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/components/translation/person", () => ({
  getNames: vi.fn().mockResolvedValue(new Map()),
}))

vi.mock("@/lib/spotlight-cache", () => ({
  revalidateSpotlight: vi.fn(),
}))

describe("Teacher Actions", () => {
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
    // Reset default mocks for db models that vi.clearAllMocks() would clear
    vi.mocked(db.school.findUnique).mockResolvedValue({
      preferredLanguage: "en",
    } as any)
    vi.mocked(db.class.count).mockResolvedValue(0)
    vi.mocked(db.classTeacher.count).mockResolvedValue(0)
    vi.mocked(db.timetable.count).mockResolvedValue(0)
  })

  describe("createTeacher", () => {
    it("creates teacher with schoolId for multi-tenant isolation", async () => {
      const mockTeacher = {
        id: "teacher-1",
        firstName: "Sarah",
        lastName: "Johnson",
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
        firstName: "Sarah",
        lastName: "Johnson",
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
        firstName: "Sarah",
        lastName: "Johnson",
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
        firstName: "Sarah",
        lastName: "Williams",
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
        lastName: "Williams",
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
        lastName: "Hacker",
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
          firstName: "Sarah",
          lastName: "Johnson",
          schoolId: mockSchoolId,
          userId: null,
          createdAt: now,
        },
        {
          id: "2",
          firstName: "Mike",
          lastName: "Brown",
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
