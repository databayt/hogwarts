// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  noShowNotice,
  noShowWhat,
  notifiedSessionIds,
  selectNoShowSessions,
  type NoShowCandidate,
} from "@/components/school-dashboard/live/no-show"

const START = new Date("2026-11-22T09:00:00Z")
const END = new Date("2026-11-22T09:45:00Z")
const at = (min: number) => new Date(START.getTime() + min * 60_000)

const session = (over: Partial<NoShowCandidate> = {}): NoShowCandidate => ({
  id: "s1",
  schoolId: "school",
  status: "scheduled",
  isPractice: false,
  scheduledStart: START,
  scheduledEnd: END,
  coveredByUserId: null,
  hostEverJoined: false,
  ...over,
})

describe("selectNoShowSessions", () => {
  const none = new Set<string>()

  it("waits five minutes past the start", () => {
    expect(selectNoShowSessions([session()], at(4), none)).toHaveLength(0)
    expect(selectNoShowSessions([session()], at(5), none)).toHaveLength(1)
  })
  it("stops at the end of the class", () => {
    expect(selectNoShowSessions([session()], at(44), none)).toHaveLength(1)
    expect(selectNoShowSessions([session()], at(45), none)).toHaveLength(0)
  })
  it("takes scheduled and live, not ended or cancelled", () => {
    expect(selectNoShowSessions([session({ status: "live" })], at(10), none)).toHaveLength(1)
    expect(selectNoShowSessions([session({ status: "cancelled" })], at(10), none)).toHaveLength(0)
    expect(selectNoShowSessions([session({ status: "ended" })], at(10), none)).toHaveLength(0)
  })
  it("skips a class a teacher joined, a covered one and the practice room", () => {
    expect(selectNoShowSessions([session({ hostEverJoined: true })], at(10), none)).toHaveLength(0)
    expect(selectNoShowSessions([session({ coveredByUserId: "u" })], at(10), none)).toHaveLength(0)
    expect(selectNoShowSessions([session({ isPractice: true })], at(10), none)).toHaveLength(0)
  })
  it("tells each class once: a session already holding a notice is skipped", () => {
    const rows = [session({ id: "a" }), session({ id: "b" })]
    const told = notifiedSessionIds([
      { metadata: { kind: "noTeacher", sessionId: "a" } },
      { metadata: null },
      { metadata: { other: 1 } },
    ])
    expect(told).toEqual(new Set(["a"]))
    expect(selectNoShowSessions(rows, at(10), told).map((s) => s.id)).toEqual(["b"])
  })
})

describe("the notice", () => {
  it("speaks Arabic first, with the class and the time", () => {
    const what = noShowWhat({ subject: "الرياضيات", section: "3 أ", title: "x" })
    expect(what).toBe("الرياضيات · 3 أ")
    expect(noShowNotice("ar", { what, time: "٠٩:٠٠" })).toEqual({
      title: "حصة بلا معلم",
      body: "الرياضيات · 3 أ — بدأت الساعة ٠٩:٠٠ ولم يدخل المعلم. ادخل وغطِّها أو احجز تعويضاً.",
    })
    expect(noShowNotice("en", { what: "Math · 3A", time: "09:00" }).title).toBe(
      "Class without a teacher"
    )
  })
  it("falls back to the title when subject and section are missing", () => {
    expect(noShowWhat({ title: "Open room" })).toBe("Open room")
  })
})
