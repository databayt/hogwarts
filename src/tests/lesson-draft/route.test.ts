// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getTenantContext } from "@/lib/tenant-context"
import { generateLessonDrafts } from "@/components/lesson-draft/generate"
import { LessonDraftError } from "@/components/lesson-draft/types"
import { POST } from "@/app/api/live/lesson-draft/route"

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/lesson-draft/generate", () => ({
  generateLessonDrafts: vi.fn(),
}))

const post = (body: unknown) =>
  POST(
    new Request("https://demo.balqalam.com/api/live/lesson-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  )

const asUser = (role: string, schoolId = "school-1") =>
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role, schoolId },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)

beforeEach(() => {
  vi.clearAllMocks()
  process.env.LESSON_DRAFT_ENABLED = "1"
  process.env.CHATBOT_ANTHROPIC_API_KEY = "k"
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    requestId: "r",
    role: "TEACHER",
    isPlatformAdmin: false,
  } as never)
  asUser("TEACHER")
})
afterEach(() => {
  delete process.env.LESSON_DRAFT_ENABLED
  delete process.env.CHATBOT_ANTHROPIC_API_KEY
})

describe("POST /api/live/lesson-draft — before the stream", () => {
  it("401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await post({ sessionId: "s1" })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "NOT_AUTHENTICATED" })
    expect(generateLessonDrafts).not.toHaveBeenCalled()
  })

  it("403 for a school that is not the session's", async () => {
    asUser("TEACHER", "school-OTHER")
    const res = await post({ sessionId: "s1" })
    expect(res.status).toBe(403)
    expect(generateLessonDrafts).not.toHaveBeenCalled()
  })

  it("403 for a student", async () => {
    asUser("STUDENT")
    const res = await post({ sessionId: "s1" })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "UNAUTHORIZED" })
    expect(generateLessonDrafts).not.toHaveBeenCalled()
  })

  it("404 while the flag is off", async () => {
    delete process.env.LESSON_DRAFT_ENABLED
    const res = await post({ sessionId: "s1" })
    expect(res.status).toBe(404)
    expect(generateLessonDrafts).not.toHaveBeenCalled()
  })

  it("400 for an unknown field (identity is never read from the body)", async () => {
    const res = await post({ sessionId: "s1", userId: "someone-else" })
    expect(res.status).toBe(400)
    expect(generateLessonDrafts).not.toHaveBeenCalled()
  })
})

describe("POST /api/live/lesson-draft — the stream", () => {
  it("emits open, stage events in order, then done", async () => {
    vi.mocked(generateLessonDrafts).mockImplementation(async (_a, _i, onStage) => {
      onStage?.("reading")
      onStage?.("writing")
      onStage?.("saving")
      return { quickAssessmentId: "qa1", assignmentId: "hw1" }
    })
    const res = await post({ sessionId: "s1" })
    expect(res.headers.get("content-type")).toContain("text/event-stream")
    const text = await res.text()
    expect(text.startsWith(": open\n\n")).toBe(true)
    const names = [...text.matchAll(/^event: (\w+)$/gm)].map((m) => m[1])
    expect(names).toEqual(["stage", "stage", "stage", "done"])
    expect(text).toContain('data: {"stage":"reading"}')
    expect(text).toContain('data: {"quickAssessmentId":"qa1","assignmentId":"hw1"}')
    // Identity comes from the session
    expect(vi.mocked(generateLessonDrafts).mock.calls[0][0]).toEqual({
      userId: "u1",
      role: "TEACHER",
      schoolId: "school-1",
    })
  })

  it("passes `existing` through on done", async () => {
    vi.mocked(generateLessonDrafts).mockResolvedValue({
      quickAssessmentId: "qa1",
      assignmentId: "hw1",
      existing: true,
    })
    const text = await (await post({ sessionId: "s1" })).text()
    expect(text).toContain('"existing":true')
  })

  it("maps a LessonDraftError to an error event with its code", async () => {
    vi.mocked(generateLessonDrafts).mockRejectedValue(
      new LessonDraftError("LESSON_DRAFT_CAP")
    )
    const text = await (await post({ sessionId: "s1" })).text()
    expect(text).toContain("event: error")
    expect(text).toContain('data: {"code":"LESSON_DRAFT_CAP"}')
    expect(text).not.toContain("event: done")
  })

  it("an unexpected failure is UNKNOWN, never its message", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(generateLessonDrafts).mockRejectedValue(new Error("secret detail"))
    const text = await (await post({ sessionId: "s1" })).text()
    expect(text).toContain('data: {"code":"UNKNOWN"}')
    expect(text).not.toContain("secret detail")
    spy.mockRestore()
  })
})
