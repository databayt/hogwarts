// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { rankNextActions } from "@/components/school-dashboard/dashboard/next-action-rank"

const overdue = {
  title: "Essay",
  subject: "Arabic",
  status: "not_submitted",
  isOverdue: true,
}

// A live class is over in minutes; it used to rank below every assignment
// and link to /timetable rather than the room.
describe("rankNextActions — live class", () => {
  it("puts a student's live class first, linking into the room", () => {
    const actions = rankNextActions("STUDENT", {
      assignments: [overdue],
      nextClass: { subject: "Maths", liveSessionId: "s1" },
    })
    expect(actions[0]).toEqual({
      kind: "liveClass",
      mark: "Maths",
      href: "/live/s1/room",
    })
    // ...and does not repeat it as a plain "next class".
    expect(actions.some((a) => a.kind === "nextClass")).toBe(false)
  })

  it("puts a teacher's live class above marking", () => {
    const actions = rankNextActions("TEACHER", {
      pendingGrading: 4,
      nextClass: { subject: "Physics", liveSessionId: "s2" },
    })
    expect(actions[0].kind).toBe("liveClass")
    expect(actions[1].kind).toBe("pendingGrading")
  })

  it("keeps the plain next class when there is no live room", () => {
    const actions = rankNextActions("STUDENT", {
      assignments: [],
      nextClass: { subject: "Maths", liveSessionId: null },
    })
    expect(actions).toEqual([
      { kind: "nextClass", mark: "Maths", href: "/timetable" },
    ])
  })
})

// The join window rides on the class payload (`upcoming-queries.ts` →
// `liveFields`): a class is "live — join" only inside it, through the slot's
// join link, and a guardian is told about their child's class.
describe("rankNextActions — join window", () => {
  const FROM = Date.UTC(2026, 10, 8, 13, 50)
  const UNTIL = Date.UTC(2026, 10, 8, 15, 0)
  const cls = {
    subject: "Maths",
    liveSessionId: null,
    slotId: "slot-1",
    liveFromMs: FROM,
    liveUntilMs: UNTIL,
  }

  it("is live — through the join link — inside the window", () => {
    const [first] = rankNextActions(
      "STUDENT",
      { nextClass: cls },
      FROM + 60_000
    )
    expect(first).toMatchObject({
      kind: "liveClass",
      mark: "Maths",
      href: "/live/join/slot-1",
    })
  })

  it("is the plain next class before the window, carrying it so the card can flip", () => {
    const [first] = rankNextActions(
      "STUDENT",
      { nextClass: cls },
      FROM - 60_000
    )
    expect(first).toMatchObject({
      kind: "nextClass",
      href: "/timetable",
      live: { fromMs: FROM, untilMs: UNTIL, joinHref: "/live/join/slot-1" },
    })
  })

  it("does not call a class live once its window has closed", () => {
    const actions = rankNextActions("TEACHER", { nextClass: cls }, UNTIL + 1)
    expect(actions.some((a) => a.kind === "liveClass")).toBe(false)
  })

  it("tells a guardian their child's class is live, by the child's given name", () => {
    const actions = rankNextActions(
      "GUARDIAN",
      { children: [{ name: "Khadija Alnoor", nextClass: cls }] },
      FROM + 60_000
    )
    expect(actions[0]).toMatchObject({
      kind: "childLiveClass",
      mark: "Khadija",
      href: "/live/join/slot-1",
    })
  })

  it("carries a child's class that has not opened yet as PENDING, last", () => {
    const actions = rankNextActions(
      "GUARDIAN",
      {
        children: [
          { name: "Khadija Alnoor", overdueAssignments: 1, nextClass: cls },
        ],
      },
      FROM - 60_000
    )
    expect(actions[0].kind).toBe("childOverdue")
    expect(actions.at(-1)).toMatchObject({
      kind: "childLiveClass",
      pending: true,
    })
  })
})
