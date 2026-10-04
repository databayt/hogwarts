// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  syncGradeSubjectEnrollments,
  syncStudentSubjectEnrollments,
} from "@/lib/enrollment-sync"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn(), findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    enrollment: { updateMany: vi.fn(), createMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"

const selections = [
  { catalogSubjectId: "math", streamId: null },
  { catalogSubjectId: "physics", streamId: "science" },
  { catalogSubjectId: "history", streamId: "arts" },
  { catalogSubjectId: "math", streamId: "science" },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.subjectSelection.findMany).mockResolvedValue(selections as never)
  vi.mocked(db.enrollment.updateMany).mockResolvedValue({ count: 0 })
  vi.mocked(db.enrollment.createMany).mockResolvedValue({ count: 2 })
})

describe("syncStudentSubjectEnrollments", () => {
  it("enrols a student in their section grade's subjects for their stream", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      userId: "u1",
      academicGradeId: "g-old",
      academicStreamId: "science",
      section: { gradeId: "g10" },
    } as never)

    const result = await syncStudentSubjectEnrollments(SCHOOL, "s1")

    expect(vi.mocked(db.student.findFirst).mock.calls[0][0]!.where).toEqual({
      id: "s1",
      schoolId: SCHOOL,
    })
    // The section's grade wins over a stale placed grade
    expect(
      vi.mocked(db.subjectSelection.findMany).mock.calls[0][0]!.where
    ).toEqual({ schoolId: SCHOOL, gradeId: "g10", isActive: true })
    expect(result).toEqual({ subjectIds: ["math", "physics"], created: 2 })
    expect(vi.mocked(db.enrollment.createMany).mock.calls[0][0]).toEqual({
      data: [
        {
          userId: "u1",
          catalogSubjectId: "math",
          schoolId: SCHOOL,
          isActive: true,
          status: "ACTIVE",
        },
        {
          userId: "u1",
          catalogSubjectId: "physics",
          schoolId: SCHOOL,
          isActive: true,
          status: "ACTIVE",
        },
      ],
      skipDuplicates: true,
    })
  })

  it("switches on a row the student can't use, but leaves a completed one", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      userId: "u1",
      academicGradeId: "g10",
      academicStreamId: "science",
      section: null,
    } as never)

    await syncStudentSubjectEnrollments(SCHOOL, "s1")

    expect(vi.mocked(db.enrollment.updateMany).mock.calls[0][0]).toEqual({
      where: {
        userId: "u1",
        catalogSubjectId: { in: ["math", "physics"] },
        status: { not: "COMPLETED" },
        OR: [{ isActive: false }, { status: { not: "ACTIVE" } }],
      },
      data: { isActive: true, status: "ACTIVE" },
    })
  })

  it("gives a student with no stream every stream's subjects", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      userId: "u1",
      academicGradeId: "g10",
      academicStreamId: null,
      section: null,
    } as never)

    const result = await syncStudentSubjectEnrollments(SCHOOL, "s1")

    expect(result.subjectIds).toEqual(["math", "physics", "history"])
  })

  it.each([
    ["no login", { userId: null, academicGradeId: "g10", section: null }],
    ["no grade", { userId: "u1", academicGradeId: null, section: null }],
  ])("writes nothing for a student with %s", async (_, student) => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      academicStreamId: null,
      ...student,
    } as never)

    const result = await syncStudentSubjectEnrollments(SCHOOL, "s1")

    expect(result).toEqual({ subjectIds: [], created: 0 })
    expect(db.enrollment.createMany).not.toHaveBeenCalled()
    expect(db.enrollment.updateMany).not.toHaveBeenCalled()
  })

  it("never throws — a failed sync leaves placement alone", async () => {
    vi.mocked(db.student.findFirst).mockRejectedValue(new Error("db down"))
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    await expect(syncStudentSubjectEnrollments(SCHOOL, "s1")).resolves.toEqual({
      subjectIds: [],
      created: 0,
    })
    warn.mockRestore()
  })

  it("runs on the client it is given (a transaction)", async () => {
    const tx = {
      student: {
        findFirst: vi.fn().mockResolvedValue({
          userId: "u1",
          academicGradeId: "g10",
          academicStreamId: null,
          section: null,
        }),
      },
      subjectSelection: { findMany: vi.fn().mockResolvedValue(selections) },
      enrollment: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 3 }),
      },
    }

    const result = await syncStudentSubjectEnrollments(
      SCHOOL,
      "s1",
      tx as never
    )

    expect(result.created).toBe(3)
    expect(db.student.findFirst).not.toHaveBeenCalled()
  })
})

describe("syncGradeSubjectEnrollments", () => {
  it("enrols the grade's active students, each in their stream's subjects", async () => {
    vi.mocked(db.student.findMany).mockResolvedValue([
      { userId: "u1", academicStreamId: "science" },
      { userId: "u2", academicStreamId: "arts" },
      { userId: "u3", academicStreamId: null },
    ] as never)
    vi.mocked(db.enrollment.createMany).mockResolvedValue({ count: 7 })

    const result = await syncGradeSubjectEnrollments(SCHOOL, "g10")

    expect(vi.mocked(db.student.findMany).mock.calls[0][0]!.where).toEqual({
      schoolId: SCHOOL,
      OR: [
        { section: { gradeId: "g10" } },
        { sectionId: null, academicGradeId: "g10" },
      ],
      status: "ACTIVE",
      userId: { not: null },
    })
    const rows = (
      vi.mocked(db.enrollment.createMany).mock.calls[0][0]!.data as Array<{
        userId: string
        catalogSubjectId: string
      }>
    ).map((r) => `${r.userId}:${r.catalogSubjectId}`)
    expect(rows).toEqual([
      "u1:math",
      "u1:physics",
      "u2:math",
      "u2:history",
      "u3:math",
      "u3:physics",
      "u3:history",
    ])
    expect(result).toEqual({ created: 7 })
  })

  it("writes nothing when the grade has no students", async () => {
    vi.mocked(db.student.findMany).mockResolvedValue([])

    const result = await syncGradeSubjectEnrollments(SCHOOL, "g10")

    expect(result).toEqual({ created: 0 })
    expect(db.enrollment.createMany).not.toHaveBeenCalled()
  })
})
