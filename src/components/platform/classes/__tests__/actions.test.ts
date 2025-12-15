import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { createClass, deleteClass, getClasses, updateClass } from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    class: {
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
        class: {
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

describe("Class Actions", () => {
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

  describe("createClass", () => {
    it("creates class with schoolId for multi-tenant isolation", async () => {
      const mockClass = {
        id: "class-1",
        name: "Grade 10A",
        capacity: 30,
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          class: {
            create: vi.fn().mockResolvedValue(mockClass),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await createClass({
        name: "Grade 10A",
        capacity: 30,
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

      const result = await createClass({
        name: "Grade 10A",
        capacity: 30,
      })

      expect(result.success).toBe(false)
    })

    it("validates capacity is positive", async () => {
      const result = await createClass({
        name: "Grade 10A",
        capacity: -5,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateClass", () => {
    it("updates class with schoolId scope", async () => {
      const mockClass = {
        id: "class-1",
        name: "Grade 10B",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          class: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findFirst: vi.fn().mockResolvedValue(mockClass),
          },
        }
        return callback(tx)
      })

      const result = await updateClass({
        id: "class-1",
        name: "Grade 10B",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating class from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          class: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await updateClass({
        id: "class-from-other-school",
        name: "Hacked Class",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteClass", () => {
    it("deletes class with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          class: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteClass({ id: "class-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting class from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          class: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteClass({ id: "class-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getClasses", () => {
    it("fetches classes scoped to schoolId", async () => {
      const mockClasses = [
        { id: "1", name: "Grade 10A", schoolId: mockSchoolId },
        { id: "2", name: "Grade 10B", schoolId: mockSchoolId },
      ]

      vi.mocked(db.class.findMany).mockResolvedValue(mockClasses as any)
      vi.mocked(db.class.count).mockResolvedValue(2)

      const result = await getClasses({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })
  })
})
