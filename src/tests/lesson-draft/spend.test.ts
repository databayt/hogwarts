// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { laneSpendSince } from "@/lib/ai/budget"
import { db } from "@/lib/db"
import {
  __resetSpend,
  estimateDraftCost,
  jobIdFor,
  reserve,
  settle,
} from "@/components/lesson-draft/spend"

vi.mock("@/lib/db", () => ({
  db: { aIUsageLog: { count: vi.fn(), create: vi.fn() } },
}))
vi.mock("@/lib/ai/budget", () => ({ laneSpendSince: vi.fn() }))
vi.mock("@/lib/platform-tenant", () => ({
  PLATFORM_SCHOOL_ID: "platform",
  ensurePlatformSchool: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
  __resetSpend()
  vi.mocked(laneSpendSince).mockResolvedValue(0)
  vi.mocked(db.aIUsageLog.count).mockResolvedValue(0)
})
afterEach(() => {
  delete process.env.LESSON_DRAFT_CAP_USD
  delete process.env.LESSON_DRAFT_DAILY_USD
  delete process.env.LESSON_DRAFT_TEACHER_DAILY
})

describe("estimateDraftCost", () => {
  it("is a fraction of a cent for a long lesson", () => {
    const e = estimateDraftCost(36_000)
    expect(e).toBeGreaterThan(0)
    expect(e).toBeLessThan(0.02)
  })
})

describe("reserve", () => {
  it("lets a draft through and reads the platform lane", async () => {
    const r = await reserve("u1", 0.005)
    expect(r).toEqual({ ok: true, estimate: 0.005 })
    expect(vi.mocked(laneSpendSince).mock.calls[0][0]).toEqual(["lesson-draft"])
  })

  it("refuses when the monthly cap is reached", async () => {
    vi.mocked(laneSpendSince).mockResolvedValue(9.999)
    expect(await reserve("u1", 0.005)).toEqual({ ok: false, reason: "cap" })
  })

  it("refuses when the daily cap is reached", async () => {
    process.env.LESSON_DRAFT_DAILY_USD = "0.001"
    expect(await reserve("u1", 0.005)).toEqual({ ok: false, reason: "cap" })
  })

  it("refuses a teacher past the daily run limit, counted by userId + jobType", async () => {
    vi.mocked(db.aIUsageLog.count).mockResolvedValue(10)
    expect(await reserve("u1", 0.005)).toEqual({
      ok: false,
      reason: "teacher_limit",
    })
    expect(vi.mocked(db.aIUsageLog.count).mock.calls[0][0]!.where).toMatchObject({
      schoolId: "platform",
      jobType: "lesson-draft",
      userId: "u1",
    })
  })

  it("holds the estimate so two drafts cannot both squeeze under the cap", async () => {
    process.env.LESSON_DRAFT_DAILY_USD = "0.008"
    expect((await reserve("u1", 0.005)).ok).toBe(true)
    expect(await reserve("u2", 0.005)).toEqual({ ok: false, reason: "cap" })
    await settle("u1", 0.005, null)
    expect((await reserve("u2", 0.005)).ok).toBe(true)
  })

  it("fails CLOSED when the ledger cannot be read", async () => {
    vi.mocked(laneSpendSince).mockRejectedValue(new Error("db down"))
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(await reserve("u1", 0.005)).toEqual({ ok: false, reason: "cap" })
    spy.mockRestore()
  })
})

describe("settle", () => {
  it("writes a platform usage row with jobType, userId and jobId", async () => {
    await settle("u1", 0.005, {
      costUsd: 0.0021,
      model: "claude-haiku-5-5",
      inputTokens: 4000,
      outputTokens: 900,
      jobId: jobIdFor("school-1", { sessionId: "sess1" }),
    })
    expect(db.aIUsageLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: "platform",
        userId: "u1",
        jobType: "lesson-draft",
        provider: "anthropic",
        costUsd: 0.0021,
        jobId: "school-1:sess1",
      }),
    })
  })

  it("logs a failed run too (cost 0 still counts toward the day)", async () => {
    await settle("u1", 0.005, {
      costUsd: 0,
      model: "m",
      inputTokens: 0,
      outputTokens: 0,
      jobId: "s:adhoc",
    })
    expect(db.aIUsageLog.create).toHaveBeenCalledTimes(1)
  })

  it("writes nothing when no call was made", async () => {
    await settle("u1", 0.005, null)
    expect(db.aIUsageLog.create).not.toHaveBeenCalled()
  })
})

describe("jobIdFor", () => {
  it("is schoolId:sessionId, else assignmentId, else adhoc", () => {
    expect(jobIdFor("s", { sessionId: "a", assignmentId: "b" })).toBe("s:a")
    expect(jobIdFor("s", { assignmentId: "b" })).toBe("s:b")
    expect(jobIdFor("s", {})).toBe("s:adhoc")
  })
})
