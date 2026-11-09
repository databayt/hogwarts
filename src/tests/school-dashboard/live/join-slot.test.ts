// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `resolveSlotJoin` — where `/live/join/{slot}` sends a reader right now.
 *
 * The clock and the zone are REAL (day-window + join-window are pure); only
 * the database edges are mocked. The school is in Khartoum (UTC+2); the slot
 * is Sunday 16:00–16:50 school time, 14:00–14:50 UTC on 2026-11-08.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { canAccessSession } from "@/components/school-dashboard/live/actions/helpers"
import { resolveSlotJoin } from "@/components/school-dashboard/live/actions/join-slot"
import {
  materializeSlotForDay,
  resolveSubstitutes,
} from "@/components/school-dashboard/live/actions/materialize-day"
import { findSlotSessionForDay } from "@/components/school-dashboard/live/actions/slot-session"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"

vi.mock("@/lib/db", () => ({
  db: {
    timetable: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
    teacher: { findFirst: vi.fn() },
    conference: { findFirst: vi.fn() },
    conferenceLink: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  canAccessSession: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/actions/materialize-day", () => ({
  materializeSlotForDay: vi.fn(),
  resolveSubstitutes: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/actions/slot-session", () => ({
  findSlotSessionForDay: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/online-policy", () => ({
  resolveOnlinePolicies: vi.fn(),
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

const SCHOOL = "school-1"
const SLOT = "slot-1"
const SECTION = "sec-1"
const at = (hhmm: string) => new Date(`2026-11-08T${hhmm}:00.000Z`) // UTC
const slotRow = {
  id: SLOT,
  termId: "term-1",
  dayOfWeek: 0, // Sunday in Khartoum on 2026-11-08
  weekOffset: 0,
  sectionId: SECTION,
  subjectId: "subj-1",
  teacherId: "teacher-1",
  // Stored as UTC wall clock: 16:00–16:50 school time.
  period: {
    startTime: new Date("1970-01-01T16:00:00.000Z"),
    endTime: new Date("1970-01-01T16:50:00.000Z"),
    isBreak: false,
  },
}
const online = (on: boolean, provider: "livekit" | "external" = "livekit") =>
  new Map([[SECTION, { online: on, provider }]])

/** Today's rows the resolver can see, by status, keyed off the lookup asked. */
let rows: Array<{ id: string; status: string }> = []

beforeEach(() => {
  vi.clearAllMocks()
  rows = []
  m(db.timetable.findFirst).mockResolvedValue(slotRow)
  m(db.school.findUnique).mockResolvedValue({
    timezone: "Africa/Khartoum",
    conferenceReminderLeadMinutes: 10,
    conferenceGuardiansObserve: true,
  })
  m(db.teacher.findFirst).mockResolvedValue({ id: "teacher-1" })
  m(db.conference.findFirst).mockResolvedValue(null)
  m(db.conferenceLink.findFirst).mockResolvedValue(null)
  m(resolveActiveTerm).mockResolvedValue({ term: { id: "term-1" } })
  m(canAccessSession).mockResolvedValue(true)
  m(resolveSubstitutes).mockResolvedValue(new Map())
  m(resolveOnlinePolicies).mockResolvedValue(online(true))
  m(findSlotSessionForDay).mockImplementation(
    async (
      _s: string,
      _slot: string,
      _tz: string,
      _d: Date,
      statuses: string[]
    ) => rows.find((r) => statuses.includes(r.status)) ?? null
  )
  // The sweep's writer: makes today's row for the slot.
  m(materializeSlotForDay).mockImplementation(async () => {
    rows.push({ id: "room-new", status: "scheduled" })
    return { created: 1, skipped: 0, truncated: 0, reasons: {} }
  })
})

const ask = (role: string, now: Date, userId = "user-1") =>
  resolveSlotJoin({
    schoolId: SCHOOL,
    userId,
    role: role as never,
    timetableId: SLOT,
    now,
  })

describe("resolveSlotJoin — who may use the link", () => {
  it("finds nothing for another school's (or a missing) slot", async () => {
    m(db.timetable.findFirst).mockResolvedValue(null)
    expect(await ask("STUDENT", at("13:55"))).toEqual({ kind: "not_found" })
  })

  it("refuses a student outside the slot's section — and makes no room", async () => {
    m(canAccessSession).mockResolvedValue(false)
    expect(await ask("STUDENT", at("13:55"))).toEqual({ kind: "forbidden" })
    expect(materializeSlotForDay).not.toHaveBeenCalled()
  })

  it("refuses staff and accountants (a slot's class is section-scoped)", async () => {
    expect(await ask("STAFF", at("13:55"))).toEqual({ kind: "forbidden" })
    expect(await ask("ACCOUNTANT", at("13:55"))).toEqual({ kind: "forbidden" })
  })

  it("refuses a guardian where the school does not let guardians watch", async () => {
    m(db.school.findUnique).mockResolvedValue({
      timezone: "Africa/Khartoum",
      conferenceReminderLeadMinutes: 10,
      conferenceGuardiansObserve: false,
    })
    expect(await ask("GUARDIAN", at("13:55"))).toEqual({ kind: "forbidden" })
  })
})

describe("resolveSlotJoin — the day and the window", () => {
  it("says not today for a slot on another weekday", async () => {
    m(db.timetable.findFirst).mockResolvedValue({ ...slotRow, dayOfWeek: 1 })
    expect(await ask("STUDENT", at("13:55"))).toMatchObject({
      kind: "not_today",
    })
  })

  it("holds an early student with the opening instant (school lead, 10 min)", async () => {
    const r = await ask("STUDENT", at("13:30")) // 15:30 Khartoum
    expect(r).toEqual({
      kind: "early",
      opensAt: at("13:50"),
      startsAt: at("14:00"),
    })
    expect(materializeSlotForDay).not.toHaveBeenCalled()
  })

  it("opens earlier for the class's own teacher (host floor, 15 min)", async () => {
    const now = at("13:47") // 15:47 — students still wait until 15:50
    expect(await ask("STUDENT", now)).toMatchObject({ kind: "early" })
    expect(await ask("TEACHER", now)).toEqual({
      kind: "room",
      sessionId: "room-new",
    })
  })

  it("says over once the grace after the bell has passed", async () => {
    expect(await ask("STUDENT", at("15:01"))).toEqual({ kind: "over" })
  })
})

describe("resolveSlotJoin — which room", () => {
  it("sends everyone into a room the teacher already opened, even early", async () => {
    rows.push({ id: "room-live", status: "live" })
    expect(await ask("STUDENT", at("13:30"))).toEqual({
      kind: "room",
      sessionId: "room-live",
    })
  })

  it("makes today's room on the tap when the section is online and the sweep missed it — once", async () => {
    expect(await ask("STUDENT", at("13:55"))).toEqual({
      kind: "room",
      sessionId: "room-new",
    })
    // The second tap (or the next sweep) finds the row instead of writing one.
    expect(await ask("STUDENT", at("13:56"))).toEqual({
      kind: "room",
      sessionId: "room-new",
    })
    expect(materializeSlotForDay).toHaveBeenCalledTimes(1)
  })

  it("takes an ad-hoc room for the section + subject before making one", async () => {
    m(db.conference.findFirst).mockResolvedValueOnce({
      id: "room-adhoc",
      status: "scheduled",
    })
    expect(await ask("STUDENT", at("13:55"))).toEqual({
      kind: "room",
      sessionId: "room-adhoc",
    })
    expect(materializeSlotForDay).not.toHaveBeenCalled()
  })

  it("answers not online for an in-person section with no room", async () => {
    m(resolveOnlinePolicies).mockResolvedValue(online(false))
    expect(await ask("STUDENT", at("13:55"))).toEqual({ kind: "not_online" })
    expect(materializeSlotForDay).not.toHaveBeenCalled()
  })

  it("hands an external school's class its standing meeting link", async () => {
    m(resolveOnlinePolicies).mockResolvedValue(online(true, "external"))
    m(db.conferenceLink.findFirst).mockResolvedValue({
      meetingUrl: "https://meet.example/abc",
    })
    expect(await ask("STUDENT", at("13:55"))).toEqual({
      kind: "external",
      url: "https://meet.example/abc",
    })
  })

  it("reports a cancelled class instead of making a new one", async () => {
    m(materializeSlotForDay).mockResolvedValue({
      created: 0,
      skipped: 1,
      truncated: 0,
      reasons: { cancelled: 1 },
    })
    rows.push({ id: "room-x", status: "cancelled" })
    expect(await ask("STUDENT", at("13:55"))).toEqual({ kind: "cancelled" })
  })

  it("says why when the sweep declines (an external school with no link)", async () => {
    m(resolveOnlinePolicies).mockResolvedValue(online(true, "external"))
    m(materializeSlotForDay).mockResolvedValue({
      created: 0,
      skipped: 1,
      truncated: 0,
      reasons: { no_link: 1 },
    })
    expect(await ask("STUDENT", at("13:55"))).toEqual({
      kind: "unavailable",
      reason: "no_link",
    })
  })
  it("says over, not unavailable, in the grace after the bell when no room exists", async () => {
    m(materializeSlotForDay).mockResolvedValue({
      created: 0,
      skipped: 1,
      truncated: 0,
      reasons: { period_over: 1 },
    })
    // 16:55 school time: the period ended at 16:50, the link is open to 17:00.
    expect(await ask("STUDENT", at("14:55"))).toEqual({ kind: "over" })
  })

  it("names a slot with no teacher instead of an unknown failure", async () => {
    m(db.timetable.findFirst).mockResolvedValue({ ...slotRow, teacherId: null })
    m(materializeSlotForDay).mockResolvedValue({
      created: 0,
      skipped: 0,
      truncated: 0,
      reasons: {},
    })
    expect(await ask("STUDENT", at("13:55"))).toEqual({
      kind: "unavailable",
      reason: "no_teacher",
    })
  })
})
