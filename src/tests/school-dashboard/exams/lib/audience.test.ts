// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  examAudienceLabel,
  examAudienceRef,
  examRosterWhere,
  pairExamsWhere,
  studentExamsWhere,
  teacherExamsWhere,
} from "@/components/school-dashboard/exams/lib/audience"

const SCHOOL = "school-1"
const none = { classId: null, gradeId: null, sectionId: null }

describe("examRosterWhere", () => {
  it("a section exam is sat by that section", () => {
    expect(
      examRosterWhere(SCHOOL, { ...none, gradeId: "g7", sectionId: "7a" })
    ).toEqual({ schoolId: SCHOOL, sectionId: "7a" })
  })

  it("a whole-grade exam is sat by every section of the grade and unplaced students of it", () => {
    expect(examRosterWhere(SCHOOL, { ...none, gradeId: "g7" })).toEqual({
      schoolId: SCHOOL,
      OR: [
        { section: { gradeId: "g7" } },
        { sectionId: null, academicGradeId: "g7" },
      ],
    })
  })

  it("a legacy exam is sat by its class's students", () => {
    expect(examRosterWhere(SCHOOL, { ...none, classId: "c1" })).toEqual({
      schoolId: SCHOOL,
      studentClasses: { some: { schoolId: SCHOOL, classId: "c1" } },
    })
  })

  it("an exam with no audience reaches nobody", () => {
    expect(examRosterWhere(SCHOOL, none)).toEqual({
      schoolId: SCHOOL,
      id: { in: [] },
    })
  })
})

describe("studentExamsWhere", () => {
  it("covers the student's section, whole-grade exams, and legacy classes", () => {
    expect(
      studentExamsWhere({ sectionId: "7a", gradeId: "g7", classIds: ["c1"] })
    ).toEqual({
      OR: [
        { classId: { in: ["c1"] } },
        { sectionId: { in: ["7a"] } },
        { sectionId: null, gradeId: { in: ["g7"] } },
      ],
    })
  })

  it("merges a guardian's children", () => {
    const where = studentExamsWhere([
      { sectionId: "7a", gradeId: "g7", classIds: [] },
      { sectionId: "9b", gradeId: "g9", classIds: [] },
    ])
    expect(where).toEqual({
      OR: [
        { sectionId: { in: ["7a", "9b"] } },
        { sectionId: null, gradeId: { in: ["g7", "g9"] } },
      ],
    })
  })

  it("matches nothing for a student placed nowhere", () => {
    expect(
      studentExamsWhere({ sectionId: null, gradeId: null, classIds: [] })
    ).toEqual({ id: { in: [] } })
    expect(studentExamsWhere([])).toEqual({ id: { in: [] } })
  })
})

describe("teacher exams", () => {
  const pairs = [
    { sectionId: "7a", subjectId: "math", gradeId: "g7" },
    { sectionId: "7b", subjectId: "math", gradeId: "g7" },
    { sectionId: "8a", subjectId: "science", gradeId: "g8" },
  ]

  it("keys section and whole-grade exams by the subject taught there", () => {
    expect(pairExamsWhere(pairs)).toEqual([
      { subjectId: "math", sectionId: { in: ["7a", "7b"] } },
      { subjectId: "science", sectionId: { in: ["8a"] } },
      { subjectId: "math", sectionId: null, gradeId: { in: ["g7"] } },
      { subjectId: "science", sectionId: null, gradeId: { in: ["g8"] } },
    ])
  })

  it("adds legacy class exams and the teacher's own exams", () => {
    const where = teacherExamsWhere({ teacherId: "t1", userId: "u1", pairs })
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { class: { teacherId: "t1" } },
        { createdById: "u1" },
      ])
    )
    expect(where.OR).toHaveLength(6)
  })
})

describe("examAudienceLabel", () => {
  it("names the section first, then the grade, then a legacy class", () => {
    expect(
      examAudienceLabel({
        ...none,
        section: { name: "السابع - أ" },
        grade: { name: "السابع" },
      })
    ).toBe("السابع - أ")
    expect(examAudienceLabel({ ...none, grade: { name: "السابع" } })).toBe(
      "السابع"
    )
    expect(examAudienceLabel({ ...none, class: { name: "Math 7" } })).toBe(
      "Math 7"
    )
    expect(examAudienceLabel(none)).toBe("")
  })

  it("gives paper headers an id and a name", () => {
    expect(
      examAudienceRef({
        ...none,
        gradeId: "g7",
        sectionId: "7a",
        section: { name: "السابع - أ" },
      })
    ).toEqual({ id: "7a", name: "السابع - أ" })
  })
})
