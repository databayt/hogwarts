// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { getCurriculumCoverage, listCurriculaWithCoverage } from "../coverage"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    curriculum: { findUnique: vi.fn(), findMany: vi.fn() },
    subject: { findMany: vi.fn() },
    chapter: { findMany: vi.fn() },
  },
}))

const SD_CURRICULUM = {
  id: "cur-sd",
  name: "Sudan National Curriculum",
  slug: "sd-national",
  country: "SD",
  code: "national",
}

const SA_CURRICULUM = {
  id: "cur-sa",
  name: "Saudi (Tatweer)",
  slug: "sa-tatweer",
  country: "SA",
  code: "tatweer",
}

// ---------------------------------------------------------------------------
// getCurriculumCoverage
// ---------------------------------------------------------------------------

describe("getCurriculumCoverage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null when the curriculum id is unknown (caller treats as 'not seeded yet')", async () => {
    vi.mocked(db.curriculum.findUnique).mockResolvedValue(null)
    const out = await getCurriculumCoverage("missing")
    expect(out).toBe(null)
    // Critical: no subject/chapter lookups when curriculum doesn't exist
    expect(db.subject.findMany).not.toHaveBeenCalled()
    expect(db.chapter.findMany).not.toHaveBeenCalled()
  })

  it("returns an empty coverage report when the curriculum has zero subjects", async () => {
    vi.mocked(db.curriculum.findUnique).mockResolvedValue(
      SA_CURRICULUM as never
    )
    vi.mocked(db.subject.findMany).mockResolvedValue([] as never)

    const out = await getCurriculumCoverage(SA_CURRICULUM.id)
    expect(out).not.toBe(null)
    expect(out!.curriculum.country).toBe("SA")
    expect(out!.subjects.total).toBe(0)
    expect(out!.subjects.byGrade).toEqual({})
    expect(out!.subjects.byDepartment).toEqual({})
    expect(out!.chapters.total).toBe(0)
    expect(out!.lessons.total).toBe(0)
    // Empty subject set should skip the chapter lookup entirely.
    expect(db.chapter.findMany).not.toHaveBeenCalled()
  })

  it("aggregates grade + department distributions across subjects", async () => {
    vi.mocked(db.curriculum.findUnique).mockResolvedValue(
      SD_CURRICULUM as never
    )
    vi.mocked(db.subject.findMany).mockResolvedValue([
      {
        id: "s1",
        grades: [1, 2, 3],
        department: "العلوم",
        totalChapters: 5,
        totalLessons: 30,
      },
      {
        id: "s2",
        grades: [1],
        department: "العلوم",
        totalChapters: 2,
        totalLessons: 8,
      },
      {
        id: "s3",
        grades: [4, 5],
        department: "اللغات",
        totalChapters: 0,
        totalLessons: 0,
      },
    ] as never)
    vi.mocked(db.chapter.findMany).mockResolvedValue([
      { id: "ch1", _count: { lessons: 10 } },
      { id: "ch2", _count: { lessons: 0 } },
      { id: "ch3", _count: { lessons: 5 } },
    ] as never)

    const out = (await getCurriculumCoverage(SD_CURRICULUM.id))!
    expect(out.subjects.total).toBe(3)
    expect(out.subjects.byGrade).toEqual({ 1: 2, 2: 1, 3: 1, 4: 1, 5: 1 })
    expect(out.subjects.byDepartment).toEqual({ العلوم: 2, اللغات: 1 })
    expect(out.subjects.withChapters).toBe(2) // s1 and s2
    expect(out.subjects.withoutChapters).toBe(1) // s3
    expect(out.lessons.total).toBe(38)
    expect(out.chapters.withLessons).toBe(2)
    expect(out.chapters.withoutLessons).toBe(1)
  })

  it("uses the joined chapter count when the denormalized total is stale (no chapters but rows exist)", async () => {
    vi.mocked(db.curriculum.findUnique).mockResolvedValue(
      SD_CURRICULUM as never
    )
    vi.mocked(db.subject.findMany).mockResolvedValue([
      {
        id: "s1",
        grades: [1],
        department: "Math",
        totalChapters: 0, // stale denormalized field
        totalLessons: 0,
      },
    ] as never)
    vi.mocked(db.chapter.findMany).mockResolvedValue([
      { id: "ch1", _count: { lessons: 3 } },
    ] as never)

    const out = (await getCurriculumCoverage(SD_CURRICULUM.id))!
    expect(out.chapters.total).toBe(1) // falls back to chapters.length when denorm is 0
    expect(out.chapters.withLessons).toBe(1)
  })

  it("scopes the chapter lookup to the curriculum's subject ids only", async () => {
    vi.mocked(db.curriculum.findUnique).mockResolvedValue(
      SD_CURRICULUM as never
    )
    vi.mocked(db.subject.findMany).mockResolvedValue([
      {
        id: "s1",
        grades: [1],
        department: "x",
        totalChapters: 1,
        totalLessons: 2,
      },
      {
        id: "s2",
        grades: [2],
        department: "x",
        totalChapters: 1,
        totalLessons: 2,
      },
    ] as never)
    vi.mocked(db.chapter.findMany).mockResolvedValue([] as never)

    await getCurriculumCoverage(SD_CURRICULUM.id)
    expect(db.chapter.findMany).toHaveBeenCalledWith({
      where: { subjectId: { in: ["s1", "s2"] } },
      select: { id: true, _count: { select: { lessons: true } } },
    })
  })
})

// ---------------------------------------------------------------------------
// listCurriculaWithCoverage
// ---------------------------------------------------------------------------

describe("listCurriculaWithCoverage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns [] when no curricula are seeded yet (skips the subject lookup)", async () => {
    vi.mocked(db.curriculum.findMany).mockResolvedValue([] as never)
    const out = await listCurriculaWithCoverage()
    expect(out).toEqual([])
    expect(db.subject.findMany).not.toHaveBeenCalled()
  })

  it("returns one row per curriculum with subjectCount + sorted unique grades", async () => {
    vi.mocked(db.curriculum.findMany).mockResolvedValue([
      SD_CURRICULUM,
      SA_CURRICULUM,
    ] as never)
    vi.mocked(db.subject.findMany).mockResolvedValue([
      { curriculumId: "cur-sd", grades: [1, 2] },
      { curriculumId: "cur-sd", grades: [2, 3] },
      { curriculumId: "cur-sa", grades: [7, 9, 8] }, // intentionally out-of-order
    ] as never)

    const out = await listCurriculaWithCoverage()
    expect(out).toHaveLength(2)
    const sd = out.find((c) => c.id === "cur-sd")!
    const sa = out.find((c) => c.id === "cur-sa")!
    expect(sd.subjectCount).toBe(2)
    expect(sd.gradeCoverage).toEqual([1, 2, 3]) // unique + sorted ascending
    expect(sa.subjectCount).toBe(1)
    expect(sa.gradeCoverage).toEqual([7, 8, 9])
  })

  it("returns a row with zero subjects when the curriculum exists but has no Subject rows yet", async () => {
    vi.mocked(db.curriculum.findMany).mockResolvedValue([
      SA_CURRICULUM,
    ] as never)
    vi.mocked(db.subject.findMany).mockResolvedValue([] as never)

    const out = await listCurriculaWithCoverage()
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({
      id: SA_CURRICULUM.id,
      name: SA_CURRICULUM.name,
      slug: SA_CURRICULUM.slug,
      country: SA_CURRICULUM.country,
      subjectCount: 0,
      gradeCoverage: [],
    })
  })

  it("ignores subjects with no curriculumId (orphan rows from pre-Phase-4 data)", async () => {
    vi.mocked(db.curriculum.findMany).mockResolvedValue([
      SD_CURRICULUM,
    ] as never)
    vi.mocked(db.subject.findMany).mockResolvedValue([
      { curriculumId: "cur-sd", grades: [1] },
      { curriculumId: null, grades: [2] }, // legacy row not yet backfilled
    ] as never)
    const out = await listCurriculaWithCoverage()
    expect(out[0].subjectCount).toBe(1)
    expect(out[0].gradeCoverage).toEqual([1])
  })
})
