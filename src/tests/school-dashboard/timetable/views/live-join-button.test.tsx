// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  isLiveJoinable,
  LiveJoinButton,
} from "@/components/school-dashboard/timetable/views/live-join-button"

// startTime is read via getUTCHours/getUTCMinutes (matching the timetable
// convention where Period times are stored as @db.Time UTC wall-clock). Build a
// Date whose UTC time-of-day is `minutesFromNow` after the local now.
function startAtDelta(minutesFromNow: number): Date {
  const now = new Date()
  const targetLocalMin = now.getHours() * 60 + now.getMinutes() + minutesFromNow
  const d = new Date()
  d.setUTCHours(Math.floor(targetLocalMin / 60), targetLocalMin % 60, 0, 0)
  return d
}

describe("isLiveJoinable", () => {
  it("current class is always joinable", () => {
    expect(isLiveJoinable("current", startAtDelta(999))).toBe(true)
    expect(isLiveJoinable("current", startAtDelta(-999))).toBe(true)
  })

  it("next class within the window (<=10 min) is joinable", () => {
    expect(isLiveJoinable("next", startAtDelta(5))).toBe(true)
    expect(isLiveJoinable("next", startAtDelta(10))).toBe(true)
  })

  it("next class outside the window (>10 min away) is not joinable", () => {
    expect(isLiveJoinable("next", startAtDelta(20))).toBe(false)
  })

  it("next class already started (negative delta) is not joinable", () => {
    expect(isLiveJoinable("next", startAtDelta(-5))).toBe(false)
  })

  it("respects a custom window", () => {
    expect(isLiveJoinable("next", startAtDelta(20), 30)).toBe(true)
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
      "/en/conference/lcs-1/room"
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
