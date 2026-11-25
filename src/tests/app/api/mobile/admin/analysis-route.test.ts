// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { adminReadinessOverview, classAttendanceRate, loadMemberReadiness } =
  vi.hoisted(() => ({
    adminReadinessOverview: vi.fn(),
    classAttendanceRate: vi.fn(),
    loadMemberReadiness: vi.fn(),
  }))

vi.mock("@/components/school-dashboard/dashboard/queries", () => ({
  adminReadinessOverview,
}))
vi.mock("@/components/school-dashboard/school/readiness/attendance", () => ({
  classAttendanceRate,
}))
vi.mock("@/components/school-dashboard/school/readiness/queries", () => ({
  loadMemberReadiness,
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

import { GET } from "@/app/api/mobile/admin/analysis/route"

async function authAs(role: string) {
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: "u1",
    email: "u@e.com",
    schoolId: "s1",
    role,
  })
}

const req = () =>
  new NextRequest("http://localhost/api/mobile/admin/analysis", {
    headers: { Authorization: "Bearer t" },
  })

const row = (
  name: string,
  level: string,
  reasons: string[],
  client: string,
  pushOn: boolean,
  lastSeenAt: Date | null
) => ({
  userId: name,
  name,
  username: name,
  role: "STUDENT",
  sectionName: "1A",
  readiness: { level, reasons },
  device: { client },
  pushOn,
  lastSeenAt,
})

beforeEach(() => {
  vi.clearAllMocks()
  adminReadinessOverview.mockResolvedValue({
    attendance: [{ date: "2026-11-24", joined: 8, expected: 10 }],
    joinsByDay: [{ date: "2026-11-24", app: 5, androidWeb: 2, desktop: 1 }],
    readinessPercent: 50,
    members: 3,
    attention: [],
    hasClassData: true,
  })
  classAttendanceRate.mockResolvedValue({ rate: 80, expected: 10, joined: 8 })
  loadMemberReadiness.mockResolvedValue([
    row("A", "ok", ["on_app"], "app", true, new Date()),
    row("B", "bad", ["never_signed_in"], "none", false, null),
    row("C", "warn", ["push_off"], "app", false, new Date(0)),
  ])
})

describe("GET /api/mobile/admin/analysis", () => {
  it("admin gets the report shape", async () => {
    await authAs("ADMIN")
    const res = await GET(req())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(classAttendanceRate).toHaveBeenCalledWith("s1", 14, expect.any(Date))
    expect(body.attendanceRate14d).toBe(80)
    expect(body.readinessPct).toBe(50)
    expect(body.attendanceByDay).toEqual([
      { date: "2026-11-24", joined: 8, expected: 10 },
    ])
    expect(body.joinsByDay).toEqual([
      { date: "2026-11-24", app: 5, androidWeb: 2, computer: 1 },
    ])
    expect(body.counts).toEqual({ members: 3, onApp: 2, pushOn: 1, active7d: 1 })
    expect(body.needsAttention.map((m: { name: string }) => m.name)).toEqual([
      "B",
      "C",
    ])
    expect(body.needsAttention[0]).toMatchObject({
      userId: "B",
      role: "STUDENT",
      sectionName: "1A",
      level: "bad",
      reasons: ["never_signed_in"],
    })
  })

  it("null rate and no members stay safe", async () => {
    await authAs("DEVELOPER")
    classAttendanceRate.mockResolvedValue({ rate: null, expected: 0, joined: 0 })
    adminReadinessOverview.mockResolvedValue({
      attendance: [],
      joinsByDay: [],
      readinessPercent: null,
      members: 0,
      attention: [],
      hasClassData: false,
    })
    loadMemberReadiness.mockResolvedValue([])
    const body = await (await GET(req())).json()
    expect(body.attendanceRate14d).toBeNull()
    expect(body.readinessPct).toBe(0)
    expect(body.needsAttention).toEqual([])
  })

  it("teacher and student get 403 without loading anything", async () => {
    for (const role of ["TEACHER", "STUDENT"]) {
      await authAs(role)
      expect((await GET(req())).status).toBe(403)
    }
    expect(adminReadinessOverview).not.toHaveBeenCalled()
  })
})
