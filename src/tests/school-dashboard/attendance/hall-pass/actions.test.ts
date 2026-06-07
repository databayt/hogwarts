// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  cancelHallPass,
  createHallPass,
  getActiveHallPasses,
  getHallPassStats,
  getStudentHallPassHistory,
  returnHallPass,
} from "@/components/school-dashboard/attendance/hall-pass/actions"

vi.mock("@/lib/db", () => ({
  db: {
    hallPass: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    student: { findFirst: vi.fn() },
    class: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(role = "TEACHER", schoolId: string | null = SCHOOL) {
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

describe("hall-pass actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("TEACHER")
  })

  describe("createHallPass", () => {
    const valid = {
      studentId: "s1",
      classId: "c1",
      destination: "BATHROOM" as const,
      expectedDuration: 10,
    }

    it("denies STUDENT role (only staff can issue)", async () => {
      mockAuth("STUDENT")

      const result = await createHallPass(valid)

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })

    it("denies GUARDIAN role", async () => {
      mockAuth("GUARDIAN")

      const result = await createHallPass(valid)

      expect(result.success).toBe(false)
    })

    it("denies when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await createHallPass(valid)

      expect(result.success).toBe(false)
    })

    it("denies missing schoolId", async () => {
      mockAuth("TEACHER", null)

      const result = await createHallPass(valid)

      expect(result.success).toBe(false)
    })
  })

  describe("returnHallPass", () => {
    it("denies non-staff", async () => {
      mockAuth("STUDENT")

      const result = await returnHallPass({ passId: "h1" })

      expect(result.success).toBe(false)
    })
  })

  describe("cancelHallPass", () => {
    it("denies non-staff", async () => {
      mockAuth("STUDENT")

      const result = await cancelHallPass("h1")

      expect(result.success).toBe(false)
    })
  })

  describe("getActiveHallPasses", () => {
    it("denies non-staff (student can't list active passes)", async () => {
      mockAuth("STUDENT")

      const result = await getActiveHallPasses()

      expect(result.success).toBe(false)
    })

    it("staff gets a defined response", async () => {
      vi.mocked(db.hallPass.findMany).mockResolvedValue([])

      const result = await getActiveHallPasses()

      expect(result).toBeDefined()
    })
  })

  describe("getStudentHallPassHistory", () => {
    it("denies non-staff", async () => {
      mockAuth("STUDENT")

      const result = await getStudentHallPassHistory("s1")

      expect(result.success).toBe(false)
    })
  })

  describe("getHallPassStats", () => {
    it("denies non-staff", async () => {
      mockAuth("STUDENT")

      const result = await getHallPassStats()

      expect(result.success).toBe(false)
    })
  })
})
