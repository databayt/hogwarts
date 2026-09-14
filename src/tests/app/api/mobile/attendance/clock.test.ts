// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// The real clock-core runs: the route is only auth + DTO around it, so the
// shared rules (roles, registers, idempotency) are what is under test.
vi.mock("@/lib/db", () => ({
  db: {
    staffMember: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    staffTimesheetEntry: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    timesheetPeriod: { findFirst: vi.fn(), create: vi.fn() },
    timesheetEntry: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const USER = "user-1"
const URL = "http://localhost/api/mobile/attendance/clock"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const get = () =>
  new NextRequest(URL, { headers: { Authorization: "Bearer test" } })
const post = (body: unknown) =>
  new NextRequest(URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer test" },
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.staffMember.findFirst).mockResolvedValue(null)
  vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
  vi.mocked(db.staffTimesheetEntry.findMany).mockResolvedValue([] as never)
  vi.mocked(db.timesheetEntry.findMany).mockResolvedValue([] as never)
})

describe("/api/mobile/attendance/clock", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET, POST } =
      await import("@/app/api/mobile/attendance/clock/route")
    expect((await GET(get())).status).toBe(401)
    expect((await POST(post({ action: "in" }))).status).toBe(401)
  })

  it("a STUDENT: GET is available:false, POST is 403 and touches nothing", async () => {
    await authAs("STUDENT")
    const { GET, POST } =
      await import("@/app/api/mobile/attendance/clock/route")
    const status = await GET(get())
    expect(status.status).toBe(200)
    expect(await status.json()).toEqual({
      available: false,
      kind: null,
      checked_in_at: null,
      checked_out_at: null,
      today_hours: 0,
      week_hours: 0,
    })
    expect((await POST(post({ action: "in" }))).status).toBe(403)
    expect(db.staffMember.findFirst).not.toHaveBeenCalled()
    expect(db.staffTimesheetEntry.create).not.toHaveBeenCalled()
  })

  it("400 for a body without a valid action", async () => {
    await authAs("STAFF")
    const { POST } = await import("@/app/api/mobile/attendance/clock/route")
    expect((await POST(post({ action: "lunch" }))).status).toBe(400)
    expect((await POST(post({}))).status).toBe(400)
  })

  it("identity rows are looked up in the token's school only — none there means no clock", async () => {
    await authAs("TEACHER")
    const { GET, POST } =
      await import("@/app/api/mobile/attendance/clock/route")
    expect((await (await GET(get())).json()).available).toBe(false)
    const res = await POST(post({ action: "in" }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "NO_CLOCK_IDENTITY" })
    expect(db.teacher.findFirst).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, userId: USER },
      select: { id: true },
    })
    expect(db.staffMember.findFirst).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, userId: USER },
      select: { id: true },
    })
    expect(db.timesheetEntry.create).not.toHaveBeenCalled()
  })

  it("STAFF clocks in: creates today's PRESENT entry and returns the new state", async () => {
    await authAs("STAFF")
    vi.mocked(db.staffMember.findFirst).mockResolvedValue({
      id: "sm1",
    } as never)
    const checkIn = new Date("2026-09-14T05:00:00.000Z")
    vi.mocked(db.staffTimesheetEntry.findFirst)
      .mockResolvedValueOnce(null) // clock-in lookup
      .mockResolvedValueOnce({
        checkIn,
        checkOut: null,
        hoursWorked: null,
      } as never) // status read
    vi.mocked(db.staffTimesheetEntry.findMany).mockResolvedValue([
      { hoursWorked: 7.5 },
      { hoursWorked: 6.25 },
    ] as never)
    const { POST } = await import("@/app/api/mobile/attendance/clock/route")
    const res = await POST(post({ action: "in" }))
    expect(res.status).toBe(200)
    expect(db.staffTimesheetEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL,
        staffMemberId: "sm1",
        status: "PRESENT",
        checkIn: expect.any(Date),
      }),
    })
    expect(await res.json()).toEqual({
      available: true,
      kind: "staff",
      checked_in_at: checkIn.toISOString(),
      checked_out_at: null,
      today_hours: 0,
      week_hours: 13.75,
    })
  })

  it("TEACHER clock-out with no check-in today is 404 NOT_CHECKED_IN", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.timesheetEntry.findFirst).mockResolvedValue(null)
    const { POST } = await import("@/app/api/mobile/attendance/clock/route")
    const res = await POST(post({ action: "out" }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "NOT_CHECKED_IN" })
    expect(db.timesheetEntry.updateMany).not.toHaveBeenCalled()
  })

  it("TEACHER GET reads in/out from the finance timesheet notes", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.timesheetEntry.findFirst).mockResolvedValue({
      notes: "in:2026-09-14T05:00:00.000Z;out:2026-09-14T12:30:00.000Z",
      hoursWorked: 7.5,
    } as never)
    const { GET } = await import("@/app/api/mobile/attendance/clock/route")
    expect(await (await GET(get())).json()).toEqual({
      available: true,
      kind: "teacher",
      checked_in_at: "2026-09-14T05:00:00.000Z",
      checked_out_at: "2026-09-14T12:30:00.000Z",
      today_hours: 7.5,
      week_hours: 0,
    })
  })
})
