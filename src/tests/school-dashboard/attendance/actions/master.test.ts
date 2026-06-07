// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getMasterAttendanceForDay,
  getPrefillFromMaster,
  recordMasterAttendance,
} from "@/components/school-dashboard/attendance/actions/master"

vi.mock("@/lib/db", () => ({
  db: {
    masterAttendance: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    student: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(role = "ADMIN", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER, schoolId, role },
  } as any)
}

describe("master attendance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
  })

  describe("recordMasterAttendance", () => {
    const input = {
      studentId: "s1",
      date: "2026-06-01",
      status: "PRESENT" as const,
    }

    it("denies when schoolId is missing", async () => {
      mockAuth("ADMIN", null)

      const result = await recordMasterAttendance(input)

      expect(result.success).toBe(false)
    })

    it("denies non-marking roles (STUDENT)", async () => {
      mockAuth("STUDENT")

      const result = await recordMasterAttendance(input)

      expect(result.success).toBe(false)
    })

    it("creates new row when no existing entry for this gate day", async () => {
      vi.mocked(db.masterAttendance.findUnique).mockResolvedValue(null)
      vi.mocked(db.masterAttendance.create).mockResolvedValue({
        id: "m1",
      } as any)

      const result = await recordMasterAttendance(input)

      expect(result.success).toBe(true)
      expect(db.masterAttendance.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId_studentId_date: expect.objectContaining({
              schoolId: SCHOOL,
              studentId: "s1",
            }),
          },
        })
      )
    })

    it("updates when existing row found", async () => {
      vi.mocked(db.masterAttendance.findUnique).mockResolvedValue({
        id: "m1",
      } as any)
      vi.mocked(db.masterAttendance.update).mockResolvedValue({
        id: "m1",
      } as any)

      const result = await recordMasterAttendance(input)

      expect(result.success).toBe(true)
      expect(db.masterAttendance.update).toHaveBeenCalled()
    })
  })

  describe("getMasterAttendanceForDay", () => {
    it("scopes findMany by schoolId", async () => {
      vi.mocked(db.masterAttendance.findMany).mockResolvedValue([])

      await getMasterAttendanceForDay({ date: "2026-06-01" })

      const call = vi.mocked(db.masterAttendance.findMany).mock.calls[0]?.[0]
      expect(call?.where).toMatchObject({ schoolId: SCHOOL })
    })

    it("denies when schoolId is missing", async () => {
      mockAuth("ADMIN", null)

      const result = await getMasterAttendanceForDay({ date: "2026-06-01" })

      expect(result.success).toBe(false)
    })
  })

  describe("getPrefillFromMaster", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getPrefillFromMaster({
        classId: "c1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(false)
    })

    it("denies non-staff role (STUDENT)", async () => {
      mockAuth("STUDENT")

      const result = await getPrefillFromMaster({
        classId: "c1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(false)
    })
  })
})
