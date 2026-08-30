// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The "turn the whole school online" sweep. What matters here is WHICH slots
// it picks — it must agree exactly with what the timetable itself shows, or a
// school gets sessions on days its schedule doesn't have.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { materializeSchoolDay } from "@/components/school-dashboard/conference/actions/materialize-day"
import { materializeOpenRoom } from "@/components/school-dashboard/conference/actions/open-room"
import { materializeSlotSession } from "@/components/school-dashboard/conference/actions/slot-session"
import { resolveOnlinePolicies } from "@/components/school-dashboard/conference/online-policy"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn(), findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
    conferenceLink: { findMany: vi.fn() },
    scheduleException: { findFirst: vi.fn() },
    section: { findMany: vi.fn() },
    substitutionRecord: { findMany: vi.fn() },
    period: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("@/components/school-dashboard/conference/online-policy", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/school-dashboard/conference/online-policy")
  >("@/components/school-dashboard/conference/online-policy")
  return { ...actual, resolveOnlinePolicies: vi.fn() }
})
vi.mock(
  "@/components/school-dashboard/conference/actions/open-room",
  async () => {
    const actual = await vi.importActual<
      typeof import("@/components/school-dashboard/conference/actions/open-room")
    >("@/components/school-dashboard/conference/actions/open-room")
    return { ...actual, materializeOpenRoom: vi.fn() }
  }
)
vi.mock(
  "@/components/school-dashboard/conference/actions/slot-session",
  () => ({ materializeSlotSession: vi.fn() })
)

const SCHOOL = "school-1"
const ONLINE = {
  online: true,
  provider: "external",
  degraded: false,
  mode: "timetable",
  source: "school",
  note: null,
}

const slot = (id: string, sectionId = "sec-1") => ({
  id,
  teacherId: "t-1",
  sectionId,
  subjectId: "sub-1",
  subject: { name: "Maths" },
  section: { name: "Grade 1-A", conferenceRecordingOptOut: false },
  teacher: { userId: "u-1" },
  period: {
    startTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
    endTime: new Date(Date.UTC(1970, 0, 1, 8, 45)),
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "Asia/Dubai",
    preferredLanguage: "ar",
    conferenceRecordingDefault: true,
    conferenceOnlineDefault: true,
    conferenceDeliveryMode: "hybrid" as const,
    conferenceProviderDefault: "external",
    conferenceOnlineFrom: null,
    conferenceOnlineUntil: null,
    conferenceOnlineNote: null,
    conferenceOnlineMode: "timetable",
    conferenceFallbackUrl: null,
  } as never)
  // No holiday by default — the sweep now short-circuits on a declared one.
  vi.mocked(db.scheduleException.findFirst).mockResolvedValue(null as never)
  vi.mocked(db.section.findMany).mockResolvedValue([] as never)
  vi.mocked(db.substitutionRecord.findMany).mockResolvedValue([] as never)
  vi.mocked(db.period.findMany).mockResolvedValue([] as never)
  vi.mocked(db.term.findFirst).mockResolvedValue({
    yearId: "year-1",
  } as never)
  vi.mocked(resolveActiveTerm).mockResolvedValue({
    term: { id: "term-1" },
    source: "explicit",
  } as never)
  vi.mocked(db.timetable.findMany).mockResolvedValue([slot("tt-1")] as never)
  vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
    {
      sectionId: "sec-1",
      subjectId: "sub-1",
      meetingUrl: "https://meet.example.com/x",
      meetingProvider: "Google Meet",
    },
  ] as never)
  vi.mocked(resolveOnlinePolicies).mockResolvedValue(
    new Map([["sec-1", ONLINE]]) as never
  )
  vi.mocked(materializeSlotSession).mockResolvedValue({
    created: true,
    sessionId: "lcs-1",
  } as never)
})

describe("materializeSchoolDay", () => {
  it("mirrors getTodaySchedule's slot filter exactly", async () => {
    // 21:00Z on Friday the 14th is already SATURDAY in Dubai — the weekday
    // must come from the school's zone, and the rest of the filter must match
    // what the timetable itself renders, or the sweep invents classes.
    await materializeSchoolDay(SCHOOL, new Date("2026-08-14T21:00:00Z"))

    const where = vi.mocked(db.timetable.findMany).mock.calls[0]?.[0]?.where
    expect(where).toMatchObject({
      schoolId: SCHOOL,
      termId: "term-1",
      dayOfWeek: 6, // Saturday in Dubai, not Friday in UTC
      weekOffset: 0,
      sectionId: { not: null },
      teacherId: { not: null },
      period: { isBreak: false },
    })
    // rotationWeek is deliberately absent: no read path in the app resolves an
    // A/B rotation, so filtering on it would put sessions on days the
    // timetable does not show.
    expect(where).not.toHaveProperty("rotationWeek")
  })

  it("passes the section's recurring link through to the writer", async () => {
    await materializeSchoolDay(SCHOOL)
    const ctx = vi.mocked(materializeSlotSession).mock.calls[0][1]
    expect(ctx.meetingUrl).toBe("https://meet.example.com/x")
    expect(ctx.policy).toEqual(ONLINE)
  })

  it("merges the school recording default with the section opt-out", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        ...slot("tt-1"),
        section: { name: "Grade 1-A", conferenceRecordingOptOut: true },
      },
    ] as never)
    await materializeSchoolDay(SCHOOL)
    expect(
      vi.mocked(materializeSlotSession).mock.calls[0][1].recordingEnabled
    ).toBe(false)
  })

  it("skips sections that are not online and counts why", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      slot("tt-1", "sec-1"),
      slot("tt-2", "sec-off"),
    ] as never)
    vi.mocked(resolveOnlinePolicies).mockResolvedValue(
      new Map([
        ["sec-1", ONLINE],
        ["sec-off", { online: false, provider: "external", degraded: false }],
      ]) as never
    )

    const out = await materializeSchoolDay(SCHOOL)
    expect(out.created).toBe(1)
    expect(out.reasons.not_online).toBe(1)
    expect(materializeSlotSession).toHaveBeenCalledTimes(1)
  })

  it("does not let one bad slot abort the rest of the school's day", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      slot("tt-1"),
      slot("tt-2"),
    ] as never)
    vi.mocked(materializeSlotSession)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ created: true, sessionId: "lcs-2" } as never)

    const out = await materializeSchoolDay(SCHOOL)
    expect(out.created).toBe(1)
    expect(out.reasons.error).toBe(1)
  })

  it("does nothing when the school has no active term", async () => {
    vi.mocked(resolveActiveTerm).mockResolvedValue({
      term: null,
      source: "none",
    } as never)
    const out = await materializeSchoolDay(SCHOOL)
    expect(out.created).toBe(0)
    expect(db.timetable.findMany).not.toHaveBeenCalled()
  })

  it("creates nothing on a declared holiday", async () => {
    // Writes are consequential in a way reads are not: a session on Eid mails
    // every student a reminder for a class that will never happen.
    vi.mocked(db.scheduleException.findFirst).mockResolvedValue({
      id: "exc-1",
    } as never)

    const out = await materializeSchoolDay(SCHOOL)
    expect(out.created).toBe(0)
    expect(out.reasons.holiday).toBe(1)
    expect(db.timetable.findMany).not.toHaveBeenCalled()
    expect(materializeSlotSession).not.toHaveBeenCalled()
  })

  it("falls back to the school's standing link when a pair has none", async () => {
    // Without this, a school that flips online overnight materializes NOTHING:
    // every pair skips with `no_link` and the only trace is a cron log.
    vi.mocked(db.school.findUnique).mockResolvedValue({
      timezone: "Asia/Dubai",
      preferredLanguage: "ar",
      conferenceRecordingDefault: true,
      conferenceOnlineDefault: true,
      conferenceDeliveryMode: "hybrid" as const,
      conferenceProviderDefault: "external",
      conferenceOnlineFrom: null,
      conferenceOnlineUntil: null,
      conferenceOnlineNote: null,
      conferenceOnlineMode: "timetable",
      conferenceFallbackUrl: "https://meet.example.com/school",
    } as never)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([] as never)

    await materializeSchoolDay(SCHOOL)
    expect(vi.mocked(materializeSlotSession).mock.calls[0][1].meetingUrl).toBe(
      "https://meet.example.com/school"
    )
  })

  it("prefers the section's own link over the standing fallback", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      timezone: "Asia/Dubai",
      preferredLanguage: "ar",
      conferenceRecordingDefault: true,
      conferenceOnlineDefault: true,
      conferenceDeliveryMode: "hybrid" as const,
      conferenceProviderDefault: "external",
      conferenceOnlineFrom: null,
      conferenceOnlineUntil: null,
      conferenceOnlineNote: null,
      conferenceOnlineMode: "timetable",
      conferenceFallbackUrl: "https://meet.example.com/school",
    } as never)

    await materializeSchoolDay(SCHOOL)
    expect(vi.mocked(materializeSlotSession).mock.calls[0][1].meetingUrl).toBe(
      "https://meet.example.com/x"
    )
  })
})

describe("materializeSchoolDay — delivery modes", () => {
  const openSchool = (mode: "timetable" | "open" | "both") =>
    vi.mocked(db.school.findUnique).mockResolvedValue({
      timezone: "Asia/Dubai",
      preferredLanguage: "ar",
      conferenceRecordingDefault: true,
      conferenceOnlineDefault: true,
      conferenceDeliveryMode: "hybrid" as const,
      conferenceProviderDefault: "external",
      conferenceOnlineFrom: null,
      conferenceOnlineUntil: null,
      conferenceOnlineNote: null,
      conferenceOnlineMode: mode,
      conferenceFallbackUrl: "https://meet.example.com/school",
    } as never)

  const section = {
    id: "sec-1",
    name: "Grade 1-A",
    conferenceOnline: null,
    conferenceRecordingOptOut: false,
    homeroomTeacherId: "t-1",
    homeroomTeacher: { userId: "u-1" },
  }

  it("`open` hosts the room with the section's busiest teacher when no homeroom is set", async () => {
    // The real onboarding path never writes homeroomTeacherId, so without a
    // fallback every real school's open mode materialized zero rooms.
    openSchool("open")
    vi.mocked(db.section.findMany).mockResolvedValue([
      {
        ...section,
        homeroomTeacherId: null,
        homeroomTeacher: null,
        timetables: [
          { teacherId: "t-a", teacher: { userId: "u-a" } },
          { teacherId: "t-b", teacher: { userId: "u-b" } },
          { teacherId: "t-b", teacher: { userId: "u-b" } },
        ],
      },
    ] as never)
    vi.mocked(materializeOpenRoom).mockResolvedValue({
      created: true,
      sessionId: "open-1",
    })

    await materializeSchoolDay(SCHOOL)

    const [passedSection] = vi.mocked(materializeOpenRoom).mock.calls[0]
    expect(passedSection.homeroomTeacherId).toBe("t-b")
    expect(passedSection.homeroomTeacherUserId).toBe("u-b")
  })

  it("`timetable` builds slot sessions and no open room", async () => {
    openSchool("timetable")
    vi.mocked(db.section.findMany).mockResolvedValue([section] as never)

    await materializeSchoolDay(SCHOOL)
    expect(materializeSlotSession).toHaveBeenCalled()
    expect(materializeOpenRoom).not.toHaveBeenCalled()
  })

  it("`open` builds the loose room and no slot sessions", async () => {
    // Free timing: the section has a standing room for the school day rather
    // than a session per bell.
    openSchool("open")
    vi.mocked(db.section.findMany).mockResolvedValue([section] as never)
    vi.mocked(materializeOpenRoom).mockResolvedValue({
      created: true,
      sessionId: "open-1",
    } as never)

    const out = await materializeSchoolDay(SCHOOL)
    expect(materializeSlotSession).not.toHaveBeenCalled()
    expect(materializeOpenRoom).toHaveBeenCalledTimes(1)
    expect(out.created).toBe(1)
  })

  it("`both` builds each", async () => {
    openSchool("both")
    vi.mocked(db.section.findMany).mockResolvedValue([section] as never)
    vi.mocked(materializeOpenRoom).mockResolvedValue({
      created: true,
      sessionId: "open-1",
    } as never)

    const out = await materializeSchoolDay(SCHOOL)
    expect(materializeSlotSession).toHaveBeenCalledTimes(1)
    expect(materializeOpenRoom).toHaveBeenCalledTimes(1)
    expect(out.created).toBe(2)
  })

  it("honours a section's opt-out for its open room too", async () => {
    openSchool("open")
    vi.mocked(db.section.findMany).mockResolvedValue([
      { ...section, conferenceOnline: false },
    ] as never)

    const out = await materializeSchoolDay(SCHOOL)
    expect(materializeOpenRoom).not.toHaveBeenCalled()
    expect(out.reasons.not_online).toBe(1)
  })
})

describe("materializeSchoolDay — substitutes", () => {
  it("a CONFIRMED substitute becomes the HOST of the slot's online arm", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([slot("tt-1")] as never)
    vi.mocked(db.substitutionRecord.findMany).mockResolvedValue([
      {
        originalSlotId: "tt-1",
        substituteTeacherId: "t-sub",
        substituteTeacher: { userId: "u-sub" },
      },
    ] as never)
    vi.mocked(materializeSlotSession).mockResolvedValue({
      created: true,
      sessionId: "c-1",
    })

    const result = await materializeSchoolDay(
      SCHOOL,
      new Date("2026-03-03T06:00:00Z")
    )

    const [passedSlot] = vi.mocked(materializeSlotSession).mock.calls[0]
    expect(passedSlot.teacherId).toBe("t-sub")
    expect(passedSlot.teacherUserId).toBe("u-sub")
    // The lookup is CONFIRMED-only and day-scoped — a pending request is still
    // the absent teacher's class on paper.
    const where = vi.mocked(db.substitutionRecord.findMany).mock.calls[0][0]
      ?.where as Record<string, unknown>
    expect(where.status).toBe("CONFIRMED")
    expect(where.slotDate).toBeDefined()
    expect(result.reasons.substituted).toBe(1)
  })

  it("leaves the original teacher as HOST when nobody is covering", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([slot("tt-1")] as never)
    vi.mocked(materializeSlotSession).mockResolvedValue({
      created: true,
      sessionId: "c-1",
    })
    await materializeSchoolDay(SCHOOL, new Date("2026-03-03T06:00:00Z"))
    const [passedSlot] = vi.mocked(materializeSlotSession).mock.calls[0]
    expect(passedSlot.teacherId).toBe("t-1")
  })
})
