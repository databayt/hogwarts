// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The catalog + physical-schedule sourcing behind the wizard: which real class
// slots are offerable, which subjects a grade actually studies, and which
// catalog lessons belong to that grade.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  getConferenceSlotOptions,
  getLiveClassFormOptions,
  getLiveClassReferenceData,
} from "@/components/school-dashboard/conference/queries"

vi.mock("@/lib/db", () => ({
  db: {
    timetable: { findMany: vi.fn() },
    teacher: { findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    section: { findMany: vi.fn() },
    lesson: { findMany: vi.fn() },
    schoolExam: { findMany: vi.fn() },
    schoolAssignment: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getConferenceSlotOptions", () => {
  beforeEach(() => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([] as never)
  })

  it("offers only real teachable slots — no breaks, no unassigned, no sectionless", async () => {
    await getConferenceSlotOptions(SCHOOL, "term-1")
    const args = vi.mocked(db.timetable.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
    }
    expect(args.where).toMatchObject({
      schoolId: SCHOOL,
      termId: "term-1",
      weekOffset: 0,
      sectionId: { not: null },
      teacherId: { not: null },
      // isBreak is the source of truth for break-ness — never the period name.
      period: { isBreak: false },
    })
  })

  it("scopes to one teacher's own slots when a teacherId is given", async () => {
    await getConferenceSlotOptions(SCHOOL, "term-1", "t-1")
    const args = vi.mocked(db.timetable.findMany).mock.calls[0][0] as {
      where: { teacherId: unknown }
    }
    expect(args.where.teacherId).toBe("t-1")
  })

  it("renders the period's UTC-anchored TIME column as an HH:mm wall clock", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        id: "tt-1",
        dayOfWeek: 0,
        teacherId: "t-1",
        subjectId: "sub-1",
        sectionId: "sec-1",
        subject: { name: "Mathematics" },
        section: { name: "Grade 1-A", grade: { gradeNumber: 1 } },
        teacher: { firstName: "Fatima", lastName: "Ali" },
        period: {
          name: "Period 3",
          // Period times are epoch-anchored UTC — reading them with the local
          // getters drifts by the server's offset (the documented seed bug).
          startTime: new Date(Date.UTC(1970, 0, 1, 8, 5)),
          endTime: new Date(Date.UTC(1970, 0, 1, 8, 50)),
        },
      },
    ] as never)

    const [slot] = await getConferenceSlotOptions(SCHOOL, "term-1")
    expect(slot).toMatchObject({
      timetableId: "tt-1",
      startTime: "08:05",
      endTime: "08:50",
      teacherName: "Fatima Ali",
      subjectName: "Mathematics",
      sectionName: "Grade 1-A",
      gradeNumber: 1,
    })
  })

  it("drops rows the DB filter can't type-narrow (null teacher/section)", async () => {
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        id: "tt-bad",
        dayOfWeek: 1,
        teacherId: null,
        sectionId: "sec-1",
        subjectId: null,
        subject: null,
        section: { name: "Grade 1-A", grade: { gradeNumber: 1 } },
        teacher: null,
        period: {
          name: "P1",
          startTime: new Date(Date.UTC(1970, 0, 1, 8, 0)),
          endTime: new Date(Date.UTC(1970, 0, 1, 8, 45)),
        },
      },
    ] as never)
    expect(await getConferenceSlotOptions(SCHOOL, "term-1")).toEqual([])
  })
})

describe("getLiveClassFormOptions", () => {
  it("maps each catalog subject to the grades that adopted it, preferring the school's own name", async () => {
    vi.mocked(db.teacher.findMany).mockResolvedValue([] as never)
    vi.mocked(db.section.findMany).mockResolvedValue([
      {
        id: "sec-1",
        name: "Grade 1-A",
        gradeId: "g1",
        grade: { gradeNumber: 1 },
      },
    ] as never)
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
      {
        gradeId: "g1",
        customName: "Maths",
        subject: { id: "sub-1", name: "Mathematics" },
      },
      {
        gradeId: "g2",
        customName: null,
        subject: { id: "sub-1", name: "Mathematics" },
      },
      {
        gradeId: "g2",
        customName: null,
        subject: { id: "sub-2", name: "Physics" },
      },
    ] as never)

    const opts = await getLiveClassFormOptions(SCHOOL)
    expect(opts.subjects).toEqual([
      // customName is the school's own label for the subject — it wins.
      { id: "sub-1", name: "Maths", gradeIds: ["g1", "g2"] },
      { id: "sub-2", name: "Physics", gradeIds: ["g2"] },
    ])
    // gradeNumber rides along so the lesson picker can narrow by grade.
    expect(opts.sections[0]).toMatchObject({ gradeId: "g1", gradeNumber: 1 })
  })
})

describe("getLiveClassReferenceData — catalog scoped to the grade", () => {
  beforeEach(() => {
    vi.mocked(db.lesson.findMany).mockResolvedValue([] as never)
    vi.mocked(db.schoolExam.findMany).mockResolvedValue([] as never)
    vi.mocked(db.schoolAssignment.findMany).mockResolvedValue([] as never)
  })

  it("keeps grade-untagged chapters visible when narrowing by grade", async () => {
    await getLiveClassReferenceData(SCHOOL, "sub-1", 7)
    const args = vi.mocked(db.lesson.findMany).mock.calls[0][0] as {
      where: { chapter: Record<string, unknown> }
    }
    // Chapter.grades defaults to [] — a bare `has` would hide most of the
    // catalog, so untagged chapters stay in.
    expect(args.where.chapter).toMatchObject({
      subjectId: "sub-1",
      OR: [{ grades: { has: 7 } }, { grades: { isEmpty: true } }],
    })
  })

  it("applies no grade filter when the section's grade is unknown", async () => {
    await getLiveClassReferenceData(SCHOOL, "sub-1")
    const args = vi.mocked(db.lesson.findMany).mock.calls[0][0] as {
      where: { chapter: Record<string, unknown> }
    }
    expect(args.where.chapter).toEqual({ subjectId: "sub-1" })
  })
})
