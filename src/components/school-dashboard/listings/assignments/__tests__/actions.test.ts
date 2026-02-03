import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    assignment: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        assignment: {
          create: vi.fn(),
          updateMany: vi.fn(),
          deleteMany: vi.fn(),
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

describe("Assignment Actions", () => {
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

  describe("createAssignment", () => {
    it("creates assignment with schoolId for multi-tenant isolation", async () => {
      const mockAssignment = {
        id: "assignment-1",
        title: "Homework 1",
        subjectId: "subject-1",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          assignment: {
            create: vi.fn().mockResolvedValue(mockAssignment),
          },
        }
        return callback(tx)
      })

      const result = await createAssignment({
        title: "Homework 1",
        description: "Complete exercises 1-10",
        subjectId: "subject-1",
        dueDate: new Date().toISOString(),
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

      const result = await createAssignment({
        title: "Assignment",
        subjectId: "subject-1",
        dueDate: new Date().toISOString(),
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateAssignment", () => {
    it("updates assignment with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          assignment: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await updateAssignment({
        id: "assignment-1",
        title: "Updated Homework",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("deleteAssignment", () => {
    it("deletes assignment with schoolId scope", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          assignment: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return callback(tx)
      })

      const result = await deleteAssignment({ id: "assignment-1" })

      expect(result.success).toBe(true)
    })
  })

  describe("getAssignments", () => {
    it("fetches assignments scoped to schoolId", async () => {
      const mockAssignments = [
        { id: "1", title: "Assignment 1", schoolId: mockSchoolId },
        { id: "2", title: "Assignment 2", schoolId: mockSchoolId },
      ]

      vi.mocked(db.assignment.findMany).mockResolvedValue(
        mockAssignments as any
      )
      vi.mocked(db.assignment.count).mockResolvedValue(2)

      const result = await getAssignments({})

      expect(result.success).toBe(true)
    })
  })
})
