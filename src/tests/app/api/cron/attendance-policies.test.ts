// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { GET } from "@/app/api/cron/attendance-policies/route"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
    attendance: { groupBy: vi.fn() },
    policyTrigger: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    policyExemption: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn(),
}))
vi.mock("next/server", async () => {
  const real =
    await vi.importActual<typeof import("next/server")>("next/server")
  return {
    ...real,
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) =>
        new Response(JSON.stringify(data), { status: init?.status ?? 200 }),
    },
  }
})

const SECRET = "test-cron-secret"

function authedRequest() {
  return new Request("http://x", {
    headers: { authorization: `Bearer ${SECRET}` },
  })
}

describe("GET /api/cron/attendance-policies (nightly threshold eval)", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = SECRET
    vi.mocked(db.school.findMany).mockResolvedValue([])
    vi.mocked(db.term.findFirst).mockResolvedValue(null)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
    vi.mocked(db.policyTrigger.findMany).mockResolvedValue([])
    vi.mocked(db.policyTrigger.create).mockResolvedValue({} as any)
    vi.mocked(db.policyTrigger.createMany).mockResolvedValue({
      count: 0,
    } as any)
    vi.mocked(db.policyExemption.findMany).mockResolvedValue([])
    vi.mocked(db.user.findMany).mockResolvedValue([])
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("returns 401 when authorization header missing", async () => {
    const res = await GET(new Request("http://x"))

    expect(res.status).toBe(401)
  })

  it("returns 401 when authorization header is wrong", async () => {
    const res = await GET(
      new Request("http://x", {
        headers: { authorization: "Bearer wrong" },
      })
    )

    expect(res.status).toBe(401)
  })

  it("returns 200 with 0 counts when no active schools", async () => {
    const res = await GET(authedRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.schoolsProcessed).toBe(0)
  })

  it("skips schools with no active term", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "School 1" },
    ] as any)
    vi.mocked(db.term.findFirst).mockResolvedValue(null)

    const res = await GET(authedRequest())
    const body = await res.json()

    expect(body.schoolsProcessed).toBe(1)
    expect(body.studentsEvaluated).toBe(0)
    expect(db.attendance.groupBy).not.toHaveBeenCalled()
  })

  it("creates Tier 1 trigger at 3 absences (lowest threshold)", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "School 1" },
    ] as any)
    vi.mocked(db.term.findFirst).mockResolvedValue({
      startDate: new Date("2026-01-01"),
    } as any)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { studentId: "student-1", _count: 3 },
    ] as any)
    vi.mocked(db.policyTrigger.create).mockResolvedValue({ id: "t1" } as any)

    const res = await GET(authedRequest())
    const body = await res.json()

    expect(body.triggersCreated).toBe(1)
    // Triggers are now flushed as a batched createMany (array payload).
    const createManyCall = vi.mocked(db.policyTrigger.createMany).mock
      .calls[0]?.[0]
    expect((createManyCall?.data as any[])[0]).toMatchObject({
      schoolId: "s1",
      studentId: "student-1",
      tier: 1,
      action: "NOTIFICATION",
    })
  })

  it("creates Tier 4 trigger at 15 absences (highest threshold)", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "S1" },
    ] as any)
    vi.mocked(db.term.findFirst).mockResolvedValue({
      startDate: new Date("2026-01-01"),
    } as any)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { studentId: "student-1", _count: 15 },
    ] as any)

    const res = await GET(authedRequest())
    const body = await res.json()

    expect(body.triggersCreated).toBe(1)
    const call = vi.mocked(db.policyTrigger.createMany).mock.calls[0]?.[0]
    expect((call?.data as any[])[0]?.tier).toBe(4)
    expect((call?.data as any[])[0]?.action).toBe("REFERRAL")
  })

  it("skips exempt students", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "S1" },
    ] as any)
    vi.mocked(db.term.findFirst).mockResolvedValue({
      startDate: new Date("2026-01-01"),
    } as any)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { studentId: "exempt-student", _count: 10 },
    ] as any)
    vi.mocked(db.policyExemption.findMany).mockResolvedValue([
      { studentId: "exempt-student" },
    ] as any)

    const res = await GET(authedRequest())
    const body = await res.json()

    expect(body.studentsEvaluated).toBe(1)
    expect(body.triggersCreated).toBe(0)
    expect(db.policyTrigger.create).not.toHaveBeenCalled()
  })

  it("idempotency — skips existing triggers", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "S1" },
    ] as any)
    vi.mocked(db.term.findFirst).mockResolvedValue({
      startDate: new Date("2026-01-01"),
    } as any)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { studentId: "student-1", _count: 10 },
    ] as any)
    vi.mocked(db.policyTrigger.findMany).mockResolvedValue([
      { studentId: "student-1", policyId: "default", tier: 3 },
    ] as any)

    const res = await GET(authedRequest())
    const body = await res.json()

    // No new trigger because tier 3 already exists
    expect(body.triggersCreated).toBe(0)
  })

  it("notifies admins on tier 3+ trigger creation", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1", name: "S1" },
    ] as any)
    vi.mocked(db.term.findFirst).mockResolvedValue({
      startDate: new Date("2026-01-01"),
    } as any)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { studentId: "student-1", _count: 10 },
    ] as any)
    vi.mocked(db.user.findMany).mockResolvedValue([{ id: "admin-1" }] as any)

    await GET(authedRequest())

    expect(dispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: "s1",
        userId: "admin-1",
        type: "attendance_alert",
        priority: "high",
      })
    )
  })

  it("returns 500 on internal failure", async () => {
    vi.mocked(db.school.findMany).mockRejectedValue(new Error("db down"))

    const res = await GET(authedRequest())

    expect(res.status).toBe(500)
  })
})
