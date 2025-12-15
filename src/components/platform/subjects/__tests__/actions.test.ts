import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    subject: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        subject: {
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
          findFirst: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
        },
      })
    ),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Subject Actions", () => {
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

  describe("createSubject", () => {
    it("creates subject with schoolId for multi-tenant isolation", async () => {
      const mockSubject = {
        id: "subject-1",
        name: "Mathematics",
        code: "MATH101",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subject: {
            create: vi.fn().mockResolvedValue(mockSubject),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await createSubject({
        name: "Mathematics",
        code: "MATH101",
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

      const result = await createSubject({
        name: "Mathematics",
        code: "MATH101",
      })

      expect(result.success).toBe(false)
    })

    it("prevents duplicate subject codes within same school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subject: {
            create: vi
              .fn()
              .mockRejectedValue(new Error("Unique constraint failed")),
            findFirst: vi
              .fn()
              .mockResolvedValue({ id: "existing", code: "MATH101" }),
          },
        }
        return callback(tx)
      })

      const result = await createSubject({
        name: "Math",
        code: "MATH101",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateSubject", () => {
    it("updates subject with schoolId scope", async () => {
      const mockSubject = {
        id: "subject-1",
        name: "Advanced Mathematics",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subject: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findFirst: vi.fn().mockResolvedValue(mockSubject),
          },
        }
        return callback(tx)
      })

      const result = await updateSubject({
        id: "subject-1",
        name: "Advanced Mathematics",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating subject from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subject: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await updateSubject({
        id: "subject-from-other-school",
        name: "Hacked Subject",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteSubject", () => {
    it("deletes subject with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subject: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteSubject({ id: "subject-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting subject from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subject: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteSubject({ id: "subject-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getSubjects", () => {
    it("fetches subjects scoped to schoolId", async () => {
      const mockSubjects = [
        {
          id: "1",
          name: "Mathematics",
          code: "MATH101",
          schoolId: mockSchoolId,
        },
        { id: "2", name: "English", code: "ENG101", schoolId: mockSchoolId },
      ]

      vi.mocked(db.subject.findMany).mockResolvedValue(mockSubjects as any)
      vi.mocked(db.subject.count).mockResolvedValue(2)

      const result = await getSubjects({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it("applies department filter with schoolId", async () => {
      vi.mocked(db.subject.findMany).mockResolvedValue([])
      vi.mocked(db.subject.count).mockResolvedValue(0)

      await getSubjects({ departmentId: "dept-1" })

      expect(db.subject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })
})
