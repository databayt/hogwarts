// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The two numbers the landing hero reads, and the scoping that keeps them
// honest: a student must never be counted a section they are not in, and
// "today" must mean the school's day, not the runtime's.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getLiveLandingCounts } from "@/components/school-dashboard/live/queries"

vi.mock("@/lib/db", () => ({
  db: { conference: { count: vi.fn() } },
}))

const SCHOOL = "school-1"
// 2026-09-01T22:30:00Z — already 2026-09-02 in Khartoum (UTC+2).
const NOW = new Date("2026-09-01T22:30:00.000Z")

type CountArgs = { where: Record<string, unknown> }
const callArgs = (i: number) =>
  vi.mocked(db.conference.count).mock.calls[i][0] as unknown as CountArgs

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.conference.count).mockResolvedValue(0 as never)
})

describe("getLiveLandingCounts", () => {
  it("returns the two counts in order: live now, then the whole day", async () => {
    vi.mocked(db.conference.count)
      .mockResolvedValueOnce(3 as never)
      .mockResolvedValueOnce(12 as never)

    await expect(getLiveLandingCounts(SCHOOL, { now: NOW })).resolves.toEqual({
      liveNow: 3,
      todayTotal: 12,
    })
  })

  it("always scopes to the school and excludes soft-deleted rows", async () => {
    await getLiveLandingCounts(SCHOOL, { now: NOW })
    for (const i of [0, 1]) {
      expect(callArgs(i).where).toMatchObject({
        schoolId: SCHOOL,
        deletedAt: null,
      })
    }
  })

  it("narrows to the viewer's sections when they are scoped — plus school-wide sessions", async () => {
    // A scoped reader sees their own sections' classes AND every session
    // addressed to the whole school (the assembly, the town hall), which the
    // section filter used to drop before visibility was asked.
    await getLiveLandingCounts(SCHOOL, { now: NOW, sectionIds: ["s-1", "s-2"] })
    expect(callArgs(0).where).toMatchObject({
      OR: [{ sectionId: { in: ["s-1", "s-2"] } }, { visibility: "school" }],
    })
  })

  it("leaves the section filter unset for a school-wide viewer", async () => {
    await getLiveLandingCounts(SCHOOL, { now: NOW })
    expect(callArgs(0).where).not.toHaveProperty("sectionId")
    expect(callArgs(0).where).not.toHaveProperty("OR")
  })

  it("narrows to one teacher's own classes when a teacherId is given", async () => {
    // A teacher is staff, so section scope hands them the whole school. The
    // hero says "your next class", so it has to ask a narrower question.
    await getLiveLandingCounts(SCHOOL, { now: NOW, teacherId: "t-1" })
    // ...plus the school's practice room, which is every member's.
    expect(callArgs(0).where).toMatchObject({
      AND: [{ OR: [{ teacherId: "t-1" }, { isPractice: true }] }],
    })
  })

  it("a supervisor's sections widen the strip scope, never the counts", async () => {
    const { getLiveLandingSessions, resolveSupervisedSectionIds } =
      await import("@/components/school-dashboard/live/queries")
    const findMany = vi.fn().mockResolvedValue([])
    const mocked = db as unknown as {
      conference: { findMany: unknown }
      section: { findMany: unknown }
    }
    mocked.conference.findMany = findMany
    mocked.section = {
      findMany: vi.fn().mockResolvedValue([{ id: "sec-a" }, { id: "sec-b" }]),
    }

    // Her own supervised sections are resolved school-scoped.
    await expect(resolveSupervisedSectionIds(SCHOOL, "t-1")).resolves.toEqual([
      "sec-a",
      "sec-b",
    ])
    expect(
      (mocked.section.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
        .where
    ).toEqual({ schoolId: SCHOOL, homeroomTeacherId: "t-1" })

    // The strip sees another teacher's session in a supervised section...
    await getLiveLandingSessions(SCHOOL, {
      now: NOW,
      teacherId: "t-1",
      supervisedSectionIds: ["sec-a", "sec-b"],
    })
    expect(findMany.mock.calls[0][0].where).toMatchObject({
      AND: [
        {
          OR: [
            { teacherId: "t-1" },
            { isPractice: true },
            { sectionId: { in: ["sec-a", "sec-b"] } },
          ],
        },
      ],
    })
    // ...and only those sections: nothing broader than the given ids.
    expect(JSON.stringify(findMany.mock.calls[0][0].where)).not.toContain(
      "sec-c"
    )

    // Counts are never given the supervised ids: still "my classes" only.
    await getLiveLandingCounts(SCHOOL, { now: NOW, teacherId: "t-1" })
    expect(callArgs(0).where).toMatchObject({
      AND: [{ OR: [{ teacherId: "t-1" }, { isPractice: true }] }],
    })
  })

  it("bounds the day in the SCHOOL's timezone, not the runtime's", async () => {
    // 22:30 UTC is already the 2nd in Khartoum, so the window must open on the
    // 2nd — a UTC-bounded query would still be counting the 1st.
    await getLiveLandingCounts(SCHOOL, {
      now: NOW,
      timeZone: "Africa/Khartoum",
    })
    const range = callArgs(1).where.scheduledStart as { gte: Date; lt: Date }
    expect(range.gte.toISOString()).toBe("2026-09-01T22:00:00.000Z")
    expect(range.lt.toISOString()).toBe("2026-09-02T22:00:00.000Z")
  })

  it("honours a different school timezone", async () => {
    await getLiveLandingCounts(SCHOOL, { now: NOW, timeZone: "Asia/Dubai" })
    const range = callArgs(1).where.scheduledStart as { gte: Date; lt: Date }
    // UTC+4 — the 2nd started at 20:00Z.
    expect(range.gte.toISOString()).toBe("2026-09-01T20:00:00.000Z")
  })

  it("counts ended sessions in the day total, but never in live-now", async () => {
    // "12 today" must not shrink as the day is taught.
    await getLiveLandingCounts(SCHOOL, { now: NOW })
    expect(callArgs(0).where.status).toBe("live")
    expect(callArgs(1).where.status).toEqual({
      in: ["scheduled", "live", "ended"],
    })
  })
})
