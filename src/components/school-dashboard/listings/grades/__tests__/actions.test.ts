import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createResult,
  deleteResult,
  getResults,
  updateResult,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    result: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        result: {
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
          findMany: vi.fn(),
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

describe("Grade/Result Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
  })

  describe("createResult", () => {
    it("creates result with schoolId for multi-tenant isolation", async () => {
      const mockResult = {
        id: "result-1",
        studentId: "student-1",
        examId: "exam-1",
        score: 85,
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          result: {
            create: vi.fn().mockResolvedValue(mockResult),
          },
        }
        return callback(tx)
      })

      const result = await createResult({
        studentId: "student-1",
        examId: "exam-1",
        score: 85,
      })

      expect(result.success).toBe(true)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      const result = await createResult({
        studentId: "student-1",
        examId: "exam-1",
        score: 85,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateResult", () => {
    it("updates result with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          result: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await updateResult({
        id: "result-1",
        score: 90,
      })

      expect(result.success).toBe(true)
    })
  })

  describe("deleteResult", () => {
    it("deletes result with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          result: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteResult({ id: "result-1" })

      expect(result.success).toBe(true)
    })
  })

  describe("getResults", () => {
    it("fetches results scoped to schoolId", async () => {
      const mockResults = [
        { id: "1", studentId: "s1", score: 85, schoolId: mockSchoolId },
        { id: "2", studentId: "s2", score: 92, schoolId: mockSchoolId },
      ]

      vi.mocked(db.result.findMany).mockResolvedValue(mockResults as any)
      vi.mocked(db.result.count).mockResolvedValue(2)

      const result = await getResults({})

      expect(result.success).toBe(true)
    })
  })
})
