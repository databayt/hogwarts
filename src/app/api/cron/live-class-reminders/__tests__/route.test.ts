// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { notifyClassStartingSoon } from "@/components/school-dashboard/live-classes/actions/notifications"

import { GET } from "../route"

vi.mock("@/lib/db", () => ({
  db: {
    liveClassSession: { findMany: vi.fn() },
    liveClassEvent: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock("@/components/school-dashboard/live-classes/actions/notifications", () => ({
  notifyClassStartingSoon: vi.fn(async () => ({ created: 0 })),
}))

const SECRET = "test-cron-secret"
const NOW = new Date("2026-06-01T09:00:00Z").getTime()

function req(authHeader?: string) {
  return new Request("http://localhost/api/cron/live-class-reminders", {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  process.env.CRON_SECRET = SECRET
  vi.mocked(db.liveClassSession.findMany).mockResolvedValue([] as never)
  vi.mocked(db.liveClassEvent.findFirst).mockResolvedValue(null as never)
  vi.mocked(db.liveClassEvent.create).mockResolvedValue({} as never)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("live-class-reminders cron — auth", () => {
  it("rejects a request with no Authorization header (401)", async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.liveClassSession.findMany).not.toHaveBeenCalled()
  })

  it("rejects a request with the wrong bearer token (401)", async () => {
    const res = await GET(req("Bearer wrong"))
    expect(res.status).toBe(401)
    expect(db.liveClassSession.findMany).not.toHaveBeenCalled()
  })
})

describe("live-class-reminders cron — detection window", () => {
  it("queries a 10-min-wide window [now+5min, now+15min] with no blind spot", async () => {
    await GET(req(`Bearer ${SECRET}`))

    const call = vi.mocked(db.liveClassSession.findMany).mock.calls[0][0] as {
      where: { scheduledStart: { gte: Date; lte: Date }; status: string }
    }
    const gte = call.where.scheduledStart.gte.getTime()
    const lte = call.where.scheduledStart.lte.getTime()

    expect(gte).toBe(NOW + 5 * 60 * 1000)
    expect(lte).toBe(NOW + 15 * 60 * 1000)
    expect(call.where.status).toBe("scheduled")

    // The window must be at least as wide as the */10 cron cadence, otherwise
    // start times fall into a gap between consecutive runs.
    expect(lte - gte).toBeGreaterThanOrEqual(10 * 60 * 1000)

    // A class starting 13 min out — which the previous [now+8, now+12] window
    // silently skipped — is now inside the window.
    const thirteenMinOut = NOW + 13 * 60 * 1000
    expect(gte).toBeLessThanOrEqual(thirteenMinOut)
    expect(lte).toBeGreaterThanOrEqual(thirteenMinOut)
  })
})

describe("live-class-reminders cron — dispatch + idempotency", () => {
  it("notifies once per fresh session and skips already-reminded ones", async () => {
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([
      { id: "lcs-fresh", schoolId: "school-1" },
      { id: "lcs-already", schoolId: "school-1" },
    ] as never)
    // First session has no prior reminder; second already has one.
    vi.mocked(db.liveClassEvent.findFirst)
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ id: "evt-existing" } as never)

    const res = await GET(req(`Bearer ${SECRET}`))
    const body = (await res.json()) as { ok: boolean; dispatched: number }

    expect(body.ok).toBe(true)
    expect(body.dispatched).toBe(1)
    expect(notifyClassStartingSoon).toHaveBeenCalledTimes(1)
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("school-1", "lcs-fresh")
    // Marker written only for the freshly-notified session (idempotency guard).
    expect(db.liveClassEvent.create).toHaveBeenCalledTimes(1)
    expect(db.liveClassEvent.create).toHaveBeenCalledWith(
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
