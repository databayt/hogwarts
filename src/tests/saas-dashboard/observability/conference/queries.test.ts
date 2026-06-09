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
    conferenceRecording: { aggregate: vi.fn() },
    conferenceParticipant: { count: vi.fn() },
    conferenceEvent: { findMany: vi.fn() },
    school: { findMany: vi.fn() },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
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
  })
})

describe("formatBytes", () => {
  it("formats byte counts", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(1073741824)).toBe("1.00 GB")
  })
})
