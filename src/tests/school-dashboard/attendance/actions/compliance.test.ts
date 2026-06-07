// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getComplianceDashboard,
  getComplianceReport,
  getScheduledReports,
} from "@/components/school-dashboard/attendance/actions/compliance"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    attendanceReport: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    student: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    attendanceIntervention: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    attendancePolicy: {
      findMany: vi.fn(),
    },
    policyTrigger: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

const SCHOOL = "school-1"

function mockAuth(role = "ADMIN", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", schoolId, role },
  } as any)
}

describe("attendance compliance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
    vi.mocked(db.attendance.count).mockResolvedValue(0)
    vi.mocked(db.attendance.findMany).mockResolvedValue([])
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
    vi.mocked(db.student.count).mockResolvedValue(0)
    vi.mocked(db.student.findMany).mockResolvedValue([])
    vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([])
    vi.mocked(db.attendanceIntervention.count).mockResolvedValue(0)
    vi.mocked(db.policyTrigger.findMany).mockResolvedValue([])
    vi.mocked(db.policyTrigger.count).mockResolvedValue(0)
    vi.mocked(db.attendanceReport.findMany).mockResolvedValue([])
  })

  describe("getComplianceDashboard", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getComplianceDashboard()

      expect(result.success).toBe(false)
    })
  })

  describe("getComplianceReport", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getComplianceReport({})

      expect(result.success).toBe(false)
    })
  })

  describe("getScheduledReports", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getScheduledReports()

      expect(result.success).toBe(false)
    })

    it("scopes report list by schoolId", async () => {
      await getScheduledReports()

      const calls = vi.mocked(db.attendanceReport.findMany).mock.calls
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })
})
