// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { offeredToStream } from "@/lib/teaching-audience"
import { getStudentSubjects } from "@/lib/teaching-scope"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
    { streamId: null, customName: null, subject: { id: "m", name: "Math" } },
    {
      streamId: "sci",
      customName: "Physics (lab)",
      subject: { id: "p", name: "Physics" },
    },
    {
      streamId: "arts",
      customName: null,
      subject: { id: "h", name: "History" },
    },
    { streamId: "sci", customName: null, subject: { id: "m", name: "Math" } },
  ] as never)
})

describe("offeredToStream", () => {
  it("reaches every stream, the student's own, or anyone without a stream", () => {
    expect(offeredToStream(null, "sci")).toBe(true)
    expect(offeredToStream("sci", "sci")).toBe(true)
    expect(offeredToStream("arts", "sci")).toBe(false)
    expect(offeredToStream("arts", null)).toBe(true)
  })
})

describe("getStudentSubjects", () => {
  it("lists the section grade's subjects for the student's stream, school names first", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      academicGradeId: "g-old",
      academicStreamId: "sci",
      section: { gradeId: "g10" },
    } as never)

    const subjects = await getStudentSubjects(SCHOOL, "s1")

    expect(
      vi.mocked(db.subjectSelection.findMany).mock.calls[0][0]!.where
    ).toEqual({ schoolId: SCHOOL, gradeId: "g10", isActive: true })
    expect(subjects).toEqual([
      { id: "m", name: "Math" },
      { id: "p", name: "Physics (lab)" },
    ])
  })

  it("is empty for a student with no grade", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      academicGradeId: null,
      academicStreamId: null,
      section: null,
    } as never)

    expect(await getStudentSubjects(SCHOOL, "s1")).toEqual([])
    expect(db.subjectSelection.findMany).not.toHaveBeenCalled()
  })
})
