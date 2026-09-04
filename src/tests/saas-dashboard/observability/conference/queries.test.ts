// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  formatBytes,
  getConferenceObservability,
} from "@/components/saas-dashboard/observability/conference/queries"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { count: vi.fn(), groupBy: vi.fn() },
    conferenceRecording: { aggregate: vi.fn(), groupBy: vi.fn() },
    conferenceParticipant: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    conferenceEvent: { findMany: vi.fn() },
    school: { findMany: vi.fn() },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Defaults for the LIVEKIT usage sub-query (actions/usage.ts,
  // getPlatformLiveUsage) that getConferenceObservability now also runs —
  // empty by default so a test that doesn't care about usage numbers still
  // exercises real code without crashing on an unmocked call.
  vi.mocked(db.conferenceParticipant.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.conferenceParticipant.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceRecording.groupBy).mockResolvedValue([] as never)
})

describe("getConferenceObservability", () => {
  it("aggregates cross-tenant metrics + computes the TCP fallback rate", async () => {
    vi.mocked(db.conference.count)
      .mockResolvedValueOnce(3 as never) // liveCount
      .mockResolvedValueOnce(7 as never) // scheduledToday
    vi.mocked(db.conference.groupBy).mockResolvedValue([
      { schoolId: "sch-b", _count: { _all: 1 } },
      { schoolId: "sch-a", _count: { _all: 2 } },
    ] as never)
    vi.mocked(db.conferenceRecording.aggregate).mockResolvedValue({
      _count: { _all: 5 },
      _sum: { fileSizeBytes: 1073741824n },
    } as never)
    vi.mocked(db.conferenceParticipant.count)
      .mockResolvedValueOnce(4 as never) // tcpFallbackCount
      .mockResolvedValueOnce(20 as never) // totalParticipants
    vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([] as never)
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "sch-a", name: "Aldar" },
      { id: "sch-b", name: "Albayan" },
    ] as never)

    const r = await getConferenceObservability()

    expect(r.liveCount).toBe(3)
    expect(r.scheduledToday).toBe(7)
    expect(r.recordingsReady).toBe(5)
    expect(r.storageBytes).toBe(1073741824)
    expect(r.tcpFallbackRate).toBeCloseTo(0.2)
    // Sorted by live count desc, names resolved.
    expect(r.liveBySchool).toEqual([
      { schoolId: "sch-a", name: "Aldar", count: 2 },
      { schoolId: "sch-b", name: "Albayan", count: 1 },
    ])
  })

  it("returns a 0 fallback rate + 0 storage when there is no data", async () => {
    vi.mocked(db.conference.count).mockResolvedValue(0 as never)
    vi.mocked(db.conference.groupBy).mockResolvedValue([] as never)
    vi.mocked(db.conferenceRecording.aggregate).mockResolvedValue({
      _count: { _all: 0 },
      _sum: { fileSizeBytes: null },
    } as never)
    vi.mocked(db.conferenceParticipant.count).mockResolvedValue(0 as never)
    vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([] as never)

    const r = await getConferenceObservability()

    expect(r.tcpFallbackRate).toBe(0)
    expect(r.storageBytes).toBe(0)
    expect(r.liveBySchool).toEqual([])
    expect(db.school.findMany).not.toHaveBeenCalled()
    // No LiveKit usage this month either — the sub-query still ran (it is
    // not gated on the other metrics) and reports an honest all-zero shape.
    expect(r.usage.rows).toEqual([])
    expect(r.usage.totals).toEqual({
      participantMinutes: 0,
      recordingMinutes: 0,
      sessions: 0,
      openSpans: 0,
    })
    expect(r.usage.percentOfTier).toEqual({ webrtc: 0, recording: 0 })
  })

  it("surfaces this month's LiveKit usage against the configured tier (fl-01)", async () => {
    vi.mocked(db.conference.count).mockResolvedValue(0 as never)
    vi.mocked(db.conference.groupBy)
      // First call: liveBySchool (empty).
      .mockResolvedValueOnce([] as never)
      // Second call: getPlatformLiveUsage's sessionGroups.
      .mockResolvedValueOnce([
        { schoolId: "sch-a", _count: { _all: 4 } },
      ] as never)
    vi.mocked(db.conferenceRecording.aggregate).mockResolvedValue({
      _count: { _all: 0 },
      _sum: { fileSizeBytes: null },
    } as never)
    vi.mocked(db.conferenceParticipant.count).mockResolvedValue(0 as never)
    vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([] as never)
    vi.mocked(db.conferenceParticipant.groupBy).mockResolvedValue([
      { schoolId: "sch-a", _sum: { durationSeconds: 6000 } }, // 100 min
    ] as never)
    vi.mocked(db.conferenceRecording.groupBy).mockResolvedValue([
      { schoolId: "sch-a", _sum: { durationSeconds: 1200 } }, // 20 min
    ] as never)
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "sch-a", name: "Aldar", domain: "aldar" },
    ] as never)

    const r = await getConferenceObservability()

    expect(r.usage.rows).toEqual([
      {
        schoolId: "sch-a",
        name: "Aldar",
        subdomain: "aldar",
        participantMinutes: 100,
        recordingMinutes: 20,
        sessions: 4,
        openSpans: 0,
      },
    ])
    expect(r.usage.totals).toEqual({
      participantMinutes: 100,
      recordingMinutes: 20,
      sessions: 4,
      openSpans: 0,
    })
    expect(r.usage.tier).toEqual({
      webrtcMinutes: 5000,
      recordingMinutes: 1000,
      concurrent: 100,
    })
  })
})

describe("formatBytes", () => {
  it("formats byte counts", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(1073741824)).toBe("1.00 GB")
  })
})
