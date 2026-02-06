import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../actions"

// Mock dependencies - need all models that actions use via getModelOrThrow
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
    teacherSubjectExpertise: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    exam: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    questionBank: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
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
        subjectName: "Mathematics",
        schoolId: mockSchoolId,
      }

      // Mock direct db.subject.create (used via getModelOrThrow)
      vi.mocked(db.subject.create).mockResolvedValue(mockSubject as any)

      const result = await createSubject({
        subjectName: "Mathematics",
        departmentId: "dept-1",
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
        subjectName: "Mathematics",
        departmentId: "dept-1",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateSubject", () => {
    it("updates subject with schoolId scope", async () => {
      const mockSubject = {
        id: "subject-1",
        subjectName: "Advanced Mathematics",
        schoolId: mockSchoolId,
      }

      // Mock subject exists
      vi.mocked(db.subject.findFirst).mockResolvedValue(mockSubject as any)
      // Mock update success
      vi.mocked(db.subject.update).mockResolvedValue(mockSubject as any)

      const result = await updateSubject({
        id: "subject-1",
        subjectName: "Advanced Mathematics",
      })

      expect(result.success).toBe(true)
    })

    it("prevents updating subject from different school", async () => {
      // Mock subject not found in this school
      vi.mocked(db.subject.findFirst).mockResolvedValue(null)

      const result = await updateSubject({
        id: "subject-from-other-school",
        subjectName: "Hacked Subject",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteSubject", () => {
    it("deletes subject with schoolId scope", async () => {
      // Mock subject exists
      vi.mocked(db.subject.findFirst).mockResolvedValue({
        id: "subject-1",
        subjectName: "Mathematics",
        schoolId: mockSchoolId,
      } as any)
      // Mock no dependencies
      vi.mocked(db.teacherSubjectExpertise.count).mockResolvedValue(0)
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.exam.count).mockResolvedValue(0)
      vi.mocked(db.questionBank.count).mockResolvedValue(0)
      // Mock successful delete
      vi.mocked(db.subject.delete).mockResolvedValue({
        id: "subject-1",
      } as any)

      const result = await deleteSubject({ id: "subject-1" })

      expect(result.success).toBe(true)
    })

    it("prevents deleting subject from different school", async () => {
      // Mock subject not found in this school
      vi.mocked(db.subject.findFirst).mockResolvedValue(null)

      const result = await deleteSubject({ id: "subject-from-other-school" })

      expect(result.success).toBe(false)
    })
  })

  describe("getSubjects", () => {
    it("fetches subjects scoped to schoolId", async () => {
      const now = new Date()
      const mockSubjects = [
        {
          id: "1",
          subjectName: "Mathematics",
          lang: "ar",
          schoolId: mockSchoolId,
          departmentId: "dept-1",
          createdAt: now,
          updatedAt: now,
          department: { id: "dept-1", departmentName: "Science" },
          _count: { teachers: 2, classes: 3 },
        },
        {
          id: "2",
          subjectName: "English",
          lang: "ar",
          schoolId: mockSchoolId,
          departmentId: "dept-2",
          createdAt: now,
          updatedAt: now,
          department: { id: "dept-2", departmentName: "Languages" },
          _count: { teachers: 1, classes: 2 },
        },
      ]

      vi.mocked(db.subject.findMany).mockResolvedValue(mockSubjects as any)
      vi.mocked(db.subject.count).mockResolvedValue(2)

      const result = await getSubjects({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
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
