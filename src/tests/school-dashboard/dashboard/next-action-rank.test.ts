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

  it("leads with the class before its window — all day — carrying the window and time", () => {
    const actions = rankNextActions(
      "STUDENT",
      { assignments: [overdue], nextClass: { ...cls, startsAt: "10:20" } },
      FROM - 3 * 3_600_000
    )
    expect(actions[0]).toMatchObject({
      kind: "liveClassSoon",
      mark: "Maths",
      detail: "10:20",
      href: "/timetable",
      live: { fromMs: FROM, untilMs: UNTIL, joinHref: "/live/join/slot-1" },
    })
    expect(actions[1].kind).toBe("assignmentOverdue")
    expect(actions.some((a) => a.kind === "nextClass")).toBe(false)
  })

  it("puts a teacher's upcoming online class above marking", () => {
    const actions = rankNextActions(
      "TEACHER",
      { pendingGrading: 3, nextClass: cls },
      FROM - 60_000
    )
    expect(actions.map((a) => a.kind)).toEqual([
      "liveClassSoon",
      "pendingGrading",
    ])
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

  it("leads a guardian's card with a child's class that has not opened yet", () => {
    const actions = rankNextActions(
      "GUARDIAN",
      {
        children: [
          { name: "Khadija Alnoor", overdueAssignments: 1, nextClass: cls },
        ],
      },
      FROM - 60_000
    )
    expect(actions[0]).toMatchObject({
      kind: "childLiveClassSoon",
      mark: "Khadija",
    })
    expect(actions[1].kind).toBe("childOverdue")
  })
})

describe("rankNextActions — the school's live day", () => {
  const today = {
    deliveryMode: "online",
    onlineToday: 12,
    noTeacherLogin: 2,
    liveNow: 0,
    nextStart: "08:00",
  }

  it("tells an admin about the day's classes before anything else", () => {
    const actions = rankNextActions("ADMIN", {
      activeIssues: 1,
      liveToday: today,
    })
    expect(actions.map((a) => a.kind)).toEqual([
      "liveBlocked",
      "liveToday",
      "activeIssues",
    ])
    expect(actions[1]).toMatchObject({ mark: "12", detail: "08:00" })
  })

  it("puts classes running now first, and drops the day count", () => {
    const actions = rankNextActions("PRINCIPAL", {
      liveToday: { ...today, liveNow: 3, noTeacherLogin: 0 },
    })
    expect(actions).toEqual([{ kind: "liveNow", mark: "3", href: "/live" }])
  })

  it("never shows staff the admin-only fix", () => {
    const actions = rankNextActions("STAFF", { liveToday: today })
    expect(actions.some((a) => a.kind === "liveBlocked")).toBe(false)
  })

  it("says nothing for an in-person school", () => {
    const actions = rankNextActions("ADMIN", {
      liveToday: { ...today, deliveryMode: "physical" },
    })
    expect(actions).toEqual([])
  })
})
