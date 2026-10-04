// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { loadTodaySchedule } from "@/components/school-dashboard/timetable/today-schedule"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    period: { findMany: vi.fn() },
    teacher: { findFirst: vi.fn() },
    student: { findFirst: vi.fn() },
    studentClass: { findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
    substitutionRecord: { findMany: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/live/school-calendar", () => ({
  findSchoolClosure: vi.fn().mockResolvedValue(null),
}))
vi.mock("@/components/school-dashboard/timetable/live-class-join", () => ({
  attachLiveClasses: vi.fn(
    async (_s: string, _t: string, _d: Date, rows: unknown[]) => rows
  ),
}))

const SCHOOL = "school-1"
const term = { id: "term-1", yearId: "year-1", label: "Term 1" }

const load = (role: string) =>
  loadTodaySchedule({ schoolId: SCHOOL, userId: "user-1", role, term })

const slotWhere = () =>
  vi.mocked(db.timetable.findMany).mock.calls[0][0]!.where as {
    OR?: unknown[]
  }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "UTC",
  } as never)
  vi.mocked(db.period.findMany).mockResolvedValue([])
  vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
  vi.mocked(db.student.findFirst).mockResolvedValue(null)
  vi.mocked(db.studentClass.findMany).mockResolvedValue([])
  vi.mocked(db.timetable.findMany).mockResolvedValue([])
  vi.mocked(db.substitutionRecord.findMany).mockResolvedValue([])
})

describe("loadTodaySchedule — whose day", () => {
  it("shows a placed student their section's day", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "s1",
      sectionId: "7a",
    } as never)

    await load("STUDENT")

    expect(slotWhere().OR).toEqual([{ sectionId: "7a" }])
  })

  it("shows an unplaced student nothing — never the whole school's day", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "s1",
      sectionId: null,
    } as never)

    await load("STUDENT")

    expect(slotWhere().OR).toEqual([{ id: { in: [] } }])
  })

  it("shows a student account with no student record nothing", async () => {
    await load("STUDENT")

    expect(slotWhere().OR).toEqual([{ id: { in: [] } }])
  })

  it("shows a teacher account with no teacher record nothing", async () => {
    await load("TEACHER")

    expect(slotWhere().OR).toEqual([{ id: { in: [] } }])
  })
})
