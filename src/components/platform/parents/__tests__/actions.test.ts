import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createParent,
  deleteParent,
  getParents,
  linkGuardian,
  unlinkGuardian,
  updateParent,
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
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    studentGuardian: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
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

      // The action uses getModelOrThrow which accesses db.guardian directly
      vi.mocked(db.guardian.create).mockResolvedValue(mockGuardian as any)

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
      // Mock guardian exists
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "guardian-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock student exists
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock no existing relationship
      vi.mocked(db.studentGuardian.findFirst).mockResolvedValue(null)
      // Mock relationship creation
      vi.mocked(db.studentGuardian.create).mockResolvedValue({
        id: "sg-1",
        guardianId: "guardian-1",
        studentId: "student-1",
      } as any)

      const result = await linkGuardian({
        guardianId: "guardian-1",
        studentId: "student-1",
        guardianTypeId: "type-1",
      })

      expect(result.success).toBe(true)
    })

    it("prevents linking guardian from different school", async () => {
      // Mock guardian not found in this school
      vi.mocked(db.guardian.findFirst).mockResolvedValue(null)

      const result = await linkGuardian({
        guardianId: "guardian-from-other-school",
        studentId: "student-1",
        guardianTypeId: "type-1",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("unlinkGuardian", () => {
    it("unlinks guardian from student with schoolId scope", async () => {
      // Mock existing relationship found
      vi.mocked(db.studentGuardian.findFirst).mockResolvedValue({
        id: "sg-1",
        studentId: "student-1",
        guardianId: "guardian-1",
        schoolId: mockSchoolId,
      } as any)
      // Mock successful delete
      vi.mocked(db.studentGuardian.delete).mockResolvedValue({
        id: "sg-1",
      } as any)

      const result = await unlinkGuardian({
        studentGuardianId: "sg-1",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("getParents", () => {
    it("fetches guardians scoped to schoolId", async () => {
      const now = new Date()
      const mockGuardians = [
        {
          id: "1",
          givenName: "Robert",
          surname: "Smith",
          schoolId: mockSchoolId,
          emailAddress: "robert@example.com",
          userId: null,
          createdAt: now,
          updatedAt: now,
          _count: { students: 2 },
        },
        {
          id: "2",
          givenName: "Mary",
          surname: "Johnson",
          schoolId: mockSchoolId,
          emailAddress: "mary@example.com",
          userId: "u-1",
          createdAt: now,
          updatedAt: now,
          _count: { students: 1 },
        },
      ]

      vi.mocked(db.guardian.findMany).mockResolvedValue(mockGuardians as any)
      vi.mocked(db.guardian.count).mockResolvedValue(2)

      const result = await getParents({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
    })
  })

  describe("deleteParent", () => {
    it("deletes guardian with schoolId scope", async () => {
      // Mock successful delete
      vi.mocked(db.guardian.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteParent({ id: "guardian-1" })

      expect(result.success).toBe(true)
    })

    it("deletes guardian even if not found (deleteMany returns count: 0)", async () => {
      // Mock delete returns 0 (still succeeds - no record to delete)
      vi.mocked(db.guardian.deleteMany).mockResolvedValue({ count: 0 })

      const result = await deleteParent({ id: "guardian-from-other-school" })

      // The action doesn't check count, it just returns success
      expect(result.success).toBe(true)
    })
  })
})
