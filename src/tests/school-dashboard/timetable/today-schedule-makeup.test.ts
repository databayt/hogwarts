// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// A make-up class («حصة تعويضية») scheduled for today shows on the day's
// schedule at its own time — for the student of its section (or of a combined
// sibling section) and for its teacher, never for anyone else — and it costs
// no extra sequential read.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { sessionSectionIds } from "@/components/school-dashboard/live/combined"
import { loadTodaySchedule } from "@/components/school-dashboard/timetable/today-schedule"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    period: { findMany: vi.fn() },
    teacher: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
    timetable: { findMany: vi.fn() },
    substitutionRecord: { findMany: vi.fn() },
    conference: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/school-name-format", () => ({
  schoolNameDisplay: vi.fn().mockResolvedValue("first-last"),
}))
vi.mock("@/components/school-dashboard/live/school-calendar", () => ({
  findSchoolClosure: vi.fn().mockResolvedValue(null),
}))
vi.mock("@/components/school-dashboard/live/combined", () => ({
  sessionSectionIds: vi.fn(),
}))
vi.mock("@/components/school-dashboard/timetable/live-class-join", () => ({
  attachLiveClasses: vi.fn(
    async (_s: string, _t: string, _d: Date, rows: unknown[]) =>
      rows.map((r) => ({ ...(r as object), liveClass: null }))
  ),
}))

const SCHOOL = "school-1"
const term = { id: "term-1", yearId: "year-1", label: "Term 1" }
// 2026-12-01 is a Tuesday; the school is on UTC for a plain clock.
const DATE = new Date("2026-12-01T06:00:00Z")

const load = (role: string) =>
  loadTodaySchedule({
    schoolId: SCHOOL,
    userId: "user-1",
    role,
    term,
    date: DATE,
  })

const makeupRow = (over: Record<string, unknown> = {}) => ({
  id: "mk-1",
  provider: "livekit",
  meetingUrl: null,
  status: "scheduled",
  sectionId: "7a",
  subjectId: "math",
  teacherId: "t-1",
  scheduledStart: new Date("2026-12-01T13:30:00Z"),
  scheduledEnd: new Date("2026-12-01T14:15:00Z"),
  makeupForId: "missed-1",
  makeupFor: { timetableId: null },
  section: { name: "7-A" },
  subject: { name: "Math" },
  teacher: { firstName: "Sara", middleName: null, lastName: "Omar" },
  ...over,
})

const period = (id: string, h: number, m: number) => ({
  id,
  name: id,
  startTime: new Date(Date.UTC(1970, 0, 1, h, m)),
  endTime: new Date(Date.UTC(1970, 0, 1, h + 1, m)),
  isBreak: false,
  untimed: false,
  gradeId: null,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "UTC",
  } as never)
  vi.mocked(db.period.findMany).mockResolvedValue([
    period("p1", 8, 0),
    period("p2", 15, 0),
  ] as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t-1" } as never)
  vi.mocked(db.student.findFirst).mockResolvedValue({
    id: "s1",
    sectionId: "7a",
    section: { gradeId: "g7" },
  } as never)
  vi.mocked(db.timetable.findMany).mockResolvedValue([])
  vi.mocked(db.substitutionRecord.findMany).mockResolvedValue([])
  vi.mocked(db.conference.findMany).mockResolvedValue([])
  vi.mocked(sessionSectionIds).mockResolvedValue([])
})

const makeups = async (role: string) =>
  (await load(role)).schedule.filter(
    (r) => (r as { makeup?: boolean }).makeup === true
  )

describe("loadTodaySchedule — make-up classes", () => {
  it("shows a student their section's make-up, with its room and time", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([makeupRow()] as never)

    const [row] = await makeups("STUDENT")

    expect(row).toMatchObject({
      makeup: true,
      subject: "Math",
      className: "7-A",
      timetableId: null,
      liveClass: {
        sessionId: "mk-1",
        provider: "livekit",
        status: "scheduled",
      },
    })
    // The wall-clock convention Period rows use: a UTC clock reading school time.
    expect(new Date(row.startTime).toISOString()).toBe(
      "1970-01-01T13:30:00.000Z"
    )
  })

  it("puts it in the day by its own time, between the periods around it", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([makeupRow()] as never)

    const { schedule } = await load("STUDENT")

    expect(schedule.map((r) => r.periodId)).toEqual(["p1", "makeup:mk-1", "p2"])
  })

  it("queries today's make-ups school-scoped, narrowed to the school day", async () => {
    await load("STUDENT")

    const args = vi.mocked(db.conference.findMany).mock.calls[0][0]!
    expect(args.where).toMatchObject({
      schoolId: SCHOOL,
      makeupForId: { not: null },
      status: { in: ["scheduled", "live"] },
      deletedAt: null,
      isPractice: false,
      scheduledStart: {
        gte: new Date("2026-12-01T00:00:00Z"),
        lt: new Date("2026-12-02T00:00:00Z"),
      },
    })
  })

  it("does not show a student another section's make-up", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      makeupRow({ sectionId: "8b", section: { name: "8-B" } }),
    ] as never)

    expect(await makeups("STUDENT")).toEqual([])
  })

  it("shows a sibling section of a combined class the make-up", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      makeupRow({
        sectionId: "8b",
        section: { name: "8-B" },
        makeupFor: { timetableId: "slot-1" },
      }),
    ] as never)
    vi.mocked(sessionSectionIds).mockResolvedValue(["8b", "7a"])

    expect(await makeups("STUDENT")).toHaveLength(1)
  })

  it("shows a teacher their own make-up and not a colleague's", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      makeupRow(),
      makeupRow({ id: "mk-2", teacherId: "t-9" }),
    ] as never)

    const rows = await makeups("TEACHER")

    expect(rows.map((r) => r.liveClass?.sessionId)).toEqual(["mk-1"])
  })

  it("adds no sequential read: the make-up query starts with the periods read", async () => {
    const order: string[] = []
    vi.mocked(db.period.findMany).mockImplementation((() => {
      order.push("period")
      return Promise.resolve([])
    }) as never)
    vi.mocked(db.conference.findMany).mockImplementation((() => {
      order.push("makeups")
      return Promise.resolve([])
    }) as never)
    vi.mocked(db.timetable.findMany).mockImplementation((() => {
      order.push("slots")
      return Promise.resolve([])
    }) as never)

    await load("STUDENT")

    // Both start in the first wave, before the slots (the next wave) are read.
    expect(order.slice(0, 2).sort()).toEqual(["makeups", "period"])
    expect(order.indexOf("slots")).toBe(2)
  })

  it("leaves the day as it was when a school has no make-ups, or the read fails", async () => {
    expect(
      (await load("STUDENT")).schedule.every((r) => !("makeup" in r))
    ).toBe(true)

    vi.mocked(db.conference.findMany).mockRejectedValue(new Error("boom"))
    expect((await load("STUDENT")).schedule).toHaveLength(2)
  })
})
