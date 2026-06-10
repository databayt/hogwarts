// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment,
} from "@/components/school-dashboard/listings/assignments/actions"
import { prewarm } from "@/components/translation/prewarm"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    // `getModelOrThrow("assignment")` resolves to `db.assignment` (it must
    // expose `findFirst` to be recognized as a model delegate).
    assignment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    school: {
      findFirst: vi.fn().mockResolvedValue({ preferredLanguage: "ar" }),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
  dispatchNotificationsToAudience: vi.fn().mockResolvedValue({ count: 0 }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Run `after()` callbacks synchronously so we can assert the prewarm side
// effect; preserve the rest of next/server.
vi.mock("next/server", async (orig) => ({
  ...((await orig()) as object),
  after: (fn: () => void) => fn(),
}))

vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(),
}))

describe("Assignment Actions", () => {
  const mockSchoolId = "school-123"

  const VALID_CREATE_INPUT = {
    title: "Homework 1",
    description: "Complete exercises 1-10",
    classId: "class-1",
    type: "HOMEWORK" as const,
    totalPoints: 100,
    weight: 10,
    dueDate: new Date(Date.now() + 86400000),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "teacher-1", role: "TEACHER", schoolId: mockSchoolId },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
  })

  describe("createAssignment", () => {
    it("creates assignment with schoolId for multi-tenant isolation", async () => {
      vi.mocked(db.assignment.create).mockResolvedValue({
        id: "assignment-1",
        title: "Homework 1",
        schoolId: mockSchoolId,
      } as any)

      const result = await createAssignment(VALID_CREATE_INPUT)

      expect(result.success).toBe(true)
      expect(db.assignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: mockSchoolId,
          title: "Homework 1",
        }),
      })
    })

    it("returns error when missing school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "TEACHER",
        locale: "en",
      })

      const result = await createAssignment(VALID_CREATE_INPUT)

      expect(result.success).toBe(false)
    })
  })

  describe("updateAssignment", () => {
    it("updates assignment with schoolId scope", async () => {
      vi.mocked(db.assignment.findFirst).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await updateAssignment({
        id: "assignment-1",
        title: "Updated Homework",
      })

      expect(result.success).toBe(true)
      expect(db.assignment.updateMany).toHaveBeenCalledWith({
        where: { id: "assignment-1", schoolId: mockSchoolId },
        data: expect.objectContaining({ title: "Updated Homework" }),
      })
    })
  })

  describe("deleteAssignment", () => {
    it("deletes assignment with schoolId scope", async () => {
      vi.mocked(db.assignment.findFirst).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.deleteMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await deleteAssignment({ id: "assignment-1" })

      expect(result.success).toBe(true)
    })
  })

  describe("getAssignments", () => {
    it("fetches assignments scoped to schoolId", async () => {
      const now = new Date()
      vi.mocked(db.assignment.findMany).mockResolvedValue([
        {
          id: "1",
          title: "Assignment 1",
          type: "HOMEWORK",
          totalPoints: 100,
          dueDate: now,
          createdAt: now,
        },
        {
          id: "2",
          title: "Assignment 2",
          type: "QUIZ",
          totalPoints: 50,
          dueDate: now,
          createdAt: now,
        },
      ] as any)
      vi.mocked(db.assignment.count).mockResolvedValue(2)

      const result = await getAssignments({})

      expect(result.success).toBe(true)
      expect(db.assignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: mockSchoolId }),
        })
      )
    })
  })

  describe("translation cache prewarm", () => {
    it("prewarms Assignment on successful create", async () => {
      vi.mocked(db.assignment.create).mockResolvedValue({
        id: "assignment-1",
        title: "Homework 1",
        description: "Complete exercises 1-10",
        schoolId: mockSchoolId,
      } as any)

      const result = await createAssignment(VALID_CREATE_INPUT)

      expect(result.success).toBe(true)
      expect(prewarm).toHaveBeenCalledWith(
        "Assignment",
        expect.objectContaining({ title: "Homework 1" }),
        { schoolId: mockSchoolId }
      )
    })

    it("prewarms Assignment on successful update", async () => {
      vi.mocked(db.assignment.findFirst).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await updateAssignment({
        id: "assignment-1",
        title: "Updated Homework",
      })

      expect(result.success).toBe(true)
      expect(prewarm).toHaveBeenCalledWith(
        "Assignment",
        expect.objectContaining({
          id: "assignment-1",
          title: "Updated Homework",
        }),
        { schoolId: mockSchoolId }
      )
    })

    it("does NOT prewarm when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await createAssignment(VALID_CREATE_INPUT)

      expect(result.success).toBe(false)
      expect(prewarm).not.toHaveBeenCalled()
    })
  })
})
