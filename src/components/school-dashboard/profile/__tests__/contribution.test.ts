// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getContributionData } from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    student: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    attendance: { findMany: vi.fn() },
    assignmentSubmission: { findMany: vi.fn() },
    result: { findMany: vi.fn() },
    borrowRecord: { findMany: vi.fn() },
    payment: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    timesheetEntry: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

const SCHOOL_ID = "school-1"
const USER_ID = "user-1"

function asAuthed(role = "STUDENT") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role, email: "u@school.edu" },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
    role,
    locale: "en",
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const m of [
    db.attendance,
    db.assignmentSubmission,
    db.result,
    db.borrowRecord,
    db.payment,
    db.message,
    db.timesheetEntry,
    db.expense,
  ]) {
    vi.mocked(m.findMany).mockResolvedValue([] as never)
  }
})

describe("getContributionData", () => {
  it("rejects unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await getContributionData()
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("NOT_AUTHENTICATED")
  })

  it("rejects callers without school context", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER_ID, role: "DEVELOPER" },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      subdomain: null,
      role: "DEVELOPER",
      locale: "en",
    } as never)
    const res = await getContributionData()
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("MISSING_SCHOOL")
  })

  it("rejects years before 2020", async () => {
    asAuthed()
    const res = await getContributionData({ year: 2019 })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("VALIDATION_ERROR")
  })

  it("rejects years too far in the future", async () => {
    asAuthed()
    const res = await getContributionData({
      year: new Date().getFullYear() + 5,
    })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("VALIDATION_ERROR")
  })

  it("returns NOT_FOUND when the user does not exist", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    const res = await getContributionData({ userId: "missing" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("NOT_FOUND")
  })

  it("returns UNKNOWN when the role is not mappable to a profile role", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "USER" } as never)
    const res = await getContributionData({ userId: USER_ID })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("UNKNOWN")
  })

  it("returns a 365-or-366 day contribution map for the requested year", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)

    const res = await getContributionData({ userId: USER_ID, year: 2025 })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.year).toBe(2025)
    expect(res.data.role).toBe("student")
    // 2025 is not a leap year — exactly 365 days
    expect(res.data.contributions).toHaveLength(365)
    expect(res.data.contributions[0].date).toBe("2025-01-01")
    expect(res.data.contributions[364].date).toBe("2025-12-31")
  })

  it("includes 366 days for leap years", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)

    const res = await getContributionData({ userId: USER_ID, year: 2024 })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.contributions).toHaveLength(366)
  })

  it("aggregates student attendance/submissions/results into the map", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { date: new Date("2025-01-15") },
      { date: new Date("2025-01-15") },
    ] as never)
    vi.mocked(db.assignmentSubmission.findMany).mockResolvedValue([
      { submittedAt: new Date("2025-01-15") },
    ] as never)
    vi.mocked(db.result.findMany).mockResolvedValue([
      { gradedAt: new Date("2025-01-20") },
    ] as never)

    const res = await getContributionData({ userId: USER_ID, year: 2025 })
    expect(res.success).toBe(true)
    if (!res.success) return

    const day15 = res.data.contributions.find((d) => d.date === "2025-01-15")
    expect(day15).toBeDefined()
    expect(day15!.count).toBe(3) // 2 attendance + 1 submission
    expect(day15!.activities.find((a) => a.type === "attendance")?.count).toBe(
      2
    )
    expect(
      day15!.activities.find((a) => a.type === "assignment_submitted")?.count
    ).toBe(1)

    expect(res.data.totalActivities).toBe(4)
  })

  it("computes summary streaks correctly", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    // Three consecutive days with activity
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { date: new Date("2025-06-01") },
      { date: new Date("2025-06-02") },
      { date: new Date("2025-06-03") },
    ] as never)

    const res = await getContributionData({ userId: USER_ID, year: 2025 })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.summary.activeDays).toBe(3)
    expect(res.data.summary.longestStreak).toBe(3)
    expect(res.data.summary.peakDay).toBeDefined()
    expect(res.data.summary.peakDay!.count).toBe(1)
  })

  it("returns an empty contribution map when the role record is missing", async () => {
    asAuthed("STUDENT")
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue(null)

    const res = await getContributionData({ userId: USER_ID, year: 2025 })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.totalActivities).toBe(0)
    expect(res.data.summary.activeDays).toBe(0)
  })

  it("uses the current year when none is supplied", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    const res = await getContributionData({ userId: USER_ID })
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.year).toBe(new Date().getFullYear())
  })
})
