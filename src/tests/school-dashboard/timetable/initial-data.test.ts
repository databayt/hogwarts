// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadInitialTimetable } from "@/components/school-dashboard/timetable/initial-data"

const m = vi.hoisted(() => ({
  getActiveTerm: vi.fn(),
  getPersonalizedTimetable: vi.fn(),
  getTimetableByStudentGrade: vi.fn(),
  getTimetableByTeacher: vi.fn(),
  getTimetableByRoom: vi.fn(),
  getTodaySchedule: vi.fn(),
  getGuardianChildren: vi.fn(),
  getChildTimetable: vi.fn(),
  getChildTodaySchedule: vi.fn(),
  getRoomsForSelection: vi.fn(),
  getTeachersForSelection: vi.fn(),
  getPermissionContext: vi.fn(),
  teacherFindFirst: vi.fn(),
  cookieGet: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: m.cookieGet }),
}))
vi.mock("@/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }))
vi.mock("@/lib/db", () => ({
  db: { teacher: { findFirst: m.teacherFindFirst } },
}))
vi.mock("@/components/school-dashboard/timetable/permissions", () => ({
  getPermissionContext: m.getPermissionContext,
}))
vi.mock("@/components/school-dashboard/timetable/actions", () => ({
  getActiveTerm: m.getActiveTerm,
  getPersonalizedTimetable: m.getPersonalizedTimetable,
  getTimetableByStudentGrade: m.getTimetableByStudentGrade,
  getTimetableByTeacher: m.getTimetableByTeacher,
  getTimetableByRoom: m.getTimetableByRoom,
  getTodaySchedule: m.getTodaySchedule,
  getGuardianChildren: m.getGuardianChildren,
  getChildTimetable: m.getChildTimetable,
  getChildTodaySchedule: m.getChildTodaySchedule,
  getRoomsForSelection: m.getRoomsForSelection,
  getTeachersForSelection: m.getTeachersForSelection,
}))

const WEEK = { slots: [{ id: "s1" }], periods: [], liveJoin: {} }
const TODAY = { schedule: [], dayOfWeek: 2, closure: null }

beforeEach(() => {
  vi.clearAllMocks()
  m.getActiveTerm.mockResolvedValue({ term: { id: "term-1" } })
  m.getPersonalizedTimetable.mockResolvedValue({ viewType: "student" })
  m.getTimetableByStudentGrade.mockResolvedValue(WEEK)
  m.getTimetableByTeacher.mockResolvedValue(WEEK)
  m.getTodaySchedule.mockResolvedValue(TODAY)
})

describe("loadInitialTimetable", () => {
  it("carries a student's week and today's closure in the same load", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "STUDENT" })

    const out = await loadInitialTimetable()

    expect(out).toEqual({
      termId: "term-1",
      data: { viewType: "student" },
      grid: WEEK,
      today: { closure: null, dayOfWeek: 2 },
      guardian: null,
      admin: null,
    })
    expect(m.getTimetableByStudentGrade).toHaveBeenCalledWith({
      termId: "term-1",
    })
    expect(m.getTimetableByTeacher).not.toHaveBeenCalled()
  })

  it("starts today's closure before the term has answered", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "STUDENT" })
    let releaseTerm!: (v: unknown) => void
    m.getActiveTerm.mockReturnValue(
      new Promise((r) => {
        releaseTerm = r
      })
    )

    const pending = loadInitialTimetable()
    // Let the role plan run; the term is still unresolved.
    await new Promise((r) => setTimeout(r, 0))
    expect(m.getTodaySchedule).toHaveBeenCalled()
    expect(m.getPersonalizedTimetable).not.toHaveBeenCalled()

    releaseTerm({ term: { id: "term-1" } })
    await pending
  })

  it("loads a teacher's own week by their teacher id", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "TEACHER" })
    m.teacherFindFirst.mockResolvedValue({ id: "tea-1" })

    const out = await loadInitialTimetable()

    expect(m.teacherFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1", schoolId: "sch" } })
    )
    expect(m.getTimetableByTeacher).toHaveBeenCalledWith({
      termId: "term-1",
      teacherId: "tea-1",
    })
    expect(out?.grid).toBe(WEEK)
    expect(out?.today).toEqual({ closure: null, dayOfWeek: 2 })
  })

  it("leaves the week null (the view loads it) when its read fails", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "STUDENT" })
    m.getTimetableByStudentGrade.mockRejectedValue(new Error("STUDENT_NOT_FOUND"))

    const out = await loadInitialTimetable()

    expect(out?.termId).toBe("term-1")
    expect(out?.grid).toBeNull()
    expect(out?.today).toBeNull()
  })

  it("does not load a week for the draft term", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "STUDENT" })
    m.getActiveTerm.mockResolvedValue({ term: { id: "__draft__" } })

    const out = await loadInitialTimetable()

    expect(m.getTimetableByStudentGrade).not.toHaveBeenCalled()
    expect(out?.termId).toBe("__draft__")
    expect(out?.grid).toBeNull()
  })

  it("seeds a guardian with the children and the first child's week and day", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "GUARDIAN" })
    m.getGuardianChildren.mockResolvedValue({
      children: [{ id: "kid-1" }, { id: "kid-2" }],
    })
    m.getChildTimetable.mockResolvedValue(WEEK)
    m.getChildTodaySchedule.mockResolvedValue(TODAY)

    const out = await loadInitialTimetable()

    expect(m.getChildTimetable).toHaveBeenCalledWith({
      termId: "term-1",
      childId: "kid-1",
    })
    expect(out?.guardian).toMatchObject({ childId: "kid-1", grid: WEEK })
    expect(out?.guardian?.children).toHaveLength(2)
  })

  it("seeds an admin from the saved cookie when it still names a room", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "ADMIN" })
    m.getRoomsForSelection.mockResolvedValue({
      rooms: [
        { id: "r1", label: "A", capacity: 20 },
        { id: "r2", label: "B", capacity: 20 },
      ],
    })
    m.getTeachersForSelection.mockResolvedValue({ teachers: [] })
    m.cookieGet.mockReturnValue({
      value: JSON.stringify({ viewMode: "classroom", roomId: "r2" }),
    })
    m.getTimetableByRoom.mockResolvedValue(WEEK)

    const out = await loadInitialTimetable()

    expect(m.getTimetableByRoom).toHaveBeenCalledWith({
      termId: "term-1",
      roomId: "r2",
    })
    expect(out?.admin?.selection).toEqual({ viewMode: "classroom", roomId: "r2" })
    expect(out?.grid).toBeNull()
  })

  it("falls back to the first room when the cookie names a stale one", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "ADMIN" })
    m.getRoomsForSelection.mockResolvedValue({
      rooms: [{ id: "r1", label: "A", capacity: 20 }],
    })
    m.getTeachersForSelection.mockResolvedValue({ teachers: [] })
    m.cookieGet.mockReturnValue({
      value: JSON.stringify({ viewMode: "classroom", roomId: "gone" }),
    })
    m.getTimetableByRoom.mockResolvedValue(WEEK)

    const out = await loadInitialTimetable()

    expect(out?.admin?.selection).toEqual({ viewMode: "classroom", roomId: "r1" })
  })

  it("resolves null when the term itself cannot be read", async () => {
    m.getPermissionContext.mockResolvedValue({ schoolId: "sch", role: "STUDENT" })
    m.getActiveTerm.mockRejectedValue(new Error("boom"))

    expect(await loadInitialTimetable()).toBeNull()
  })
})
