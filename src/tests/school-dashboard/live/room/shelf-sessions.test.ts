// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// What the room's shelf is allowed to name.
//
// The shelf is not a permission gate, but it must not widen the one that
// already ran. `canAccessSession` admits a STUDENT or GUARDIAN to a
// `visibility: "school"` session on school membership ALONE, whatever section
// the row happens to carry — so a shelf keyed on `sectionId` would list a
// stranger section's section-visible classes, by subject, time and lesson, to
// a reader who was only ever let in school-wide. `getLiveClass` answers
// NOT_FOUND rather than UNAUTHORIZED precisely so those sessions are not
// revealed to exist.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { findRoomShelfSessions } from "@/components/school-dashboard/live/queries"

vi.mock("@/lib/db", () => ({
  db: { conference: { findMany: vi.fn() } },
}))

const SCHOOL = "school-1"
const NOW = new Date("2026-09-03T08:00:00.000Z")

type FindArgs = {
  where: Record<string, unknown>
  orderBy: Record<string, unknown>
  take: number
}
const callArgs = (i: number) =>
  vi.mocked(db.conference.findMany).mock.calls[i][0] as unknown as FindArgs

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
})

describe("findRoomShelfSessions", () => {
  it("gives a section-scoped class its own section's series", async () => {
    await findRoomShelfSessions(SCHOOL, {
      sessionId: "c-1",
      sectionId: "sec-x",
      visibility: "section",
      now: NOW,
    })
    for (const i of [0, 1]) {
      expect(callArgs(i).where).toMatchObject({ sectionId: "sec-x" })
      expect(callArgs(i).where).not.toHaveProperty("visibility")
    }
  })

  it("gives a SCHOOL-WIDE class the school's series even when it names a section", async () => {
    // The leak this exists to stop: the row has a section, but school-wide is
    // what admitted the reader, so the section is not theirs to be shown.
    await findRoomShelfSessions(SCHOOL, {
      sessionId: "c-1",
      sectionId: "sec-x",
      visibility: "school",
      now: NOW,
    })
    for (const i of [0, 1]) {
      expect(callArgs(i).where).toMatchObject({ visibility: "school" })
      expect(callArgs(i).where).not.toHaveProperty("sectionId")
    }
  })

  it("falls back to school-wide when the class names no section at all", async () => {
    await findRoomShelfSessions(SCHOOL, {
      sessionId: "c-1",
      sectionId: null,
      visibility: "section",
      now: NOW,
    })
    expect(callArgs(0).where).toMatchObject({ visibility: "school" })
  })

  it("always scopes to the tenant, drops soft-deleted rows and excludes itself", async () => {
    await findRoomShelfSessions(SCHOOL, {
      sessionId: "c-1",
      sectionId: "sec-x",
      visibility: "section",
      now: NOW,
    })
    for (const i of [0, 1]) {
      expect(callArgs(i).where).toMatchObject({
        schoolId: SCHOOL,
        deletedAt: null,
        id: { not: "c-1" },
      })
    }
  })

  it("reads as a season: the recent past oldest-first, then what is still to come", async () => {
    vi.mocked(db.conference.findMany)
      .mockResolvedValueOnce([{ id: "p2" }, { id: "p1" }] as never) // desc
      .mockResolvedValueOnce([{ id: "u1" }, { id: "u2" }] as never) // asc

    const rows = await findRoomShelfSessions(SCHOOL, {
      sessionId: "c-1",
      sectionId: "sec-x",
      visibility: "section",
      now: NOW,
    })

    expect(rows.map((r) => r.id)).toEqual(["p1", "p2", "u1", "u2"])
    expect(callArgs(0)).toMatchObject({
      orderBy: { scheduledStart: "desc" },
      take: 4,
    })
    expect(callArgs(1)).toMatchObject({
      orderBy: { scheduledStart: "asc" },
      take: 8,
    })
    expect(callArgs(0).where).toMatchObject({ scheduledStart: { lt: NOW } })
    expect(callArgs(1).where).toMatchObject({ scheduledStart: { gte: NOW } })
  })
})
