// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// "Your next class": the school's clock and zone are REAL (day-window is
// pure); only the database edges are mocked. Khartoum is UTC+2, and
// 2026-11-08 is a Sunday there.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { loadNextClassToday } from "@/components/school-dashboard/live/next-class"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    teacher: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
    timetable: { findMany: vi.fn() },
    conference: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn(async () => ({ term: { id: "term-1" } })),
}))
const combinedPrimaryForSlots = vi.fn(async () => new Map<string, string>())
vi.mock("@/components/school-dashboard/live/combined", () => ({
  combinedPrimaryForSlots: (...a: unknown[]) =>
    combinedPrimaryForSlots(...(a as [])),
}))
const teacherDaySlotFilter = vi.fn(async () => [{ teacherId: "t-1" }])
vi.mock("@/components/school-dashboard/timetable/today-schedule", () => ({
  teacherDaySlotFilter: (...a: unknown[]) => teacherDaySlotFilter(...(a as [])),
}))

// 16:30 in Khartoum.
const NOW = new Date("2026-11-08T14:30:00Z")
const wall = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`)
const slot = (id: string, from: string, to: string, extra = {}) => ({
  id,
  section: { name: "7-A" },
  subject: { name: `Subject ${id}` },
  period: { startTime: wall(from), endTime: wall(to), isBreak: false },
  ...extra,
})

const ENDED = slot("s-ended", "15:00", "15:50") // period times are school wall-clock
const RUNNING = slot("s-running", "16:00", "16:50")
const LATER = slot("s-later", "17:00", "17:50")

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "Africa/Khartoum",
  } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t-1" } as never)
  vi.mocked(db.student.findFirst).mockResolvedValue({
    sectionId: "sec-1",
  } as never)
  vi.mocked(db.timetable.findMany).mockResolvedValue([
    LATER,
    ENDED,
    RUNNING,
  ] as never)
  vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
})

const input = { schoolId: "sch1", userId: "u1", role: "TEACHER", now: NOW }

describe("loadNextClassToday", () => {
  it("a teacher with an ended, a running and a later slot gets the running one", async () => {
    const next = await loadNextClassToday(input)
    expect(next?.timetableId).toBe("s-running")
    expect(next?.subject).toBe("Subject s-running")
    expect(next?.section).toBe("7-A")
    // 16:00 Khartoum = 14:00Z
    expect(next?.startsAt.toISOString()).toBe("2026-11-08T14:00:00.000Z")
    expect(next?.endsAt.toISOString()).toBe("2026-11-08T14:50:00.000Z")
  })

  it("skips afterTimetableId", async () => {
    const next = await loadNextClassToday({
      ...input,
      afterTimetableId: "s-running",
    })
    expect(next?.timetableId).toBe("s-later")
  })

  it("skips a slot whose session today already ended or was cancelled", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { timetableId: "s-running" },
    ] as never)
    const next = await loadNextClassToday(input)
    expect(next?.timetableId).toBe("s-later")
    expect(db.conference.findMany).toHaveBeenCalledTimes(1) // batched, not per slot
  })

  it("is null when nothing is left today", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([ENDED] as never)
    expect(await loadNextClassToday(input)).toBeNull()
  })

  it("ignores break periods", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        ...RUNNING,
        period: { ...RUNNING.period, isBreak: true },
      },
      LATER,
    ] as never)
    expect((await loadNextClassToday(input))?.timetableId).toBe("s-later")
  })

  it("a teacher is filtered with the timetable's own substitution-aware filter", async () => {
    await loadNextClassToday(input)
    expect(teacherDaySlotFilter).toHaveBeenCalled()
    const q = vi.mocked(db.timetable.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(q.where).toMatchObject({
      schoolId: "sch1",
      termId: "term-1",
      dayOfWeek: 0,
      weekOffset: 0,
      OR: [{ teacherId: "t-1" }],
    })
  })

  it("a student gets their section's slots", async () => {
    const next = await loadNextClassToday({ ...input, role: "STUDENT" })
    expect(next?.timetableId).toBe("s-running")
    const q = vi.mocked(db.timetable.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(q.where).toMatchObject({
      schoolId: "sch1",
      OR: [{ sectionId: "sec-1" }],
    })
    expect(teacherDaySlotFilter).not.toHaveBeenCalled()
  })

  it.each(["ADMIN", "GUARDIAN", "STAFF", null])(
    "role %s gets null and reads nothing",
    async (role) => {
      expect(await loadNextClassToday({ ...input, role })).toBeNull()
      expect(db.timetable.findMany).not.toHaveBeenCalled()
    }
  )

  it("queries the school's weekday, not the server's: Sunday late evening UTC is already Monday?", async () => {
    // 2026-11-08T23:30Z is 01:30 Monday in Khartoum.
    await loadNextClassToday({
      ...input,
      now: new Date("2026-11-08T23:30:00Z"),
    })
    const q = vi.mocked(db.timetable.findMany).mock.calls[0][0] as {
      where: { dayOfWeek: number }
    }
    expect(q.where.dayOfWeek).toBe(1)
  })

  it("a student with no section has no next class", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      sectionId: null,
    } as never)
    expect(
      await loadNextClassToday({ ...input, role: "STUDENT" })
    ).toBeNull()
  })
})

describe("loadNextClassToday — a combined class is one class", () => {
  // One teacher, two sections, the same period: each section has a slot, the
  // room belongs to the primary.
  const ARTS = slot("s-arts", "16:00", "16:50")
  const SCIENCE = slot("s-science", "16:00", "16:50")

  it("never offers the sibling slot of the class the reader is leaving", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      ARTS,
      SCIENCE,
      LATER,
    ] as never)
    combinedPrimaryForSlots.mockResolvedValueOnce(
      new Map([
        ["s-arts", "s-science"],
        ["s-science", "s-science"],
      ])
    )
    const next = await loadNextClassToday({
      schoolId: "sch-1",
      userId: "u-1",
      role: "TEACHER",
      now: NOW,
      afterTimetableId: "s-science",
    })
    expect(next?.timetableId).toBe("s-later")
  })

  it("a sibling slot is over when the room's own slot has ended today", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([ARTS, LATER] as never)
    combinedPrimaryForSlots.mockResolvedValueOnce(
      new Map([["s-arts", "s-science"]])
    )
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { timetableId: "s-science" },
    ] as never)
    const next = await loadNextClassToday({
      schoolId: "sch-1",
      userId: "u-2",
      role: "STUDENT",
      now: NOW,
    })
    expect(next?.timetableId).toBe("s-later")
  })
})
