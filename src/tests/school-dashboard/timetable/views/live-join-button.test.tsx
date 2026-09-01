// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  ClosureNotice,
  isLiveJoinable,
  LiveJoinButton,
  OnlineBadge,
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
      "/en/live/lcs-1/room"
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

describe("OnlineBadge", () => {
  const link = {
    sessionId: null,
    provider: "external" as const,
    meetingUrl: "https://meet.example.com/standing",
    status: null,
  }
  const session = { ...link, sessionId: "lcs-1", status: "scheduled" }

  it("marks a class that has a session today", () => {
    render(<OnlineBadge liveClass={session} label="Online" />)
    expect(screen.getByText("Online")).toBeInTheDocument()
  })

  it("does NOT mark a class that merely has a standing link", () => {
    // Every school with a permanent Zoom room has one of these. It means
    // "there is a room you could use", not "this class is online today" — and
    // badging it would put "Online" on every card, forever, in a school that
    // never went online.
    render(<OnlineBadge liveClass={link} label="Online" />)
    expect(screen.queryByText("Online")).not.toBeInTheDocument()
  })

  it("renders nothing with no live class at all", () => {
    const { container } = render(
      <OnlineBadge liveClass={null} label="Online" />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe("ClosureNotice", () => {
  it("names the closure so a data error is distinguishable from a real one", () => {
    render(
      <ClosureNotice
        closure={{ title: "عيد الفطر", exceptionType: "HOLIDAY" }}
        label="School is closed today"
      />
    )
    expect(screen.getByText(/School is closed today/)).toBeInTheDocument()
    expect(screen.getByText(/عيد الفطر/)).toBeInTheDocument()
  })

  it("renders nothing on an ordinary day", () => {
    const { container } = render(
      <ClosureNotice closure={null} label="School is closed today" />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
