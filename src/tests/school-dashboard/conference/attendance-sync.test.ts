// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { syncConferenceAttendance } from "@/components/school-dashboard/conference/actions/attendance-sync"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    timetable: { findFirst: vi.fn() },
    student: { findMany: vi.fn() },
    conferenceParticipant: { findMany: vi.fn() },
    attendance: { findMany: vi.fn(), update: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

const mockDb = db as unknown as {
  conference: { findFirst: ReturnType<typeof vi.fn> }
  timetable: { findFirst: ReturnType<typeof vi.fn> }
  student: { findMany: ReturnType<typeof vi.fn> }
  conferenceParticipant: { findMany: ReturnType<typeof vi.fn> }
  attendance: {
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

const START = new Date("2026-06-19T08:00:00.000Z")
const ON_TIME = new Date("2026-06-19T08:05:00.000Z") // within the 10-min grace
const LATE = new Date("2026-06-19T08:20:00.000Z") // past the 10-min grace

function happySession() {
  mockDb.conference.findFirst.mockResolvedValue({
    id: "c1",
    sectionId: "sec1",
    timetableId: "tt1",
    scheduledStart: START,
    actualStart: null,
    school: { conferenceAttendanceSync: true },
  })
  mockDb.timetable.findFirst.mockResolvedValue({
    periodId: "p1",
    period: { name: "Period 1" },
  })
  mockDb.student.findMany.mockResolvedValue([
    { id: "sA", userId: "uA" },
    { id: "sB", userId: "uB" },
    { id: "sC", userId: "uC" },
  ])
  mockDb.conferenceParticipant.findMany.mockResolvedValue([
    { userId: "uA", joinedAt: ON_TIME },
    { userId: "uB", joinedAt: LATE },
    // uC never joined → no row
  ])
  mockDb.attendance.findMany.mockResolvedValue([])
}

describe("syncConferenceAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // $transaction runs the callback with a tx exposing the attendance writers.
    mockDb.$transaction.mockImplementation(async (cb: any) =>
      cb({
        attendance: {
          update: mockDb.attendance.update,
          createMany: mockDb.attendance.createMany,
        },
      })
    )
  })

  it("skips when the school has not opted in", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      actualStart: null,
      school: { conferenceAttendanceSync: false },
    })
    const res = await syncConferenceAttendance("school1", "c1")
    expect(res.skipped).toBe("disabled")
    expect(mockDb.student.findMany).not.toHaveBeenCalled()
  })

  it("skips ad-hoc sessions with no section or timetable", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      sectionId: null,
      timetableId: "tt1",
      scheduledStart: START,
      actualStart: null,
      school: { conferenceAttendanceSync: true },
    })
    const res = await syncConferenceAttendance("school1", "c1")
    expect(res.skipped).toBe("no_section_or_timetable")
  })

  it("skips when the section has no students", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      actualStart: null,
      school: { conferenceAttendanceSync: true },
    })
    mockDb.timetable.findFirst.mockResolvedValue({
      periodId: "p1",
      period: { name: "P1" },
    })
    mockDb.student.findMany.mockResolvedValue([])
    const res = await syncConferenceAttendance("school1", "c1")
    expect(res.skipped).toBe("empty_roster")
  })

  it("derives PRESENT / LATE / ABSENT from participant presence", async () => {
    happySession()
    const res = await syncConferenceAttendance("school1", "c1")

    expect(res).toEqual({ marked: 3, updated: 0 })
    expect(mockDb.attendance.createMany).toHaveBeenCalledTimes(1)
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const byStudent = Object.fromEntries(rows.map((r) => [r.studentId, r]))

    expect(byStudent.sA.status).toBe("PRESENT")
    expect(byStudent.sB.status).toBe("LATE")
    expect(byStudent.sC.status).toBe("ABSENT")
    // Every row is stamped as the virtual (live-class presence) method.
    for (const r of rows) {
      expect(r.method).toBe("VIRTUAL")
      expect(r.sectionId).toBe("sec1")
      expect(r.periodId).toBe("p1")
      expect(r.periodName).toBe("Period 1")
    }
    expect(byStudent.sA.checkInTime).toEqual(ON_TIME)
    expect(byStudent.sC.checkInTime).toBeNull()
  })

  it("updates + revives an existing row instead of duplicating (idempotent)", async () => {
    happySession()
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-A", studentId: "sA" },
    ])

    const res = await syncConferenceAttendance("school1", "c1")

    expect(res).toEqual({ marked: 2, updated: 1 })
    expect(mockDb.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "att-A" },
        data: expect.objectContaining({
          status: "PRESENT",
          method: "VIRTUAL",
          deletedAt: null, // revives a soft-deleted row
        }),
      })
    )
    const created = mockDb.attendance.createMany.mock.calls[0][0]
      .data as Array<{
      studentId: string
    }>
    expect(created.map((r) => r.studentId).sort()).toEqual(["sB", "sC"])
  })

  it("treats actualStart (when present) as the lateness anchor", async () => {
    happySession()
    // Room actually started at 08:15 — uB's 08:20 join is now within grace.
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      actualStart: new Date("2026-06-19T08:15:00.000Z"),
      school: { conferenceAttendanceSync: true },
    })
    await syncConferenceAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const byStudent = Object.fromEntries(rows.map((r) => [r.studentId, r]))
    // uA joined at 08:05, before actualStart → still counts PRESENT.
    expect(byStudent.sA.status).toBe("PRESENT")
    // uB joined at 08:20, within 10 min of the 08:15 actual start → PRESENT.
    expect(byStudent.sB.status).toBe("PRESENT")
  })
})
