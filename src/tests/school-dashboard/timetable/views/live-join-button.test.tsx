// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { schoolNow } from "@/components/school-dashboard/timetable/school-now"
import {
  ClosureNotice,
  isLiveJoinable,
  isRowLiveJoinable,
  LiveJoinButton,
  liveSlotStatus,
  OnlineBadge,
} from "@/components/school-dashboard/timetable/views/live-join-button"

// Period times are school wall-clock stored as `1970-01-01T..Z`, read with UTC
// getters; "now" is the school's clock (Africa/Khartoum, UTC+2).
const TZ = "Africa/Khartoum"
const at = (z: string) => schoolNow(TZ, new Date(`2026-11-21T${z}:00Z`))
const START = "1970-01-01T16:00:00Z"
const END = "1970-01-01T17:00:00Z"
// 16:00 Khartoum is 14:00Z.

describe("isLiveJoinable", () => {
  it("current class is always joinable", () => {
    expect(isLiveJoinable("current", START, at("13:00"))).toBe(true)
    expect(isLiveJoinable("current", START, at("20:00"))).toBe(true)
  })

  it("next class within the window (<=10 min) is joinable", () => {
    expect(isLiveJoinable("next", START, at("13:55"))).toBe(true)
    expect(isLiveJoinable("next", START, at("13:50"))).toBe(true)
  })

  it("next class outside the window (>10 min away) is not joinable", () => {
    expect(isLiveJoinable("next", START, at("13:40"))).toBe(false)
  })

  it("next class already started is not joinable", () => {
    expect(isLiveJoinable("next", START, at("14:05"))).toBe(false)
  })

  it("respects a custom window", () => {
    expect(isLiveJoinable("next", START, at("13:30"), 30)).toBe(true)
  })

  it("does not read the device clock: a UTC+3 reading is the same instant", () => {
    expect(
      isLiveJoinable(
        "next",
        START,
        schoolNow(TZ, new Date("2026-11-21T13:50:00Z"))
      )
    ).toBe(true)
  })
})

describe("isRowLiveJoinable / liveSlotStatus around a 16:00-17:00 period", () => {
  it("13:00Z: upcoming, not joinable", () => {
    expect(liveSlotStatus(START, END, at("13:00"))).toBe("upcoming")
    expect(isRowLiveJoinable(START, END, at("13:00"))).toBe(false)
  })
  it("13:50Z: upcoming and joinable", () => {
    expect(liveSlotStatus(START, END, at("13:50"))).toBe("upcoming")
    expect(isRowLiveJoinable(START, END, at("13:50"))).toBe(true)
  })
  it("14:00Z: live", () => {
    expect(liveSlotStatus(START, END, at("14:00"))).toBe("live")
    expect(isRowLiveJoinable(START, END, at("14:00"))).toBe(true)
  })
  it("15:00Z: missed", () => {
    expect(liveSlotStatus(START, END, at("15:00"))).toBe("missed")
    expect(isRowLiveJoinable(START, END, at("15:00"))).toBe(false)
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
