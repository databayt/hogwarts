// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"

vi.mock("@/lib/db", () => ({
  db: {
    academicGrade: { findFirst: vi.fn() },
    section: { findFirst: vi.fn() },
    subjectSelection: { findFirst: vi.fn() },
  },
}))

vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn(),
}))

const SCHOOL = "school-1"
const input = { gradeId: "g7", sectionId: "7a", subjectId: "math" }

describe("resolveTeachingScope", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      id: "g7",
    } as never)
    vi.mocked(db.section.findFirst).mockResolvedValue({ id: "7a" } as never)
    vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
      id: "sel-1",
    } as never)
    vi.mocked(resolveActiveTerm).mockResolvedValue({
      term: { id: "term-1" },
      source: "explicit",
    } as never)
  })

  it("returns the scope with the active term", async () => {
    expect(await resolveTeachingScope(SCHOOL, input)).toEqual({
      ok: true,
      scope: {
        gradeId: "g7",
        sectionId: "7a",
        subjectId: "math",
        termId: "term-1",
      },
    })
  })

  it("checks every id against the school, and the section against its grade", async () => {
    await resolveTeachingScope(SCHOOL, input)
    expect(db.academicGrade.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "g7", schoolId: SCHOOL } })
    )
    expect(db.section.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "7a", schoolId: SCHOOL, gradeId: "g7" },
      })
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

  it("treats a missing section as the whole grade", async () => {
    const result = await resolveTeachingScope(SCHOOL, {
      gradeId: "g7",
      sectionId: null,
      subjectId: "math",
    })
    expect(result).toMatchObject({ ok: true, scope: { sectionId: null } })
    expect(db.section.findFirst).not.toHaveBeenCalled()
  })

  it("refuses another school's grade", async () => {
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue(null)
    expect(await resolveTeachingScope(SCHOOL, input)).toEqual({
      ok: false,
      code: "GRADE_NOT_FOUND",
    })
  })

  it("refuses a section outside the grade", async () => {
    vi.mocked(db.section.findFirst).mockResolvedValue(null)
    expect(await resolveTeachingScope(SCHOOL, input)).toEqual({
      ok: false,
      code: "INVALID_SECTION",
    })
  })

  it("refuses a subject the grade doesn't teach", async () => {
    vi.mocked(db.subjectSelection.findFirst).mockResolvedValue(null)
    expect(await resolveTeachingScope(SCHOOL, input)).toEqual({
      ok: false,
      code: "SUBJECT_NOT_IN_GRADE",
    })
  })

  it("still resolves when the school has no active term", async () => {
    vi.mocked(resolveActiveTerm).mockResolvedValue({
      term: null,
      source: "none",
    } as never)
    expect(await resolveTeachingScope(SCHOOL, input)).toMatchObject({
      ok: true,
      scope: { termId: null },
    })
  })
})
