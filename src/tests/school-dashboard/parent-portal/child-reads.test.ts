// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"
import {
  getChildGrades,
  getChildTimetable,
} from "@/components/school-dashboard/parent-portal/actions"

vi.mock("@/lib/db", () => ({
  db: {
    studentGuardian: { findFirst: vi.fn() },
    examResult: { findMany: vi.fn() },
    result: { groupBy: vi.fn() },
    student: { findFirst: vi.fn() },
    subject: { findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/rbac/context", () => ({
  getPolicyContext: vi.fn().mockResolvedValue({
    role: "GUARDIAN",
    guardianId: "guardian-1",
    schoolId: "school-1",
  }),
  PolicyContextError: class extends Error {},
}))
vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn().mockResolvedValue({ term: { id: "term-1" } }),
}))

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.studentGuardian.findFirst).mockResolvedValue({
    id: "sg-1",
  } as never)
})

describe("parent portal — a child's week", () => {
  it("reads the child's section in the active term", async () => {
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "s1", sectionId: "7a", gradeId: "g7" },
    ])
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        id: "slot-1",
        dayOfWeek: 1,
        period: {
          name: "P1",
          startTime: new Date(Date.UTC(1970, 0, 1, 8)),
          endTime: new Date(Date.UTC(1970, 0, 1, 9)),
        },
        section: { name: "7-A" },
        subject: { name: "Math" },
        teacher: { firstName: "Huda", lastName: "Salim" },
        classroom: { roomName: "R1" },
      },
    ] as never)

    const { timetable } = await getChildTimetable({ studentId: "s1" })

    expect(vi.mocked(db.timetable.findMany).mock.calls[0][0]!.where).toEqual({
      schoolId: SCHOOL,
      termId: "term-1",
      weekOffset: 0,
      sectionId: "7a",
    })
    expect(timetable[0]).toMatchObject({
      className: "7-A",
      name: "Math",
      teacherName: "Huda Salim",
      roomName: "R1",
    })
  })

  it("returns an empty week for an unplaced child", async () => {
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "s1", sectionId: null, gradeId: "g7" },
    ])

    const { timetable } = await getChildTimetable({ studentId: "s1" })

    expect(timetable).toEqual([])
    expect(db.timetable.findMany).not.toHaveBeenCalled()
  })
})

describe("parent portal — a child's subject standing", () => {
  it("averages the gradebook per subject", async () => {
    vi.mocked(db.examResult.findMany).mockResolvedValue([])
    vi.mocked(db.result.groupBy).mockResolvedValue([
      { subjectId: "math", _avg: { percentage: 81.26 } },
    ] as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      section: { name: "7-A" },
    } as never)
    vi.mocked(db.subject.findMany).mockResolvedValue([
      { id: "math", name: "Math" },
    ] as never)

    const { grades } = await getChildGrades({ studentId: "s1" })

    expect(vi.mocked(db.result.groupBy).mock.calls[0][0]!.where).toMatchObject({
      schoolId: SCHOOL,
      studentId: "s1",
    })
    expect(grades.classScores).toEqual([
      { id: "math", className: "7-A", name: "Math", score: 81.3 },
    ])
  })
})
