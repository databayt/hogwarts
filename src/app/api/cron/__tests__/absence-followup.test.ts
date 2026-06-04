// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getGuardiansForStudent } from "@/lib/guardian-utils"

import { GET } from "../absence-followup/route"

vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/compliance/audit-actions", () => ({
  ComplianceAudit: {
    PARENT_CONTACT_QUEUED: "compliance.parent_contact.queued",
  },
}))
vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    schoolComplianceConfig: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    attendanceIntervention: { create: vi.fn() },
  },
}))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn(),
}))
vi.mock("@/lib/guardian-utils", () => ({
  getGuardiansForStudent: vi.fn(),
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

describe("GET /api/cron/absence-followup (2h SLA)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.schoolComplianceConfig.findMany).mockResolvedValue([])
    vi.mocked(db.attendance.findMany).mockResolvedValue([])
    vi.mocked(getGuardiansForStudent).mockResolvedValue([])
  })

  it("returns 401 when not authorized", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(false)

    const res = await GET(new Request("http://x"))

    expect(res.status).toBe(401)
  })

  it("returns 200 with 0 counts when no schools have compliance enabled", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(db.schoolComplianceConfig.findMany).mockResolvedValue([])

    const res = await GET(new Request("http://x"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.schoolsScanned).toBe(0)
    expect(body.absencesScanned).toBe(0)
    expect(body.interventionsCreated).toBe(0)
  })

  it("dispatches notification + writes intervention when guardian found", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(db.schoolComplianceConfig.findMany).mockResolvedValue([
      {
        schoolId: "school-1",
        parentContactSlaMinutes: 120,
        school: { name: "Yasmina BA", preferredLanguage: "en" },
      },
    ] as any)
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      {
        id: "a1",
        studentId: "s1",
        classId: "c1",
        date: new Date(),
        markedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        student: {
          firstName: "Ahmed",
          middleName: null,
          lastName: "Hassan",
        },
      },
    ] as any)
    vi.mocked(getGuardiansForStudent).mockResolvedValue([
      { userId: "guardian-user-1", phoneNumber: null, email: null } as any,
    ])
    vi.mocked(dispatchNotification).mockResolvedValue(undefined as any)
    vi.mocked(db.attendanceIntervention.create).mockResolvedValue({
      id: "i1",
    } as any)

    const res = await GET(new Request("http://x"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.absencesScanned).toBe(1)
    expect(body.interventionsCreated).toBe(1)
    expect(dispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "absence_unreported_followup",
        channels: ["in_app", "email", "whatsapp"],
      })
    )
    expect(db.attendanceIntervention.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school-1",
          studentId: "s1",
          parentNotified: true,
          contactMethod: "in_app+email+whatsapp",
          contactResult: "dispatched",
        }),
      })
    )
  })

  it("skips intervention when no guardians available", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(db.schoolComplianceConfig.findMany).mockResolvedValue([
      {
        schoolId: "school-1",
        parentContactSlaMinutes: 120,
        school: { name: "X", preferredLanguage: "ar" },
      },
    ] as any)
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      {
        id: "a1",
        studentId: "s1",
        classId: "c1",
        date: new Date(),
        markedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        student: { firstName: "X", middleName: null, lastName: "Y" },
      },
    ] as any)
    vi.mocked(getGuardiansForStudent).mockResolvedValue([])

    const res = await GET(new Request("http://x"))
    const body = await res.json()

    expect(body.absencesScanned).toBe(1)
    expect(body.interventionsCreated).toBe(0)
    expect(db.attendanceIntervention.create).not.toHaveBeenCalled()
  })

  it("uses Arabic title/body when school preferredLanguage = ar", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(db.schoolComplianceConfig.findMany).mockResolvedValue([
      {
        schoolId: "school-1",
        parentContactSlaMinutes: 120,
        school: { name: "X", preferredLanguage: "ar" },
      },
    ] as any)
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      {
        id: "a1",
        studentId: "s1",
        classId: "c1",
        date: new Date(),
        markedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        student: { firstName: "Ahmed", middleName: null, lastName: "Hassan" },
      },
    ] as any)
    vi.mocked(getGuardiansForStudent).mockResolvedValue([
      { userId: "g1" } as any,
    ])
    vi.mocked(dispatchNotification).mockResolvedValue(undefined as any)

    await GET(new Request("http://x"))

    const call = vi.mocked(dispatchNotification).mock.calls[0]?.[0]
    expect(call?.lang).toBe("ar")
    expect(call?.title).toMatch(/غياب/)
  })

  it("returns 500 on internal failure", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(db.schoolComplianceConfig.findMany).mockRejectedValue(
      new Error("db down")
    )

    const res = await GET(new Request("http://x"))

    expect(res.status).toBe(500)
  })
})
