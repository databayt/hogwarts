// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getExcuseById,
  getExcusesForStudent,
  getPendingExcuses,
  getUnexcusedAbsences,
  reviewExcuse,
  submitExcuse,
} from "@/components/school-dashboard/attendance/actions/excuses"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    attendanceExcuse: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(db)),
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(role = "GUARDIAN", schoolId: string | null = SCHOOL) {
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

describe("attendance excuses actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("GUARDIAN")
  })

  describe("submitExcuse", () => {
    const valid = {
      attendanceId: "a1",
      reason: "MEDICAL" as const,
      description: "Doctor visit",
    }

    it("denies missing schoolId", async () => {
      mockAuth("GUARDIAN", null)

      const result = await submitExcuse(valid)

      expect(result.success).toBe(false)
    })

    it("denies unauthenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL,
        subdomain: "demo",
        role: "GUARDIAN",
        locale: "en",
      })
      vi.mocked(auth).mockResolvedValue(null)

      const result = await submitExcuse(valid)

      expect(result.success).toBe(false)
    })

    it("scopes attendance lookup by schoolId (no cross-school excuse)", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)

      const result = await submitExcuse(valid)

      expect(result.success).toBe(false)
      const call = vi.mocked(db.attendance.findFirst).mock.calls[0]?.[0]
      expect(call?.where).toMatchObject({ schoolId: SCHOOL })
    })
  })

  describe("reviewExcuse", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await reviewExcuse({
        excuseId: "e1",
        status: "APPROVED",
      })

      expect(result.success).toBe(false)
    })

    it("denies non-staff role (STUDENT)", async () => {
      mockAuth("STUDENT")

      const result = await reviewExcuse({
        excuseId: "e1",
        status: "APPROVED",
      })

      expect(result.success).toBe(false)
    })

    it("scopes excuse lookup by schoolId", async () => {
      mockAuth("ADMIN")
      vi.mocked(db.attendanceExcuse.findFirst).mockResolvedValue(null)

      await reviewExcuse({ excuseId: "e1", status: "APPROVED" })

      const call = vi.mocked(db.attendanceExcuse.findFirst).mock.calls[0]?.[0]
      if (call?.where) {
        expect(call.where).toMatchObject({ schoolId: SCHOOL })
      }
    })
  })

  describe("getExcusesForStudent", () => {
    it("denies missing schoolId", async () => {
      mockAuth("GUARDIAN", null)

      const result = await getExcusesForStudent("s1")

      expect(result.success).toBe(false)
    })
  })

  describe("getPendingExcuses", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getPendingExcuses()

      expect(result.success).toBe(false)
    })
  })

  describe("getExcuseById", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getExcuseById("e1")

      expect(result.success).toBe(false)
    })
  })

  describe("getUnexcusedAbsences", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getUnexcusedAbsences("s1")

      expect(result.success).toBe(false)
    })
  })
})
