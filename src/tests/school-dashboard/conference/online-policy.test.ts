// Copyright (c) 2025-present databayt/
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Does this school teach online, and over which back-end?" — the single
// decision every online-school path reads. `effectivePolicy` is pure, so the
// rules are tested directly; the db-backed wrappers are covered for the
// batching + tenant-scoping behaviour that the cron depends on.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { isLiveKitConfigured } from "@/components/school-dashboard/conference/livekit/client"
import {
  effectivePolicy,
  isOnlineWindowActive,
  OFFLINE_POLICY,
  resolveOnlinePolicies,
  resolveOnlinePolicy,
} from "@/components/school-dashboard/conference/online-policy"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    section: { findFirst: vi.fn(), findMany: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/conference/livekit/client", () => ({
  isLiveKitConfigured: vi.fn(() => false),
}))

const SCHOOL = "school-1"
const TZ = "Africa/Khartoum"

/** Every School column the resolver reads, with the "not online" defaults. */
const base = () => ({
  timezone: TZ,
  conferenceOnlineDefault: false,
  conferenceProviderDefault: "external" as const,
  conferenceOnlineFrom: null,
  conferenceOnlineUntil: null,
  conferenceOnlineNote: null,
  conferenceOnlineMode: "timetable" as const,
})

const online = (provider: "livekit" | "external" = "external") => ({
  ...base(),
  conferenceOnlineDefault: true,
  conferenceProviderDefault: provider,
})

/** A school that is NOT online by default but has a window over `days`. */
const windowed = (from: string, until: string | null, note = "flooding") => ({
  ...base(),
  conferenceOnlineFrom: new Date(from),
  conferenceOnlineUntil: until ? new Date(until) : null,
  conferenceOnlineNote: note,
})

const DURING = new Date("2026-03-10T09:00:00Z")
const BEFORE = new Date("2026-03-01T09:00:00Z")
const AFTER = new Date("2026-04-01T09:00:00Z")

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isLiveKitConfigured).mockReturnValue(false)
})

describe("effectivePolicy", () => {
  it("is offline when the school has not opted in", () => {
    expect(effectivePolicy(base(), null)).toEqual(OFFLINE_POLICY)
  })

  it("is offline when there is no school row at all", () => {
    expect(effectivePolicy(null, true).online).toBe(false)
  })

  it("inherits the school switch when the section has no override", () => {
    expect(effectivePolicy(online(), null).online).toBe(true)
    expect(effectivePolicy(online(), undefined).online).toBe(true)
  })

  it("lets a section override the school in BOTH directions", () => {
    // Held back from a school that went online…
    expect(effectivePolicy(online(), false).online).toBe(false)
    // …and online inside a school that has not.
    expect(effectivePolicy(base(), true).online).toBe(true)
  })

  it("degrades a livekit preference to external while the SFU is unprovisioned", () => {
    // The six RUNBOOK infra gates are ops, not code — a school may choose
    // livekit before they land and must still get working classes today.
    vi.mocked(isLiveKitConfigured).mockReturnValue(false)
    expect(effectivePolicy(online("livekit"), null)).toMatchObject({
      online: true,
      provider: "external",
      degraded: true,
      source: "school",
    })
  })

  it("promotes the same stored preference once the SFU exists — no migration", () => {
    vi.mocked(isLiveKitConfigured).mockReturnValue(true)
    expect(effectivePolicy(online("livekit"), null)).toMatchObject({
      online: true,
      provider: "livekit",
      degraded: false,
    })
  })

  it("goes online for the days inside a temporary window, and only those", () => {
    const w = windowed("2026-03-05T00:00:00Z", "2026-03-15T00:00:00Z")
    expect(effectivePolicy(w, null, BEFORE).online).toBe(false)
    expect(effectivePolicy(w, null, DURING).online).toBe(true)
    expect(effectivePolicy(w, null, AFTER).online).toBe(false)
  })

  it("stays online indefinitely when the window has no end date", () => {
    // What an emergency actually looks like: nobody knows on day one when the
    // roads reopen.
    const w = windowed("2026-03-05T00:00:00Z", null)
    expect(effectivePolicy(w, null, DURING).online).toBe(true)
    expect(effectivePolicy(w, null, AFTER).online).toBe(true)
    expect(effectivePolicy(w, null, BEFORE).online).toBe(false)
  })

  it("ignores an end date with no start date", () => {
    // A half-filled form must never put a school online forever.
    const w = { ...base(), conferenceOnlineUntil: new Date(AFTER) }
    expect(effectivePolicy(w, null, DURING).online).toBe(false)
  })

  it("covers the whole of the last day — the window is day-granular", () => {
    const w = windowed("2026-03-10T00:00:00Z", "2026-03-10T00:00:00Z")
    // A one-day window, tested late in that school day.
    expect(
      effectivePolicy(w, null, new Date("2026-03-10T20:30:00Z")).online
    ).toBe(true)
  })

  it("does NOT override an explicit per-section opt-out", () => {
    // The window lifts the school-wide DEFAULT; it is not a closure, because
    // online delivery never sends the building home. So the tri-state rule
    // survives verbatim: an explicit section decision still wins.
    const w = windowed("2026-03-05T00:00:00Z", "2026-03-15T00:00:00Z")
    expect(effectivePolicy(w, false, DURING).online).toBe(false)
    expect(effectivePolicy(w, null, DURING).online).toBe(true)
    expect(effectivePolicy(w, true, DURING).online).toBe(true)
  })

  it("reports the source, and carries the reason only for a window", () => {
    const w = windowed("2026-03-05T00:00:00Z", null, "closed — flooding")
    expect(effectivePolicy(w, null, DURING)).toMatchObject({
      source: "window",
      note: "closed — flooding",
    })
    // A school that was already online did not go online because of the storm.
    expect(
      effectivePolicy({ ...w, conferenceOnlineDefault: true }, null, DURING)
    ).toMatchObject({ source: "school", note: null })
    expect(effectivePolicy(w, true, DURING)).toMatchObject({
      source: "section",
      note: null,
    })
  })

  it("carries the delivery mode through", () => {
    expect(
      effectivePolicy({ ...online(), conferenceOnlineMode: "both" }, null).mode
    ).toBe("both")
    // Pinned to `timetable` when offline so callers never branch on a stale mode.
    expect(effectivePolicy(base(), null).mode).toBe("timetable")
  })

  it("never reports degraded for a school that chose external", () => {
    vi.mocked(isLiveKitConfigured).mockReturnValue(false)
    expect(effectivePolicy(online("external"), null).degraded).toBe(false)
  })
})

describe("isOnlineWindowActive", () => {
  it("is false with no school row and with no window", () => {
    expect(isOnlineWindowActive(null, DURING)).toBe(false)
    expect(
      isOnlineWindowActive(
        {
          timezone: TZ,
          conferenceOnlineFrom: null,
          conferenceOnlineUntil: null,
        },
        DURING
      )
    ).toBe(false)
  })
})

describe("resolveOnlinePolicy", () => {
  it("scopes the section lookup by school", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(online() as never)
    vi.mocked(db.section.findFirst).mockResolvedValue({
      conferenceOnline: null,
    } as never)

    await resolveOnlinePolicy(SCHOOL, "sec-1")

    const where = vi.mocked(db.section.findFirst).mock.calls[0]?.[0]?.where
    expect(where).toMatchObject({ id: "sec-1", schoolId: SCHOOL })
  })

  it("skips the section query entirely when there is no section", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(online() as never)
    const p = await resolveOnlinePolicy(SCHOOL, null)
    expect(db.section.findFirst).not.toHaveBeenCalled()
    expect(p.online).toBe(true)
  })
})

describe("resolveOnlinePolicies (batched)", () => {
  it("resolves many sections with ONE school query and ONE section query", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(online() as never)
    vi.mocked(db.section.findMany).mockResolvedValue([
      { id: "sec-1", conferenceOnline: null },
      { id: "sec-2", conferenceOnline: false },
    ] as never)

    const out = await resolveOnlinePolicies(SCHOOL, [
      "sec-1",
      "sec-2",
      "sec-1", // duplicates must not multiply queries
    ])

    expect(db.school.findUnique).toHaveBeenCalledTimes(1)
    expect(db.section.findMany).toHaveBeenCalledTimes(1)
    expect(out.get("sec-1")?.online).toBe(true)
    expect(out.get("sec-2")?.online).toBe(false)
  })

  it("treats a section that isn't this school's as offline, never as inheriting", async () => {
    // The id resolved to no row under this schoolId. Letting it fall through
    // to the school-wide switch would materialize sessions for another
    // tenant's section.
    vi.mocked(db.school.findUnique).mockResolvedValue(online() as never)
    vi.mocked(db.section.findMany).mockResolvedValue([] as never)

    const out = await resolveOnlinePolicies(SCHOOL, ["sec-elsewhere"])
    expect(out.get("sec-elsewhere")).toEqual(OFFLINE_POLICY)
  })

  it("does no work for an empty section list", async () => {
    const out = await resolveOnlinePolicies(SCHOOL, [])
    expect(out.size).toBe(0)
    expect(db.school.findUnique).not.toHaveBeenCalled()
  })
})
