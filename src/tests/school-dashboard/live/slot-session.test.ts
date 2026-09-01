// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Slot-anchored sessions, keyed by school-calendar DAY. A timetable slot
// recurs weekly, so "the session on this slot" only means something together
// with a date — the two behaviours locked here are the ones that break the
// moment a school actually teaches online every week.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  findSlotSessionForDay,
  materializeSlotSession,
} from "@/components/school-dashboard/live/actions/slot-session"
import type { OnlinePolicy } from "@/components/school-dashboard/live/online-policy"

// Title prewarm is a fire-and-forget cache fill; not what these tests assert.
vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(async () => {}),
}))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    conferenceParticipant: { upsert: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const TZ = "Asia/Dubai"

const SLOT = {
  id: "tt-1",
  teacherId: "t-1",
  sectionId: "sec-1",
  subjectId: "sub-1",
  subjectName: "Maths",
  sectionName: "Grade 1-A",
  teacherUserId: "u-teacher",
  period: {
    startTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
    endTime: new Date(Date.UTC(1970, 0, 1, 8, 45)),
  },
}

const EXTERNAL: OnlinePolicy = {
  online: true,
  provider: "external",
  degraded: false,
  mode: "timetable",
  source: "school",
  note: null,
}
const LIVEKIT: OnlinePolicy = { ...EXTERNAL, provider: "livekit" }

/**
 * The fixture day, and a clock pinned to its morning.
 *
 * The materializer skips a period that is already over, so these tests are
 * time-dependent by construction — without a pinned clock the whole file would
 * start failing on its own the day the fixture date passed.
 */
const DAY = "2026-08-15"
const NOW = new Date(`${DAY}T02:00:00Z`) // 06:00 in Asia/Dubai, before period 1

const ctx = (
  over: Partial<Parameters<typeof materializeSlotSession>[1]> = {}
) =>
  ({
    schoolId: SCHOOL,
    timeZone: TZ,
    date: new Date(`${DAY}T06:00:00Z`),
    policy: EXTERNAL,
    recordingEnabled: true,
    meetingUrl: "https://meet.example.com/x",
    meetingProvider: "Google Meet",
    lang: "ar",
    ...over,
  }) as Parameters<typeof materializeSlotSession>[1]

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.mocked(db.conference.findFirst).mockResolvedValue(null as never)
  vi.mocked(db.conference.create).mockResolvedValue({ id: "lcs-new" } as never)
  vi.mocked(db.conference.update).mockResolvedValue({} as never)
  vi.mocked(db.conferenceParticipant.upsert).mockResolvedValue({} as never)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("findSlotSessionForDay", () => {
  it("bounds the lookup to the SCHOOL day, not the server day", async () => {
    await findSlotSessionForDay(
      SCHOOL,
      "tt-1",
      TZ,
      new Date("2026-08-14T21:00:00Z") // already Aug 15 in Dubai
    )
    const where = vi.mocked(db.conference.findFirst).mock.calls[0]?.[0]?.where
    expect(where).toMatchObject({ schoolId: SCHOOL, timetableId: "tt-1" })
    expect(
      (where?.scheduledStart as { gte: Date; lt: Date }).gte.toISOString()
    ).toBe("2026-08-14T20:00:00.000Z")
    expect(
      (where?.scheduledStart as { gte: Date; lt: Date }).lt.toISOString()
    ).toBe("2026-08-15T20:00:00.000Z")
  })

  it("looks only at joinable statuses by default", async () => {
    // The interactive Start button wants this: a class that already ENDED
    // today should not be reused, so a teacher can hold a second sitting.
    await findSlotSessionForDay(SCHOOL, "tt-1", TZ, new Date())
    const where = vi.mocked(db.conference.findFirst).mock.calls[0]?.[0]?.where
    expect(where?.status).toEqual({ in: ["scheduled", "live"] })
  })
})

describe("materializeSlotSession", () => {
  it("creates one external session for the slot's period, in school-local time", async () => {
    const out = await materializeSlotSession(SLOT, ctx())
    expect(out).toEqual({ created: true, sessionId: "lcs-new" })

    const data = vi.mocked(db.conference.create).mock.calls[0][0].data as {
      scheduledStart: Date
      scheduledEnd: Date
      provider: string
      meetingUrl: string
      timetableId: string
      status: string
    }
    // 08:00–08:45 Dubai on 2026-08-15 → 04:00–04:45Z.
    expect(data.scheduledStart.toISOString()).toBe("2026-08-15T04:00:00.000Z")
    expect(data.scheduledEnd.toISOString()).toBe("2026-08-15T04:45:00.000Z")
    expect(data.provider).toBe("external")
    expect(data.meetingUrl).toBe("https://meet.example.com/x")
    expect(data.timetableId).toBe("tt-1")
    expect(data.status).toBe("scheduled")
  })

  it("checks every DECIDED status, so a cancelled class is not resurrected", async () => {
    // The sweep re-runs every 15 minutes. Looking only for joinable rows would
    // recreate a class the teacher cancelled an hour ago, over and over.
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: "lcs-cancelled",
      status: "cancelled",
    } as never)

    const out = await materializeSlotSession(SLOT, ctx())
    expect(out).toEqual({ created: false, reason: "cancelled" })
    expect(db.conference.create).not.toHaveBeenCalled()

    const where = vi.mocked(db.conference.findFirst).mock.calls[0]?.[0]?.where
    expect(where?.status).toEqual({
      in: ["scheduled", "live", "ended", "cancelled", "failed"],
    })
  })

  it("is idempotent for a day that already has a session", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: "lcs-1",
      status: "scheduled",
    } as never)
    expect(await materializeSlotSession(SLOT, ctx())).toEqual({
      created: false,
      reason: "exists",
    })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("refuses to publish an external class with no meeting link", async () => {
    // An external session IS its link; without one we would ship a dead Join
    // button and an empty reminder.
    expect(
      await materializeSlotSession(SLOT, ctx({ meetingUrl: null }))
    ).toEqual({ created: false, reason: "no_link" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("needs no link on the LiveKit path — the room IS the destination", async () => {
    const out = await materializeSlotSession(
      SLOT,
      ctx({ policy: LIVEKIT, meetingUrl: null })
    )
    expect(out).toEqual({ created: true, sessionId: "lcs-new" })
    // roomName is stamped in a second write so it can embed the row's cuid.
    expect(vi.mocked(db.conference.update).mock.calls[0][0].data).toEqual({
      roomName: `sch-${SCHOOL}-lc-lcs-new`,
    })
    // Teacher is HOST up front; students resolve lazily from the roster.
    expect(db.conferenceParticipant.upsert).toHaveBeenCalled()
  })

  it("skips a period whose end does not follow its start", async () => {
    const out = await materializeSlotSession(
      {
        ...SLOT,
        period: {
          startTime: new Date(Date.UTC(1970, 0, 1, 10, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
        },
      },
      ctx()
    )
    expect(out).toEqual({ created: false, reason: "bad_period" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("honours the section recording opt-out passed by the sweep", async () => {
    await materializeSlotSession(SLOT, ctx({ recordingEnabled: false }))
    const data = vi.mocked(db.conference.create).mock.calls[0][0].data as {
      recordingEnabled: boolean
    }
    expect(data.recordingEnabled).toBe(false)
  })
})

describe("materializeSlotSession — a period that is already over", () => {
  it("creates nothing once the period has ended", async () => {
    // The moment a school can go online MID-DAY this matters: flipping the
    // switch at 13:00 would otherwise materialize every morning slot as
    // `scheduled`, publish Join buttons for classes that finished hours ago,
    // and hand the end-stale cron a pile of instantly-stranded rows to cancel.
    vi.setSystemTime(new Date(`${DAY}T09:00:00Z`)) // 13:00 in Asia/Dubai
    const out = await materializeSlotSession(SLOT, ctx())
    expect(out).toEqual({ created: false, reason: "period_over" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("still creates a period that has started but not finished", async () => {
    // 08:20 Dubai — inside the 08:00–08:45 period. A teacher who flips the
    // switch mid-lesson should still get a room for the rest of it.
    vi.setSystemTime(new Date(`${DAY}T04:20:00Z`))
    const out = await materializeSlotSession(SLOT, ctx())
    expect(out).toMatchObject({ created: true })
  })

  it("back-filling a past date is a no-op", async () => {
    const out = await materializeSlotSession(
      SLOT,
      ctx({ date: new Date("2026-08-01T06:00:00Z") })
    )
    expect(out).toEqual({ created: false, reason: "period_over" })
  })
})
