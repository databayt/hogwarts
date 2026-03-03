// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { generateSections, getGradeConfiguration } from "../actions"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    academicGrade: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    classroomType: {
      findMany: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    classroom: {
      upsert: vi.fn(),
      count: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Classrooms Configure Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", schoolId: mockSchoolId, role: "ADMIN" },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })
  })

  describe("getGradeConfiguration", () => {
    it("returns grade configs with section and room counts", async () => {
      vi.mocked(db.academicGrade.findMany).mockResolvedValue([
        {
          id: "g1",
          name: "Grade 1",
          gradeNumber: 1,
          maxStudents: 30,
          _count: { classes: 3, sections: 3 },
        },
      ] as any)
      vi.mocked(db.classroomType.findMany).mockResolvedValue([
        { id: "rt1", name: "Standard" },
      ] as any)
      vi.mocked(db.section.findMany).mockResolvedValue([
        { gradeId: "g1", classroomId: "r1" },
        { gradeId: "g1", classroomId: "r2" },
      ] as any)

      const result = await getGradeConfiguration()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.grades).toHaveLength(1)
        expect(result.data.grades[0]).toEqual(
          expect.objectContaining({
            gradeId: "g1",
            gradeName: "Grade 1",
            existingSections: 3,
            existingRooms: 2,
          })
        )
        expect(result.data.roomTypes).toHaveLength(1)
      }
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getGradeConfiguration()

      expect(result.success).toBe(false)
    })

    it("returns error when missing school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getGradeConfiguration()

      expect(result.success).toBe(false)
    })
  })

  describe("generateSections", () => {
    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await generateSections({
        grades: [
          {
            gradeId: "g1",
            sections: 3,
            capacityPerSection: 30,
            roomType: "rt1",
          },
        ],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("NOT_AUTHENTICATED")
      }
    })

    it("returns error when exceeding classroom limit", async () => {
      vi.mocked(db.classroom.count).mockResolvedValue(95)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        maxClasses: 100,
      } as any)

      const result = await generateSections({
        grades: [
          {
            gradeId: "g1",
            sections: 10,
            capacityPerSection: 30,
            roomType: "rt1",
          },
        ],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Classroom limit reached")
      }
    })
  })
})
