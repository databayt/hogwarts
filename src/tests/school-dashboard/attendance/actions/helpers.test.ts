// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  getTeacherSectionIds,
  sectionScopeWhere,
} from "@/components/school-dashboard/attendance/actions/helpers"

vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    section: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const USER = "user-1"

describe("attendance helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTeacherSectionIds", () => {
    it("covers no section when the user has no teacher record — never the school", async () => {
      vi.mocked(db.teacher.findFirst).mockResolvedValue(null)

      expect(await getTeacherSectionIds(SCHOOL, USER)).toEqual([])
      expect(db.teacher.findFirst).toHaveBeenCalledWith({
        where: { userId: USER, schoolId: SCHOOL },
        select: { id: true },
      })
      expect(db.section.findMany).not.toHaveBeenCalled()
    })

    it("covers homeroom, timetable and subject-assignment sections", async () => {
      vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
      vi.mocked(db.section.findMany).mockResolvedValue([
        { id: "7a" },
        { id: "8b" },
      ] as never)

      expect(await getTeacherSectionIds(SCHOOL, USER)).toEqual(["7a", "8b"])
      expect(db.section.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: SCHOOL,
          OR: [
            { homeroomTeacherId: "t1" },
            { timetables: { some: { schoolId: SCHOOL, teacherId: "t1" } } },
            {
              subjectTeachers: { some: { schoolId: SCHOOL, teacherId: "t1" } },
            },
          ],
        },
        select: { id: true },
      })
    })
  })

  describe("sectionScopeWhere", () => {
    it("leaves staff unscoped", () => {
      expect(sectionScopeWhere({ teacherSectionIds: null })).toEqual({})
    })

    it("keeps a teacher to their sections", () => {
      expect(sectionScopeWhere({ teacherSectionIds: ["7a", "8b"] })).toEqual({
        sectionId: { in: ["7a", "8b"] },
      })
    })

    it("narrows to one of the teacher's sections", () => {
      expect(
        sectionScopeWhere({ teacherSectionIds: ["7a", "8b"], sectionId: "8b" })
      ).toEqual({ sectionId: "8b" })
    })

    it("intersects away a section outside the teacher's own — never widens", () => {
      expect(
        sectionScopeWhere({ teacherSectionIds: ["7a"], sectionId: "9c" })
      ).toEqual({ sectionId: { in: [] } })
    })

    it("filters by grade through the section", () => {
      expect(
        sectionScopeWhere({ teacherSectionIds: null, gradeId: "g7" })
      ).toEqual({ section: { gradeId: "g7" } })
    })
  })
})
