// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// attachLiveClasses — resolves the timetable "Join live class" target per slot:
// a session scheduled today for the (section, subject) wins; else the stable
// LiveClassDefaultLink; else null. All queries are schoolId-scoped.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { attachLiveClasses } from "../live-class-join"

vi.mock("@/lib/db", () => ({
  db: {
    liveClassSession: { findMany: vi.fn() },
    liveClassDefaultLink: { findMany: vi.fn() },
  },
}))

const SCHOOL_ID = "school-aldar"
const TERM_ID = "term-1"
const DATE = new Date("2026-06-01T08:00:00Z")

const slot = (sectionId: string | null, subjectId: string | null) => ({
  periodId: `p-${sectionId}-${subjectId}`,
  sectionId,
  subjectId,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.liveClassSession.findMany).mockResolvedValue([] as never)
  vi.mocked(db.liveClassDefaultLink.findMany).mockResolvedValue([] as never)
})

describe("attachLiveClasses", () => {
  it("short-circuits (no DB calls) when no entry has a section", async () => {
    // No slot carries a sectionId → nothing to resolve, skip the queries.
    const entries = [slot(null, "sub-1"), slot(null, "sub-2"), slot(null, null)]
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, entries)
    expect(result.every((e) => e.liveClass === null)).toBe(true)
    expect(db.liveClassSession.findMany).not.toHaveBeenCalled()
    expect(db.liveClassDefaultLink.findMany).not.toHaveBeenCalled()
  })

  it("resolves all-null when section + subject live on different slots (no overlap)", async () => {
    // sec-1 and sub-1 exist, but on different slots — the query runs, yet no
    // single slot has BOTH, so every entry's per-slot guard yields null.
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [
      slot("sec-1", null),
      slot(null, "sub-1"),
    ])
    expect(result.every((e) => e.liveClass === null)).toBe(true)
    expect(db.liveClassSession.findMany).toHaveBeenCalled()
  })

  it("attaches a scheduled session (sessionId set) to the matching slot", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/abc",
        status: "live",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [
      slot("sec-1", "sub-1"),
      slot("sec-2", "sub-2"),
    ])
    expect(result[0].liveClass).toEqual({
      sessionId: "lcs-1",
      provider: "external",
      meetingUrl: "https://meet.google.com/abc",
      status: "live",
    })
    expect(result[1].liveClass).toBeNull()
  })

  it("falls back to the stable default link (sessionId null) when no session today", async () => {
    vi.mocked(db.liveClassDefaultLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/recurring",
      },
    ] as never)
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [
      slot("sec-1", "sub-1"),
    ])
    expect(result[0].liveClass).toEqual({
      sessionId: null,
      provider: "external",
      meetingUrl: "https://meet.google.com/recurring",
      status: null,
    })
  })

  it("prefers the session over the default link when both exist", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-win",
        provider: "livekit",
        meetingUrl: null,
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    vi.mocked(db.liveClassDefaultLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/recurring",
      },
    ] as never)
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [
      slot("sec-1", "sub-1"),
    ])
    expect(result[0].liveClass?.sessionId).toBe("lcs-win")
    expect(result[0].liveClass?.provider).toBe("livekit")
  })

  it("keeps the earliest session when several match the same section+subject", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-early",
        provider: "external",
        meetingUrl: "u1",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
      {
        id: "lcs-late",
        provider: "external",
        meetingUrl: "u2",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [
      slot("sec-1", "sub-1"),
    ])
    expect(result[0].liveClass?.sessionId).toBe("lcs-early")
  })

  it("returns null for entries that have no section+subject", async () => {
    const result = await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [
      slot("sec-1", "sub-1"),
      slot(null, null),
    ])
    expect(result[1].liveClass).toBeNull()
  })

  it("scopes both queries by schoolId (tenant isolation)", async () => {
    await attachLiveClasses(SCHOOL_ID, TERM_ID, DATE, [slot("sec-1", "sub-1")])
    expect(db.liveClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_ID }),
      })
    )
    expect(db.liveClassDefaultLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_ID,
          termId: TERM_ID,
        }),
      })
    )
  })
})
