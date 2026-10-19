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
