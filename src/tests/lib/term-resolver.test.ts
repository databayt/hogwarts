// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { pickActiveTerm, resolveActiveTerm } from "@/lib/term-resolver"

vi.mock("@/lib/db", () => ({
  db: {
    term: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  },
}))

const today = new Date("2026-09-28T09:00:00Z")
const d = (iso: string) => new Date(`${iso}T00:00:00Z`)

function term(
  id: string,
  start: string,
  end: string,
  isActive = false
): {
  id: string
  termNumber: number
  startDate: Date
  endDate: Date
  isActive: boolean
  schoolYear: { id: string }
} {
  return {
    id,
    termNumber: 1,
    startDate: d(start),
    endDate: d(end),
    isActive,
    schoolYear: { id: `year-${id}` },
  }
}

// Newest start first, the order the resolver's query returns.
const past = term("past", "2026-01-10", "2026-04-30")
const current = term("current", "2026-09-01", "2026-12-20")
const future = term("future", "2027-01-10", "2027-04-30")

describe("pickActiveTerm", () => {
  it("prefers an active term whose dates contain today", () => {
    const activeNow = { ...current, isActive: true }
    const activeOld = { ...past, isActive: true }
    expect(pickActiveTerm([future, activeNow, activeOld], today)).toEqual({
      term: activeNow,
      source: "explicit",
    })
  })

  it("falls back to any active term when none contains today", () => {
    const activeOld = { ...past, isActive: true }
    expect(pickActiveTerm([future, current, activeOld], today)).toEqual({
      term: activeOld,
      source: "explicit",
    })
  })

  it("uses the term containing today when none is active", () => {
    expect(pickActiveTerm([future, current, past], today)).toEqual({
      term: current,
      source: "date_range",
    })
  })

  it("uses the most recent term when none contains today", () => {
    expect(pickActiveTerm([future, past], today)).toEqual({
      term: future,
      source: "most_recent",
    })
  })

  it("returns null for a school without terms", () => {
    expect(pickActiveTerm([], today)).toBeNull()
  })
})

describe("resolveActiveTerm", () => {
  beforeEach(() => vi.clearAllMocks())

  it("answers from one query, newest start first", async () => {
    vi.mocked(db.term.findMany).mockResolvedValue([current, past] as never)

    const result = await resolveActiveTerm("school-1")

    expect(db.term.findMany).toHaveBeenCalledTimes(1)
    expect(db.term.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: "school-1" },
        orderBy: { startDate: "desc" },
      })
    )
    expect(db.term.findFirst).not.toHaveBeenCalled()
    expect(db.term.count).not.toHaveBeenCalled()
    expect(result.term?.yearId).toBe(`year-${result.term?.id}`)
  })
})
