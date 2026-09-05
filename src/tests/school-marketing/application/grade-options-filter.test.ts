// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  filterGradeOptionsBySchool,
  getGradeOptions,
} from "@/components/school-marketing/application/academic/config"

const ALL = getGradeOptions({})

describe("filterGradeOptionsBySchool", () => {
  it("keeps the full list when the school has defined no grades yet", () => {
    expect(filterGradeOptionsBySchool(ALL, [])).toHaveLength(ALL.length)
    expect(filterGradeOptionsBySchool(ALL, null)).toHaveLength(ALL.length)
  })

  it("offers only the grades the school teaches", () => {
    const labels = filterGradeOptionsBySchool(ALL, [1, 2, 3]).map(
      (o) => o.label
    )
    expect(labels).toEqual(["Grade 1", "Grade 2", "Grade 3"])
  })

  it("treats the KG entries by their label root, not their trailing digit", () => {
    // KG1/KG2 must not masquerade as Grade 1/2 …
    expect(filterGradeOptionsBySchool(ALL, [1, 2]).map((o) => o.label)).toEqual(
      ["Grade 1", "Grade 2"]
    )
    // … and a school with a kindergarten (gradeNumber 0) gets both KG entries.
    expect(filterGradeOptionsBySchool(ALL, [0]).map((o) => o.label)).toEqual([
      "KG 1",
      "KG 2",
    ])
  })
})
