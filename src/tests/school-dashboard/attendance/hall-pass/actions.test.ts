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
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), refresh: vi.fn() }))

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
      destination: "BATHROOM" as const,
      expectedDuration: 10,
    }

    it("issues the pass on the student's own section", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue({
        sectionId: "7a",
      } as never)
      vi.mocked(db.hallPass.findFirst).mockResolvedValue(null)
      vi.mocked(db.hallPass.findMany).mockResolvedValue([])
      vi.mocked(db.hallPass.create).mockResolvedValue({
        id: "h1",
        student: { firstName: "Sara", lastName: "Ali" },
        section: { name: "7-A" },
        destination: "BATHROOM",
        expectedReturn: new Date(),
        conflictWith: null,
      } as never)

      const result = await createHallPass(valid)

      expect(db.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "s1", schoolId: SCHOOL } })
      )
      const data = vi.mocked(db.hallPass.create).mock.calls[0][0].data
      expect(data).toMatchObject({
        schoolId: SCHOOL,
        studentId: "s1",
        sectionId: "7a",
      })
      expect(data).not.toHaveProperty("classId")
      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({ className: "7-A" })
    })

    it("refuses a student of another school", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await createHallPass(valid)

      expect(result.success).toBe(false)
      expect(result.error).toBe("STUDENT_NOT_FOUND")
      expect(db.hallPass.create).not.toHaveBeenCalled()
    })

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
