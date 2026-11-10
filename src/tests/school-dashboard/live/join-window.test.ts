// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  DEFAULT_JOIN_LEAD_MIN,
  HOST_EARLY_START_MIN,
  hostMayStart,
  JOIN_GRACE_AFTER_END_MIN,
  joinPhase,
  joinWindow,
} from "@/components/school-dashboard/live/join-window"

const MIN = 60_000
const START = Date.UTC(2026, 10, 8, 14, 0) // 16:00 Khartoum
const END = START + 50 * MIN

describe("joinWindow", () => {
  it("opens a student's link at the school's lead and closes after the grace", () => {
    const w = joinWindow({
      startMs: START,
      endMs: END,
      leadMinutes: 10,
      isHost: false,
    })
    expect(w.opensAtMs).toBe(START - 10 * MIN)
    expect(w.closesAtMs).toBe(END + JOIN_GRACE_AFTER_END_MIN * MIN)
  })

  it("gives the teacher the same window as the students", () => {
    for (const lead of [5, 10, 30]) {
      const host = joinWindow({ startMs: START, endMs: END, leadMinutes: lead, isHost: true })
      const student = joinWindow({ startMs: START, endMs: END, leadMinutes: lead, isHost: false })
      expect(host).toEqual(student)
      expect(host.opensAtMs).toBe(START - lead * MIN)
    }
  })

  it("falls back to the default lead for missing or bad data, and clamps it", () => {
    expect(
      joinWindow({
        startMs: START,
        endMs: END,
        leadMinutes: null,
        isHost: false,
      }).opensAtMs
    ).toBe(START - DEFAULT_JOIN_LEAD_MIN * MIN)
    expect(
      joinWindow({
        startMs: START,
        endMs: END,
        leadMinutes: -20,
        isHost: false,
      }).opensAtMs
    ).toBe(START)
    expect(
      joinWindow({
        startMs: START,
        endMs: END,
        leadMinutes: 600,
        isHost: false,
      }).opensAtMs
    ).toBe(START - 60 * MIN)
  })
})

describe("joinPhase", () => {
  const w = joinWindow({
    startMs: START,
    endMs: END,
    leadMinutes: 10,
    isHost: false,
  })
  it("is early before the window, open inside it (edges included), over after", () => {
    expect(joinPhase(w.opensAtMs - 1, w)).toBe("early")
    expect(joinPhase(w.opensAtMs, w)).toBe("open")
    expect(joinPhase(END, w)).toBe("open")
    expect(joinPhase(w.closesAtMs, w)).toBe("open")
    expect(joinPhase(w.closesAtMs + 1, w)).toBe("over")
  })
})

describe("hostMayStart", () => {
  it("refuses a start more than the host floor before the bell", () => {
    const start = new Date(START)
    expect(hostMayStart(start, START - (HOST_EARLY_START_MIN + 1) * MIN)).toBe(
      false
    )
    expect(hostMayStart(start, START - HOST_EARLY_START_MIN * MIN)).toBe(true)
    // A late sitting past the end is still startable.
    expect(hostMayStart(start, END + 60 * MIN)).toBe(true)
  })

  it("allows a row with no schedule", () => {
    expect(hostMayStart(null)).toBe(true)
  })
})
