// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  applyLessonProgress,
  completeLessonCore,
} from "@/components/lumos/lib/progress-core"
import { submitLessonQuizCore } from "@/components/lumos/lib/quiz-submission"
import { submitQuickAttendanceCore } from "@/components/school-dashboard/attendance/actions/quick-core"
import { submitAssignmentCore } from "@/components/school-dashboard/listings/assignments/submit-core"

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
  "@/components/school-dashboard/attendance/actions/quick-core",
  async (importActual) => {
    const actual =
      await importActual<
        typeof import("@/components/school-dashboard/attendance/actions/quick-core")
      >()
    return {
      quickSubmitSchema: actual.quickSubmitSchema,
      submitQuickAttendanceCore: vi.fn(),
    }
  }
)
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
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const USER = "user-1"
const AT = "2026-09-14T08:00:00.000Z"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const post = (body: unknown) =>
  new NextRequest("http://localhost/api/mobile/offline/sync", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer test" },
  })

const item = (key: string, kind: string, payload: unknown) => ({
  idempotency_key: key,
  kind,
  payload,
  created_at: AT,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("AWS_S3_BUCKET", "hogwarts-test")
})

describe("POST /api/mobile/offline/sync", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { POST } = await import("@/app/api/mobile/offline/sync/route")
    expect((await POST(post({ items: [] }))).status).toBe(401)
  })

  it("400 for an empty batch or a malformed idempotency key", async () => {
    await authAs("STUDENT")
    const { POST } = await import("@/app/api/mobile/offline/sync/route")
    expect((await POST(post({ items: [] }))).status).toBe(400)
    expect(
      (
        await POST(
          post({ items: [item("x", "complete", { lesson_id: "l1" })] })
        )
      ).status
    ).toBe(400)
  })

  it("applies snake_case payloads in order, keyed by idempotency_key", async () => {
    await authAs("STUDENT")
    vi.mocked(applyLessonProgress).mockResolvedValue({
      status: "saved",
      completed: false,
    })
    vi.mocked(completeLessonCore).mockResolvedValue({
      status: "stale",
    } as never)
    vi.mocked(submitLessonQuizCore).mockResolvedValue({
      status: "graded",
      duplicate: true,
      result: { correctCount: 3, totalQuestions: 4 },
    } as never)
    const { POST } = await import("@/app/api/mobile/offline/sync/route")
    const res = await POST(
      post({
        items: [
          item("item-0001", "progress", {
            lesson_id: "l1",
            watched_seconds: 30,
            total_seconds: 60,
          }),
          item("item-0002", "complete", { lesson_id: "l1" }),
          item("item-0003", "quiz", {
            lesson_id: "l1",
            answers: [{ question_id: "q1", selected_option_index: 2 }],
          }),
        ],
      })
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(applyLessonProgress).toHaveBeenCalledWith({
      userId: USER,
      lessonId: "l1",
      watchedSeconds: 30,
      totalSeconds: 60,
      at: new Date(AT),
    })
    expect(submitLessonQuizCore).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER,
        schoolId: SCHOOL,
        attemptId: "item-0003",
        answers: [{ questionId: "q1", selectedOptionIndex: 2 }],
      })
    )
    expect(body.results).toEqual([
      { idempotency_key: "item-0001", result: "applied" },
      {
        idempotency_key: "item-0002",
        result: "rejected",
        code: "STALE",
      },
      {
        idempotency_key: "item-0003",
        result: "duplicate",
        data: { correct_count: 3, total_questions: 4 },
      },
    ])
    expect(typeof body.server_time).toBe("string")
  })

  it("rejects an assignment attachment outside this school's storage", async () => {
    await authAs("STUDENT")
    const { POST } = await import("@/app/api/mobile/offline/sync/route")
    const body = await (
      await POST(
        post({
          items: [
            item("item-0004", "assignment", {
              assignment_id: "a1",
              content: "essay",
              attachments: ["https://evil.example.com/x.pdf"],
            }),
          ],
        })
      )
    ).json()
    expect(body.results).toEqual([
      {
        idempotency_key: "item-0004",
        result: "rejected",
        code: "INVALID_ATTACHMENT",
      },
    ])
    expect(submitAssignmentCore).not.toHaveBeenCalled()
  })

  it("attendance: a STUDENT is refused, a TEACHER marks with the bearer context", async () => {
    const { POST } = await import("@/app/api/mobile/offline/sync/route")
    const attendance = item("item-0005", "attendance", {
      section_id: "sec1",
      date: "2026-09-14",
      absent_student_ids: ["s2"],
      late_student_ids: [],
    })

    await authAs("STUDENT")
    const refused = await (await POST(post({ items: [attendance] }))).json()
    expect(refused.results[0]).toMatchObject({ code: "FORBIDDEN" })
    expect(submitQuickAttendanceCore).not.toHaveBeenCalled()

    await authAs("TEACHER")
    vi.mocked(submitQuickAttendanceCore).mockResolvedValue({
      status: "marked",
      total: 3,
      present: 2,
      absent: 1,
      late: 0,
      guardiansNotified: 1,
    })
    const ok = await (await POST(post({ items: [attendance] }))).json()
    expect(submitQuickAttendanceCore).toHaveBeenCalledWith({
      schoolId: SCHOOL,
      userId: USER,
      role: "TEACHER",
      input: {
        sectionId: "sec1",
        date: "2026-09-14",
        absentStudentIds: ["s2"],
        lateStudentIds: [],
      },
      at: new Date(AT),
    })
    expect(ok.results[0]).toEqual({
      idempotency_key: "item-0005",
      result: "applied",
      data: {
        total: 3,
        present: 2,
        absent: 1,
        late: 0,
        guardians_notified: 1,
      },
    })
  })
})
