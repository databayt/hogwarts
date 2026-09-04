// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The cron's candidate-school filter. `effectivePolicy` resolves FOUR stored
// sources in hybrid mode — school default, section override, GRADE override,
// window — and the pre-filter must name every one of them, or a school that
// is online through the missing arm alone is never even handed to
// `materializeSchoolDay`. The grade arm shipped 2026-08-30 without being added
// here; nothing noticed because a materialized day only proves the arms that
// happened to be on.
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { materializeOnlineSchools } from "@/components/school-dashboard/live/actions/materialize-day"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn(), findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
    conferenceLink: { findMany: vi.fn() },
    scheduleException: { findFirst: vi.fn() },
    section: { findMany: vi.fn() },
    substitutionRecord: { findMany: vi.fn() },
    period: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn(async () => ({ term: null })),
}))

type Where = { OR: Array<Record<string, unknown>> }

function candidateWhere(): Where {
  const call = vi.mocked(db.school.findMany).mock.calls[0]?.[0] as {
    where: Where
  }
  return call.where
}

describe("materializeOnlineSchools — candidate filter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.school.findMany).mockResolvedValue([] as never)
  })

  it("names all four online sources: school default, section, GRADE, window", async () => {
    await materializeOnlineSchools(new Date("2026-09-04T06:00:00Z"))
    const arms = candidateWhere().OR
    expect(arms).toContainEqual({ conferenceOnlineDefault: true })
    expect(arms).toContainEqual({
      sections: { some: { conferenceOnline: true } },
    })
    expect(arms).toContainEqual({
      academicGrades: { some: { conferenceOnline: true } },
    })
    expect(arms).toContainEqual(
      expect.objectContaining({ conferenceOnlineFrom: { not: null } })
    )
  })

  it("the window arm keeps an open-ended closure and drops one that expired long ago", async () => {
    const now = new Date("2026-09-04T06:00:00Z")
    await materializeOnlineSchools(now)
    const window = candidateWhere().OR.find(
      (a) => "conferenceOnlineFrom" in a
    ) as { OR: Array<Record<string, unknown>> }
    expect(window.OR).toContainEqual({ conferenceOnlineUntil: null })
    const bounded = window.OR.find(
      (a) => "conferenceOnlineUntil" in a && a.conferenceOnlineUntil !== null
    ) as {
      conferenceOnlineUntil: { gte: Date }
    }
    // 48h of grace, measured from the sweep's own clock.
    expect(bounded.conferenceOnlineUntil.gte.getTime()).toBe(
      now.getTime() - 48 * 60 * 60 * 1000
    )
  })

  it("sweeps each candidate once and totals the results", async () => {
    vi.mocked(db.school.findMany).mockResolvedValue([
      { id: "s1" },
      { id: "s2" },
    ] as never)
    // No school row → materializeSchoolDay returns EMPTY without touching
    // anything else; enough to prove the loop and the tally.
    vi.mocked(db.school.findUnique).mockResolvedValue(null as never)
    const r = await materializeOnlineSchools(new Date("2026-09-04T06:00:00Z"))
    expect(r.schools).toBe(2)
    expect(db.school.findUnique).toHaveBeenCalledTimes(2)
  })
})
