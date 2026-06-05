// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Progress-schedule action tests.
 *
 * Confirms tenant isolation on every CRUD path so a teacher cannot read or
 * mutate another school's progress-report schedules.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createProgressSchedule,
  deleteProgressSchedule,
  getProgressSchedule,
  getProgressSchedules,
  updateProgressSchedule,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    progressReportSchedule: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_ID = "school-prog-1"
const USER_ID = "user-prog-1"
const VALID_INPUT = {
  classId: "class-1",
  frequency: "WEEKLY" as const,
  includeExamResults: true,
  includeAttendance: true,
  includeAssignments: false,
  includeBehavior: false,
  recipientTypes: ["GUARDIAN"],
  channels: ["EMAIL"],
}

describe("Progress Schedule Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    } as any)
  })

  describe("createProgressSchedule", () => {
    it("rejects when no schoolId in tenant context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      const result = await createProgressSchedule(VALID_INPUT)

      expect(result.success).toBe(false)
      expect(db.progressReportSchedule.create).not.toHaveBeenCalled()
    })

    it("validates classId belongs to the school", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue(null)

      const result = await createProgressSchedule(VALID_INPUT)

      expect(result.success).toBe(false)
      expect(db.class.findFirst).toHaveBeenCalledWith({
        where: { id: "class-1", schoolId: SCHOOL_ID },
      })
      expect(db.progressReportSchedule.create).not.toHaveBeenCalled()
    })

    it("creates schedule with schoolId in payload", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.progressReportSchedule.create).mockResolvedValue({
        id: "sched-1",
      } as any)

      const result = await createProgressSchedule(VALID_INPUT)

      expect(result.success).toBe(true)
      expect(db.progressReportSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: SCHOOL_ID,
            createdBy: USER_ID,
          }),
        })
      )
    })

    it("calculates correct nextRunAt for WEEKLY frequency", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.progressReportSchedule.create).mockResolvedValue({
        id: "sched-1",
      } as any)

      await createProgressSchedule(VALID_INPUT)

      const call = vi.mocked(db.progressReportSchedule.create).mock.calls[0][0]
      const nextRun = (call.data as any).nextRunAt as Date
      const expected = new Date()
      expected.setDate(expected.getDate() + 7)
      const diffMs = Math.abs(nextRun.getTime() - expected.getTime())
      // Allow 5s drift for test execution
      expect(diffMs).toBeLessThan(5000)
    })
  })

  describe("getProgressSchedules", () => {
    it("filters by schoolId", async () => {
      vi.mocked(db.progressReportSchedule.findMany).mockResolvedValue([])

      await getProgressSchedules()

      expect(db.progressReportSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL_ID },
        })
      )
    })

    it("returns empty array on missing schoolId (no leak)", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      const result = await getProgressSchedules()

      expect(result).toHaveLength(0)
      expect(db.progressReportSchedule.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getProgressSchedule", () => {
    it("scopes findFirst with schoolId", async () => {
      vi.mocked(db.progressReportSchedule.findFirst).mockResolvedValue(null)

      await getProgressSchedule("sched-1")

      expect(db.progressReportSchedule.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "sched-1", schoolId: SCHOOL_ID },
        })
      )
    })
  })

  describe("updateProgressSchedule", () => {
    it("verifies schedule belongs to school before update", async () => {
      vi.mocked(db.progressReportSchedule.findFirst).mockResolvedValue(null)

      const result = await updateProgressSchedule({
        id: "sched-foreign",
        ...VALID_INPUT,
      })

      expect(result.success).toBe(false)
      expect(db.progressReportSchedule.update).not.toHaveBeenCalled()
    })
  })

  describe("deleteProgressSchedule", () => {
    it("rejects deletion of foreign-school schedule", async () => {
      vi.mocked(db.progressReportSchedule.findFirst).mockResolvedValue(null)

      const result = await deleteProgressSchedule("sched-foreign")

      expect(result.success).toBe(false)
      expect(db.progressReportSchedule.delete).not.toHaveBeenCalled()
    })
  })
})
