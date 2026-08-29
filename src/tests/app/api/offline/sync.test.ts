// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The outbox drain. What the device relies on: per-item verdicts in input
 * order, a thrown item never taking its neighbours down, quiz items keyed on
 * the device's id, and rejections that NAME their reason so the student can
 * see why a piece of work was parked.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTenantContext } from "@/lib/tenant-context"
import {
  applyLessonProgress,
  completeLessonCore,
} from "@/components/lumos/lib/progress-core"
import { submitLessonQuizCore } from "@/components/lumos/lib/quiz-submission"
import { submitAssignmentCore } from "@/components/school-dashboard/listings/assignments/submit-core"
import { POST } from "@/app/api/offline/sync/route"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}))
vi.mock("@/components/lumos/lib/progress-core", () => ({
  applyLessonProgress: vi.fn(),
  completeLessonCore: vi.fn(),
}))
vi.mock("@/components/lumos/lib/quiz-submission", async (importActual) => {
  const actual =
    await importActual<
      typeof import("@/components/lumos/lib/quiz-submission")
    >()
  return {
    ATTEMPT_ID_PATTERN: actual.ATTEMPT_ID_PATTERN,
    submitLessonQuizCore: vi.fn(),
  }
})
vi.mock(
  "@/components/school-dashboard/listings/assignments/submit-core",
  async (importActual) => {
    const actual =
      await importActual<
        typeof import("@/components/school-dashboard/listings/assignments/submit-core")
      >()
    return {
      submitAssignmentSchema: actual.submitAssignmentSchema,
      submitAssignmentCore: vi.fn(),
    }
  }
)

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mAuth = m(auth)
const mTenant = m(getTenantContext)
const mProgress = m(applyLessonProgress)
const mComplete = m(completeLessonCore)
const mQuiz = m(submitLessonQuizCore)
const mAssignment = m(submitAssignmentCore)

async function post(body: unknown) {
  const res = await POST(
    new Request("https://demo.balqalam.com/api/offline/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }) as never
  )
  return { status: res.status, json: await res.json() }
}

const AT = "2026-08-28T20:00:00.000Z"
const item = (id: string, kind: string, payload: unknown) => ({
  id,
  kind,
  payload,
  createdAt: AT,
})

beforeEach(() => {
  vi.clearAllMocks()
  mAuth.mockResolvedValue({ user: { id: "u1", role: "STUDENT" } })
  mTenant.mockResolvedValue({ schoolId: "school-1" })
  mProgress.mockResolvedValue({ status: "saved", completed: false })
  mComplete.mockResolvedValue({ status: "completed", certificateIssued: false })
  mQuiz.mockResolvedValue({
    status: "graded",
    duplicate: false,
    result: {
      score: 1,
      total: 2,
      percentage: 50,
      verdicts: [],
      recorded: true,
    },
  })
  mAssignment.mockResolvedValue({
    status: "submitted",
    submissionStatus: "SUBMITTED",
  })
})

describe("POST /api/offline/sync", () => {
  it("401s a signed-out device before reading the body", async () => {
    mAuth.mockResolvedValueOnce(null)
    const r = await post({ items: [] })
    expect(r.status).toBe(401)
    expect(mProgress).not.toHaveBeenCalled()
  })

  it("400s malformed bodies and unknown kinds", async () => {
    expect((await post("not json")).status).toBe(400)
    expect((await post({ items: [] })).status).toBe(400)
    expect(
      (await post({ items: [item("aaaaaaaa-1", "teleport", {})] })).status
    ).toBe(400)
  })

  it("returns one verdict per item, in input order, and a thrown item does not stop the rest", async () => {
    mProgress
      .mockResolvedValueOnce({ status: "saved", completed: true })
      .mockRejectedValueOnce(new Error("db hiccup"))
      .mockResolvedValueOnce({ status: "stale" })
    const r = await post({
      items: [
        item("item-0001", "progress", {
          lessonId: "l1",
          watchedSeconds: 10,
          totalSeconds: 100,
        }),
        item("item-0002", "progress", {
          lessonId: "l1",
          watchedSeconds: 20,
          totalSeconds: 100,
        }),
        item("item-0003", "progress", {
          lessonId: "l1",
          watchedSeconds: 5,
          totalSeconds: 100,
        }),
      ],
    })
    expect(r.status).toBe(200)
    expect(r.json.results).toEqual([
      { id: "item-0001", result: "applied" },
      { id: "item-0002", result: "rejected", code: "ERROR" },
      { id: "item-0003", result: "duplicate" },
    ])
    // the replayed sample carries its own timestamp
    expect(mProgress.mock.calls[0][0]).toMatchObject({
      userId: "u1",
      lessonId: "l1",
      at: new Date(AT),
    })
  })

  it("names the reason a progress item was rejected", async () => {
    mProgress.mockResolvedValueOnce({ status: "noEnrollment" })
    const r = await post({
      items: [
        item("item-0001", "progress", {
          lessonId: "l1",
          watchedSeconds: 1,
          totalSeconds: 9,
        }),
      ],
    })
    expect(r.json.results[0]).toEqual({
      id: "item-0001",
      result: "rejected",
      code: "NO_ENROLLMENT",
    })
  })

  it("rejects a payload that fails its schema without calling the core", async () => {
    const r = await post({
      items: [
        item("item-0001", "progress", { lessonId: "l1", watchedSeconds: -5 }),
      ],
    })
    expect(r.json.results[0]).toEqual({
      id: "item-0001",
      result: "rejected",
      code: "INVALID_PAYLOAD",
    })
    expect(mProgress).not.toHaveBeenCalled()
  })

  it("keys a quiz on the device's item id, marks it offline, and returns the graded result", async () => {
    const r = await post({
      items: [
        item("quiz-attempt-0001", "quiz", {
          lessonId: "l1",
          answers: [{ questionId: "q1", selectedOptionIndex: 1 }],
        }),
      ],
    })
    expect(mQuiz).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        schoolId: "school-1",
        lessonId: "l1",
        attemptId: "quiz-attempt-0001",
        source: "offline",
        submittedAt: new Date(AT),
      })
    )
    expect(r.json.results[0]).toMatchObject({
      id: "quiz-attempt-0001",
      result: "applied",
      data: { score: 1, total: 2 },
    })
  })

  it("reports a replayed quiz as duplicate, still with its stored result", async () => {
    mQuiz.mockResolvedValueOnce({
      status: "graded",
      duplicate: true,
      result: {
        score: 2,
        total: 2,
        percentage: 100,
        verdicts: [],
        recorded: false,
      },
    })
    const r = await post({
      items: [
        item("quiz-attempt-0001", "quiz", { lessonId: "l1", answers: [] }),
      ],
    })
    expect(r.json.results[0]).toMatchObject({
      result: "duplicate",
      data: { score: 2 },
    })
  })

  it("completes a lesson at the time the device recorded it", async () => {
    await post({ items: [item("item-0001", "complete", { lessonId: "l1" })] })
    expect(mComplete).toHaveBeenCalledWith({
      userId: "u1",
      lessonId: "l1",
      at: new Date(AT),
    })
  })

  it("refuses an assignment outside a school tenant, and maps core outcomes to codes", async () => {
    mTenant.mockResolvedValueOnce({ schoolId: null })
    let r = await post({
      items: [
        item("item-0001", "assignment", {
          assignmentId: "a1",
          content: "my essay",
        }),
      ],
    })
    expect(r.json.results[0]).toEqual({
      id: "item-0001",
      result: "rejected",
      code: "NO_SCHOOL",
    })
    expect(mAssignment).not.toHaveBeenCalled()

    mAssignment.mockResolvedValueOnce({ status: "alreadyGraded" })
    r = await post({
      items: [
        item("item-0001", "assignment", {
          assignmentId: "a1",
          content: "my essay",
        }),
      ],
    })
    expect(r.json.results[0]).toEqual({
      id: "item-0001",
      result: "rejected",
      code: "ALREADY_GRADED",
    })

    mAssignment.mockResolvedValueOnce({ status: "stale" })
    r = await post({
      items: [
        item("item-0001", "assignment", {
          assignmentId: "a1",
          content: "my essay",
        }),
      ],
    })
    expect(r.json.results[0]).toEqual({ id: "item-0001", result: "duplicate" })
  })
})
