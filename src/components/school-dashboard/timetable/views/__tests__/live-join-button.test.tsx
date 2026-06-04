// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isLiveJoinable, LiveJoinButton } from "../live-join-button"

afterEach(() => cleanup())

// ---------------------------------------------------------------------------
// isLiveJoinable — the live-window gate
// ---------------------------------------------------------------------------
describe("isLiveJoinable", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Local noon — deterministic minute-of-day regardless of machine TZ.
    vi.setSystemTime(new Date("2026-06-01T12:00:00"))
  })
  afterEach(() => vi.useRealTimers())

  // Build a Date whose UTC h:m equals (local-now-minutes + delta) so the
  // function's local-now vs UTC-start comparison is TZ-independent.
  const startAtDelta = (deltaMin: number) => {
    const now = new Date()
    const target = now.getHours() * 60 + now.getMinutes() + deltaMin
    return new Date(
      Date.UTC(2026, 5, 1, Math.floor(target / 60), target % 60, 0)
    )
  }

  it("current class is always joinable", () => {
    expect(isLiveJoinable("current", startAtDelta(999))).toBe(true)
  })

  it("next class within the window (≤10 min) is joinable", () => {
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

// ---------------------------------------------------------------------------
// LiveJoinButton — provider-aware Join target
// ---------------------------------------------------------------------------
describe("LiveJoinButton", () => {
  it("external link opens the meeting URL in a new tab", () => {
    render(
      <LiveJoinButton
        lang="en"
        label="Join live class"
        liveClass={{
          sessionId: "lcs-1",
          provider: "external",
          meetingUrl: "https://meet.google.com/abc-defg-hij",
          status: "live",
        }}
      />
    )
    const link = screen.getByRole("link", { name: /join live class/i })
    expect(link).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("a recurring default link (no session) still opens the meeting URL", () => {
    render(
      <LiveJoinButton
        lang="en"
        label="Join"
        liveClass={{
          sessionId: null,
          provider: "external",
          meetingUrl: "https://meet.google.com/recurring",
          status: null,
        }}
      />
    )
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://meet.google.com/recurring"
    )
  })

  it("a LiveKit session links to the in-app room", () => {
    render(
      <LiveJoinButton
        lang="ar"
        label="انضمام"
        liveClass={{
          sessionId: "lcs-9",
          provider: "livekit",
          meetingUrl: null,
          status: "live",
        }}
      />
    )
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/ar/live-classes/lcs-9/room"
    )
  })

  it("renders nothing when there is no link to join", () => {
    const { container } = render(
      <LiveJoinButton lang="en" label="Join" liveClass={null} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing for an external session missing its URL", () => {
    const { container } = render(
      <LiveJoinButton
        lang="en"
        label="Join"
        liveClass={{
          sessionId: "lcs-2",
          provider: "external",
          meetingUrl: null,
          status: "scheduled",
        }}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
