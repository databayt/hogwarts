import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  createParent,
  updateParent,
  deleteParent,
  getParents,
  linkGuardian,
  unlinkGuardian,
} from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    guardian: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    studentGuardian: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      guardian: {
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      studentGuardian: {
        create: vi.fn(),
        deleteMany: vi.fn(),
        findFirst: vi.fn(),
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

describe("Parent/Guardian Actions", () => {
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

  describe("createParent", () => {
    it("creates guardian with schoolId for multi-tenant isolation", async () => {
      const mockGuardian = {
        id: "guardian-1",
        givenName: "Robert",
        surname: "Smith",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          guardian: {
            create: vi.fn().mockResolvedValue(mockGuardian),
            findFirst: vi.fn().mockResolvedValue(null),
          },
        }
        return callback(tx)
      })

      const result = await createParent({
        givenName: "Robert",
        surname: "Smith",
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

      const result = await createParent({
        givenName: "Robert",
        surname: "Smith",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("linkGuardian", () => {
    it("links guardian to student with schoolId verification", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          guardian: {
            findFirst: vi.fn().mockResolvedValue({ id: "guardian-1", schoolId: mockSchoolId }),
          },
          studentGuardian: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              guardianId: "guardian-1",
              studentId: "student-1",
            }),
          },
        }
        return callback(tx)
      })

      const result = await linkGuardian({
        guardianId: "guardian-1",
        studentId: "student-1",
        relationshipType: "FATHER",
      })

      expect(result.success).toBe(true)
    })

    it("prevents linking guardian from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          guardian: {
            findFirst: vi.fn().mockResolvedValue(null), // Not found in this school
          },
          studentGuardian: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await linkGuardian({
        guardianId: "guardian-from-other-school",
        studentId: "student-1",
        relationshipType: "FATHER",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("unlinkGuardian", () => {
    it("unlinks guardian from student with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          studentGuardian: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await unlinkGuardian({
        guardianId: "guardian-1",
        studentId: "student-1",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("getParents", () => {
    it("fetches guardians scoped to schoolId", async () => {
      const mockGuardians = [
        { id: "1", givenName: "Robert", surname: "Smith", schoolId: mockSchoolId },
        { id: "2", givenName: "Mary", surname: "Johnson", schoolId: mockSchoolId },
      ]

      vi.mocked(db.guardian.findMany).mockResolvedValue(mockGuardians as any)
      vi.mocked(db.guardian.count).mockResolvedValue(2)

      const result = await getParents({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })
  })

  describe("deleteParent", () => {
    it("deletes guardian with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          guardian: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteParent({ id: "guardian-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting guardian from different school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          guardian: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteParent({ id: "guardian-from-other-school" })

      expect(result.success).toBe(false)
    })
  })
})
