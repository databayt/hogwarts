// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  getOrCreateAnswerKey,
  refreshAnswerKey,
} from "../actions/auto-mark-with-key"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-1", role: "TEACHER" },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    examAnswerKey: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    generatedExam: {
      findFirst: vi.fn(),
    },
    questionBank: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Auto-Mark with Answer Key", () => {
  const SCHOOL_ID = "school-1"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getOrCreateAnswerKey", () => {
    it("uses findFirst with schoolId for existing key lookup", async () => {
      vi.mocked(db.examAnswerKey.findFirst).mockResolvedValue({
        id: "key-1",
        generatedExamId: "ge-1",
        schoolId: SCHOOL_ID,
        answers: [{ questionId: "q1", correctAnswer: "A" }],
      } as any)

      const result = await getOrCreateAnswerKey("ge-1")

      expect(result.success).toBe(true)
      expect(db.examAnswerKey.findFirst).toHaveBeenCalledWith({
        where: { generatedExamId: "ge-1", schoolId: SCHOOL_ID },
      })
    })

    it("returns unauthorized when no schoolId", async () => {
      const { auth } = await import("@/auth")
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", schoolId: null, role: "TEACHER" },
      } as any)

      const result = await getOrCreateAnswerKey("ge-1")

      expect(result.success).toBe(false)
      expect(result.code).toBe("UNAUTHORIZED")
    })
  })

  describe("refreshAnswerKey", () => {
    it("deleteMany includes schoolId in where clause", async () => {
      vi.mocked(db.examAnswerKey.deleteMany).mockResolvedValue({ count: 1 })
      // After delete, getOrCreateAnswerKey will run — mock the chain
      vi.mocked(db.examAnswerKey.findFirst).mockResolvedValue(null)
      vi.mocked(db.generatedExam.findFirst).mockResolvedValue({
        id: "ge-1",
        schoolId: SCHOOL_ID,
        exam: {},
      } as any)
      vi.mocked(db.questionBank.findMany).mockResolvedValue([])
      vi.mocked(db.examAnswerKey.create).mockResolvedValue({
        id: "key-new",
      } as any)

      await refreshAnswerKey("ge-1")

      expect(db.examAnswerKey.deleteMany).toHaveBeenCalledWith({
        where: { generatedExamId: "ge-1", schoolId: SCHOOL_ID },
      })
    })
  })
})
