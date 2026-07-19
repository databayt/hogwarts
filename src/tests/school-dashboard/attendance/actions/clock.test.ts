// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  clockIn,
  clockOut,
  getMyClockStatus,
} from "@/components/school-dashboard/attendance/actions/clock"

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

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))

const SCHOOL = "school-1"

function mockAuth(role = "STAFF", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as never,
    locale: "en",
  } as never)
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", schoolId, role },
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth("STAFF")
  vi.mocked(db.staffMember.findFirst).mockResolvedValue(null)
  vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
  vi.mocked(db.staffTimesheetEntry.findMany).mockResolvedValue([] as never)
  vi.mocked(db.timesheetEntry.findMany).mockResolvedValue([] as never)
})

describe("clock identity + gates", () => {
  it("rejects STUDENT role", async () => {
    mockAuth("STUDENT")
    const result = await clockIn()
    expect(result.success).toBe(false)
  })

  it("getMyClockStatus reports unavailable (not an error) when no identity row exists", async () => {
    const result = await getMyClockStatus()
    expect(result.success).toBe(true)
    if (result.success) expect(result.data!.available).toBe(false)
  })

  it("clockIn errors when no identity row exists", async () => {
    const result = await clockIn()
    expect(result.success).toBe(false)
  })
})

describe("staff clock (StaffTimesheetEntry)", () => {
  beforeEach(() => {
    vi.mocked(db.staffMember.findFirst).mockResolvedValue({
      id: "sm1",
    } as never)
  })

  it("clockIn creates today's entry with checkIn + PRESENT", async () => {
    vi.mocked(db.staffTimesheetEntry.findFirst).mockResolvedValue(null)
    const result = await clockIn()
    expect(result.success).toBe(true)
    expect(db.staffTimesheetEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL,
          staffMemberId: "sm1",
          status: "PRESENT",
          checkIn: expect.any(Date),
        }),
      })
    )
  })

  it("clockIn is idempotent when already checked in", async () => {
    vi.mocked(db.staffTimesheetEntry.findFirst).mockResolvedValue({
      id: "e1",
      checkIn: new Date(),
    } as never)
    const result = await clockIn()
    expect(result.success).toBe(true)
    expect(db.staffTimesheetEntry.create).not.toHaveBeenCalled()
    expect(db.staffTimesheetEntry.updateMany).not.toHaveBeenCalled()
  })

  it("clockOut computes hoursWorked from checkIn, tenant-scoped", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000)
    vi.mocked(db.staffTimesheetEntry.findFirst).mockResolvedValue({
      id: "e1",
      checkIn: twoHoursAgo,
      checkOut: null,
    } as never)
    const result = await clockOut()
    expect(result.success).toBe(true)
    const call = vi.mocked(db.staffTimesheetEntry.updateMany).mock.calls[0][0]
    expect(call.where).toMatchObject({ id: "e1", schoolId: SCHOOL })
    expect(call.data.checkOut).toBeInstanceOf(Date)
    expect(Number(call.data.hoursWorked)).toBeCloseTo(2, 1)
  })

  it("clockOut without a check-in returns an error", async () => {
    vi.mocked(db.staffTimesheetEntry.findFirst).mockResolvedValue(null)
    const result = await clockOut()
    expect(result.success).toBe(false)
  })
})

describe("teacher clock (finance TimesheetEntry)", () => {
  beforeEach(() => {
    mockAuth("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
  })

  it("clockIn creates a month period when none is open, then a DRAFT 0h entry", async () => {
    vi.mocked(db.timesheetPeriod.findFirst).mockResolvedValue(null)
    vi.mocked(db.timesheetPeriod.create).mockResolvedValue({
      id: "p1",
    } as never)
    vi.mocked(db.timesheetEntry.findFirst).mockResolvedValue(null)

    const result = await clockIn()
    expect(result.success).toBe(true)
    expect(db.timesheetPeriod.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL,
          status: "OPEN",
        }),
      })
    )
    expect(db.timesheetEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL,
          periodId: "p1",
          teacherId: "t1",
          hoursWorked: 0,
          status: "DRAFT",
          notes: expect.stringMatching(/^in:/),
        }),
      })
    )
  })

  it("clockIn reuses an existing OPEN period covering today", async () => {
    vi.mocked(db.timesheetPeriod.findFirst).mockResolvedValue({
      id: "p-open",
    } as never)
    vi.mocked(db.timesheetEntry.findFirst).mockResolvedValue(null)
    const result = await clockIn()
    expect(result.success).toBe(true)
    expect(db.timesheetPeriod.create).not.toHaveBeenCalled()
    expect(db.timesheetEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ periodId: "p-open" }),
      })
    )
  })

  it("clockOut computes hours from the notes check-in and appends out:", async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000)
    vi.mocked(db.timesheetEntry.findFirst).mockResolvedValue({
      id: "te1",
      notes: `in:${threeHoursAgo.toISOString()}`,
    } as never)
    const result = await clockOut()
    expect(result.success).toBe(true)
    const call = vi.mocked(db.timesheetEntry.updateMany).mock.calls[0][0]
    expect(call.where).toMatchObject({ id: "te1", schoolId: SCHOOL })
    expect(Number(call.data.hoursWorked)).toBeCloseTo(3, 1)
    expect(String(call.data.notes)).toMatch(/^in:.*;out:/)
  })

  it("teacher status parses in/out times from notes", async () => {
    const inIso = "2026-07-19T05:00:00.000Z"
    vi.mocked(db.timesheetEntry.findFirst).mockResolvedValue({
      notes: `in:${inIso}`,
      hoursWorked: 0,
    } as never)
    const result = await getMyClockStatus()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data!.kind).toBe("teacher")
      expect(result.data!.checkedInAt).toBe(inIso)
      expect(result.data!.checkedOutAt).toBeNull()
    }
  })
})
