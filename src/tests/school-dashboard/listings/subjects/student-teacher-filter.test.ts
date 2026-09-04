// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getStudentIdByUserId,
  getSubjectIdsForStudent,
  getSubjectIdsForTeacher,
  getTeacherIdByUserId,
} from "@/components/school-dashboard/listings/subjects/queries"

vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
    studentClass: {
      findMany: vi.fn(),
    },
    timetable: {
      findMany: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
    classTeacher: {
      findMany: vi.fn(),
    },
    teacherSubjectExpertise: {
      findMany: vi.fn(),
    },
    subjectSelection: {
      findMany: vi.fn(),
    },
    subject: {
      findMany: vi.fn(),
    },
  },
}))

describe("Subject Queries - Student & Teacher Filtering", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"
  const mockStudentId = "student-123"
  const mockTeacherId = "teacher-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getStudentIdByUserId", () => {
    it("returns student id when found", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: mockStudentId,
      } as any)

      const result = await getStudentIdByUserId(mockSchoolId, mockUserId)
      expect(result).toBe(mockStudentId)
      expect(db.student.findFirst).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId, userId: mockUserId },
        select: { id: true },
      })
    })

    it("returns null when student not found", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await getStudentIdByUserId(mockSchoolId, mockUserId)
      expect(result).toBeNull()
    })
  })

  describe("getTeacherIdByUserId", () => {
    it("returns teacher id when found", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.teacher.findFirst).mockResolvedValue({
        id: mockTeacherId,
      } as any)

      const result = await getTeacherIdByUserId(mockSchoolId, mockUserId)
      expect(result).toBe(mockTeacherId)
      expect(db.teacher.findFirst).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId, userId: mockUserId },
        select: { id: true },
      })
    })

    it("returns null when teacher not found", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.teacher.findFirst).mockResolvedValue(null)

      const result = await getTeacherIdByUserId(mockSchoolId, mockUserId)
      expect(result).toBeNull()
    })
  })

  describe("getSubjectIdsForStudent", () => {
    it("returns the grade curriculum plus attachments the catalog places in that grade", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.studentClass.findMany).mockResolvedValue([
        { class: { subjectId: "subj-1" } },
        { class: { subjectId: "subj-2" } },
      ] as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        sectionId: "section-1",
        academicGradeId: "grade-1",
        academicGrade: { gradeNumber: 10 },
      } as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([
        { subjectId: "subj-3" },
        { subjectId: "subj-1" },
      ] as any)
      vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
        { catalogSubjectId: "subj-1" },
        { catalogSubjectId: "subj-curriculum" },
      ] as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "subj-2", grades: [10] },
        { id: "subj-3", grades: [] },
      ] as any)

      const subjectIds = await getSubjectIdsForStudent(
        mockSchoolId,
        mockStudentId
      )
      expect(subjectIds.has("subj-1")).toBe(true)
      expect(subjectIds.has("subj-2")).toBe(true)
      expect(subjectIds.has("subj-3")).toBe(true)
      expect(subjectIds.has("subj-curriculum")).toBe(true)
      expect(subjectIds.size).toBe(4)
    })

    it("drops an enrolled class whose subject belongs to another grade", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.studentClass.findMany).mockResolvedValue([
        { class: { subjectId: "subj-grade-4" } },
      ] as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        sectionId: null,
        academicGradeId: "grade-1",
        academicGrade: { gradeNumber: 10 },
      } as any)
      vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
        { catalogSubjectId: "subj-grade-10" },
      ] as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "subj-grade-4", grades: [4] },
      ] as any)

      const subjectIds = await getSubjectIdsForStudent(
        mockSchoolId,
        mockStudentId
      )
      expect(subjectIds.has("subj-grade-4")).toBe(false)
      expect(subjectIds.has("subj-grade-10")).toBe(true)
      expect(subjectIds.size).toBe(1)
    })

    it("falls back to grade classes and selections if no direct enrollments or timetable slots", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.studentClass.findMany).mockResolvedValue([])
      vi.mocked(db.student.findFirst).mockResolvedValue({
        sectionId: null,
        academicGradeId: "grade-1",
        academicGrade: { gradeNumber: 10 },
      } as any)
      vi.mocked(db.class.findMany).mockResolvedValue([
        { subjectId: "subj-fallback-1" },
      ] as any)
      vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
        { catalogSubjectId: "subj-fallback-2" },
      ] as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "subj-fallback-1", grades: [10] },
      ] as any)

      const subjectIds = await getSubjectIdsForStudent(
        mockSchoolId,
        mockStudentId
      )
      expect(subjectIds.has("subj-fallback-1")).toBe(true)
      expect(subjectIds.has("subj-fallback-2")).toBe(true)
      expect(subjectIds.size).toBe(2)
    })

    it("keeps the raw attachments when the student has no academic grade", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.studentClass.findMany).mockResolvedValue([
        { class: { subjectId: "subj-1" } },
      ] as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        sectionId: null,
        academicGradeId: null,
        academicGrade: null,
      } as any)

      const subjectIds = await getSubjectIdsForStudent(
        mockSchoolId,
        mockStudentId
      )
      expect(subjectIds.has("subj-1")).toBe(true)
      expect(subjectIds.size).toBe(1)
      expect(db.subjectSelection.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getSubjectIdsForTeacher", () => {
    it("aggregates subjects from classes, co-teaching, timetable, and expertise", async () => {
      const { db } = await import("@/lib/db")
      vi.mocked(db.class.findMany).mockResolvedValue([
        { subjectId: "subj-primary" },
      ] as any)
      vi.mocked(db.classTeacher.findMany).mockResolvedValue([
        { class: { subjectId: "subj-coteach" } },
      ] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([
        { subjectId: "subj-timetable" },
      ] as any)
      vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([
        { subjectId: "subj-expertise" },
      ] as any)

      const subjectIds = await getSubjectIdsForTeacher(
        mockSchoolId,
        mockTeacherId
      )
      expect(subjectIds.has("subj-primary")).toBe(true)
      expect(subjectIds.has("subj-coteach")).toBe(true)
      expect(subjectIds.has("subj-timetable")).toBe(true)
      expect(subjectIds.has("subj-expertise")).toBe(true)
      expect(subjectIds.size).toBe(4)
    })
  })
})
