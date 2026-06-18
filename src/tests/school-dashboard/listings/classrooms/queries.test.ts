// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getGrades,
  getRoomClasses,
  getRoomDetail,
  getRoomTimetable,
} from "@/components/school-dashboard/listings/classrooms/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    classroom: { findFirst: vi.fn(), findMany: vi.fn() },
    academicGrade: { findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
    schoolWeekConfig: { findFirst: vi.fn() },
    period: { findMany: vi.fn() },
    class: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"

function asAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role: "ADMIN", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "ADMIN",
    locale: "en",
  })
}

function asTenantless() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role: "ADMIN", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null as any,
    subdomain: "demo",
    role: "ADMIN",
    locale: "en",
  })
}

function asUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "ADMIN",
    locale: "en",
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin()
})

describe("getGrades", () => {
  it("returns grades scoped by schoolId, ordered by gradeNumber", async () => {
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1" },
    ] as any)

    const result = await getGrades()

    expect(result).toHaveLength(1)
    expect(vi.mocked(db.academicGrade.findMany)).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL },
      select: { id: true, name: true },
      orderBy: { gradeNumber: "asc" },
    })
  })

  it("returns [] when tenant context is missing (no DB hit)", async () => {
    asTenantless()
    expect(await getGrades()).toEqual([])
    expect(vi.mocked(db.academicGrade.findMany)).not.toHaveBeenCalled()
  })

  it("returns [] when session is missing (no DB hit)", async () => {
    asUnauthenticated()
    expect(await getGrades()).toEqual([])
    expect(vi.mocked(db.academicGrade.findMany)).not.toHaveBeenCalled()
  })

  it("returns [] when role lacks read permission (no DB hit)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: SCHOOL },
    } as any)
    expect(await getGrades()).toEqual([])
    expect(vi.mocked(db.academicGrade.findMany)).not.toHaveBeenCalled()
  })
})

describe("getRoomDetail", () => {
  it("scopes the lookup by schoolId and id", async () => {
    vi.mocked(db.classroom.findFirst).mockResolvedValue({
      id: "r1",
      roomName: "A101",
      capacity: 30,
      typeId: "t1",
      gradeId: null,
      lang: "ar",
      classroomType: { id: "t1", name: "Classroom", lang: "ar" },
      grade: null,
    } as any)

    const result = await getRoomDetail({ id: "r1" })

    expect(result?.roomName).toBe("A101")
    expect(vi.mocked(db.classroom.findFirst).mock.calls[0][0]?.where).toEqual({
      id: "r1",
      schoolId: SCHOOL,
    })
  })

  it("returns null without schoolId", async () => {
    asTenantless()
    expect(await getRoomDetail({ id: "r1" })).toBeNull()
  })

  it("returns null when role is unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: SCHOOL },
    } as any)
    expect(await getRoomDetail({ id: "r1" })).toBeNull()
    expect(vi.mocked(db.classroom.findFirst)).not.toHaveBeenCalled()
  })
})

describe("getRoomTimetable", () => {
  it("returns mapped slots, working days and periods scoped by schoolId/term", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        id: "tt1",
        dayOfWeek: 1,
        periodId: "p1",
        class: {
          id: "c1",
          name: "Math",
          grade: { id: "g1", name: "Grade 1" },
          subject: { id: "sub1", name: "Math" },
        },
        teacher: { id: "t1", firstName: "Ada", lastName: "Lovelace" },
      },
    ] as any)
    vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
      workingDays: [0, 1, 2, 3, 4],
    } as any)
    vi.mocked(db.period.findMany).mockResolvedValue([
      {
        id: "p1",
        name: "P1",
        startTime: new Date("2025-01-01T08:00:00.000Z"),
        endTime: new Date("2025-01-01T08:45:00.000Z"),
      },
    ] as any)

    const result = await getRoomTimetable({ roomId: "r1", termId: "term-1" })

    expect(result.slots).toHaveLength(1)
    expect(result.slots[0]).toMatchObject({
      dayOfWeek: 1,
      className: "Math",
      teacher: "Ada Lovelace",
    })
    expect(result.workingDays).toEqual([0, 1, 2, 3, 4])
    expect(result.periods[0].startTime).toBe("2025-01-01T08:00:00.000Z")
    expect(
      vi.mocked(db.timetable.findMany).mock.calls[0][0]?.where
    ).toMatchObject({
      schoolId: SCHOOL,
      classroomId: "r1",
      termId: "term-1",
      weekOffset: 0,
    })
  })

  it("returns the empty shape when school context is missing", async () => {
    asTenantless()
    const result = await getRoomTimetable({ roomId: "r1", termId: "term-1" })
    expect(result).toEqual({ slots: [], workingDays: [], periods: [] })
    expect(vi.mocked(db.timetable.findMany)).not.toHaveBeenCalled()
  })

  it("returns the empty shape when role is unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: SCHOOL },
    } as any)
    const result = await getRoomTimetable({ roomId: "r1", termId: "term-1" })
    expect(result).toEqual({ slots: [], workingDays: [], periods: [] })
    expect(vi.mocked(db.timetable.findMany)).not.toHaveBeenCalled()
  })

  it("falls back to default working days when no week config exists", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)
    vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue(null)
    vi.mocked(db.period.findMany).mockResolvedValue([] as any)
    const result = await getRoomTimetable({ roomId: "r1", termId: "term-1" })
    expect(result.workingDays).toEqual([0, 1, 2, 3, 4])
  })
})

describe("getRoomClasses", () => {
  it("returns classes scoped to school + classroom", async () => {
    vi.mocked(db.class.findMany).mockResolvedValue([
      {
        id: "c1",
        name: "Math",
        maxCapacity: 30,
        grade: { id: "g1", name: "Grade 1" },
        subject: { id: "s1", name: "Math" },
        teacher: { id: "t1", firstName: "Ada", lastName: "Lovelace" },
        _count: { studentClasses: 25 },
      },
    ] as any)

    const result = await getRoomClasses({ roomId: "r1" })

    expect(result).toHaveLength(1)
    expect(vi.mocked(db.class.findMany).mock.calls[0][0]?.where).toEqual({
      schoolId: SCHOOL,
      classroomId: "r1",
    })
  })

  it("returns [] when role is unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: SCHOOL },
    } as any)
    expect(await getRoomClasses({ roomId: "r1" })).toEqual([])
    expect(vi.mocked(db.class.findMany)).not.toHaveBeenCalled()
  })
})
