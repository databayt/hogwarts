// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLessonContent } from "@/components/stream/data/catalog/get-lesson-content"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    contentOverride: { findFirst: vi.fn() },
    question: { findMany: vi.fn() },
  },
}))

const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockOverride = db.contentOverride.findFirst as ReturnType<typeof vi.fn>
const mockQuestions = db.question.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockOverride.mockResolvedValue(null) // quiz not hidden by default
  mockQuestions.mockResolvedValue([
    {
      id: "q-1",
      questionText: "2 + 2 = ?",
      questionType: "MCQ",
      options: ["3", "4"],
      sampleAnswer: "4",
    },
  ])
})

describe("getLessonContent — per-school quiz hide", () => {
  it("returns the lesson's questions when the quiz is not hidden", async () => {
    const result = await getLessonContent("lesson-1")
    expect(result.questions).toHaveLength(1)
    expect(mockQuestions).toHaveBeenCalledOnce()
  })

  it("returns NO questions when the school hid this lesson's quiz", async () => {
    mockOverride.mockResolvedValueOnce({ id: "ov-1" }) // hideQuiz override exists
    const result = await getLessonContent("lesson-1")
    expect(result.questions).toEqual([])
    // Short-circuits before hitting the question table.
    expect(mockQuestions).not.toHaveBeenCalled()
  })

  it("checks the hideQuiz override scoped to (schoolId, lesson)", async () => {
    await getLessonContent("lesson-1")
    expect(mockOverride).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: "school-1",
          catalogLessonId: "lesson-1",
          hideQuiz: true,
        },
      })
    )
  })

  it("skips the override check for individual (no-school) users", async () => {
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getLessonContent("lesson-1")
    expect(mockOverride).not.toHaveBeenCalled()
    expect(result.questions).toHaveLength(1)
  })
})
