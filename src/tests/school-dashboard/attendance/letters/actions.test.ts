// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  bulkGenerateLetters,
  generateLetter,
  getStudentLetterHistory,
  getStudentsNeedingLetters,
  previewLetter,
} from "@/components/school-dashboard/attendance/letters/actions"

vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    attendanceIntervention: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
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

describe("attendance letters actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
  })

  describe("generateLetter", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await generateLetter({
        studentId: "s1",
        letterType: "FIRST_WARNING",
        deliveryMethod: "EMAIL",
      })

      expect(result.success).toBe(false)
    })

    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await generateLetter({
        studentId: "s1",
        letterType: "FIRST_WARNING",
        deliveryMethod: "EMAIL",
      })

      expect(result.success).toBe(false)
    })

    it("rejects student from different school", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await generateLetter({
        studentId: "s-other",
        letterType: "FIRST_WARNING",
        deliveryMethod: "EMAIL",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("getStudentLetterHistory", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentLetterHistory("s1")

      expect(result).toBeDefined()
      expect(result.success === false).toBeTruthy()
    })
  })

  describe("getStudentsNeedingLetters", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await getStudentsNeedingLetters()

      expect(result.success).toBe(false)
    })
  })

  describe("bulkGenerateLetters", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await bulkGenerateLetters({
        studentIds: ["s1"],
        letterType: "FIRST_WARNING",
        deliveryMethod: "EMAIL",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("previewLetter", () => {
    it("returns defined response", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await previewLetter({
        studentId: "s1",
        letterType: "FIRST_WARNING",
      })

      expect(result).toBeDefined()
    })
  })
})
