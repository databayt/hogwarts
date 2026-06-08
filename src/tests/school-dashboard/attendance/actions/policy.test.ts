// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createPolicyExemption,
  dismissPolicyTrigger,
  evaluatePolicies,
  getPolicyTriggers,
} from "@/components/school-dashboard/attendance/actions/policy"

vi.mock("@/lib/db", () => ({
  db: {
    attendancePolicy: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    policyTrigger: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    policyExemption: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

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

describe("attendance policy actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
  })

  describe("evaluatePolicies", () => {
    it("scopes policies and triggers by passed schoolId", async () => {
      vi.mocked(db.attendancePolicy.findMany).mockResolvedValue([])

      await evaluatePolicies(SCHOOL)

      const call = vi.mocked(db.attendancePolicy.findMany).mock.calls[0]?.[0]
      expect(call?.where).toMatchObject({ schoolId: SCHOOL, isActive: true })
    })

    it("returns a defined result with no active policies", async () => {
      vi.mocked(db.attendancePolicy.findMany).mockResolvedValue([])

      const result = await evaluatePolicies(SCHOOL)

      expect(result).toBeDefined()
    })
  })

  describe("getPolicyTriggers", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getPolicyTriggers()

      expect(result.success).toBe(false)
    })

    it("scopes by schoolId and optional filter", async () => {
      vi.mocked(db.policyTrigger.findMany).mockResolvedValue([])

      await getPolicyTriggers({ status: "OPEN", tier: 1 })

      const call = vi.mocked(db.policyTrigger.findMany).mock.calls[0]?.[0]
      expect(call?.where).toMatchObject({
        schoolId: SCHOOL,
      })
    })
  })

  describe("createPolicyExemption", () => {
    it("denies non-admin", async () => {
      mockAuth("TEACHER")

      const result = await createPolicyExemption({
        studentId: "s1",
        reason: "Medical clearance",
      })

      expect(result.success).toBe(false)
    })

    it("creates exemption with schoolId", async () => {
      vi.mocked(db.policyExemption.create).mockResolvedValue({
        id: "e1",
      } as any)

      const result = await createPolicyExemption({
        studentId: "s1",
        reason: "Medical clearance",
      })

      expect(result.success).toBe(true)
      expect(db.policyExemption.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: SCHOOL,
            studentId: "s1",
          }),
        })
      )
    })
  })

  describe("dismissPolicyTrigger", () => {
    it("denies non-admin", async () => {
      mockAuth("TEACHER")

      const result = await dismissPolicyTrigger("trigger-1", "reviewed")

      expect(result.success).toBe(false)
    })

    it("returns success when admin dismisses trigger", async () => {
      vi.mocked(db.policyTrigger.findFirst).mockResolvedValue({
        id: "trigger-1",
        schoolId: SCHOOL,
      } as any)
      vi.mocked(db.policyTrigger.update).mockResolvedValue({} as any)
      vi.mocked(db.policyTrigger.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await dismissPolicyTrigger("trigger-1", "reviewed")

      expect(result).toBeDefined()
    })
  })
})
