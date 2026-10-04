// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  resolveStudentSubjectContext,
  upsertGradebookResult,
} from "@/components/school-dashboard/grades/lib/gradebook"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    class: { findFirst: vi.fn() },
    subjectSelection: { findFirst: vi.fn() },
    result: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))

vi.mock("@/components/school-dashboard/listings/grades/queries", () => ({
  calculateGrade: () => "A",
  getSchoolGradingScheme: vi.fn(),
}))

const SCHOOL = "school-1"

describe("resolveStudentSubjectContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.student.findFirst).mockResolvedValue({
      sectionId: "7a",
      academicGradeId: null,
      section: { gradeId: "g7" },
    } as never)
    vi.mocked(db.class.findFirst).mockResolvedValue(null)
    vi.mocked(resolveActiveTerm).mockResolvedValue({
      term: { id: "term-1" },
      source: "explicit",
    } as never)
  })

  it("scopes a subject the student's grade teaches, with no class", async () => {
    vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
      id: "sel-1",
    } as never)

    expect(await resolveStudentSubjectContext(SCHOOL, "stu-1", "math")).toEqual(
      {
        classId: null,
        sectionId: "7a",
        academicGradeId: "g7",
        termId: "term-1",
      }
    )
    expect(db.subjectSelection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: SCHOOL,
          gradeId: "g7",
          catalogSubjectId: "math",
          isActive: true,
        },
      })
    )
  })

  it("keeps a legacy class for the subject when there is one", async () => {
    vi.mocked(db.subjectSelection.findFirst).mockResolvedValue(null)
    vi.mocked(db.class.findFirst).mockResolvedValue({ id: "cl-1" } as never)

    expect(
      await resolveStudentSubjectContext(SCHOOL, "stu-1", "math")
    ).toMatchObject({ classId: "cl-1", sectionId: "7a" })
  })

  it("refuses a subject the student doesn't study — never another subject's slot", async () => {
    vi.mocked(db.subjectSelection.findFirst).mockResolvedValue(null)

    expect(
      await resolveStudentSubjectContext(SCHOOL, "stu-1", "physics")
    ).toBeNull()
  })

  it("needs a subject and a student of this school", async () => {
    expect(await resolveStudentSubjectContext(SCHOOL, "stu-1", null)).toBeNull()
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    expect(
      await resolveStudentSubjectContext(SCHOOL, "stranger", "math")
    ).toBeNull()
  })
})

describe("upsertGradebookResult", () => {
  beforeEach(() => vi.clearAllMocks())

  it("writes a class-less row with its section, grade and term", async () => {
    vi.mocked(db.result.findFirst).mockResolvedValue(null)

    await upsertGradebookResult({
      schoolId: SCHOOL,
      studentId: "stu-1",
      classId: null,
      sectionId: "7a",
      academicGradeId: "g7",
      termId: "term-1",
      subjectId: "math",
      examId: "ex-1",
      score: 45,
      maxScore: 50,
      grade: "A",
    })

    const data = vi.mocked(db.result.create).mock.calls[0][0].data
    expect(data).toMatchObject({
      schoolId: SCHOOL,
      studentId: "stu-1",
      classId: null,
      sectionId: "7a",
      academicGradeId: "g7",
      termId: "term-1",
      subjectId: "math",
      examId: "ex-1",
      percentage: 90,
    })
  })

  it("leaves scope a caller doesn't name untouched on update", async () => {
    vi.mocked(db.result.findFirst).mockResolvedValue({ id: "r-1" } as never)

    await upsertGradebookResult({
      schoolId: SCHOOL,
      studentId: "stu-1",
      subjectId: "math",
      examId: "ex-1",
      termId: "term-1",
      score: 40,
      maxScore: 50,
      grade: "B",
    })

    const data = vi.mocked(db.result.update).mock.calls[0][0].data
    expect(data).toMatchObject({ termId: "term-1" })
    expect(data).not.toHaveProperty("classId")
    expect(data).not.toHaveProperty("sectionId")
  })
})
