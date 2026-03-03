// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { publishResults } from "../actions/results"
import { cancelExam, completeExam, startExam } from "../actions/status"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-1", role: "ADMIN" },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    exam: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    examResult: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock the dynamic import for auto-grade in completeExam
vi.mock("../../mark/actions/auto-mark", () => ({
  autoGradeExam: vi.fn().mockResolvedValue({
    success: true,
    data: { graded: 5 },
  }),
}))

describe("Exam Status Actions — defense-in-depth", () => {
  const SCHOOL_ID = "school-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })
  })

  describe("startExam", () => {
    it("uses updateMany with schoolId", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_ID,
        status: "PLANNED",
        generatedExam: { _count: { questions: 10 } },
      } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 1 })

      const result = await startExam("exam-1")

      expect(result.success).toBe(true)
      expect(db.exam.updateMany).toHaveBeenCalledWith({
        where: { id: "exam-1", schoolId: SCHOOL_ID },
        data: { status: "IN_PROGRESS" },
      })
    })

    it("returns error for missing school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "",
        role: "ADMIN",
        locale: "en",
      })

      const result = await startExam("exam-1")

      expect(result.success).toBe(false)
      expect(result.code).toBe("NO_SCHOOL_CONTEXT")
    })

    it("returns error for exam not found", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue(null)

      const result = await startExam("exam-missing")

      expect(result.success).toBe(false)
      expect(result.code).toBe("EXAM_NOT_FOUND")
    })

    it("returns error for invalid status transition", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        status: "COMPLETED",
      } as any)

      const result = await startExam("exam-1")

      expect(result.success).toBe(false)
      expect(result.code).toBe("INVALID_STATUS")
    })
  })

  describe("completeExam", () => {
    it("uses updateMany with schoolId", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_ID,
        status: "IN_PROGRESS",
      } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 1 })

      const result = await completeExam("exam-1", { autoGrade: false })

      expect(result.success).toBe(true)
      expect(db.exam.updateMany).toHaveBeenCalledWith({
        where: { id: "exam-1", schoolId: SCHOOL_ID },
        data: { status: "COMPLETED" },
      })
    })
  })

  describe("cancelExam", () => {
    it("uses updateMany with schoolId", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_ID,
        status: "PLANNED",
        description: "Original description",
      } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 1 })

      const result = await cancelExam("exam-1", "Scheduling conflict")

      expect(result.success).toBe(true)
      expect(db.exam.updateMany).toHaveBeenCalledWith({
        where: { id: "exam-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({ status: "CANCELLED" }),
      })
    })
  })

  describe("publishResults", () => {
    it("uses updateMany with schoolId", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_ID,
        _count: { results: 25 },
        class: { _count: { studentClasses: 25 } },
      } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 1 })

      const result = await publishResults({
        examId: "exam-1",
        notifyStudents: false,
      })

      expect(result.success).toBe(true)
      expect(db.exam.updateMany).toHaveBeenCalledWith({
        where: { id: "exam-1", schoolId: SCHOOL_ID },
        data: { status: "COMPLETED" },
      })
    })
  })
})
