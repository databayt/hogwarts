// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// The real attendance/queries.ts runs against a mocked db, so the route is
// tested through the same loaders the web overview reads.
vi.mock("@/lib/db", () => ({
  db: {
    class: { findMany: vi.fn() },
    schoolWeekConfig: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    attendanceExcuse: { findMany: vi.fn() },
    teacher: { findFirst: vi.fn() },
    classTeacher: { findMany: vi.fn() },
  },
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const SCHOOL = "school-1"
const USER = "user-1"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role,
  })
}

const get = (query = "") =>
  new NextRequest(`http://localhost/api/mobile/attendance/today${query}`, {
    headers: { Authorization: "Bearer test" },
  })

function daysAgo(n: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

const student = (first: string) => ({ firstName: first, lastName: "Test" })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.class.findMany).mockResolvedValue([])
  vi.mocked(db.schoolWeekConfig.findMany).mockResolvedValue([])
  vi.mocked(db.attendance.findMany).mockResolvedValue([])
  vi.mocked(db.attendanceExcuse.findMany).mockResolvedValue([])
})

describe("GET /api/mobile/attendance/today", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/attendance/today/route")
    expect((await GET(get())).status).toBe(401)
  })

  it("403 for TEACHER, STUDENT and GUARDIAN", async () => {
    const { GET } = await import("@/app/api/mobile/attendance/today/route")
    for (const role of ["TEACHER", "STUDENT", "GUARDIAN"]) {
      await authAs(role)
      expect((await GET(get())).status).toBe(403)
    }
    expect(db.attendance.findMany).not.toHaveBeenCalled()
  })

  it("every query is scoped to the token's school — another school's data never enters", async () => {
    await authAs("STAFF")
    const { GET } = await import("@/app/api/mobile/attendance/today/route")
    const res = await GET(get())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.unmarked_classes).toEqual([])
    expect(body.needs_attention).toEqual([])
    expect(body.recent_activity).toEqual([])

    const calls = [
      ...vi.mocked(db.class.findMany).mock.calls,
      ...vi.mocked(db.schoolWeekConfig.findMany).mock.calls,
      ...vi.mocked(db.attendance.findMany).mock.calls,
      ...vi.mocked(db.attendanceExcuse.findMany).mock.calls,
    ]
    expect(calls.length).toBeGreaterThanOrEqual(6)
    for (const [args] of calls) {
      expect((args as { where: { schoolId: string } }).where.schoolId).toBe(
        SCHOOL
      )
    }
    // Admin-side roles see the whole school: no teacher class lookup.
    expect(db.teacher.findFirst).not.toHaveBeenCalled()
  })

  it("returns progress, unmarked pills, needs-attention and recent activity in snake_case", async () => {
    await authAs("ADMIN")
    const markedAt = new Date("2026-09-14T05:10:00.000Z")
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "c1", name: "10A", _count: { studentClasses: 20 } },
      { id: "c2", name: "10B", _count: { studentClasses: 18 } },
      { id: "c3", name: "Empty", _count: { studentClasses: 0 } },
    ] as never)
    vi.mocked(db.attendance.findMany).mockImplementation(((args: {
      where: { status?: string }
      take?: number
    }) => {
      if (args.take === 10) {
        return Promise.resolve([
          {
            id: "a1",
            status: "PRESENT",
            markedAt,
            method: "MANUAL",
            date: daysAgo(0),
            student: student("Sara"),
            class: { name: "10A" },
          },
        ])
      }
      if (args.where.status === "ABSENT") {
        return Promise.resolve(
          [0, 1, 2].map((n) => ({
            studentId: "s9",
            date: daysAgo(n),
            student: student("Omar"),
            class: { name: "10A" },
          }))
        )
      }
      return Promise.resolve([
        {
          id: "a1",
          classId: "c1",
          studentId: "s1",
          status: "PRESENT",
          markedAt,
        },
        { id: "a2", classId: "c1", studentId: "s2", status: "LATE", markedAt },
      ])
    }) as never)
    vi.mocked(db.attendanceExcuse.findMany).mockResolvedValue([
      {
        id: "e1",
        attendance: {
          studentId: "s7",
          date: daysAgo(1),
          student: student("Huda"),
          class: { name: "10B" },
        },
      },
    ] as never)

    const { GET } = await import("@/app/api/mobile/attendance/today/route")
    const body = await (await GET(get("?limit=5"))).json()

    expect(body.today).toEqual({
      date: expect.any(String),
      day_name: expect.any(String),
      is_school_day: true,
    })
    expect(body.stats).toEqual({
      total_students: 38,
      marked_today: 2,
      present: 1,
      absent: 0,
      late: 1,
      attendance_rate: 100,
      classes_total: 2,
      classes_marked: 1,
    })
    expect(body.unmarked_classes).toEqual([
      { id: "c2", name: "10B", student_count: 18 },
    ])
    expect(body.needs_attention).toEqual([
      {
        student_id: "s9",
        student_name: "Omar Test",
        class_name: "10A",
        issue: "consecutive_absence",
        severity: "warning",
        details: "Absent 3 consecutive days",
        count: 3,
        date: null,
        action_url: "/students/s9",
      },
      {
        student_id: "s7",
        student_name: "Huda Test",
        class_name: "10B",
        issue: "unexcused_pending",
        severity: "info",
        details: expect.any(String),
        count: null,
        date: daysAgo(1).toISOString(),
        action_url: "/attendance/excuses",
      },
    ])
    expect(body.needs_attention_summary).toEqual({
      critical: 0,
      warning: 1,
      info: 1,
    })
    expect(body.recent_activity).toEqual([
      {
        id: "a1",
        student_name: "Sara Test",
        class_name: "10A",
        status: "PRESENT",
        method: "MANUAL",
        date: daysAgo(0).toISOString(),
        time: expect.any(String),
        marked_at: markedAt.toISOString(),
      },
    ])
  })
})
