// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { attachLiveClasses } from "../live-class-join"

vi.mock("@/lib/db", () => ({
  db: {
    liveClassSession: { findMany: vi.fn() },
    liveClassDefaultLink: { findMany: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const TERM = "term-1"
const DATE = new Date("2026-06-01T12:00:00Z")

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.liveClassSession.findMany).mockResolvedValue([] as never)
  vi.mocked(db.liveClassDefaultLink.findMany).mockResolvedValue([] as never)
})

describe("attachLiveClasses", () => {
  it("short-circuits with no DB calls when no entry has a section+subject", async () => {
    const entries = [{ periodId: "p1" }, { sectionId: null, subjectId: null }]
    const result = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(db.liveClassSession.findMany).not.toHaveBeenCalled()
    expect(db.liveClassDefaultLink.findMany).not.toHaveBeenCalled()
    expect(result.every((e) => e.liveClass === null)).toBe(true)
  })

  it("attaches a scheduled session (sessionId set) to the matching entry", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/abc",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const entries = [{ sectionId: "sec-1", subjectId: "sub-1" }]
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(out.liveClass).toEqual({
      sessionId: "lcs-1",
      provider: "external",
      meetingUrl: "https://meet.google.com/abc",
      status: "scheduled",
    })
  })

  it("falls back to the recurring default link (sessionId null) when no session today", async () => {
    vi.mocked(db.liveClassDefaultLink.findMany).mockResolvedValue([
      {
        sectionId: "sec-1",
        subjectId: "sub-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/recurring",
      },
    ] as never)
    const entries = [{ sectionId: "sec-1", subjectId: "sub-1" }]
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(out.liveClass).toEqual({
      sessionId: null,
      provider: "external",
      meetingUrl: "https://meet.google.com/recurring",
      status: null,
    })
  })

  it("prefers the session over the default link when both exist", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/session",
        status: "live",
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
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-1")
    expect(out.liveClass?.meetingUrl).toBe("https://meet.google.com/session")
  })

  it("keeps the earliest session when several match the same section+subject", async () => {
    // findMany returns ordered-by scheduledStart asc; the first wins.
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-early",
        provider: "external",
        meetingUrl: "https://meet.google.com/early",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
      {
        id: "lcs-late",
        provider: "external",
        meetingUrl: "https://meet.google.com/late",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const [out] = await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(out.liveClass?.sessionId).toBe("lcs-early")
  })

  it("returns null for entries that have no section+subject match", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        provider: "external",
        meetingUrl: "https://meet.google.com/abc",
        status: "scheduled",
        sectionId: "sec-1",
        subjectId: "sub-1",
      },
    ] as never)
    const entries = [
      { sectionId: "sec-1", subjectId: "sub-1" }, // matches
      { sectionId: "sec-9", subjectId: "sub-9" }, // no match
      { sectionId: null, subjectId: null }, // break/empty
    ]
    const result = await attachLiveClasses(SCHOOL, TERM, DATE, entries)
    expect(result[0].liveClass?.sessionId).toBe("lcs-1")
    expect(result[1].liveClass).toBeNull()
    expect(result[2].liveClass).toBeNull()
  })

  it("scopes both queries by schoolId (tenant isolation)", async () => {
    await attachLiveClasses(SCHOOL, TERM, DATE, [
      { sectionId: "sec-1", subjectId: "sub-1" },
    ])
    expect(db.liveClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL }),
      })
    )
    expect(db.liveClassDefaultLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL, termId: TERM }),
      })
    )
  })
})
