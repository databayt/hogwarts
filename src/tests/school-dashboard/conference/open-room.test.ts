// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The LOOSE delivery mode — one standing room per section per school day, with
// no period boundaries. A school that has gone online because of a storm
// rarely reproduces its bell schedule on day one; a school that is online by
// design may not want one at all.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  materializeOpenRoom,
  openRoomWindow,
} from "@/components/school-dashboard/conference/actions/open-room"
import type { OnlinePolicy } from "@/components/school-dashboard/conference/online-policy"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    conferenceParticipant: { upsert: vi.fn() },
  },
}))
vi.mock("next/server", () => ({ after: (fn: () => unknown) => fn() }))
vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(async () => undefined),
}))

const TZ = "Africa/Khartoum"
const SCHOOL = "school-1"

const policy = (provider: "livekit" | "external"): OnlinePolicy => ({
  online: true,
  provider,
  degraded: false,
  mode: "open",
  source: "window",
  note: null,
})

const SECTION = {
  id: "sec-1",
  name: "Grade 1-A",
  homeroomTeacherId: "t-1",
  homeroomTeacherUserId: "u-1",
  conferenceRecordingOptOut: false,
}

// A window that is comfortably in the future, so `day_over` never fires
// incidentally.
const FUTURE = new Date(Date.now() + 60 * 60 * 1000)
const LATER = new Date(Date.now() + 5 * 60 * 60 * 1000)

const ctx = (
  over: Partial<Parameters<typeof materializeOpenRoom>[1]> = {}
) => ({
  schoolId: SCHOOL,
  timeZone: TZ,
  date: new Date(),
  policy: policy("external"),
  recordingEnabled: false,
  meetingUrl: "https://meet.example.com/school",
  meetingProvider: null,
  lang: "ar",
  dayStart: FUTURE,
  dayEnd: LATER,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.conference.findFirst).mockResolvedValue(null as never)
  vi.mocked(db.conference.create).mockResolvedValue({ id: "open-1" } as never)
  vi.mocked(db.conference.update).mockResolvedValue({} as never)
  vi.mocked(db.conferenceParticipant.upsert).mockResolvedValue({} as never)
})

describe("openRoomWindow", () => {
  const period = (sh: number, eh: number) => ({
    startTime: new Date(Date.UTC(1970, 0, 1, sh, 0)),
    endTime: new Date(Date.UTC(1970, 0, 1, eh, 0)),
  })

  it("spans the first period's start to the LAST period's end", () => {
    const day = new Date("2026-03-10T09:00:00Z")
    // Deliberately out of order — the day is bounded by the extremes, not by
    // whatever order the rows arrive in.
    const w = openRoomWindow(TZ, day, [
      period(10, 11),
      period(8, 9),
      period(12, 14),
    ])
    expect(w.end.getTime() - w.start.getTime()).toBe(6 * 60 * 60 * 1000)
  })

  it("falls back to the whole calendar day when the school has no periods", () => {
    // A school with no bell schedule is precisely the school most likely to
    // want loose delivery — "no periods" must not mean "no room".
    const w = openRoomWindow(TZ, new Date("2026-03-10T09:00:00Z"), [])
    expect(w.end.getTime() - w.start.getTime()).toBe(24 * 60 * 60 * 1000)
  })
})

describe("materializeOpenRoom", () => {
  it("creates one external room for the section's whole day", async () => {
    const out = await materializeOpenRoom(SECTION, ctx())
    expect(out).toEqual({ created: true, sessionId: "open-1" })

    const data = vi.mocked(db.conference.create).mock.calls[0]?.[0]
      ?.data as Record<string, unknown>
    expect(data.provider).toBe("external")
    expect(data.meetingUrl).toBe("https://meet.example.com/school")
    // Slot-less by construction: no period to anchor to, and no subject.
    expect(data.timetableId).toBeNull()
    expect(data.subjectId).toBeNull()
    expect(data.sectionId).toBe("sec-1")
    expect(data.scheduledStart).toBe(FUTURE)
    expect(data.scheduledEnd).toBe(LATER)
  })

  it("is idempotent — a second sweep 15 minutes later is a no-op", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: "open-1",
      status: "scheduled",
    } as never)

    const out = await materializeOpenRoom(SECTION, ctx())
    expect(out).toEqual({ created: false, reason: "exists" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("leaves a cancelled room cancelled", async () => {
    // The sweep re-runs every 15 minutes; a joinable-only check would reopen
    // a room the teacher closed, all day long.
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: "open-1",
      status: "cancelled",
    } as never)

    const out = await materializeOpenRoom(SECTION, ctx())
    expect(out).toEqual({ created: false, reason: "cancelled" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("identifies the day's room by (section, no slot, no subject, exact start)", async () => {
    await materializeOpenRoom(SECTION, ctx())
    const where = vi.mocked(db.conference.findFirst).mock.calls[0]?.[0]?.where
    expect(where).toMatchObject({
      schoolId: SCHOOL,
      sectionId: "sec-1",
      timetableId: null,
      subjectId: null,
      scheduledStart: FUTURE,
      deletedAt: null,
    })
  })

  it("skips a section with no homeroom teacher — a room needs a host", async () => {
    // Conference.teacherId is required and onDelete: Restrict; there is no
    // slot to borrow a teacher from.
    const out = await materializeOpenRoom(
      { ...SECTION, homeroomTeacherId: null },
      ctx()
    )
    expect(out).toEqual({ created: false, reason: "no_teacher" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("skips when an external room has no link at all", async () => {
    // An open room carries no subject, so ConferenceLink cannot supply a URL —
    // the school's standing link is the only external source.
    const out = await materializeOpenRoom(SECTION, ctx({ meetingUrl: null }))
    expect(out).toEqual({ created: false, reason: "no_link" })
  })

  it("does not need a link for an in-app room", async () => {
    const out = await materializeOpenRoom(
      SECTION,
      ctx({ policy: policy("livekit"), meetingUrl: null })
    )
    expect(out).toEqual({ created: true, sessionId: "open-1" })
    // Two-step so the tenant-namespaced roomName can embed the row's own cuid.
    expect(vi.mocked(db.conference.update).mock.calls[0]?.[0]?.data).toEqual({
      roomName: `sch-${SCHOOL}-lc-open-1`,
    })
    // The homeroom teacher is HOST up front; students resolve lazily on join.
    expect(db.conferenceParticipant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "u-1", role: "HOST" }),
      })
    )
  })

  it("does not create a room whose day is already over", async () => {
    // What stops an afternoon flip filling the table with dead-on-arrival rows.
    const out = await materializeOpenRoom(
      SECTION,
      ctx({
        dayStart: new Date(Date.now() - 6 * 60 * 60 * 1000),
        dayEnd: new Date(Date.now() - 60 * 1000),
      })
    )
    expect(out).toEqual({ created: false, reason: "day_over" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("still builds a FUTURE day after today's classes have finished", async () => {
    // The regression this locks: "over" was compared against `ctx.date`, which
    // callers pass carrying the current TIME-OF-DAY on the target date. Once
    // the wall clock passed the last period's end, every future day looked
    // already over — a 15:20 run refused to build tomorrow's rooms because
    // tomorrow's classes end at 12:10. Caught only against real data, because
    // the cron's `ctx.date === now` makes the two comparisons coincide.
    const tomorrow = new Date(Date.now() + 86_400_000)
    const out = await materializeOpenRoom(
      SECTION,
      ctx({
        // A target date carrying a time-of-day LATER than the day's own end.
        date: tomorrow,
        dayStart: new Date(tomorrow.getTime() - 6 * 60 * 60 * 1000),
        dayEnd: new Date(tomorrow.getTime() - 60 * 1000),
      })
    )
    expect(out).toMatchObject({ created: true })
  })
})
