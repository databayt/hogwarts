// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// One closure predicate, read by three callers that react differently: the
// conference sweep and the transport cron suppress, the timetable read path
// informs. What is locked here is the predicate itself — the day window it
// tests and the shape it hands back.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  findSchoolClosure,
  isSchoolClosedOn,
} from "@/components/school-dashboard/live/school-calendar"

vi.mock("@/lib/db", () => ({
  db: { scheduleException: { findFirst: vi.fn() } },
}))

const SCHOOL = "school-1"
const TZ = "Africa/Khartoum" // UTC+2, no DST

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.scheduleException.findFirst).mockResolvedValue(null as never)
})

describe("findSchoolClosure", () => {
  it("returns the closure with its title, for the UI to name", async () => {
    vi.mocked(db.scheduleException.findFirst).mockResolvedValue({
      title: "عيد الفطر",
      exceptionType: "HOLIDAY",
    } as never)

    await expect(
      findSchoolClosure(SCHOOL, TZ, new Date("2026-03-10T09:00:00Z"))
    ).resolves.toEqual({ title: "عيد الفطر", exceptionType: "HOLIDAY" })
  })

  it("tests overlap against the SCHOOL-calendar day, not the raw instant", async () => {
    // 2026-03-10 in Africa/Khartoum runs 2026-03-09T22:00Z → 2026-03-10T22:00Z.
    // A holiday stored as a bare date still has to cover the whole of it.
    await findSchoolClosure(SCHOOL, TZ, new Date("2026-03-10T21:30:00Z"))

    const where = vi.mocked(db.scheduleException.findFirst).mock.calls[0]?.[0]
      ?.where as {
      schoolId: string
      exceptionType: { in: string[] }
      startDate: { lt: Date }
      endDate: { gte: Date }
    }
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.exceptionType.in).toEqual(["HOLIDAY", "CANCELLED"])
    expect(where.startDate.lt.toISOString()).toBe("2026-03-10T22:00:00.000Z")
    expect(where.endDate.gte.toISOString()).toBe("2026-03-09T22:00:00.000Z")
  })

  it("only treats HOLIDAY and CANCELLED as closed", async () => {
    // EVENT and MODIFIED_SCHEDULE are still teaching days.
    await findSchoolClosure(SCHOOL, TZ)
    const where = vi.mocked(db.scheduleException.findFirst).mock.calls[0]?.[0]
      ?.where as { exceptionType: { in: string[] } }
    expect(where.exceptionType.in).not.toContain("EVENT")
    expect(where.exceptionType.in).not.toContain("MODIFIED_SCHEDULE")
  })

  it("is deterministic when two exceptions overlap one day", async () => {
    await findSchoolClosure(SCHOOL, TZ)
    expect(
      vi.mocked(db.scheduleException.findFirst).mock.calls[0]?.[0]?.orderBy
    ).toEqual({ startDate: "asc" })
  })
})

describe("isSchoolClosedOn", () => {
  it("collapses the closure to the boolean the write side wants", async () => {
    expect(await isSchoolClosedOn(SCHOOL, TZ)).toBe(false)

    vi.mocked(db.scheduleException.findFirst).mockResolvedValue({
      title: "عيد",
      exceptionType: "CANCELLED",
    } as never)
    expect(await isSchoolClosedOn(SCHOOL, TZ)).toBe(true)
  })
})
