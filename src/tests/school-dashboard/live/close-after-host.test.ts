// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// A timetable class closes with its time: bell rung + no host in the room.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  closeIfHostGone,
  scheduleCloseAfterHost,
} from "@/components/school-dashboard/live/actions/close-after-host"
import { syncLiveAttendance } from "@/components/school-dashboard/live/actions/attendance-sync"
import {
  HOST_GONE_HOLD_MS,
  shouldCloseAfterHost,
} from "@/components/school-dashboard/live/join-window"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn(), updateMany: vi.fn() },
    conferenceParticipant: { count: vi.fn() },
  },
}))
const closeRoom = vi.fn(async () => undefined)
vi.mock("@/components/school-dashboard/live/livekit/close-room", () => ({
  closeRoom: (...a: unknown[]) => closeRoom(...a),
}))
vi.mock("@/components/school-dashboard/live/actions/attendance-sync", () => ({
  syncLiveAttendance: vi.fn(async () => ({ marked: 0, updated: 0 })),
}))

const NOW = new Date("2026-11-22T12:50:00Z").getTime()
const BELL = new Date(NOW - 60_000) // rang a minute ago
const base = {
  status: "live",
  timetableId: "tt-1",
  isPractice: false,
  scheduledEnd: BELL,
  nowMs: NOW,
  hostsPresent: 0,
}

describe("shouldCloseAfterHost", () => {
  it("closes only a live, timetable, non-practice class past the bell with no host", () => {
    expect(shouldCloseAfterHost(base)).toBe(true)
  })
  it("exactly at the bell counts as rung", () => {
    expect(shouldCloseAfterHost({ ...base, nowMs: BELL.getTime() })).toBe(true)
  })
  it.each([
    ["before the bell", { scheduledEnd: new Date(NOW + 1) }],
    ["a host present", { hostsPresent: 1 }],
    ["a practice room", { isPractice: true }],
    ["an ad-hoc class", { timetableId: null }],
    ["a scheduled row", { status: "scheduled" }],
    ["an ended row", { status: "ended" }],
    ["no scheduled end", { scheduledEnd: null }],
  ])("does not close with %s", (_name, patch) => {
    expect(shouldCloseAfterHost({ ...base, ...patch })).toBe(false)
  })
  it("holds two and a half minutes — longer than a weak line's slowest reconnect", () => {
    expect(HOST_GONE_HOLD_MS).toBe(150_000)
  })
})

function session(patch: Record<string, unknown> = {}) {
  vi.mocked(db.conference.findFirst).mockResolvedValue({
    id: "s1",
    status: "live",
    timetableId: "tt-1",
    isPractice: false,
    scheduledEnd: BELL,
    roomName: "room-1",
    recordings: [{ egressId: "egr-1" }],
    ...patch,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.mocked(db.conferenceParticipant.count).mockResolvedValue(0 as never)
  vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 1 } as never)
})
afterEach(() => vi.useRealTimers())

describe("closeIfHostGone", () => {
  it("closes when the bell rang and no host is present: guarded write, room, attendance", async () => {
    session()
    expect(await closeIfHostGone("sch1", "s1")).toBe(true)
    expect(db.conference.updateMany).toHaveBeenCalledWith({
      where: { id: "s1", schoolId: "sch1", status: "live" },
      data: { status: "ended", actualEnd: expect.any(Date) },
    })
    expect(closeRoom).toHaveBeenCalledWith("room-1", ["egr-1"])
    expect(syncLiveAttendance).toHaveBeenCalledWith("sch1", "s1")
  })

  it("counts hosts scoped by school, joined and with an open span", async () => {
    session()
    await closeIfHostGone("sch1", "s1")
    expect(db.conferenceParticipant.count).toHaveBeenCalledWith({
      where: {
        sessionId: "s1",
        schoolId: "sch1",
        role: { in: ["HOST", "CO_HOST"] },
        activeSince: { not: null },
        status: "joined",
      },
    })
  })

  it.each([
    ["before the bell", { scheduledEnd: new Date(NOW + 5 * 60_000) }],
    ["a practice room", { isPractice: true }],
    ["an ad-hoc class", { timetableId: null }],
    ["an already ended class", { status: "ended" }],
  ])("does nothing for %s", async (_n, patch) => {
    session(patch)
    expect(await closeIfHostGone("sch1", "s1")).toBe(false)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
    expect(closeRoom).not.toHaveBeenCalled()
  })

  it("does nothing with a host present", async () => {
    session()
    vi.mocked(db.conferenceParticipant.count).mockResolvedValue(1 as never)
    expect(await closeIfHostGone("sch1", "s1")).toBe(false)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })

  it("does not close the room when another writer already ended it", async () => {
    session()
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 0 } as never)
    expect(await closeIfHostGone("sch1", "s1")).toBe(false)
    expect(closeRoom).not.toHaveBeenCalled()
  })

  it("never throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(db.conference.findFirst).mockRejectedValue(new Error("db"))
    await expect(closeIfHostGone("sch1", "s1")).resolves.toBe(false)
  })
})

describe("scheduleCloseAfterHost", () => {
  it("does nothing when the bell is more than 20 minutes away", async () => {
    session({ scheduledEnd: new Date(NOW + 21 * 60_000) })
    scheduleCloseAfterHost({
      schoolId: "sch1",
      sessionId: "s1",
      scheduledEnd: new Date(NOW + 21 * 60_000),
    })
    await vi.advanceTimersByTimeAsync(60 * 60_000)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })

  it("after the bell, closes once the hold has passed", async () => {
    session()
    scheduleCloseAfterHost({
      schoolId: "sch1",
      sessionId: "s1",
      scheduledEnd: BELL,
    })
    await vi.advanceTimersByTimeAsync(HOST_GONE_HOLD_MS - 1000)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    expect(db.conference.updateMany).toHaveBeenCalledTimes(1)
  })

  it("re-arms: one timer per session", async () => {
    session()
    scheduleCloseAfterHost({
      schoolId: "sch1",
      sessionId: "s1",
      scheduledEnd: BELL,
    })
    scheduleCloseAfterHost({
      schoolId: "sch1",
      sessionId: "s1",
      scheduledEnd: BELL,
    })
    await vi.advanceTimersByTimeAsync(HOST_GONE_HOLD_MS + 1000)
    expect(db.conference.updateMany).toHaveBeenCalledTimes(1)
  })

  it("before the bell, waits for the bell", async () => {
    session({ scheduledEnd: new Date(NOW + 10 * 60_000) })
    scheduleCloseAfterHost({
      schoolId: "sch1",
      sessionId: "s1",
      scheduledEnd: new Date(NOW + 10 * 60_000),
    })
    await vi.advanceTimersByTimeAsync(9 * 60_000)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
    // The bell rings at +10 min; the timer fires 5 s after it.
    await vi.advanceTimersByTimeAsync(2 * 60_000)
    expect(db.conference.updateMany).toHaveBeenCalledTimes(1)
  })
})
