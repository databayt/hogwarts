// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The /live landing page's two per-reader rules: what a card calls the class
// it is describing, and which two recordings are worth this reader's time.
//
// Both were verified once against demo rows — a student who had attended
// eleven of twelve classes saw one catch-up card, and the pair of recordings
// rendered was the OLDER pair because it was the missed one. Neither
// verification survives the next re-seed, which is what these pin.

import { describe, expect, it } from "vitest"

import {
  resolveLandingViewer,
  rowContext,
} from "@/components/school-dashboard/live/landing/viewer"
import { rankRecordings } from "@/components/school-dashboard/live/queries"

const session = { sectionName: "Grade 7-A", gradeName: "Grade 7" }

describe("rowContext", () => {
  it("names the SECTION to every reader who spans more than one", () => {
    for (const role of [
      "DEVELOPER",
      "ADMIN",
      "TEACHER",
      "GUARDIAN",
      "STAFF",
      "ACCOUNTANT",
    ]) {
      expect(rowContext(session, resolveLandingViewer(role))).toBe("Grade 7-A")
    }
  })

  it("names the GRADE to a student", () => {
    // `Section.name` already contains the grade, so a student whose every row
    // is one section would be reading the class letter for no reason.
    expect(rowContext(session, resolveLandingViewer("STUDENT"))).toBe("Grade 7")
  })

  it("falls back to whichever half exists", () => {
    const admin = resolveLandingViewer("ADMIN")
    const student = resolveLandingViewer("STUDENT")
    expect(rowContext({ sectionName: null, gradeName: "Grade 7" }, admin)).toBe(
      "Grade 7"
    )
    expect(
      rowContext({ sectionName: "Grade 7-A", gradeName: null }, student)
    ).toBe("Grade 7-A")
    expect(rowContext({ sectionName: null, gradeName: null }, admin)).toBeNull()
  })
})

describe("rankRecordings", () => {
  // The rows arrive newest-first from the query; `participants` is the probe
  // for "this reader was in it", so an empty array means they missed it.
  const rows = [
    { id: "newest-attended", participants: [{ id: "p1" }] },
    { id: "older-missed", participants: [] },
    { id: "oldest-attended", participants: [{ id: "p2" }] },
    { id: "oldest-missed", participants: [] },
  ]

  it("puts a missed class ahead of a more recent attended one", () => {
    // This is the whole feature: without it the section degrades to "the two
    // most recent recordings", which any demo would still look right on.
    expect(rankRecordings(rows).map((r) => r.id)).toEqual([
      "older-missed",
      "oldest-missed",
      "newest-attended",
      "oldest-attended",
    ])
  })

  it("keeps recency inside each group", () => {
    const attended = rankRecordings([
      { id: "newer", participants: [{ id: "p1" }] },
      { id: "older", participants: [{ id: "p2" }] },
    ])
    expect(attended.map((r) => r.id)).toEqual(["newer", "older"])
  })

  it("leaves an all-missed list in the order it arrived", () => {
    const missed = rankRecordings([
      { id: "newer", participants: [] },
      { id: "older", participants: [] },
    ])
    expect(missed.map((r) => r.id)).toEqual(["newer", "older"])
  })

  it("does not mutate its input", () => {
    const input = [
      { id: "a", participants: [{ id: "p" }] },
      { id: "b", participants: [] },
    ]
    rankRecordings(input)
    expect(input.map((r) => r.id)).toEqual(["a", "b"])
  })
})
