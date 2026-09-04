// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class usage metering (finding fl-01): the school-scoped meter, the
// platform-wide grouping the DEVELOPER observability page reads, and the
// LIVEKIT_TIER env override parsing.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  currentMonthStart,
  getPlatformLiveUsage,
  getSchoolLiveUsage,
  LIVEKIT_TIER,
} from "@/components/school-dashboard/live/actions/usage"

vi.mock("@/lib/db", () => ({
  db: {
    conferenceParticipant: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    conferenceRecording: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    conference: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    school: {
      findMany: vi.fn(),
    },
  },
}))

const SCHOOL = "school-1"
// Half-open calendar month: March 2026, UTC.
const MONTH_START = new Date(Date.UTC(2026, 2, 1))
const MONTH_END = new Date(Date.UTC(2026, 3, 1))
const NOW = new Date("2026-03-15T10:00:00.000Z")

type WhereArgs = { where: Record<string, unknown> }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.conferenceParticipant.aggregate).mockResolvedValue({
    _sum: { durationSeconds: 0 },
  } as never)
  vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceRecording.aggregate).mockResolvedValue({
    _sum: { durationSeconds: 0 },
  } as never)
  vi.mocked(db.conference.count).mockResolvedValue(0 as never)
  vi.mocked(db.conferenceParticipant.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.conferenceRecording.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.conference.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.school.findMany).mockResolvedValue([] as never)
})

describe("getSchoolLiveUsage", () => {
  it("scopes every query to the school and the half-open month window", async () => {
    await getSchoolLiveUsage(SCHOOL, MONTH_START, NOW)

    const participantArgs = vi.mocked(db.conferenceParticipant.aggregate).mock
      .calls[0][0] as unknown as WhereArgs
    expect(participantArgs.where).toMatchObject({
      schoolId: SCHOOL,
      session: { scheduledStart: { gte: MONTH_START, lt: MONTH_END } },
    })

    const recordingArgs = vi.mocked(db.conferenceRecording.aggregate).mock
      .calls[0][0] as unknown as WhereArgs
    expect(recordingArgs.where).toMatchObject({
      schoolId: SCHOOL,
      session: { scheduledStart: { gte: MONTH_START, lt: MONTH_END } },
    })

    const sessionArgs = vi.mocked(db.conference.count).mock
      .calls[0][0] as unknown as WhereArgs
    expect(sessionArgs.where).toMatchObject({
      schoolId: SCHOOL,
      scheduledStart: { gte: MONTH_START, lt: MONTH_END },
    })
  })

  it("adds the open span (now - activeSince) to durationSeconds", async () => {
    // 10 minutes already settled + a 30-minute span still open at NOW.
    vi.mocked(db.conferenceParticipant.aggregate).mockResolvedValue({
      _sum: { durationSeconds: 600 },
    } as never)
    vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([
      { activeSince: new Date("2026-03-15T09:30:00.000Z") },
    ] as never)

    const usage = await getSchoolLiveUsage(SCHOOL, MONTH_START, NOW)

    expect(usage.participantMinutes).toBe(40) // (600 + 1800) / 60
    expect(usage.openSpans).toBe(1)
  })

  it("counts every currently-open span, not just its seconds", async () => {
    vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([
      { activeSince: new Date("2026-03-15T09:55:00.000Z") },
      { activeSince: new Date("2026-03-15T09:59:00.000Z") },
      { activeSince: new Date("2026-03-15T09:58:00.000Z") },
    ] as never)

    const usage = await getSchoolLiveUsage(SCHOOL, MONTH_START, NOW)

    expect(usage.openSpans).toBe(3)
  })

  it("includes soft-deleted recordings — deletedAt is never filtered on the recording query", async () => {
    await getSchoolLiveUsage(SCHOOL, MONTH_START, NOW)

    const recordingArgs = vi.mocked(db.conferenceRecording.aggregate).mock
      .calls[0][0] as unknown as WhereArgs
    expect(recordingArgs.where).not.toHaveProperty("deletedAt")
  })

  it("sums recording minutes from the aggregate regardless of soft-delete", async () => {
    vi.mocked(db.conferenceRecording.aggregate).mockResolvedValue({
      _sum: { durationSeconds: 1200 },
    } as never)

    const usage = await getSchoolLiveUsage(SCHOOL, MONTH_START, NOW)

    expect(usage.recordingMinutes).toBe(20)
  })

  it("counts only non-soft-deleted sessions for the `sessions` figure", async () => {
    vi.mocked(db.conference.count).mockResolvedValue(7 as never)

    const usage = await getSchoolLiveUsage(SCHOOL, MONTH_START, NOW)

    expect(usage.sessions).toBe(7)
    const sessionArgs = vi.mocked(db.conference.count).mock
      .calls[0][0] as unknown as WhereArgs
    expect(sessionArgs.where).toMatchObject({ deletedAt: null })
  })

  it("defaults `now` to the current clock when not supplied", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    try {
      vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([
        { activeSince: new Date("2026-03-15T09:00:00.000Z") },
      ] as never)
      const usage = await getSchoolLiveUsage(SCHOOL, MONTH_START)
      // 1 hour open span at the faked "now".
      expect(usage.participantMinutes).toBe(60)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("getPlatformLiveUsage", () => {
  beforeEach(() => {
    vi.mocked(db.conferenceParticipant.groupBy).mockResolvedValue([
      { schoolId: "s1", _sum: { durationSeconds: 3000 } }, // 50 min
      { schoolId: "s2", _sum: { durationSeconds: 600 } }, // 10 min
    ] as never)
    vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([
      // s2 has a 60-minute span still open at NOW.
      { schoolId: "s2", activeSince: new Date("2026-03-15T09:00:00.000Z") },
    ] as never)
    vi.mocked(db.conferenceRecording.groupBy).mockResolvedValue([
      { schoolId: "s1", _sum: { durationSeconds: 1200 } }, // 20 min
    ] as never)
    vi.mocked(db.conference.groupBy).mockResolvedValue([
      { schoolId: "s1", _count: { _all: 5 } },
      { schoolId: "s2", _count: { _all: 2 } },
      { schoolId: "s3", _count: { _all: 1 } }, // no participants/recordings at all
    ] as never)
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "School One", domain: "school-one" },
      { id: "s2", name: "School Two", domain: "school-two" },
      { id: "s3", name: "School Three", domain: "school-three" },
    ] as never)
  })

  it("groups usage per school and sorts descending by participantMinutes", async () => {
    const result = await getPlatformLiveUsage(MONTH_START, NOW)

    expect(result.rows.map((r) => r.schoolId)).toEqual(["s2", "s1", "s3"])
    expect(result.rows[0]).toMatchObject({
      schoolId: "s2",
      name: "School Two",
      subdomain: "school-two",
      participantMinutes: 70, // (600 + 3600) / 60
      recordingMinutes: 0,
      sessions: 2,
      openSpans: 1,
    })
    expect(result.rows[1]).toMatchObject({
      schoolId: "s1",
      participantMinutes: 50,
      recordingMinutes: 20,
      sessions: 5,
      openSpans: 0,
    })
    expect(result.rows[2]).toMatchObject({
      schoolId: "s3",
      participantMinutes: 0,
      recordingMinutes: 0,
      sessions: 1,
      openSpans: 0,
    })
  })

  it("resolves school display name/subdomain for exactly the schools that appear", async () => {
    await getPlatformLiveUsage(MONTH_START, NOW)

    const args = vi.mocked(db.school.findMany).mock.calls[0][0] as unknown as {
      where: { id: { in: string[] } }
    }
    expect(new Set(args.where.id.in)).toEqual(new Set(["s1", "s2", "s3"]))
  })

  it("sums platform totals across every school", async () => {
    const result = await getPlatformLiveUsage(MONTH_START, NOW)

    expect(result.totals).toEqual({
      participantMinutes: 120, // 50 + 70 + 0
      recordingMinutes: 20,
      sessions: 8,
      openSpans: 1,
    })
  })

  it("computes percentOfTier from the totals against the configured tier", async () => {
    const result = await getPlatformLiveUsage(MONTH_START, NOW)

    const expectedWebrtc =
      Math.round((120 / LIVEKIT_TIER.webrtcMinutes) * 1000) / 10
    const expectedRecording =
      Math.round((20 / LIVEKIT_TIER.recordingMinutes) * 1000) / 10
    expect(result.percentOfTier).toEqual({
      webrtc: expectedWebrtc,
      recording: expectedRecording,
    })
    expect(result.tier).toEqual(LIVEKIT_TIER)
  })

  it("scopes the month window identically to the school-level read", async () => {
    await getPlatformLiveUsage(MONTH_START, NOW)

    const args = vi.mocked(db.conferenceParticipant.groupBy).mock
      .calls[0][0] as unknown as WhereArgs
    expect(args.where).toMatchObject({
      session: { scheduledStart: { gte: MONTH_START, lt: MONTH_END } },
    })
  })

  it("never filters deletedAt on the recording groupBy", async () => {
    await getPlatformLiveUsage(MONTH_START, NOW)

    const args = vi.mocked(db.conferenceRecording.groupBy).mock
      .calls[0][0] as unknown as WhereArgs
    expect(args.where).not.toHaveProperty("deletedAt")
  })

  it("skips the school lookup entirely when nothing happened this month", async () => {
    vi.mocked(db.conferenceParticipant.groupBy).mockResolvedValue([] as never)
    vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([] as never)
    vi.mocked(db.conferenceRecording.groupBy).mockResolvedValue([] as never)
    vi.mocked(db.conference.groupBy).mockResolvedValue([] as never)

    const result = await getPlatformLiveUsage(MONTH_START, NOW)

    expect(result.rows).toEqual([])
    expect(db.school.findMany).not.toHaveBeenCalled()
  })
})

describe("currentMonthStart", () => {
  it("returns the UTC calendar month start", () => {
    expect(currentMonthStart(NOW)).toEqual(new Date(Date.UTC(2026, 2, 1)))
  })

  it("defaults to the current clock when `now` is not supplied", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    try {
      expect(currentMonthStart()).toEqual(new Date(Date.UTC(2026, 2, 1)))
    } finally {
      vi.useRealTimers()
    }
  })

  it("pairs correctly with addUtcMonth across a UTC month boundary (this is the whole reason it stays UTC-only — see the module comment)", async () => {
    // A start-of-month UTC instant round-trips cleanly through the window
    // getSchoolLiveUsage/getPlatformLiveUsage build with it — unlike a
    // school-local-midnight start, which addUtcMonth would truncate (see
    // usage.ts's currentMonthStart comment for the Khartoum example).
    const monthStart = currentMonthStart(NOW)
    await getSchoolLiveUsage(SCHOOL, monthStart, NOW)
    const args = vi.mocked(db.conference.count).mock
      .calls[0][0] as unknown as WhereArgs
    expect(args.where).toMatchObject({
      scheduledStart: {
        gte: new Date(Date.UTC(2026, 2, 1)),
        lt: new Date(Date.UTC(2026, 3, 1)),
      },
    })
  })
})

describe("LIVEKIT_TIER env overrides", () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it("falls back to the RUNBOOK free-tier numbers with no env vars set", async () => {
    delete process.env.LIVEKIT_TIER_WEBRTC_MINUTES
    delete process.env.LIVEKIT_TIER_RECORDING_MINUTES
    delete process.env.LIVEKIT_TIER_CONCURRENT
    const mod = await import("@/components/school-dashboard/live/actions/usage")
    expect(mod.LIVEKIT_TIER).toEqual({
      webrtcMinutes: 5000,
      recordingMinutes: 1000,
      concurrent: 100,
    })
  })

  it("applies valid positive-integer overrides for all three knobs", async () => {
    process.env.LIVEKIT_TIER_WEBRTC_MINUTES = "20000"
    process.env.LIVEKIT_TIER_RECORDING_MINUTES = "5000"
    process.env.LIVEKIT_TIER_CONCURRENT = "500"
    const mod = await import("@/components/school-dashboard/live/actions/usage")
    expect(mod.LIVEKIT_TIER).toEqual({
      webrtcMinutes: 20000,
      recordingMinutes: 5000,
      concurrent: 500,
    })
  })

  it("falls back on garbage: zero, negative, non-numeric", async () => {
    process.env.LIVEKIT_TIER_WEBRTC_MINUTES = "0"
    process.env.LIVEKIT_TIER_RECORDING_MINUTES = "-5"
    process.env.LIVEKIT_TIER_CONCURRENT = "not-a-number"
    const mod = await import("@/components/school-dashboard/live/actions/usage")
    expect(mod.LIVEKIT_TIER).toEqual({
      webrtcMinutes: 5000,
      recordingMinutes: 1000,
      concurrent: 100,
    })
  })

  it("falls back on a fractional override — only whole minutes are valid", async () => {
    process.env.LIVEKIT_TIER_WEBRTC_MINUTES = "3.5"
    const mod = await import("@/components/school-dashboard/live/actions/usage")
    expect(mod.LIVEKIT_TIER.webrtcMinutes).toBe(5000)
  })
})
