// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  isLiveJoinable,
  LiveJoinButton,
  type LiveClassJoinInfo,
} from "../live-join-button"

// Both "now" and the period start are read via getUTCHours/getUTCMinutes
// (Period times are stored as @db.Time UTC wall-clock and displayed that way).
// Build a Date whose UTC time-of-day is `minutesFromNow` after the UTC now.
function startAtDelta(minutesFromNow: number): Date {
  const now = new Date()
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  const targetMin = (((nowMin + minutesFromNow) % 1440) + 1440) % 1440
  const d = new Date()
  d.setUTCHours(Math.floor(targetMin / 60), targetMin % 60, 0, 0)
  return d
}

// A recurring external/default link: no live-state machine, gated purely on time.
const EXTERNAL: LiveClassJoinInfo = {
  sessionId: null,
  provider: "external",
  meetingUrl: "https://meet.google.com/recurring",
  status: null,
}

describe("isLiveJoinable — time window (external / default link)", () => {
  it("current class is always joinable", () => {
    expect(isLiveJoinable(EXTERNAL, "current", startAtDelta(999))).toBe(true)
    expect(isLiveJoinable(EXTERNAL, "current", startAtDelta(-999))).toBe(true)
  })

  it("next class within the window (<=10 min) is joinable", () => {
    expect(isLiveJoinable(EXTERNAL, "next", startAtDelta(5))).toBe(true)
    expect(isLiveJoinable(EXTERNAL, "next", startAtDelta(10))).toBe(true)
  })

  it("next class outside the window (>10 min away) is not joinable", () => {
    expect(isLiveJoinable(EXTERNAL, "next", startAtDelta(20))).toBe(false)
  })

  it("next class already started (negative delta) is not joinable", () => {
    expect(isLiveJoinable(EXTERNAL, "next", startAtDelta(-5))).toBe(false)
  })

  it("respects a custom window", () => {
    expect(
      isLiveJoinable(EXTERNAL, "next", startAtDelta(20), { windowMin: 30 })
    ).toBe(true)
  })
})

describe("isLiveJoinable — provider/status gating", () => {
  const livekit = (status: string): LiveClassJoinInfo => ({
    sessionId: "lcs-1",
    provider: "livekit",
    meetingUrl: null,
    status,
  })

  it("returns false when there is no live class", () => {
    expect(isLiveJoinable(null, "current", startAtDelta(0))).toBe(false)
    expect(isLiveJoinable(undefined, "current", startAtDelta(0))).toBe(false)
  })

  it("returns false for an ended or cancelled session", () => {
    expect(isLiveJoinable(livekit("ended"), "current", startAtDelta(0))).toBe(
      false
    )
    expect(
      isLiveJoinable(
        { ...EXTERNAL, status: "cancelled" },
        "current",
        startAtDelta(0)
      )
    ).toBe(false)
  })

  it("blocks a student from a scheduled LiveKit room (only host can start)", () => {
    expect(
      isLiveJoinable(livekit("scheduled"), "current", startAtDelta(0))
    ).toBe(false)
  })

  it("lets a host open a scheduled LiveKit room", () => {
    expect(
      isLiveJoinable(livekit("scheduled"), "current", startAtDelta(0), {
        canHostScheduled: true,
      })
    ).toBe(true)
  })

  it("allows anyone into a live LiveKit room", () => {
    expect(isLiveJoinable(livekit("live"), "current", startAtDelta(0))).toBe(
      true
    )
  })
})

describe("LiveJoinButton", () => {
  it("external link opens the meeting URL in a new tab", () => {
    render(
      <LiveJoinButton
        liveClass={{
          sessionId: "lcs-1",
          provider: "external",
          meetingUrl: "https://meet.google.com/abc",
          status: "scheduled",
        }}
        lang="en"
        label="Join"
      />
    )
    const link = screen.getByRole("link", { name: /join/i })
    expect(link).toHaveAttribute("href", "https://meet.google.com/abc")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("a recurring default link (no session) still opens the meeting URL", () => {
    render(
      <LiveJoinButton
        liveClass={{
          sessionId: null,
          provider: "external",
          meetingUrl: "https://meet.google.com/recurring",
          status: null,
        }}
        lang="en"
        label="Join"
      />
    )
    expect(screen.getByRole("link", { name: /join/i })).toHaveAttribute(
      "href",
      "https://meet.google.com/recurring"
    )
  })

  it("a LiveKit session links to the in-app room", () => {
    render(
      <LiveJoinButton
        liveClass={{
          sessionId: "lcs-1",
          provider: "livekit",
          meetingUrl: null,
          status: "live",
        }}
        lang="en"
        label="Join"
      />
    )
    expect(screen.getByRole("link", { name: /join/i })).toHaveAttribute(
      "href",
      "/en/live-classes/lcs-1/room"
    )
  })

  it("renders nothing when there is no link to join", () => {
    const { container } = render(
      <LiveJoinButton liveClass={null} lang="en" label="Join" />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing for an external session missing its URL", () => {
    const { container } = render(
      <LiveJoinButton
        liveClass={{
          sessionId: "lcs-1",
          provider: "external",
          meetingUrl: null,
          status: "scheduled",
        }}
        lang="en"
        label="Join"
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
