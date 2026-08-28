// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Students list sorting maps to real Prisma columns.
 *
 * Sorting is server-side here (`manualSorting`), and the sort id used to be
 * spread straight into `orderBy` as `{ [s.id]: dir }`. Four of the sortable
 * columns are not Student scalars — `name` is composed from firstName/lastName,
 * `gradeName` comes from AcademicGrade, `classroom` from Section → Classroom,
 * `phone` from mobileNumber — so Prisma rejected them ("Unknown argument
 * `name`"). `StudentsContent` has no try/catch, so any URL carrying one of
 * those sorts took the page down: a shared link, a reload after clicking the
 * header, the back button.
 *
 * The bug is invisible in the browser until a full navigation, because nuqs
 * runs `shallow: true` — clicking the header rewrites the URL without asking
 * the server. That is exactly why this is pinned by a test.
 */
import { describe, expect, it } from "vitest"

import {
  buildStudentOrderBy,
  buildUnplacedFilter,
} from "@/components/school-dashboard/listings/students/list-params"

/** Every key any clause orders on, flattened out of nested relation objects. */
function leafKeys(clauses: Record<string, unknown>[]): string[] {
  const keys: string[] = []
  const walk = (node: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === "object")
        walk(value as Record<string, unknown>)
      else keys.push(key)
    }
  }
  clauses.forEach(walk)
  return keys
}

describe("buildStudentOrderBy", () => {
  it("defaults to newest-first when nothing is sorted", () => {
    expect(buildStudentOrderBy([])).toEqual([{ createdAt: "desc" }])
    expect(buildStudentOrderBy(undefined)).toEqual([{ createdAt: "desc" }])
  })

  it("never emits a derived column as a Student scalar", () => {
    // These four are the crash: they are column ids, not database columns.
    for (const id of ["name", "gradeName", "classroom", "phone"]) {
      const clauses = buildStudentOrderBy([{ id, desc: false }])
      expect(leafKeys(clauses)).not.toContain(id)
      expect(clauses.length).toBeGreaterThan(0)
    }
  })

  it("orders a name sort by first name then last", () => {
    expect(buildStudentOrderBy([{ id: "name", desc: true }])).toEqual([
      { firstName: "desc" },
      { lastName: "desc" },
    ])
  })

  it("reaches through the relation for grade and classroom", () => {
    expect(buildStudentOrderBy([{ id: "gradeName", desc: false }])).toEqual([
      { academicGrade: { gradeNumber: "asc" } },
    ])
    expect(buildStudentOrderBy([{ id: "classroom", desc: false }])).toEqual([
      { section: { classroom: { roomName: "asc" } } },
    ])
  })

  it("passes real scalars through", () => {
    expect(buildStudentOrderBy([{ id: "createdAt", desc: true }])).toEqual([
      { createdAt: "desc" },
    ])
    expect(buildStudentOrderBy([{ id: "studentId", desc: false }])).toEqual([
      { studentId: "asc" },
    ])
  })

  it("drops an unrecognised id instead of passing it to Prisma", () => {
    // `sort` comes off the URL, so an arbitrary id is reachable by hand.
    expect(buildStudentOrderBy([{ id: "bogus", desc: false }])).toEqual([
      { createdAt: "desc" },
    ])
    expect(
      buildStudentOrderBy([
        { id: "bogus", desc: false },
        { id: "name", desc: false },
      ])
    ).toEqual([{ firstName: "asc" }, { lastName: "asc" }])
  })

  it("ignores malformed entries", () => {
    expect(buildStudentOrderBy("not-an-array")).toEqual([{ createdAt: "desc" }])
    expect(buildStudentOrderBy([{ desc: true }, null, 42])).toEqual([
      { createdAt: "desc" },
    ])
  })
})

// ---------------------------------------------------------------------------
// Unplaced filter
// ---------------------------------------------------------------------------

describe("buildUnplacedFilter", () => {
  /**
   * A student with no `academicGradeId` is the quiet failure mode of the whole
   * intake pipeline: `ensureStudentFeeAssignments` short-circuits on a null
   * grade, so no fees are assigned, no invoices are raised, and neither the
   * fee-due nor the fee-overdue cron ever chases them. "No seat" and "no
   * grade" are therefore NOT interchangeable, and `any` has to cover both.
   */
  it("returns an empty filter when the chip is off", () => {
    expect(buildUnplacedFilter("")).toEqual({})
  })

  it("filters on a missing homeroom seat", () => {
    expect(buildUnplacedFilter("seat")).toEqual({ sectionId: null })
  })

  it("filters on a missing grade — the one that costs the school money", () => {
    expect(buildUnplacedFilter("grade")).toEqual({ academicGradeId: null })
  })

  it("covers either gap under `any`", () => {
    expect(buildUnplacedFilter("any")).toEqual({
      OR: [{ sectionId: null }, { academicGradeId: null }],
    })
  })
})
