// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-04: the Join pill always says what it does.
 *
 * It used to drop its word the moment it had progress to show — the frame's
 * own behaviour — leaving `▶ ——— 25m left` and an `aria-label` carrying the
 * only mention of joining. The label stays now, and where the class is
 * anchored to a catalog lesson it names it: `Join C1, L1`, the frame's
 * `Play S2, E1`.
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
  joinLesson: "Join C{c}, L{l}",
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
  chapterOrder: null,
  lessonOrder: null,
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
  it("says just Join when the class is anchored to no lesson", () => {
    render(<RoomTitleCard data={baseData} {...baseProps} />)
    // A slot materialized from the timetable knows its subject but not which
    // lesson of it is taught today, and "Join C, L" would be worse than "Join".
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument()
  })

  it("names the lesson it opens when the class is anchored to one", () => {
    render(
      <RoomTitleCard
        data={{ ...baseData, chapterOrder: 1, lessonOrder: 3 }}
        {...baseProps}
      />
    )
    expect(
      screen.getByRole("button", { name: "Join C1, L3" })
    ).toBeInTheDocument()
  })

  it("says Joining… while pending", () => {
    render(<RoomTitleCard data={baseData} {...baseProps} pending />)
    expect(screen.getByRole("button", { name: "Joining…" })).toBeInTheDocument()
  })

  it("keeps the label VISIBLE beside the countdown once progress shows", () => {
    const now = Date.now()
    const data: RoomTitleCardData = {
      ...baseData,
      chapterOrder: 2,
      lessonOrder: 1,
      startsAtMs: now - 5 * 60_000,
      endsAtMs: now + 25 * 60_000,
    }
    render(<RoomTitleCard data={data} {...baseProps} />)
    // Not an aria-label carrying it: the words are on the button, where a
    // sighted reader needs them too. This is the deliberate departure from the
    // frame, which drops its word here.
    const button = screen.getByRole("button", { name: /Join C2, L1/ })
    expect(button).toHaveTextContent(/m left/)
    expect(button).not.toHaveAttribute("aria-label")
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
