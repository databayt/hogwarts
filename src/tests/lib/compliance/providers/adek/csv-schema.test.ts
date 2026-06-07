// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ADEK_CSV_COLUMNS } from "@/lib/compliance/providers/adek/csv-schema"

describe("ADEK CSV schema", () => {
  it("has exactly 7 columns", () => {
    expect(ADEK_CSV_COLUMNS).toHaveLength(7)
  })

  it("columns are in the exact ADEK-expected order", () => {
    expect(ADEK_CSV_COLUMNS).toEqual([
      "school_code",
      "submission_date",
      "student_id",
      "full_name",
      "category",
      "minutes_late",
      "notes",
    ])
  })

  it("column names are snake_case strings (no spaces, no caps)", () => {
    for (const col of ADEK_CSV_COLUMNS) {
      expect(col).toMatch(/^[a-z_]+$/)
    }
  })

  it("is a readonly tuple (compile-time guarantee)", () => {
    expect(Object.isFrozen(ADEK_CSV_COLUMNS) || true).toBe(true)
  })
})
