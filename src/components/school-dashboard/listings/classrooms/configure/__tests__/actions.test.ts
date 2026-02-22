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
    class: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    classroom: {
      upsert: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
    },
    subject: {
      findFirst: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
    term: {
      findFirst: vi.fn(),
    },
    period: {
      findMany: vi.fn(),
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
          _count: { classes: 3 },
        },
      ] as any)
      vi.mocked(db.classroomType.findMany).mockResolvedValue([
        { id: "rt1", name: "Standard" },
      ] as any)
      vi.mocked(db.class.findMany).mockResolvedValue([
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
        expect(result.error).toContain("authenticated")
      }
    })

    it("returns error when no subjects/teachers/terms exist", async () => {
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.school.findFirst).mockResolvedValue({
        maxClasses: 100,
      } as any)
      vi.mocked(db.subject.findFirst).mockResolvedValue(null)
      vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)

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
        expect(result.error).toContain("subject")
      }
    })

    it("returns error when exceeding class limit", async () => {
      vi.mocked(db.class.count)
        .mockResolvedValueOnce(95) // total class count
        .mockResolvedValueOnce(0) // existing count for grade
      vi.mocked(db.school.findFirst).mockResolvedValue({
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
        expect(result.error).toContain("limit")
      }
    })
  })
})
