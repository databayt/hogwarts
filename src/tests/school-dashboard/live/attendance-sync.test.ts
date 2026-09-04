// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  connectedSeconds,
  syncLiveAttendance,
} from "@/components/school-dashboard/live/actions/attendance-sync"

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
// Period ends 45 minutes after it starts.
const END = new Date(START.getTime() + 45 * 60_000)
const ON_TIME = new Date("2026-06-19T08:05:00.000Z") // within the 10-min grace
const LATE = new Date("2026-06-19T08:20:00.000Z") // past the 10-min grace

function happySession() {
  mockDb.conference.findFirst.mockResolvedValue({
    id: "c1",
    provider: "livekit",
    sectionId: "sec1",
    timetableId: "tt1",
    scheduledStart: START,
    scheduledEnd: END,
    actualStart: null,
    school: { conferenceAttendanceSync: true },
  })
  mockDb.timetable.findFirst.mockResolvedValue({
    periodId: "p1",
    period: { name: "Period 1" },
    classId: null,
  })
  mockDb.student.findMany.mockResolvedValue([
    { id: "sA", userId: "uA" },
    { id: "sB", userId: "uB" },
    { id: "sC", userId: "uC" },
  ])
  mockDb.conferenceParticipant.findMany.mockResolvedValue([
    // Legacy single-span rows: no accumulated duration, no open span.
    {
      userId: "uA",
      joinedAt: ON_TIME,
      leftAt: null,
      durationSeconds: null,
      activeSince: null,
    },
    {
      userId: "uB",
      joinedAt: LATE,
      leftAt: null,
      durationSeconds: null,
      activeSince: null,
    },
    // uC never joined → no row
  ])
  mockDb.attendance.findMany.mockResolvedValue([])
}

describe("syncLiveAttendance", () => {
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
      scheduledEnd: END,
      actualStart: null,
      school: { conferenceAttendanceSync: false },
    })
    const res = await syncLiveAttendance("school1", "c1")
    expect(res.skipped).toBe("disabled")
    expect(mockDb.student.findMany).not.toHaveBeenCalled()
  })

  it("skips external sessions — no presence telemetry, roster must NOT be marked absent", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "external",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: null,
      school: { conferenceAttendanceSync: true },
    })
    const res = await syncLiveAttendance("school1", "c1")
    expect(res.skipped).toBe("external_provider")
    expect(mockDb.student.findMany).not.toHaveBeenCalled()
    expect(mockDb.attendance.createMany).not.toHaveBeenCalled()
  })

  it("skips ad-hoc sessions with no section or timetable", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: null,
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: null,
      school: { conferenceAttendanceSync: true },
    })
    const res = await syncLiveAttendance("school1", "c1")
    expect(res.skipped).toBe("no_section_or_timetable")
  })

  it("skips when the section has no students", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: null,
      school: { conferenceAttendanceSync: true },
    })
    mockDb.timetable.findFirst.mockResolvedValue({
      periodId: "p1",
      period: { name: "P1" },
    })
    mockDb.student.findMany.mockResolvedValue([])
    const res = await syncLiveAttendance("school1", "c1")
    expect(res.skipped).toBe("empty_roster")
  })

  it("derives PRESENT / LATE / ABSENT from participant presence", async () => {
    happySession()
    const res = await syncLiveAttendance("school1", "c1")

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

  it("marks a drive-by join ABSENT — presence needs a duration, not a ping", async () => {
    happySession()
    // uA connects and drops after 30 seconds. Before the floor existed this
    // scored identically to sitting the whole lesson.
    mockDb.conferenceParticipant.findMany.mockResolvedValue([
      {
        userId: "uA",
        joinedAt: ON_TIME,
        leftAt: new Date(ON_TIME.getTime() + 30_000),
        durationSeconds: null,
        activeSince: null,
      },
      {
        userId: "uB",
        joinedAt: LATE,
        leftAt: null,
        durationSeconds: null,
        activeSince: null,
      },
    ])

    await syncLiveAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const byStudent = Object.fromEntries(rows.map((r) => [r.studentId, r]))
    expect(byStudent.sA.status).toBe("ABSENT")
    expect(byStudent.sA.checkInTime).toBeNull()
    // uB never recorded a leave, so it counts to the session end and still
    // registers — the student who stayed must not be punished for the webhook
    // ordering that leaves `leftAt` unset.
    expect(byStudent.sB.status).toBe("LATE")
  })

  it("updates + revives an existing row instead of duplicating (idempotent)", async () => {
    happySession()
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-A", studentId: "sA" },
    ])

    const res = await syncLiveAttendance("school1", "c1")

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
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: new Date("2026-06-19T08:15:00.000Z"),
      school: { conferenceAttendanceSync: true },
    })
    await syncLiveAttendance("school1", "c1")
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

describe("syncLiveAttendance — presence across reconnects", () => {
  it("counts every span, not just the last one — a drop and rejoin keeps earlier presence", async () => {
    happySession()
    mockDb.conferenceParticipant.findMany.mockResolvedValue([
      // 4 min closed span + reconnected 3 min before reconciliation → 7 min ≥ floor.
      {
        userId: "uA",
        joinedAt: ON_TIME,
        leftAt: new Date(ON_TIME.getTime() + 4 * 60_000),
        durationSeconds: 4 * 60,
        activeSince: new Date(Date.now() - 3 * 60_000),
      },
    ] as never)
    await syncLiveAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const a = rows.find((r) => r.studentId === "sA")!
    expect(a.status).toBe("PRESENT")
    // Still connected at reconciliation → no check-out, not "left early".
    expect(a.checkOutTime).toBeNull()
    expect(a.notes).toBe("auto: live-class presence")
  })

  it("records check-out and 'left early' for a student who left before the last 10 minutes", async () => {
    happySession()
    const leftAt = new Date(START.getTime() + 20 * 60_000) // 25 min before the end
    mockDb.conferenceParticipant.findMany.mockResolvedValue([
      {
        userId: "uA",
        joinedAt: ON_TIME,
        leftAt,
        durationSeconds: 20 * 60,
        activeSince: null,
      },
    ] as never)
    await syncLiveAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const a = rows.find((r) => r.studentId === "sA")!
    expect(a.status).toBe("PRESENT")
    expect(a.checkOutTime).toEqual(leftAt)
    expect(a.notes).toBe("auto: live-class presence · left early")
  })

  it("a student who left inside the last 10 minutes is not 'left early'", async () => {
    happySession()
    const leftAt = new Date(END.getTime() - 5 * 60_000)
    mockDb.conferenceParticipant.findMany.mockResolvedValue([
      {
        userId: "uA",
        joinedAt: ON_TIME,
        leftAt,
        durationSeconds: 40 * 60,
        activeSince: null,
      },
    ] as never)
    await syncLiveAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const a = rows.find((r) => r.studentId === "sA")!
    expect(a.checkOutTime).toEqual(leftAt)
    expect(a.notes).toBe("auto: live-class presence")
  })
})

describe("syncLiveAttendance — Attendance.date is the SCHOOL-LOCAL day (attn-01)", () => {
  it("derives the day from Africa/Khartoum (default) local time, not the UTC day of the start instant", async () => {
    happySession()
    // 23:30 UTC on the 18th is 01:30 the NEXT day in Africa/Khartoum (UTC+2)
    // — exactly the boundary the old `Date.UTC(start)` derivation got wrong.
    const localBoundaryStart = new Date("2026-06-18T23:30:00.000Z")
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: localBoundaryStart,
      scheduledEnd: new Date(localBoundaryStart.getTime() + 45 * 60_000),
      actualStart: null,
      // No explicit timezone -> falls back to DEFAULT_SCHOOL_TZ.
      school: { conferenceAttendanceSync: true },
    })

    await syncLiveAttendance("school1", "c1")

    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    // Khartoum-local calendar day (the 19th), NOT the UTC day (the 18th).
    expect(rows[0].date).toEqual(new Date("2026-06-19"))
    expect(mockDb.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: new Date("2026-06-19") }),
      })
    )
  })

  it("uses School.timezone when set, deriving the PREVIOUS local day across a negative UTC offset", async () => {
    happySession()
    // 00:30 UTC is 20:30 the PREVIOUS day in America/New_York (UTC-4, EDT in June).
    const start = new Date("2026-06-19T00:30:00.000Z")
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: start,
      scheduledEnd: new Date(start.getTime() + 45 * 60_000),
      actualStart: null,
      school: {
        conferenceAttendanceSync: true,
        timezone: "America/New_York",
      },
    })

    await syncLiveAttendance("school1", "c1")

    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    expect(rows[0].date).toEqual(new Date("2026-06-18"))
  })

  it("a session starting well inside the school day still lands on the same UTC day (sanity check)", async () => {
    happySession()
    await syncLiveAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    // START is 08:00 UTC = 10:00 Africa/Khartoum — same calendar day either way.
    expect(rows[0].date).toEqual(new Date("2026-06-19"))
  })
})

describe("syncLiveAttendance — carries the slot's classId (attn-03)", () => {
  it("sets classId on a created row from the timetable slot's legacy class link", async () => {
    happySession()
    mockDb.timetable.findFirst.mockResolvedValue({
      periodId: "p1",
      period: { name: "Period 1" },
      classId: "cls1",
    })

    await syncLiveAttendance("school1", "c1")

    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    for (const r of rows) expect(r.classId).toBe("cls1")
  })

  it("writes classId: null when the slot has no legacy class link", async () => {
    happySession() // default timetable mock has classId: null
    await syncLiveAttendance("school1", "c1")
    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    for (const r of rows) expect(r.classId).toBeNull()
  })
})

describe("syncLiveAttendance — hybrid-school safety (attn-05)", () => {
  it("never downgrades a MANUAL PRESENT row to ABSENT for a student who didn't join online", async () => {
    happySession()
    // Nobody joined the live room this sync — everyone reads ABSENT by presence.
    mockDb.conferenceParticipant.findMany.mockResolvedValue([])
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-A", studentId: "sA", method: "MANUAL", status: "PRESENT" },
    ])

    const res = await syncLiveAttendance("school1", "c1")

    // sA's manual row must never be touched.
    expect(mockDb.attendance.update).not.toHaveBeenCalled()
    // sB and sC (no existing row) still get created ABSENT.
    expect(res.marked).toBe(2)
    expect(res.updated).toBe(0)
  })

  it("leaves a manual EXCUSED row untouched when presence says ABSENT", async () => {
    happySession()
    mockDb.conferenceParticipant.findMany.mockResolvedValue([])
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-A", studentId: "sA", method: "MANUAL", status: "EXCUSED" },
    ])

    await syncLiveAttendance("school1", "c1")

    expect(mockDb.attendance.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "att-A" } })
    )
  })

  it("a SOFT-DELETED manual PRESENT row does NOT block revival — an admin-removed mark was never 'seen in the room'", async () => {
    happySession()
    mockDb.conferenceParticipant.findMany.mockResolvedValue([]) // nobody joined online
    mockDb.attendance.findMany.mockResolvedValue([
      {
        id: "att-A",
        studentId: "sA",
        method: "MANUAL",
        status: "PRESENT",
        deletedAt: new Date("2026-06-01"),
      },
    ])

    await syncLiveAttendance("school1", "c1")

    // Unlike the live (non-deleted) MANUAL PRESENT case, this row IS revived
    // and overwritten with the live-presence result (ABSENT here).
    expect(mockDb.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "att-A" },
        data: expect.objectContaining({
          status: "ABSENT",
          method: "VIRTUAL",
          deletedAt: null,
        }),
      })
    )
  })

  it("upgrades a MANUAL row to VIRTUAL PRESENT when online presence says PRESENT", async () => {
    happySession()
    // sA (uA) joins on time per happySession()'s participant fixture.
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-A", studentId: "sA", method: "MANUAL", status: "ABSENT" },
    ])

    await syncLiveAttendance("school1", "c1")

    expect(mockDb.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "att-A" },
        data: expect.objectContaining({
          status: "PRESENT",
          method: "VIRTUAL",
        }),
      })
    )
  })

  it("still allows a VIRTUAL row to be downgraded to ABSENT on re-sync (no manual protection)", async () => {
    happySession()
    mockDb.conferenceParticipant.findMany.mockResolvedValue([]) // sA no longer present
    mockDb.attendance.findMany.mockResolvedValue([
      { id: "att-A", studentId: "sA", method: "VIRTUAL", status: "PRESENT" },
    ])

    await syncLiveAttendance("school1", "c1")

    expect(mockDb.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "att-A" },
        data: expect.objectContaining({
          status: "ABSENT",
          method: "VIRTUAL",
        }),
      })
    )
  })
})

describe("syncLiveAttendance — per-school thresholds (live-07)", () => {
  it("uses School.conferenceLateGraceMinutes instead of the 10-minute default", async () => {
    happySession()
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: null,
      school: { conferenceAttendanceSync: true, conferenceLateGraceMinutes: 2 },
    })

    // ON_TIME (uA) is START + 5 min — PRESENT under the 10-min default,
    // LATE under a school-configured 2-minute grace.
    await syncLiveAttendance("school1", "c1")

    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const a = rows.find((r) => r.studentId === "sA")!
    expect(a.status).toBe("LATE")
  })

  it("uses School.conferenceMinPresenceMinutes instead of the 5-minute default", async () => {
    happySession()
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: null,
      school: {
        conferenceAttendanceSync: true,
        conferenceMinPresenceMinutes: 8,
      },
    })
    // uA connects and drops after 6 minutes — over the 5-min default floor,
    // under an 8-minute school-configured floor.
    mockDb.conferenceParticipant.findMany.mockResolvedValue([
      {
        userId: "uA",
        joinedAt: ON_TIME,
        leftAt: new Date(ON_TIME.getTime() + 6 * 60_000),
        durationSeconds: null,
        activeSince: null,
      },
    ])

    await syncLiveAttendance("school1", "c1")

    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const a = rows.find((r) => r.studentId === "sA")!
    expect(a.status).toBe("ABSENT")
  })

  it("uses School.conferenceEarlyLeaveMinutes instead of the 10-minute default", async () => {
    happySession()
    mockDb.conference.findFirst.mockResolvedValue({
      id: "c1",
      provider: "livekit",
      sectionId: "sec1",
      timetableId: "tt1",
      scheduledStart: START,
      scheduledEnd: END,
      actualStart: null,
      school: {
        conferenceAttendanceSync: true,
        conferenceEarlyLeaveMinutes: 2,
      },
    })
    // "Early" means leaving BEFORE (scheduledEnd - earlyLeaveMinutes) — a
    // SMALLER window is STRICTER (catches more departures as early). Leaving
    // 5 minutes before the end is within the 10-min default grace (NOT
    // early there — see the sibling "not early" test above), but outside a
    // school-configured 2-minute grace.
    const leftAt = new Date(END.getTime() - 5 * 60_000)
    mockDb.conferenceParticipant.findMany.mockResolvedValue([
      {
        userId: "uA",
        joinedAt: ON_TIME,
        leftAt,
        durationSeconds: 30 * 60,
        activeSince: null,
      },
    ])

    await syncLiveAttendance("school1", "c1")

    const rows = mockDb.attendance.createMany.mock.calls[0][0].data as Array<
      Record<string, unknown>
    >
    const a = rows.find((r) => r.studentId === "sA")!
    expect(a.notes).toBe("auto: live-class presence · left early")
  })
})

describe("connectedSeconds", () => {
  const now = new Date("2026-03-03T08:00:00Z")
  it("legacy single-span rows still compute from joinedAt/leftAt", () => {
    expect(
      connectedSeconds(
        {
          joinedAt: new Date("2026-03-03T07:00:00Z"),
          leftAt: new Date("2026-03-03T07:30:00Z"),
          durationSeconds: null,
          activeSince: null,
        },
        now
      )
    ).toBe(30 * 60)
  })
  it("accumulated rows add the open span up to now", () => {
    expect(
      connectedSeconds(
        {
          joinedAt: new Date("2026-03-03T07:00:00Z"),
          leftAt: null,
          durationSeconds: 600,
          activeSince: new Date("2026-03-03T07:50:00Z"),
        },
        now
      )
    ).toBe(600 + 600)
  })
  it("a duplicate leave (no open span) adds nothing", () => {
    expect(
      connectedSeconds(
        {
          joinedAt: new Date("2026-03-03T07:00:00Z"),
          leftAt: new Date("2026-03-03T07:10:00Z"),
          durationSeconds: 600,
          activeSince: null,
        },
        now
      )
    ).toBe(600)
  })
})
