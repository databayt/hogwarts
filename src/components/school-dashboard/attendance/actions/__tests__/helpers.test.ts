// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { getClassIdsByGrade, getTeacherClassIds } from "../helpers"

vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    class: { findMany: vi.fn() },
    classTeacher: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const USER = "user-1"

describe("attendance helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getTeacherClassIds", () => {
    it("returns null when user is not a teacher in this school", async () => {
      vi.mocked(db.teacher.findFirst).mockResolvedValue(null)

      const result = await getTeacherClassIds(SCHOOL, USER)

      expect(result).toBeNull()
      expect(db.teacher.findFirst).toHaveBeenCalledWith({
        where: { userId: USER, schoolId: SCHOOL },
        select: { id: true },
      })
    })

    it("unions primary class teacher + co-teacher bridge classes", async () => {
      vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as any)
      vi.mocked(db.class.findMany).mockResolvedValue([
        { id: "c1" },
        { id: "c2" },
      ] as any)
      vi.mocked(db.classTeacher.findMany).mockResolvedValue([
        { classId: "c2" },
        { classId: "c3" },
      ] as any)

      const result = await getTeacherClassIds(SCHOOL, USER)

      expect(result).toEqual(expect.arrayContaining(["c1", "c2", "c3"]))
      expect(result).toHaveLength(3) // deduped
    })

    it("scopes all lookups by schoolId", async () => {
      vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as any)
      vi.mocked(db.class.findMany).mockResolvedValue([] as any)
      vi.mocked(db.classTeacher.findMany).mockResolvedValue([] as any)

      await getTeacherClassIds(SCHOOL, USER)

      expect(db.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL, teacherId: "t1" },
        })
      )
      expect(db.classTeacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL, teacherId: "t1" },
        })
      )
    })
  })

  describe("getClassIdsByGrade", () => {
    it("returns class IDs scoped to schoolId + gradeId", async () => {
      vi.mocked(db.class.findMany).mockResolvedValue([
        { id: "c1" },
        { id: "c2" },
      ] as any)

      const result = await getClassIdsByGrade(SCHOOL, "g1")

      expect(result).toEqual(["c1", "c2"])
      expect(db.class.findMany).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL, gradeId: "g1" },
        select: { id: true },
      })
    })

    it("intersects with teacher's classes when teacherClassIds provided", async () => {
      vi.mocked(db.class.findMany).mockResolvedValue([{ id: "c1" }] as any)

      await getClassIdsByGrade(SCHOOL, "g1", ["c1", "c5"])

      expect(db.class.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: SCHOOL,
          gradeId: "g1",
          id: { in: ["c1", "c5"] },
        },
        select: { id: true },
      })
    })

    it("ignores empty teacher class array (no teacher scoping)", async () => {
      vi.mocked(db.class.findMany).mockResolvedValue([] as any)

      await getClassIdsByGrade(SCHOOL, "g1", [])

      const call = vi.mocked(db.class.findMany).mock.calls[0][0]
      expect(call?.where).not.toHaveProperty("id")
    })

    it("ignores null teacher class IDs (admin path)", async () => {
      vi.mocked(db.class.findMany).mockResolvedValue([] as any)

      await getClassIdsByGrade(SCHOOL, "g1", null)

      const call = vi.mocked(db.class.findMany).mock.calls[0][0]
      expect(call?.where).not.toHaveProperty("id")
    })
  })
})
