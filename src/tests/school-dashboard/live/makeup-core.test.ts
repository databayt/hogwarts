// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Make-up class core (makeup-core.ts): eligibility, ownership, the double-tap
// lock, conflicts, the copied fields, cancel / replan, and the school scoping of
// every query. The db is an in-memory fixture with just enough `where`
// matching to prove that the "missed" predicate itself refuses the wrong rows.

import { after } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  afterLiveClassCreated,
  createLiveClassCore,
} from "@/components/school-dashboard/live/actions/create-core"
import { notifyClassCancelled } from "@/components/school-dashboard/live/actions/notifications"
import { combinedGroupForSlot } from "@/components/school-dashboard/live/combined"
import {
  cancelMakeup,
  createMakeup,
  findScheduleConflicts,
  listMissedClasses,
  missedClassWhere,
  replanMakeup,
  suggestMakeupSlots,
  type MakeupActor,
} from "@/components/school-dashboard/live/makeup-core"
import { findClosuresInRange } from "@/components/school-dashboard/live/school-calendar"

const hoisted = vi.hoisted(() => {
  const fn = () => vi.fn()
  const mockDb = {
    conference: {
      findMany: fn(),
      findFirst: fn(),
      count: fn(),
      updateMany: fn(),
    },
    school: { findUnique: fn() },
    timetable: { findMany: fn() },
    period: { findMany: fn() },
    schoolWeekConfig: { findMany: fn() },
    $queryRaw: fn(),
    $transaction: fn(),
  }
  return { mockDb }
})

vi.mock("@/lib/db", () => ({ db: hoisted.mockDb }))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/live/actions/create-core", () => ({
  createLiveClassCore: vi.fn(),
  afterLiveClassCreated: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  liveListRevalidatePaths: () => ["/live-list"],
  liveSessionRevalidatePaths: () => ["/live-session"],
}))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassCancelled: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/combined", () => ({
  combinedGroupForSlot: vi.fn(async () => null),
  groupSectionIds: (g: { members: { sectionId: string }[] }) =>
    g.members.map((m) => m.sectionId),
}))
vi.mock("@/components/school-dashboard/live/school-calendar", () => ({
  findClosuresInRange: vi.fn(async () => []),
}))

const m = hoisted.mockDb
const mock = <T>(f: T) => f as unknown as ReturnType<typeof vi.fn>

const SCHOOL = "school-1"
const NOW = new Date("2026-11-22T04:00:00Z") // Sunday 06:00 Khartoum
const START = "2026-11-23T06:00:00.000Z"
const END = "2026-11-23T06:45:00.000Z"

const teacherActor: MakeupActor = {
  userId: "u-teacher",
  role: "TEACHER",
  schoolId: SCHOOL,
}
const otherTeacher: MakeupActor = {
  userId: "u-other",
  role: "TEACHER",
  schoolId: SCHOOL,
}
const admin: MakeupActor = {
  userId: "u-admin",
  role: "ADMIN",
  schoolId: SCHOOL,
}

type Row = Record<string, unknown>
const missedRow = (over: Row = {}): Row => ({
  id: "missed-1",
  schoolId: SCHOOL,
  status: "cancelled",
  actualStart: null,
  isPractice: false,
  deletedAt: null,
  sectionId: "sec-7",
  subjectId: "sub-math",
  makeupForId: null,
  timetableId: "tt-1",
  teacherId: "t-1",
  title: "Algebra",
  description: "Chapter 3",
  lang: "ar",
  visibility: "section",
  catalogLessonId: "lesson-1",
  provider: "livekit",
  meetingUrl: null,
  meetingProvider: null,
  scheduledStart: new Date("2026-11-20T08:00:00Z"),
  scheduledEnd: new Date("2026-11-20T08:45:00Z"),
  teacher: { userId: "u-teacher" },
  section: { gradeId: "grade-7" },
  ...over,
})

/** Just enough of Prisma's `where` for the missed predicate. */
function matches(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (v === null) return row[k] === null
    if (typeof v === "object" && v !== null && "not" in v) {
      return row[k] !== (v as { not: unknown }).not
    }
    if (typeof v === "object" && v !== null && "in" in v) {
      return (v as { in: unknown[] }).in.includes(row[k])
    }
    return row[k] === v
  })
}

let rows: Row[]
const created = { id: "makeup-1", roomName: "r" }

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(NOW)
  rows = [missedRow()]
  m.$transaction.mockImplementation(async (fn: (tx: typeof m) => unknown) =>
    fn(m)
  )
  m.$queryRaw.mockResolvedValue([{ id: "missed-1" }])
  m.conference.findFirst.mockImplementation(
    async ({ where }: { where: Row }) =>
      rows.find((r) => matches(r, where)) ?? null
  )
  m.conference.count.mockResolvedValue(0)
  m.conference.findMany.mockResolvedValue([])
  m.conference.updateMany.mockResolvedValue({ count: 1 })
  m.school.findUnique.mockResolvedValue({
    timezone: "Africa/Khartoum",
    conferenceMaxDuration: 120,
    conferenceRecordingDefault: true,
  })
  m.timetable.findMany.mockResolvedValue([])
  m.period.findMany.mockResolvedValue([])
  m.schoolWeekConfig.findMany.mockResolvedValue([])
  mock(resolveActiveTerm).mockResolvedValue({
    term: { id: "term-1", yearId: "year-1" },
    source: "explicit",
  })
  mock(createLiveClassCore).mockResolvedValue({ success: true, data: created })
  mock(combinedGroupForSlot).mockResolvedValue(null)
  mock(findClosuresInRange).mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

describe("missedClassWhere", () => {
  it("is cancelled + never started + a real class + not itself a make-up, in one school", () => {
    expect(missedClassWhere(SCHOOL)).toEqual({
      schoolId: SCHOOL,
      status: "cancelled",
      actualStart: null,
      isPractice: false,
      deletedAt: null,
      sectionId: { not: null },
      subjectId: { not: null },
      makeupForId: null,
    })
  })
})

describe("createMakeup — eligibility", () => {
  const cases: [string, Row][] = [
    ["an ended class", { status: "ended" }],
    ["a live class", { status: "live" }],
    ["a scheduled class", { status: "scheduled" }],
    ["a cancelled class that did start", { actualStart: new Date() }],
    ["the practice room", { isPractice: true }],
    ["an all-day open room (no subject)", { subjectId: null }],
    ["a section-less class", { sectionId: null }],
    ["a deleted class", { deletedAt: new Date() }],
    ["a make-up itself", { makeupForId: "root" }],
    ["another school's class", { schoolId: "school-2" }],
  ]
  it.each(cases)("refuses %s", async (_name, over) => {
    rows = [missedRow(over)]
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ success: false, error: "MAKEUP_NOT_ELIGIBLE" })
    expect(createLiveClassCore).not.toHaveBeenCalled()
  })

  it("refuses an unknown id", async () => {
    const res = await createMakeup(teacherActor, {
      missedId: "nope",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ error: "MAKEUP_NOT_ELIGIBLE" })
  })

  it("refuses a start in the past, or an end before the start", async () => {
    for (const [s, e] of [
      ["2026-11-22T03:00:00.000Z", "2026-11-22T03:45:00.000Z"],
      [START, "2026-11-23T05:00:00.000Z"],
    ]) {
      const res = await createMakeup(teacherActor, {
        missedId: "missed-1",
        startIso: s,
        endIso: e,
      })
      expect(res).toMatchObject({ success: false, error: "VALIDATION_ERROR" })
    }
    expect(createLiveClassCore).not.toHaveBeenCalled()
  })
})

describe("createMakeup — ownership", () => {
  it("lets the class's teacher make it up", async () => {
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res).toEqual({ success: true, data: created })
  })

  it("refuses another teacher", async () => {
    const res = await createMakeup(otherTeacher, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ success: false, error: "UNAUTHORIZED" })
    expect(createLiveClassCore).not.toHaveBeenCalled()
  })

  it("lets an admin make up any teacher's class", async () => {
    const res = await createMakeup(admin, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res.success).toBe(true)
  })

  it("refuses a student", async () => {
    const res = await createMakeup(
      { userId: "u-s", role: "STUDENT", schoolId: SCHOOL },
      { missedId: "missed-1", startIso: START, endIso: END }
    )
    expect(res).toMatchObject({ error: "UNAUTHORIZED" })
  })
})

describe("createMakeup — double submit", () => {
  it("locks the missed row before it checks anything", async () => {
    await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(m.$queryRaw).toHaveBeenCalledTimes(1)
    // The raw tagged template: [strings, id, schoolId]; both scoped values bound.
    const call = m.$queryRaw.mock.calls[0]
    expect(call.slice(1)).toEqual(["missed-1", SCHOOL])
    expect(call[0].join("?")).toMatch(/FOR UPDATE/)
    expect(m.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      m.conference.findFirst.mock.invocationCallOrder[0]
    )
  })

  it("answers the second tap MAKEUP_ALREADY_PLANNED", async () => {
    m.conference.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1)
    const first = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    const second = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(first.success).toBe(true)
    expect(second).toMatchObject({
      success: false,
      error: "MAKEUP_ALREADY_PLANNED",
    })
    expect(createLiveClassCore).toHaveBeenCalledTimes(1)
    // "Already planned" means a child that is scheduled, live or ended — a
    // cancelled one does not count, so the class is missed again.
    expect(m.conference.count.mock.calls[0][0].where).toMatchObject({
      schoolId: SCHOOL,
      makeupForId: "missed-1",
      status: { in: ["scheduled", "live", "ended"] },
      deletedAt: null,
    })
  })
})

describe("createMakeup — conflicts", () => {
  it("refuses a time that overlaps another session of the teacher or section", async () => {
    m.conference.findMany.mockResolvedValue([
      {
        id: "other",
        teacherId: "t-1",
        sectionId: "sec-9",
        scheduledStart: new Date("2026-11-23T05:30:00Z"),
        scheduledEnd: new Date("2026-11-23T06:15:00Z"),
      },
    ])
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ success: false, error: "MAKEUP_CONFLICT" })
    expect(createLiveClassCore).not.toHaveBeenCalled()
    expect(afterLiveClassCreated).not.toHaveBeenCalled()
  })

  it("refuses a time that falls on the teacher's weekly timetable slot", async () => {
    // Monday 2026-11-23, 08:00–08:45 Khartoum = 06:00–06:45Z.
    m.timetable.findMany.mockResolvedValue([
      {
        id: "tt-x",
        teacherId: "t-1",
        sectionId: "sec-9",
        period: {
          startTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 8, 45)),
        },
      },
    ])
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ error: "MAKEUP_CONFLICT" })
  })

  it("lets a time that only touches a slot through", async () => {
    m.timetable.findMany.mockResolvedValue([
      {
        id: "tt-x",
        teacherId: "t-1",
        sectionId: "sec-9",
        period: {
          startTime: new Date(Date.UTC(1970, 0, 1, 8, 45)),
          endTime: new Date(Date.UTC(1970, 0, 1, 9, 30)),
        },
      },
    ])
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res.success).toBe(true)
  })

  it("checks every section of a combined class", async () => {
    mock(combinedGroupForSlot).mockResolvedValue({
      primaryId: "tt-1",
      members: [
        { slotId: "tt-1", sectionId: "sec-7" },
        { slotId: "tt-2", sectionId: "sec-8" },
      ],
    })
    await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    const where = m.conference.findMany.mock.calls[0][0].where
    expect(JSON.stringify(where)).toContain(
      '"sectionId":{"in":["sec-7","sec-8"]}'
    )
  })
})

describe("createMakeup — the copy", () => {
  it("creates through create-core with the original's fields, no slot, the root as parent", async () => {
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res.success).toBe(true)
    const [ctx, input, opts] = mock(createLiveClassCore).mock.calls[0]
    expect(ctx).toEqual({ schoolId: SCHOOL })
    expect(input).toMatchObject({
      title: "حصة تعويضية: Algebra",
      description: "Chapter 3",
      lang: "ar",
      teacherId: "t-1",
      sectionId: "sec-7",
      subjectId: "sub-math",
      visibility: "section",
      catalogLessonId: "lesson-1",
      scheduledStart: START,
      scheduledEnd: END,
    })
    expect(input.timetableId).toBeUndefined()
    expect(opts.makeupForId).toBe("missed-1")
    expect(opts.tx).toBe(m)
    expect(opts.provider).toBeUndefined()
  })

  it("prefixes an English class in English", async () => {
    rows = [missedRow({ lang: "en", title: "Algebra" })]
    await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(mock(createLiveClassCore).mock.calls[0][1].title).toBe(
      "Make-up class: Algebra"
    )
  })

  it("keeps the title within 255 characters", async () => {
    rows = [missedRow({ title: "x".repeat(255) })]
    await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(mock(createLiveClassCore).mock.calls[0][1].title).toHaveLength(255)
  })

  it("copies an external class's link", async () => {
    rows = [
      missedRow({
        provider: "external",
        meetingUrl: "https://meet.example/abc",
        meetingProvider: "zoom",
      }),
    ]
    await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(mock(createLiveClassCore).mock.calls[0][2]).toMatchObject({
      provider: "external",
      meetingUrl: "https://meet.example/abc",
      meetingProvider: "zoom",
    })
  })

  it("announces the class only AFTER the transaction has committed", async () => {
    let committed = false
    m.$transaction.mockImplementation(async (fn: (tx: typeof m) => unknown) => {
      const out = await fn(m)
      committed = true
      return out
    })
    mock(afterLiveClassCreated).mockImplementation(() => {
      expect(committed).toBe(true)
    })
    await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(afterLiveClassCreated).toHaveBeenCalledWith(SCHOOL, created)
  })

  it("answers create-core's refusal and announces nothing", async () => {
    mock(createLiveClassCore).mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_MAX_DURATION_EXCEEDED",
    })
    const res = await createMakeup(teacherActor, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ error: "LIVE_CLASS_MAX_DURATION_EXCEEDED" })
    expect(afterLiveClassCreated).not.toHaveBeenCalled()
  })
})

describe("listMissedClasses", () => {
  const listed = {
    id: "missed-1",
    title: "Algebra",
    scheduledStart: new Date("2026-11-20T08:00:00Z"),
    scheduledEnd: new Date("2026-11-20T08:45:00Z"),
    section: null,
    subject: null,
    teacher: {
      id: "t-1",
      firstName: "A",
      middleName: null,
      lastName: "B",
      profilePhotoUrl: null,
    },
    makeups: [],
  }

  it("narrows a teacher to their own classes, in the last 14 days", async () => {
    m.conference.findMany.mockResolvedValue([listed])
    const out = await listMissedClasses(teacherActor)
    expect(out).toHaveLength(1)
    const args = m.conference.findMany.mock.calls[0][0]
    expect(args.where).toMatchObject({
      ...missedClassWhere(SCHOOL),
      teacher: { userId: "u-teacher" },
      scheduledStart: { gte: new Date("2026-11-08T04:00:00Z"), lt: NOW },
    })
    expect(args.take).toBe(100)
  })

  it("shows an admin the whole school", async () => {
    await listMissedClasses(admin, { days: 7 })
    const where = m.conference.findMany.mock.calls[0][0].where
    expect(where.teacher).toBeUndefined()
    expect(where.schoolId).toBe(SCHOOL)
  })

  it("leaves out a class that already has a make-up — a cancelled make-up does not count", async () => {
    await listMissedClasses(teacherActor)
    const where = m.conference.findMany.mock.calls[0][0].where
    expect(where.makeups).toEqual({
      none: { status: { in: ["scheduled", "live", "ended"] }, deletedAt: null },
    })
  })

  it("returns the latest make-up when asked", async () => {
    m.conference.findMany.mockResolvedValue([
      {
        ...listed,
        makeups: [
          {
            id: "makeup-1",
            scheduledStart: new Date("2026-11-23T06:00:00Z"),
            status: "scheduled",
          },
        ],
      },
    ])
    const out = await listMissedClasses(teacherActor, { includeMadeUp: true })
    expect(out[0].madeUpBy).toMatchObject({
      id: "makeup-1",
      status: "scheduled",
    })
    expect(m.conference.findMany.mock.calls[0][0].where.makeups).toBeUndefined()
  })

  it("lists nothing for a role that cannot make up classes", async () => {
    const out = await listMissedClasses({
      userId: "u",
      role: "STUDENT",
      schoolId: SCHOOL,
    })
    expect(out).toEqual([])
    expect(m.conference.findMany).not.toHaveBeenCalled()
  })
})

describe("cancelMakeup", () => {
  const makeup = (over: Row = {}): Row => ({
    id: "makeup-1",
    schoolId: SCHOOL,
    status: "scheduled",
    deletedAt: null,
    makeupForId: "missed-1",
    lang: "ar",
    teacher: { userId: "u-teacher" },
    ...over,
  })

  it("lets the owning teacher cancel (no admin permission needed) and tells the class", async () => {
    rows = [makeup()]
    const res = await cancelMakeup(teacherActor, "makeup-1")
    expect(res).toEqual({ success: true, data: { id: "makeup-1" } })
    expect(m.conference.updateMany).toHaveBeenCalledWith({
      where: { id: "makeup-1", schoolId: SCHOOL, status: "scheduled" },
      data: { status: "cancelled" },
    })
    const cb = mock(after).mock.calls[0][0] as () => void
    cb()
    expect(notifyClassCancelled).toHaveBeenCalledWith(
      SCHOOL,
      "makeup-1",
      "أُلغيت الحصة التعويضية"
    )
  })

  it("lets an admin cancel, refuses another teacher", async () => {
    rows = [makeup()]
    expect((await cancelMakeup(admin, "makeup-1")).success).toBe(true)
    expect(await cancelMakeup(otherTeacher, "makeup-1")).toMatchObject({
      error: "UNAUTHORIZED",
    })
  })

  it("only cancels a scheduled make-up", async () => {
    rows = [makeup({ status: "ended" })]
    expect(await cancelMakeup(teacherActor, "makeup-1")).toMatchObject({
      error: "LIVE_CLASS_INVALID_STATE",
    })
    expect(m.conference.updateMany).not.toHaveBeenCalled()
  })

  it("does not take an ordinary class for a make-up", async () => {
    rows = [makeup({ makeupForId: null })]
    expect(await cancelMakeup(admin, "makeup-1")).toMatchObject({
      error: "LIVE_CLASS_NOT_FOUND",
    })
  })

  it("answers a lost race (the guarded flip changed nothing) as an invalid state", async () => {
    rows = [makeup()]
    m.conference.updateMany.mockResolvedValue({ count: 0 })
    expect(await cancelMakeup(teacherActor, "makeup-1")).toMatchObject({
      error: "LIVE_CLASS_INVALID_STATE",
    })
  })
})

describe("replanMakeup", () => {
  const old: Row = {
    id: "makeup-0",
    schoolId: SCHOOL,
    status: "scheduled",
    deletedAt: null,
    makeupForId: "missed-1",
    lang: "ar",
    teacher: { userId: "u-teacher" },
  }

  beforeEach(() => {
    rows = [missedRow(), old]
  })

  it("cancels the old one and creates the new one under the SAME root, in one transaction", async () => {
    const res = await replanMakeup(teacherActor, {
      makeupId: "makeup-0",
      startIso: START,
      endIso: END,
    })
    expect(res).toEqual({ success: true, data: created })
    expect(m.$transaction).toHaveBeenCalledTimes(1)
    expect(m.conference.updateMany).toHaveBeenCalledWith({
      where: { id: "makeup-0", schoolId: SCHOOL, status: "scheduled" },
      data: { status: "cancelled" },
    })
    expect(mock(createLiveClassCore).mock.calls[0][2].makeupForId).toBe(
      "missed-1"
    )
    expect(m.$queryRaw.mock.calls[0].slice(1)).toEqual(["missed-1", SCHOOL])
    expect(afterLiveClassCreated).toHaveBeenCalledWith(SCHOOL, created)
  })

  it("answers a refused new time and leaves the old make-up standing (the transaction aborts)", async () => {
    m.conference.findMany.mockResolvedValue([
      {
        id: "other",
        teacherId: "t-1",
        sectionId: null,
        scheduledStart: new Date("2026-11-23T06:00:00Z"),
        scheduledEnd: new Date("2026-11-23T07:00:00Z"),
      },
    ])
    const res = await replanMakeup(teacherActor, {
      makeupId: "makeup-0",
      startIso: START,
      endIso: END,
    })
    expect(res).toMatchObject({ success: false, error: "MAKEUP_CONFLICT" })
    expect(afterLiveClassCreated).not.toHaveBeenCalled()
    expect(mock(after)).not.toHaveBeenCalled()
  })

  it("refuses another teacher", async () => {
    expect(
      await replanMakeup(otherTeacher, {
        makeupId: "makeup-0",
        startIso: START,
        endIso: END,
      })
    ).toMatchObject({ error: "UNAUTHORIZED" })
  })
})

describe("suggestMakeupSlots", () => {
  const P = (id: string, h: number, m2: number, eh: number, em: number) => ({
    id,
    name: id,
    startTime: new Date(Date.UTC(1970, 0, 1, h, m2)),
    endTime: new Date(Date.UTC(1970, 0, 1, eh, em)),
    isBreak: false,
    untimed: false,
    gradeId: null,
  })

  beforeEach(() => {
    m.period.findMany.mockResolvedValue([
      P("p1", 8, 0, 8, 45),
      P("p2", 9, 0, 9, 45),
    ])
  })

  it("returns the free periods as ISO strings, in the school's zone", async () => {
    const res = await suggestMakeupSlots(teacherActor, "missed-1", {
      horizonDays: 2,
    })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.timeZone).toBe("Africa/Khartoum")
    expect(res.data.durationMin).toBe(45)
    expect(res.data.days.map((d) => d.day)).toEqual([
      "2026-11-22",
      "2026-11-23",
    ])
    expect(res.data.days[0].slots[0]).toEqual({
      startIso: "2026-11-22T06:00:00.000Z",
      endIso: "2026-11-22T06:45:00.000Z",
      kind: "period",
      periodId: "p1",
      periodName: "p1",
    })
  })

  it("prefers the term's working days over the school default", async () => {
    m.schoolWeekConfig.findMany.mockResolvedValue([
      { termId: null, workingDays: [0, 1, 2, 3, 4] },
      { termId: "term-1", workingDays: [1] },
    ])
    const res = await suggestMakeupSlots(teacherActor, "missed-1", {
      horizonDays: 3,
    })
    if (!res.success) throw new Error("expected success")
    expect(res.data.days.map((d) => d.day)).toEqual(["2026-11-23"])
  })

  it("loads a combined class's sibling sections as busy", async () => {
    mock(combinedGroupForSlot).mockResolvedValue({
      primaryId: "tt-1",
      members: [
        { slotId: "tt-1", sectionId: "sec-7" },
        { slotId: "tt-2", sectionId: "sec-8" },
      ],
    })
    await suggestMakeupSlots(teacherActor, "missed-1")
    expect(
      JSON.stringify(m.timetable.findMany.mock.calls[0][0].where)
    ).toContain('"sectionId":{"in":["sec-7","sec-8"]}')
    expect(
      JSON.stringify(m.conference.findMany.mock.calls[0][0].where)
    ).toContain('"sectionId":{"in":["sec-7","sec-8"]}')
  })

  it("is empty without an active term", async () => {
    mock(resolveActiveTerm).mockResolvedValue({ term: null, source: "none" })
    const res = await suggestMakeupSlots(teacherActor, "missed-1")
    expect(res).toMatchObject({ success: true, data: { days: [] } })
  })

  it("refuses another teacher and a class that is not missed", async () => {
    expect(await suggestMakeupSlots(otherTeacher, "missed-1")).toMatchObject({
      error: "UNAUTHORIZED",
    })
    rows = [missedRow({ status: "ended" })]
    expect(await suggestMakeupSlots(teacherActor, "missed-1")).toMatchObject({
      error: "MAKEUP_NOT_ELIGIBLE",
    })
  })
})

describe("findScheduleConflicts", () => {
  it("ignores the session it is told to ignore, and scopes by school", async () => {
    await findScheduleConflicts(SCHOOL, {
      teacherId: "t-1",
      sectionIds: ["sec-7"],
      start: new Date(START),
      end: new Date(END),
      ignoreSessionId: "makeup-0",
    })
    const where = m.conference.findMany.mock.calls[0][0].where
    expect(where.id).toEqual({ not: "makeup-0" })
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.status).toEqual({ in: ["scheduled", "live"] })
  })
})

describe("school scoping", () => {
  it("puts the school in every query of every path", async () => {
    rows = [
      missedRow(),
      {
        id: "makeup-0",
        schoolId: SCHOOL,
        status: "scheduled",
        deletedAt: null,
        makeupForId: "missed-1",
        lang: "ar",
        teacher: { userId: "u-teacher" },
      },
    ]
    m.conference.findMany.mockResolvedValue([])
    await listMissedClasses(admin)
    await suggestMakeupSlots(admin, "missed-1")
    await createMakeup(admin, {
      missedId: "missed-1",
      startIso: START,
      endIso: END,
    })
    await cancelMakeup(admin, "makeup-0")
    await replanMakeup(admin, {
      makeupId: "makeup-0",
      startIso: START,
      endIso: END,
    })

    const wheres: [string, Record<string, unknown>][] = []
    for (const [model, fns] of Object.entries({
      conference: m.conference,
      timetable: m.timetable,
      period: m.period,
      schoolWeekConfig: m.schoolWeekConfig,
    })) {
      for (const [name, f] of Object.entries(fns)) {
        for (const call of mock(f).mock.calls) {
          wheres.push([`${model}.${name}`, call[0].where])
        }
      }
    }
    expect(wheres.length).toBeGreaterThan(10)
    for (const [name, where] of wheres) {
      // `OR` on schoolWeekConfig sits beside schoolId, never instead of it.
      expect(where.schoolId, name).toBe(SCHOOL)
    }
    for (const call of m.school.findUnique.mock.calls) {
      expect(call[0].where).toEqual({ id: SCHOOL })
    }
    for (const call of m.$queryRaw.mock.calls) {
      expect(call.slice(1)).toContain(SCHOOL)
    }
    expect(
      mock(findClosuresInRange).mock.calls.every((c) => c[0] === SCHOOL)
    ).toBe(true)
  })
})
