// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    timetable: { findMany: vi.fn() },
  },
}))
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
  new NextRequest(`http://localhost/api/mobile/teacher/schedule${query}`, {
    headers: { Authorization: "Bearer test" },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/mobile/teacher/schedule", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { GET } = await import("@/app/api/mobile/teacher/schedule/route")
    expect((await GET(get())).status).toBe(401)
  })

  it("403 for a STUDENT", async () => {
    await authAs("STUDENT")
    const { GET } = await import("@/app/api/mobile/teacher/schedule/route")
    expect((await GET(get())).status).toBe(403)
    expect(db.teacher.findFirst).not.toHaveBeenCalled()
  })

  it("404 when this school has no Teacher row for the user (another tenant's teacher)", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const { GET } = await import("@/app/api/mobile/teacher/schedule/route")
    expect((await GET(get())).status).toBe(404)
    expect(db.teacher.findFirst).toHaveBeenCalledWith({
      where: { userId: USER, schoolId: SCHOOL },
      select: { id: true },
    })
    expect(db.timetable.findMany).not.toHaveBeenCalled()
  })

  it("returns slots with section_id beside section_name, scoped to the school", async () => {
    await authAs("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        id: "tt1",
        dayOfWeek: 1,
        subject: { id: "sub1", name: "Math" },
        section: { id: "sec1", name: "10A", grade: { name: "Grade 10" } },
        classroom: { id: "r1", roomName: "R1" },
        period: {
          id: "p1",
          name: "Period 1",
          startTime: "08:00",
          endTime: "08:45",
        },
      },
      {
        id: "tt2",
        dayOfWeek: 1,
        subject: null,
        section: null,
        classroom: null,
        period: null,
      },
    ] as never)
    const { GET } = await import("@/app/api/mobile/teacher/schedule/route")
    const res = await GET(get("?day=1"))
    expect(res.status).toBe(200)
    expect(vi.mocked(db.timetable.findMany).mock.calls[0][0]).toMatchObject({
      where: { schoolId: SCHOOL, teacherId: "t1", dayOfWeek: 1 },
    })
    expect((await res.json()).data).toEqual([
      {
        id: "tt1",
        day_of_week: 1,
        subject_name: "Math",
        section_id: "sec1",
        section_name: "10A",
        grade_name: "Grade 10",
        classroom: "R1",
        period_name: "Period 1",
        start_time: "08:00",
        end_time: "08:45",
      },
      {
        id: "tt2",
        day_of_week: 1,
        subject_name: null,
        section_id: null,
        section_name: null,
        grade_name: null,
        classroom: null,
        period_name: null,
        start_time: null,
        end_time: null,
      },
    ])
  })
})
