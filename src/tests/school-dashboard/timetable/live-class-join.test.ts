// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  attachLiveClasses,
  resolveTodayJoinTargets,
} from "@/components/school-dashboard/timetable/live-class-join"

// The policy engine has its own suite; stub it here so these tests stay about
// the resolver. Defaults to "this section is online", which is what every
// pre-existing case in this file assumed before tier 3 was gated.
const onlineBySection = new Map<string, boolean>()
vi.mock("@/components/school-dashboard/live/online-policy", () => ({
  resolveOnlinePolicies: vi.fn(
    async (_schoolId: string, sectionIds: string[]) =>
      new Map(
        sectionIds.map((id) => [
          id,
          { online: onlineBySection.get(id) ?? true } as never,
        ])
      )
  ),
}))

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    conference: { findMany: vi.fn() },
    conferenceLink: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const TERM = "term-1"
const DATE = new Date("2026-06-01T12:00:00Z")

beforeEach(() => {
  vi.clearAllMocks()
  onlineBySection.clear()
  // The day window is resolved in the SCHOOL's timezone, so every path now
  // reads School.timezone first.
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "Asia/Dubai",
  } as never)
  vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceLink.findMany).mockResolvedValue([] as never)
})

describe("attachLiveClasses — slot-first matching", () => {
  // A subject taught TWICE in one day (a double period, or maths on two
  // periods) yields two sessions under one `section:subject` key. Matching on
  // that key alone with "earliest today wins" resolved the afternoon card to
  // the MORNING session — and a Join there writes attendance against the wrong
  // slot's timetableId. Latent while sessions were hand-made one at a time;
  // a daily event once every slot is materialized.
  const twoSessions = [
    {
      id: "lcs-morning",
      provider: "external",
      meetingUrl: "https://meet.example.com/am",
      status: "scheduled",
      sectionId: "sec-1",
      subjectId: "sub-1",
      timetableId: "tt-period-2",
    },
    {
      id: "lcs-afternoon",
      provider: "external",
      meetingUrl: "https://meet.example.com/pm",
      status: "scheduled",
      sectionId: "sec-1",
      subjectId: "sub-1",
      timetableId: "tt-period-5",
    },
  ]

  it("resolves each period to ITS OWN session, not the earliest of the day", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue(twoSessions as never)
    const [am, pm] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-period-2" },
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-period-5" },
    ])
    expect(am.liveClass?.sessionId).toBe("lcs-morning")
    expect(pm.liveClass?.sessionId).toBe("lcs-afternoon")
  })

  it("falls back to section+subject for an entry with no slot anchor", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue(twoSessions as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-morning") // earliest wins
  })

  it("falls back to section+subject when the slot has no session of its own", async () => {
    // An ad-hoc session (assembly, tutorial) carries no timetableId, so a card
    // for an unrelated slot must still find it by section+subject.
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-adhoc",
        provider: "external",
        meetingUrl: "https://meet.example.com/adhoc",
        status: "live",
        sectionId: "sec-1",
        subjectId: "sub-1",
        timetableId: null,
      },
    ] as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-period-9" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-adhoc")
  })

  it("prefers a real session over the recurring default link", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      twoSessions[0],
    ] as never)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.example.com/recurring",
      },
    ] as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-period-2" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-morning")
    expect(out.liveClass?.meetingUrl).toBe("https://meet.example.com/am")
  })
})

describe("attachLiveClasses", () => {
  it("short-circuits with no DB calls when no entry has a section+subject", async () => {
    const entries = [{ periodId: "p1" }, { sectionId: null, subjectId: null }]
    const result = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(db.conference.findMany).not.toHaveBeenCalled()
    expect(db.conferenceLink.findMany).not.toHaveBeenCalled()
    expect(result.every((e) => e.liveClass === null)).toBe(true)
  })

  it("attaches a scheduled session (sessionId set) to the matching entry", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/abc",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const entries = [{ sectionId: "sec-1", subjectId: "sub-1" }]
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(out.liveClass).toEqual({
      sessionId: "lcs-1",
      provider: "external",
      meetingUrl: "https://meet.google.com/abc",
      status: "scheduled",
    })
  })

  it("falls back to the recurring default link (sessionId null) when no session today", async () => {
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/recurring",
      },
    ] as never)
    const entries = [{ sectionId: "sec-1", subjectId: "sub-1" }]
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(out.liveClass).toEqual({
      sessionId: null,
      provider: "external",
      meetingUrl: "https://meet.google.com/recurring",
      status: null,
    })
  })

  it("prefers the session over the default link when both exist", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/session",
        status: "live",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/recurring",
      },
    ] as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-1")
    expect(out.liveClass?.meetingUrl).toBe("https://meet.google.com/session")
  })

  it("keeps the earliest session when several match the same section+subject", async () => {
    // findMany returns ordered-by scheduledStart asc; the first wins.
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-early",
        provider: "external",
        meetingUrl: "https://meet.google.com/early",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
      {
        id: "lcs-late",
        provider: "external",
        meetingUrl: "https://meet.google.com/late",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-early")
  })

  it("returns null for entries that have no section+subject match", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/abc",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const entries = [
      { sectionId: "sec-1", subjectId: "sub-1" }, // matches
      { sectionId: "sec-9", subjectId: "sub-9" }, // no match
      { sectionId: null, subjectId: null }, // break/empty
    ]
    const result = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(result[0].liveClass?.sessionId).toBe("lcs-1")
    expect(result[1].liveClass).toBeNull()
    expect(result[2].liveClass).toBeNull()
  })

  it("scopes both queries by schoolId (tenant isolation)", async () => {
    await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(db.conference.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL }),
      })
    )
    expect(db.conferenceLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL, termId: TERM }),
      })
    )
  })
})

describe("attachLiveClasses — the section's open room", () => {
  // Loose delivery mode (conference `mode: "open"`): one standing room per
  // section for the whole teaching day. It is slot-less AND subject-less by
  // construction, so the (section, subject) key cannot see it — without the
  // dedicated lookup a school running this mode has no path from any timetable
  // card to its own room.
  const openRoom = {
    id: "open-1",
    provider: "external" as const,
    meetingUrl: "https://meet.example.com/grade-1-a",
    status: "scheduled",
    sectionId: "sec-1",
  }

  beforeEach(() => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      timezone: "Africa/Khartoum",
    } as never)
  })

  it("resolves for every period of the section's day", async () => {
    vi.mocked(db.conference.findMany)
      .mockResolvedValueOnce([] as never) // slot/subject sessions
      .mockResolvedValueOnce([openRoom] as never) // open rooms
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([] as never)

    const out = await attachLiveClasses("school-1", "term-1", new Date(), [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-1" },
      { sectionId: "sec-1", subjectId: "sub-2", timetableId: "tt-2" },
    ])

    // The room is open for the whole day, so every card can reach it.
    expect(out[0].liveClass?.sessionId).toBe("open-1")
    expect(out[1].liveClass?.sessionId).toBe("open-1")
  })

  it("is queried for slot-less, subject-less sessions inside today", async () => {
    vi.mocked(db.conference.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([] as never)

    await attachLiveClasses("school-1", "term-1", new Date(), [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-1" },
    ])

    const where = vi.mocked(db.conference.findMany).mock.calls[1]?.[0]
      ?.where as Record<string, unknown>
    expect(where.timetableId).toBeNull()
    expect(where.subjectId).toBeNull()
    expect(where.schoolId).toBe("school-1")
    expect(where.deletedAt).toBeNull()
  })

  it("ranks BELOW a per-slot session and below the subject's own link", async () => {
    const slotSession = {
      id: "lcs-slot",
      provider: "livekit" as const,
      meetingUrl: null,
      status: "scheduled",
      sectionId: "sec-1",
      subjectId: "sub-1",
      timetableId: "tt-1",
    }
    vi.mocked(db.conference.findMany)
      .mockResolvedValueOnce([slotSession] as never)
      .mockResolvedValueOnce([openRoom] as never)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-2",
        provider: "external",
        meetingUrl: "https://meet.example.com/maths",
      },
    ] as never)

    const out = await attachLiveClasses("school-1", "term-1", new Date(), [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-1" },
      { sectionId: "sec-1", subjectId: "sub-2", timetableId: "tt-2" },
      { sectionId: "sec-1", subjectId: "sub-3", timetableId: "tt-3" },
    ])

    expect(out[0].liveClass?.sessionId).toBe("lcs-slot") // slot wins
    expect(out[1].liveClass?.meetingUrl).toBe("https://meet.example.com/maths") // subject link wins
    expect(out[2].liveClass?.sessionId).toBe("open-1") // open room is the floor
  })
})

describe("attachLiveClasses — the standing link obeys the online policy", () => {
  // Tier 3 is the only tier with no materialized row behind it, so it is the
  // only one that can outlive the decision that created it. A school that
  // switches back to `physical` keeps its ConferenceLink rows; without the gate
  // every slot of that subject offers a live room forever.
  const link = [
    {
      sectionId: "sec-1",
      subjectId: "sub-1",
      provider: "external",
      meetingUrl: "https://meet.example.com/recurring",
    },
  ]
  const entry = [
    { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-1" },
  ]

  it("resolves the link when the section is online", async () => {
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue(link as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entry)
    expect(out.liveClass?.meetingUrl).toBe("https://meet.example.com/recurring")
  })

  it("suppresses the link when the section is NOT online", async () => {
    onlineBySection.set("sec-1", false)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue(link as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entry)
    expect(out.liveClass).toBeNull()
  })

  it("gates per section, not per school", async () => {
    // Hybrid: one section opted out, its neighbour did not.
    onlineBySection.set("sec-off", false)
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      ...link,
      {
        sectionId: "sec-off",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.example.com/other",
      },
    ] as never)
    const [on, off] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1", timetableId: "tt-1" },
      { sectionId: "sec-off", subjectId: "sub-1", timetableId: "tt-2" },
    ])
    expect(on.liveClass?.meetingUrl).toBe("https://meet.example.com/recurring")
    expect(off.liveClass).toBeNull()
  })

  it("still resolves a MATERIALIZED session on an offline section", async () => {
    // Online is additive and a session is a real row someone may be sitting in.
    // Only the speculative tier is suppressed.
    onlineBySection.set("sec-1", false)
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.example.com/live",
        status: "live",
        sectionId: "sec-1",
        subjectId: "sub-1",
        timetableId: "tt-1",
      },
    ] as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entry)
    expect(out.liveClass?.sessionId).toBe("lcs-1")
  })
})

describe("resolveTodayJoinTargets — day filtering", () => {
  // The map exists so the weekly grid can offer Join without a day check of its
  // own. That only holds if the helper filters to the SCHOOL's today before
  // calling attachLiveClasses: tiers 2 and 3 of the resolver are not day-aware,
  // so a whole week in would let a standing link stamp every weekday row.
  const WED = new Date("2026-06-03T09:00:00Z") // Wednesday = 3

  function slot(id: string, dayOfWeek: number) {
    return { id, dayOfWeek, sectionId: "sec-1", subjectId: "sub-1" }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(WED)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("passes ONLY the school-local today's slots to the resolver", async () => {
    // A standing link resolves for whatever it is handed — so what comes back
    // is exactly the set the helper chose to ask about.
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.example/room",
      },
    ] as never)

    const map = await resolveTodayJoinTargets(SCHOOL, TERM, [
      slot("mon", 1),
      slot("wed", 3),
      slot("thu", 4),
    ])

    expect(Object.keys(map)).toEqual(["wed"])
    expect(map.wed.meetingUrl).toBe("https://meet.example/room")
  })

  it("returns an empty map when the school's today has no slots", async () => {
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.example/room",
      },
    ] as never)

    const map = await resolveTodayJoinTargets(SCHOOL, TERM, [
      slot("mon", 1),
      slot("thu", 4),
    ])

    expect(map).toEqual({})
    // Nothing to ask about — the resolver is not called at all.
    expect(db.conferenceLink.findMany).not.toHaveBeenCalled()
  })

  it("resolves the day in the SCHOOL's timezone, not the server's", async () => {
    // 2026-06-03T21:30Z is still Wednesday in UTC but already Thursday in Dubai
    // (UTC+4). The school's calendar is the one that counts.
    vi.setSystemTime(new Date("2026-06-03T21:30:00Z"))
    vi.mocked(db.conferenceLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.example/room",
      },
    ] as never)

    const map = await resolveTodayJoinTargets(SCHOOL, TERM, [
      slot("wed", 3),
      slot("thu", 4),
    ])

    expect(Object.keys(map)).toEqual(["thu"])
  })

  it("short-circuits on an empty slot list without touching the db", async () => {
    const map = await resolveTodayJoinTargets(SCHOOL, TERM, [])
    expect(map).toEqual({})
    expect(db.school.findUnique).not.toHaveBeenCalled()
  })
})
