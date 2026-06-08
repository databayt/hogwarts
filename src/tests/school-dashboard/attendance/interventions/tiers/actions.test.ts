// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createTieredIntervention,
  getMTSSStats,
  getMyPendingInterventions,
  getStudentInterventionHistory,
  getStudentsByTier,
  updateInterventionStatus,
} from "@/components/school-dashboard/attendance/interventions/tiers/actions"

vi.mock("@/lib/db", () => ({
  db: {
    attendanceIntervention: {
      create: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    attendance: {
      groupBy: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(
  role: string | null = "ADMIN",
  schoolId: string | null = SCHOOL
) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue(
    role ? ({ user: { id: USER, schoolId, role } } as any) : null
  )
}

describe("MTSS tier intervention actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
    vi.mocked(db.attendanceIntervention.findMany).mockResolvedValue([])
    vi.mocked(db.attendanceIntervention.count).mockResolvedValue(0)
    vi.mocked(db.student.findMany).mockResolvedValue([])
  })

  describe("getStudentsByTier", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await getStudentsByTier()

      expect(result.success).toBe(false)
    })

    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentsByTier()

      expect(result.success).toBe(false)
    })
  })

  describe("createTieredIntervention", () => {
    const valid = {
      studentId: "s1",
      tier: "TIER_2" as const,
      action: "PARENT_PHONE_CALL",
      title: "Parent call",
      priority: 2,
    }

    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await createTieredIntervention(valid)

      expect(result.success).toBe(false)
    })

    it("denies STUDENT role", async () => {
      mockAuth("STUDENT")

      const result = await createTieredIntervention(valid)

      expect(result.success).toBe(false)
    })
  })

  describe("updateInterventionStatus", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await updateInterventionStatus({
        interventionId: "i1",
        status: "COMPLETED",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("getStudentInterventionHistory", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentInterventionHistory("s1")

      expect(result.success).toBe(false)
    })
  })

  describe("getMyPendingInterventions", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await getMyPendingInterventions()

      expect(result.success).toBe(false)
    })
  })

  describe("getMTSSStats", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getMTSSStats()

      expect(result.success).toBe(false)
    })
  })
})
