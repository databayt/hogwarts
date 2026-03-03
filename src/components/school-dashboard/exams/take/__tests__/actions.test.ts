// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { startExamSession } from "../actions"

const SCHOOL_ID = "clschool000000000000000001"
const EXAM_ID = "clexam00000000000000000001"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "cluser00000000000000000001",
      schoolId: "clschool000000000000000001",
      role: "STUDENT",
    },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    exam: {
      findFirst: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    examSession: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    questionBank: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Exam Take Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("startExamSession", () => {
    it("includes schoolId in questionBank findMany for option shuffling", async () => {
      // Setup: exam with shuffle options enabled
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: EXAM_ID,
        schoolId: SCHOOL_ID,
        status: "IN_PROGRESS",
        maxAttempts: 3,
        shuffleQuestions: false,
        shuffleOptions: true,
        generatedExam: {
          questions: [
            { questionId: "clq0000000000000000000001", order: 1 },
            { questionId: "clq0000000000000000000002", order: 2 },
          ],
        },
      } as any)

      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "clstudent0000000000000001",
      } as any)

      vi.mocked(db.examSession.count).mockResolvedValue(0)
      vi.mocked(db.examSession.findFirst).mockResolvedValue(null)

      vi.mocked(db.questionBank.findMany).mockResolvedValue([
        {
          id: "clq0000000000000000000001",
          options: [
            { text: "A", isCorrect: true },
            { text: "B", isCorrect: false },
          ],
        },
      ] as any)

      vi.mocked(db.examSession.create).mockResolvedValue({
        id: "clsession0000000000000001",
      } as any)

      await startExamSession({
        examId: EXAM_ID,
      })

      // Verify questionBank.findMany includes schoolId
      expect(db.questionBank.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_ID,
          }),
        })
      )
    })
  })
})
