// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  batchTranslateMessages,
  createInterventionFromRecommendation,
  getAtRiskStudents,
  runRiskPredictions,
  translateMessage,
} from "@/components/school-dashboard/attendance/ai/actions"

vi.mock("@/lib/db", () => ({
  db: {
    attendanceRiskPrediction: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    attendanceIntervention: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    translationCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"

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
    role ? ({ user: { id: "u1", schoolId, role } } as any) : null
  )
}

describe("attendance AI actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
    vi.mocked(db.student.findMany).mockResolvedValue([])
    vi.mocked(db.attendance.findMany).mockResolvedValue([])
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
  })

  describe("runRiskPredictions", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await runRiskPredictions({})

      expect(result.success).toBe(false)
    })

    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await runRiskPredictions({})

      expect(result.success).toBe(false)
    })
  })

  describe("getAtRiskStudents", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await getAtRiskStudents()

      expect(result.success).toBe(false)
    })

    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getAtRiskStudents()

      expect(result.success).toBe(false)
    })
  })

  describe("translateMessage", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await translateMessage({
        message: "Hello",
        targetLanguage: "ar",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("batchTranslateMessages", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await batchTranslateMessages({
        messages: ["Hello"],
        targetLanguage: "ar",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("createInterventionFromRecommendation", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await createInterventionFromRecommendation({
        studentId: "s1",
        type: "PARENT_PHONE_CALL",
      })

      expect(result.success).toBe(false)
    })

    it("denies STUDENT role", async () => {
      mockAuth("STUDENT")

      const result = await createInterventionFromRecommendation(
        "s1",
        "Call the parent to discuss attendance"
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  describe("staff role gating", () => {
    it("runRiskPredictions denies STUDENT role", async () => {
      mockAuth("STUDENT")
      const result = await runRiskPredictions({})
      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })

    it("getAtRiskStudents denies STUDENT role (no school-wide PII leak)", async () => {
      mockAuth("STUDENT")
      const result = await getAtRiskStudents()
      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })

    it("getAtRiskStudents passes the gate for ADMIN (not UNAUTHORIZED)", async () => {
      mockAuth("ADMIN")
      const result = await getAtRiskStudents()
      expect(result.error).not.toBe("UNAUTHORIZED")
    })

    it("batchTranslateMessages denies STUDENT role", async () => {
      mockAuth("STUDENT")
      const result = await batchTranslateMessages(["Hello"], "ar")
      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })
})
