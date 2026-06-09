// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { setupCatalogForSchool } from "@/components/catalog/setup"

// Step 6 — lock in the invariants of LEVEL_CONFIG + SCHOOL_LEVEL_TO_CATALOG.
// These constants are private to catalog-setup.ts but their EFFECT on the
// number of AcademicGrades created is observable. Rather than re-exporting
// them (leaky), we mock the DB and count grade creations per schoolLevel.

vi.mock("@/lib/db", () => {
  const create = vi.fn()
  const findMany = vi.fn().mockResolvedValue([])
  const findUnique = vi.fn()
  const count = vi.fn().mockResolvedValue(0)
  const $transaction = vi.fn()

  return {
    db: {
      school: { findUnique },
      academicLevel: { count, create: vi.fn() },
      academicGrade: { create },
      academicStream: { create: vi.fn() },
      yearLevel: { findMany },
      subject: { findMany: vi.fn() },
      catalogSubject: { update: vi.fn() },
      schoolSubjectSelection: { create: vi.fn(), createMany: vi.fn() },
      $transaction,
    },
  }
})

vi.mock("@/lib/timetable-reference", () => ({
  getReferenceWeeklyPeriods: vi.fn().mockReturnValue(4),
}))

async function gradesCreatedFor(schoolLevel: "primary" | "secondary" | "both") {
  vi.mocked(db.academicLevel.count).mockResolvedValue(0)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    schoolLevel,
    country: "SD",
    schoolType: "private",
    timetableStructure: null,
  } as never)
  vi.mocked(db.subject.findMany).mockResolvedValue([
    {
      id: "c1",
      name: "x",
      levels: ["ELEMENTARY", "MIDDLE", "HIGH"],
      grades: [],
    },
  ] as never)
  vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

  const created: number[] = []
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
    const tx = {
      academicLevel: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockImplementation(async (args: any) => ({
          id: `al-${args.data.level}`,
          level: args.data.level,
        })),
      },
      academicGrade: {
        create: vi.fn().mockImplementation(async (args: any) => {
          created.push(args.data.gradeNumber)
          return { id: `ag-${args.data.gradeNumber}` }
        }),
      },
      academicStream: { create: vi.fn().mockResolvedValue({ id: "s" }) },
      schoolSubjectSelection: { create: vi.fn(), createMany: vi.fn() },
      subjectSelection: { create: vi.fn(), createMany: vi.fn() },
      catalogSubject: { update: vi.fn() },
    }
    return cb(tx)
  })

  await setupCatalogForSchool("school-test")
  return created.sort((a, b) => a - b)
}

describe("Step 6 — AcademicGrade creation respects schoolLevel", () => {
  it("primary creates grades 1-6 exactly", async () => {
    const grades = await gradesCreatedFor("primary")
    expect(grades).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("secondary creates grades 7-12 exactly", async () => {
    const grades = await gradesCreatedFor("secondary")
    expect(grades).toEqual([7, 8, 9, 10, 11, 12])
  })

  it("both creates all 12 grades", async () => {
    const grades = await gradesCreatedFor("both")
    expect(grades).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it("null schoolLevel falls back to 'both' (12 grades, never zero)", async () => {
    vi.mocked(db.academicLevel.count).mockResolvedValue(0)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      schoolLevel: null,
      country: "SD",
      schoolType: "private",
      timetableStructure: null,
    } as never)
    vi.mocked(db.subject.findMany).mockResolvedValue([
      { id: "c1", name: "x", levels: ["ELEMENTARY"], grades: [] },
    ] as never)
    vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

    const created: number[] = []
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      const tx = {
        academicLevel: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockImplementation(async (args: any) => ({
            id: `al-${args.data.level}`,
            level: args.data.level,
          })),
        },
        academicGrade: {
          create: vi.fn().mockImplementation(async (args: any) => {
            created.push(args.data.gradeNumber)
            return { id: "ag" }
          }),
        },
        academicStream: { create: vi.fn().mockResolvedValue({ id: "s" }) },
        schoolSubjectSelection: { create: vi.fn(), createMany: vi.fn() },
        subjectSelection: { create: vi.fn(), createMany: vi.fn() },
        catalogSubject: { update: vi.fn() },
      }
      return cb(tx)
    })

    await setupCatalogForSchool("school-test-null")
    expect(created.sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
  })
})
