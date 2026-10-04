// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PrismaClient } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { seedAssignments } from "../../../prisma/seeds/assignments"
import { seedAttendance } from "../../../prisma/seeds/attendance"
import { seedExams } from "../../../prisma/seeds/exams"
import {
  buildGradeSubjects,
  seedSectionPlacement,
} from "../../../prisma/seeds/teaching"
import type {
  GradeSubjectRef,
  StudentRef,
  TeacherRef,
  TermRef,
} from "../../../prisma/seeds/types"

// Subject-teacher assignment lives in the conference seed; not under test here
vi.mock("../../../prisma/seeds/conference", () => ({
  topUpExpertise: vi.fn().mockResolvedValue(null),
  ensureSeedAssignments: vi.fn().mockResolvedValue(undefined),
}))

const SCHOOL = "school-1"
const term: TermRef = {
  id: "term-1",
  termNumber: 1,
  startDate: new Date("2026-09-01"),
  endDate: new Date("2026-12-31"),
  isActive: true,
}

function fakePrisma() {
  return {
    academicGrade: { findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    section: { findMany: vi.fn() },
    subjectTeacher: { findMany: vi.fn() },
    schoolExam: { findFirst: vi.fn(), create: vi.fn() },
    schoolAssignment: { findFirst: vi.fn(), create: vi.fn() },
    student: { findMany: vi.fn(), update: vi.fn() },
    attendance: { deleteMany: vi.fn(), createMany: vi.fn(), create: vi.fn() },
  }
}
let prisma: ReturnType<typeof fakePrisma>
const db = () => prisma as unknown as PrismaClient

const unit = (over: Partial<GradeSubjectRef> = {}): GradeSubjectRef => ({
  gradeId: "g7",
  yearLevelId: "yl7",
  subjectId: "math",
  name: "Math - Grade 7",
  termId: term.id,
  teacherId: "t1",
  teacherUserId: "u-t1",
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
  prisma = fakePrisma()
})

describe("class-free seed — grade subjects", () => {
  it("makes one unit per subject a grade takes, with its first section's teacher", async () => {
    prisma.academicGrade.findMany.mockResolvedValue([
      { id: "g7", yearLevelId: "yl7" },
      { id: "g8", yearLevelId: "yl8" },
    ])
    prisma.subjectSelection.findMany.mockResolvedValue([
      { gradeId: "g7", catalogSubjectId: "math" },
      { gradeId: "g8", catalogSubjectId: "science" },
    ])
    prisma.section.findMany.mockResolvedValue([
      { id: "7a", gradeId: "g7" },
      { id: "7b", gradeId: "g7" },
      { id: "8a", gradeId: "g8" },
    ])
    prisma.subjectTeacher.findMany.mockResolvedValue([
      {
        sectionId: "7a",
        subjectId: "math",
        teacher: { id: "t1", userId: "u-t1" },
      },
    ])

    const refs = await buildGradeSubjects(
      db(),
      SCHOOL,
      [
        { id: "math", name: "Math" },
        { id: "science", name: "Science" },
      ],
      [
        { id: "yl7", levelName: "Grade 7", lang: "en", levelOrder: 7 },
        { id: "yl8", levelName: "Grade 8", lang: "en", levelOrder: 8 },
      ],
      term
    )

    expect(refs).toEqual([
      unit(),
      {
        gradeId: "g8",
        yearLevelId: "yl8",
        subjectId: "science",
        name: "Science - Grade 8",
        termId: term.id,
        teacherId: null,
        teacherUserId: null,
      },
    ])
    // Only the first section of each grade is asked for its teacher
    expect(
      prisma.subjectTeacher.findMany.mock.calls[0][0].where.sectionId
    ).toEqual({ in: ["7a", "8a"] })
  })
})

describe("class-free seed — work for the whole grade", () => {
  it("sets exams for the grade, never a class", async () => {
    prisma.schoolExam.findFirst.mockResolvedValue(null)
    prisma.schoolExam.create.mockImplementation(async () => ({
      id: `e${prisma.schoolExam.create.mock.calls.length}`,
    }))

    const ids = await seedExams(
      db(),
      SCHOOL,
      [{ id: "math", name: "Math" }],
      [unit()],
      term
    )

    expect(ids).toHaveLength(4)
    const data = prisma.schoolExam.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      schoolId: SCHOOL,
      gradeId: "g7",
      sectionId: null,
      termId: term.id,
      subjectId: "math",
      createdById: "u-t1",
    })
    expect(data).not.toHaveProperty("classId")
  })

  it("sets assignments for the grade, by the subject's teacher", async () => {
    prisma.schoolAssignment.findFirst.mockResolvedValue(null)
    prisma.schoolAssignment.create.mockResolvedValue({ id: "a1" })
    const teachers = [{ id: "t9", userId: "u-t9" }] as TeacherRef[]

    await seedAssignments(
      db(),
      SCHOOL,
      [unit()],
      teachers,
      term.startDate,
      term.endDate
    )

    const data = prisma.schoolAssignment.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      gradeId: "g7",
      sectionId: null,
      subjectId: "math",
      termId: term.id,
      createdById: "u-t1",
    })
    expect(data).not.toHaveProperty("classId")
  })
})

describe("class-free seed — sections", () => {
  it("marks each student in their own section and skips the unplaced", async () => {
    prisma.attendance.deleteMany.mockResolvedValue({ count: 0 })
    prisma.attendance.createMany.mockResolvedValue({ count: 1 })
    prisma.student.findMany.mockResolvedValue([{ id: "s1", sectionId: "7a" }])
    const students = [
      { id: "s1", yearLevelId: "yl7" },
      { id: "s2", yearLevelId: "yl7" },
    ] as StudentRef[]

    await seedAttendance(db(), SCHOOL, students, [{ id: "t1" }] as TeacherRef[])

    const rows = prisma.attendance.createMany.mock.calls.flatMap(
      (c) => c[0].data as Array<Record<string, unknown>>
    )
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.studentId === "s1")).toBe(true)
    expect(rows.every((r) => r.sectionId === "7a")).toBe(true)
    expect(rows.some((r) => "classId" in r)).toBe(false)
  })

  it("places students round-robin across their grade's sections", async () => {
    prisma.academicGrade.findMany.mockResolvedValue([
      { id: "g7", yearLevelId: "yl7" },
    ])
    prisma.section.findMany.mockResolvedValue([
      { id: "7a", gradeId: "g7" },
      { id: "7b", gradeId: "g7" },
    ])
    prisma.student.update.mockResolvedValue({})

    const placed = await seedSectionPlacement(db(), SCHOOL, [
      { id: "s1", yearLevelId: "yl7" },
      { id: "s2", yearLevelId: "yl7" },
      { id: "s3", yearLevelId: "yl7" },
    ] as StudentRef[])

    expect(placed).toBe(3)
    expect(
      prisma.student.update.mock.calls.map((c) => c[0].data.sectionId)
    ).toEqual(["7a", "7b", "7a"])
  })
})
