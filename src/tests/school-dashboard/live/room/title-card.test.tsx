// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-04: once the Join pill shows progress ("30m left"), the visible text no
 * longer says "Join" anywhere — the fix adds an explicit `aria-label` so the
 * button keeps a real accessible name.
 *
 * lr-07: the mark row used to be the lesson hero's placeholder verbatim
 * (`4K` / `Free` / `CC` / `AD`), none of it true of a live room. It is now
 * `HD` (filled, always) plus honest outlined marks for what THIS room
 * actually offers.
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  RoomTitleCard,
  type RoomTitleCardData,
  type RoomTitleCardLabels,
} from "@/components/school-dashboard/live/room/title-card"

const labels: RoomTitleCardLabels = {
  join: "Join",
  joining: "Joining…",
  more: "MORE",
  live: "Live",
  scheduled: "Scheduled",
  recorded: "Recorded",
  resourceOne: "resource",
  resourceMany: "resources",
  free: "Free",
  hd: "HD",
  rec: "REC",
  chat: "Chat",
  poll: "Poll",
  whiteboard: "Whiteboard",
  hands: "Hands",
  remaining: "{n}m left",
  remainingHours: "{h}h {m}m left",
  back: "Back",
  add: "ADD",
  addToCalendar: "Add to calendar",
  share: "Share",
  linkCopied: "Link copied",
}

const baseData: RoomTitleCardData = {
  subject: "Mathematics",
  grade: "Grade 7",
  section: "Grade 7-A",
  teacher: "Ms. Smith",
  chapter: null,
  lesson: null,
  startTime: "10:00 AM",
  durationLabel: "45 min",
  isLive: true,
  isRecording: false,
  tools: { chat: false, hands: false, polls: false, whiteboard: false },
  startsAtMs: null,
  endsAtMs: null,
  description: null,
  resourceCount: 0,
  // No artwork: keeps the test from exercising next/image at all.
  thumbnailUrl: null,
  color: "#123456",
}

const baseProps = {
  labels,
  sessionId: "s1",
  detailHref: "/en/live/s1",
  pending: false,
  error: null,
  onJoin: () => {},
}

describe("RoomTitleCard action button accessible name (lr-04)", () => {
  it("has no separate aria-label when it just says Join", () => {
    render(<RoomTitleCard data={baseData} {...baseProps} />)
    // The visible text alone is the accessible name — "Join".
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument()
  })

  it("says Joining… while pending", () => {
    render(<RoomTitleCard data={baseData} {...baseProps} pending />)
    expect(screen.getByRole("button", { name: "Joining…" })).toBeInTheDocument()
  })

  it("keeps an accessible name of Join once progress shows only a countdown", () => {
    const now = Date.now()
    const data: RoomTitleCardData = {
      ...baseData,
      startsAtMs: now - 5 * 60_000,
      endsAtMs: now + 25 * 60_000,
    }
    render(<RoomTitleCard data={data} {...baseProps} />)
    // Visible text is just "25m left" — the accessible name must say Join.
    const button = screen.getByRole("button", { name: "Join" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent(/m left/)
  })
})

describe("RoomTitleCard mark row (lr-07)", () => {
  it("shows HD filled, and no placeholder 4K/Free/CC/AD marks", () => {
    render(<RoomTitleCard data={baseData} {...baseProps} />)
    expect(screen.getByText("HD")).toBeInTheDocument()
    expect(screen.queryByText("4K")).not.toBeInTheDocument()
    expect(screen.queryByText("Free")).not.toBeInTheDocument()
    expect(screen.queryByText("CC")).not.toBeInTheDocument()
    expect(screen.queryByText("AD")).not.toBeInTheDocument()
  })

  it("adds REC only when the session records", () => {
    render(<RoomTitleCard data={baseData} {...baseProps} />)
    expect(screen.queryByText("REC")).not.toBeInTheDocument()

    render(
      <RoomTitleCard data={{ ...baseData, isRecording: true }} {...baseProps} />
    )
    expect(screen.getByText("REC")).toBeInTheDocument()
  })

  it("adds a mark per tool the school actually turned on, and none it did not", () => {
    render(
      <RoomTitleCard
        data={{
          ...baseData,
          tools: { chat: true, hands: false, polls: true, whiteboard: false },
        }}
        {...baseProps}
      />
    )
    expect(screen.getByText("Chat")).toBeInTheDocument()
    expect(screen.getByText("Poll")).toBeInTheDocument()
    expect(screen.queryByText("Hands")).not.toBeInTheDocument()
    expect(screen.queryByText("Whiteboard")).not.toBeInTheDocument()
  })
})
