// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ComplianceProvider } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  getComplianceConfigForSchool,
  getParentContactSlaReport,
  listRecentSubmissions,
} from "@/components/school-dashboard/compliance/queries"

vi.mock("@/lib/db", () => ({
  db: {
    schoolComplianceConfig: { findUnique: vi.fn() },
    complianceSubmission: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    attendanceIntervention: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"

describe("compliance queries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getComplianceConfigForSchool", () => {
    it("returns null when no config exists for this school+provider", async () => {
      vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue(null)

      const result = await getComplianceConfigForSchool(SCHOOL)

      expect(result).toBeNull()
    })

    it("uses compound where schoolId_provider", async () => {
      vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue(null)

      await getComplianceConfigForSchool(SCHOOL, ComplianceProvider.ADEK_ESIS)

      expect(db.schoolComplianceConfig.findUnique).toHaveBeenCalledWith({
        where: {
          schoolId_provider: {
            schoolId: SCHOOL,
            provider: ComplianceProvider.ADEK_ESIS,
          },
        },
      })
    })

    it("maps row to DTO", async () => {
      vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
        id: "c1",
        schoolId: SCHOOL,
        provider: ComplianceProvider.ADEK_ESIS,
        enabled: true,
        mode: "DRY_RUN",
        submissionTimeUtc: "10:00",
        parentContactSlaMinutes: 120,
        notifyAdminOnFailure: true,
        sharedGroupId: null,
        lastSubmissionAt: null,
        lastSubmissionStatus: null,
      } as any)

      const result = await getComplianceConfigForSchool(SCHOOL)

      expect(result?.enabled).toBe(true)
      expect(result?.mode).toBe("DRY_RUN")
    })
  })

  describe("listRecentSubmissions", () => {
    it("scopes findMany by schoolId", async () => {
      vi.mocked(db.complianceSubmission.findMany).mockResolvedValue([])

      await listRecentSubmissions(SCHOOL, 30)

      expect(db.complianceSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL },
          take: 30,
        })
      )
    })

    it("uses default limit of 30 when not specified", async () => {
      vi.mocked(db.complianceSubmission.findMany).mockResolvedValue([])

      await listRecentSubmissions(SCHOOL)

      const call = vi.mocked(db.complianceSubmission.findMany).mock
        .calls[0]?.[0]
      expect(call?.take).toBe(30)
    })

    it("orders by submissionDate desc, attemptNumber desc", async () => {
      vi.mocked(db.complianceSubmission.findMany).mockResolvedValue([])

      await listRecentSubmissions(SCHOOL)

      const call = vi.mocked(db.complianceSubmission.findMany).mock
        .calls[0]?.[0]
      expect(call?.orderBy).toEqual([
        { submissionDate: "desc" },
        { attemptNumber: "desc" },
      ])
    })
  })

  describe("getParentContactSlaReport (ADEK 2h SLA evidence)", () => {
    const from = new Date("2026-05-01")
    const to = new Date("2026-05-31")

    it("returns zeroes when no absences in range", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const result = await getParentContactSlaReport(SCHOOL, from, to)

      expect(result).toEqual({
        totalAbsences: 0,
        contactedWithinSla: 0,
        contactedLate: 0,
        notContacted: 0,
      })
    })

    it("scopes both queries by schoolId", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          id: "a1",
          studentId: "s1",
          markedAt: new Date("2026-05-15T08:00:00Z"),
        },
      ] as any)
      vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([])

      await getParentContactSlaReport(SCHOOL, from, to)

      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL }),
        })
      )
      expect(db.attendanceIntervention.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL }),
        })
      )
    })

    it("counts contactedWithinSla when intervention < 2h after absence", async () => {
      const absenceTime = new Date("2026-05-15T08:00:00Z")
      const interventionTime = new Date("2026-05-15T09:30:00Z") // 90 min later

      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { id: "a1", studentId: "s1", markedAt: absenceTime },
      ] as any)
      vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([
        { studentId: "s1", createdAt: interventionTime },
      ] as any)

      const result = await getParentContactSlaReport(SCHOOL, from, to, 120)

      expect(result.contactedWithinSla).toBe(1)
      expect(result.contactedLate).toBe(0)
      expect(result.notContacted).toBe(0)
    })

    it("counts contactedLate when intervention > SLA", async () => {
      const absenceTime = new Date("2026-05-15T08:00:00Z")
      const interventionTime = new Date("2026-05-15T11:00:00Z") // 3h later

      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { id: "a1", studentId: "s1", markedAt: absenceTime },
      ] as any)
      vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([
        { studentId: "s1", createdAt: interventionTime },
      ] as any)

      const result = await getParentContactSlaReport(SCHOOL, from, to, 120)

      expect(result.contactedLate).toBe(1)
      expect(result.contactedWithinSla).toBe(0)
    })

    it("counts notContacted when no intervention", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          id: "a1",
          studentId: "s1",
          markedAt: new Date("2026-05-15T08:00:00Z"),
        },
      ] as any)
      vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([])

      const result = await getParentContactSlaReport(SCHOOL, from, to)

      expect(result.notContacted).toBe(1)
      expect(result.totalAbsences).toBe(1)
    })

    it("uses first contact (earliest createdAt) when multiple interventions for same student", async () => {
      const absenceTime = new Date("2026-05-15T08:00:00Z")
      const firstContact = new Date("2026-05-15T09:00:00Z") // within SLA
      const laterContact = new Date("2026-05-15T15:00:00Z") // outside SLA

      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { id: "a1", studentId: "s1", markedAt: absenceTime },
      ] as any)
      vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([
        { studentId: "s1", createdAt: firstContact },
        { studentId: "s1", createdAt: laterContact },
      ] as any)

      const result = await getParentContactSlaReport(SCHOOL, from, to, 120)

      expect(result.contactedWithinSla).toBe(1)
      expect(result.contactedLate).toBe(0)
    })
  })
})
