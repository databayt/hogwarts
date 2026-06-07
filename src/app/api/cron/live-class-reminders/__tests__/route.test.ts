// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { notifyClassStartingSoon } from "@/components/school-dashboard/conference/actions/notifications"

import { GET } from "../route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findMany: vi.fn() },
    conferenceEvent: { findFirst: vi.fn(), create: vi.fn() },
  },
}))
vi.mock(
  "@/components/school-dashboard/conference/actions/notifications",
  () => ({ notifyClassStartingSoon: vi.fn(async () => ({ created: 0 })) })
)

const NOW = new Date("2026-06-01T09:00:00Z").getTime()
const req = () => new Request("http://localhost/api/cron/live-class-reminders")

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.mocked(isAuthorizedCron).mockReturnValue(true)
  vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceEvent.findFirst).mockResolvedValue(null as never)
  vi.mocked(db.conferenceEvent.create).mockResolvedValue({} as never)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("live-class-reminders cron — auth", () => {
  it("returns 401 when not an authorized cron request", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(false)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.conference.findMany).not.toHaveBeenCalled()
  })
})

describe("live-class-reminders cron — detection window", () => {
  it("queries a 5-min-wide window [now+5min, now+10min] with no blind spot", async () => {
    await GET(req())
    const call = vi.mocked(db.conference.findMany).mock.calls[0][0] as {
      where: { scheduledStart: { gte: Date; lte: Date }; status: string }
    }
    const gte = call.where.scheduledStart.gte.getTime()
    const lte = call.where.scheduledStart.lte.getTime()

    expect(gte).toBe(NOW + 5 * 60 * 1000)
    expect(lte).toBe(NOW + 10 * 60 * 1000)
    expect(call.where.status).toBe("scheduled")

    // Window must be at least as wide as the */5 cron cadence — otherwise a
    // start time falls into a gap between consecutive runs.
    expect(lte - gte).toBeGreaterThanOrEqual(5 * 60 * 1000)

    // A class starting 9 min out — which the previous [now+8, now+12] window
    // would catch but the very next run would re-evaluate — is inside [5,10].
    const nineMinOut = NOW + 9 * 60 * 1000
    expect(gte).toBeLessThanOrEqual(nineMinOut)
    expect(lte).toBeGreaterThanOrEqual(nineMinOut)
  })
})

describe("live-class-reminders cron — dispatch + idempotency", () => {
  it("notifies once per fresh session and skips already-reminded ones", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      { id: "lcs-fresh", schoolId: "school-1" },
      { id: "lcs-already", schoolId: "school-1" },
    ] as never)
    vi.mocked(db.conferenceEvent.findFirst)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ id: "evt-existing" } as never)

    const res = await GET(req())
    const body = (await res.json()) as { ok: boolean; dispatched: number }

    expect(body.ok).toBe(true)
    expect(body.dispatched).toBe(1)
    expect(notifyClassStartingSoon).toHaveBeenCalledTimes(1)
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("school-1", "lcs-fresh")
    expect(db.conferenceEvent.create).toHaveBeenCalledTimes(1)
    expect(db.conferenceEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school-1",
          sessionId: "lcs-fresh",
          eventType: "reminder_starting_soon",
        }),
      })
    )
  })
})
