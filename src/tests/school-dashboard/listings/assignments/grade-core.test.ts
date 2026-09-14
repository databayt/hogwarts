// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { gradeSubmissionCore } from "@/components/school-dashboard/listings/assignments/grade-core"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/db", () => ({
  db: {
    assignmentSubmission: { findFirst: vi.fn(), updateMany: vi.fn() },
  },
}))

const base = {
  schoolId: "school-1",
  graderUserId: "teacher-user",
  submissionId: "sub-1",
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.assignmentSubmission.findFirst).mockResolvedValue({
    id: "sub-1",
    assignment: { id: "a1", title: "Essay", totalPoints: 20 },
    student: { userId: "student-user" },
  } as never)
})

describe("gradeSubmissionCore", () => {
  it("scopes the lookup by school (and assignment when given)", async () => {
    vi.mocked(db.assignmentSubmission.findFirst).mockResolvedValue(null)
    expect(
      await gradeSubmissionCore({ ...base, score: 5, assignmentId: "a1" })
    ).toEqual({ status: "notFound" })
    expect(db.assignmentSubmission.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-1", schoolId: "school-1", assignmentId: "a1" },
      })
    )
    expect(db.assignmentSubmission.updateMany).not.toHaveBeenCalled()
  })

  it("refuses a score above the assignment's total points", async () => {
    expect(await gradeSubmissionCore({ ...base, score: 21 })).toEqual({
      status: "scoreAboveTotal",
      totalPoints: 20,
    })
    expect(db.assignmentSubmission.updateMany).not.toHaveBeenCalled()
  })

  it("writes score, feedback, GRADED, gradedAt and gradedBy, then notifies", async () => {
    const out = await gradeSubmissionCore({
      ...base,
      score: 20,
      feedback: "Great",
    })
    expect(out).toMatchObject({ status: "graded", score: 20, totalPoints: 20 })
    expect(db.assignmentSubmission.updateMany).toHaveBeenCalledWith({
      where: { id: "sub-1", schoolId: "school-1" },
      data: expect.objectContaining({
        score: 20,
        feedback: "Great",
        status: "GRADED",
        gradedBy: "teacher-user",
        gradedAt: expect.any(Date),
      }),
    })
    expect(dispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "student-user",
        type: "assignment_graded",
      })
    )
  })
})
