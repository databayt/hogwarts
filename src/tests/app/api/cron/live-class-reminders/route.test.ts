// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { processPendingWebPushes } from "@/lib/notifications/push-web"
import { notifyClassStartingSoon } from "@/components/school-dashboard/live/actions/notifications"
import { GET } from "@/app/api/cron/live-class-reminders/route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findMany: vi.fn() },
    conferenceEvent: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassStartingSoon: vi.fn(async () => ({ created: 0 })),
}))
vi.mock("@/lib/notifications/push-web", () => ({
  processPendingWebPushes: vi.fn(async () => ({
    processed: 0,
    succeeded: 0,
    failed: 0,
    noDevice: 0,
    pruned: 0,
    skippedReason: null,
  })),
}))

const NOW = new Date("2026-06-01T09:00:00Z").getTime()
const req = () => new Request("http://localhost/api/cron/live-class-reminders")

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  vi.mocked(isAuthorizedCron).mockReturnValue(true)
  vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceEvent.create).mockResolvedValue({} as never)
  vi.mocked(db.conferenceEvent.createMany).mockResolvedValue({
    count: 0,
  } as never)
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
  it("scans from now to the widest reach a school may have (lead 60 + the tick slack), then applies each school's own", async () => {
    await GET(req())
    const call = vi.mocked(db.conference.findMany).mock.calls[0][0] as {
      where: { scheduledStart: { gte: Date; lte: Date }; status: string }
    }
    const gte = call.where.scheduledStart.gte.getTime()
    const lte = call.where.scheduledStart.lte.getTime()
    expect(gte).toBe(NOW)
    expect(lte).toBe(NOW + 62 * 60 * 1000)
    expect(call.where.status).toBe("scheduled")
  })

  // The bug of 2026-11-09: lead 10 on a 15-minute cron. A class on the hour
  // is 15 minutes out at :45 and starting at :00 — never inside the lead at
  // any tick, so 40 of one school's 52 classes were never reminded.
  it("reminds a class one cron cadence out when the school's lead is shorter than the cadence", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-on-the-hour",
        schoolId: "school-a",
        scheduledStart: new Date(NOW + 15 * 60 * 1000),
        school: { conferenceReminderLeadMinutes: 10 },
      },
      // 16.5 minutes out: the tick ran a little early relative to the last
      // one — still this tick's, or the next would find it already starting.
      {
        id: "lcs-slack",
        schoolId: "school-a",
        scheduledStart: new Date(NOW + 16.5 * 60 * 1000),
        school: { conferenceReminderLeadMinutes: 10 },
      },
      // 20 minutes out: the NEXT tick's (5 minutes out then).
      {
        id: "lcs-next-tick",
        schoolId: "school-a",
        scheduledStart: new Date(NOW + 20 * 60 * 1000),
        school: { conferenceReminderLeadMinutes: 10 },
      },
    ] as never)
    const res = await GET(req())
    const body = (await res.json()) as { dispatched: number }
    expect(body.dispatched).toBe(2)
    expect(notifyClassStartingSoon).toHaveBeenCalledWith(
      "school-a",
      "lcs-on-the-hour",
      15
    )
    expect(notifyClassStartingSoon).toHaveBeenCalledWith(
      "school-a",
      "lcs-slack",
      17
    )
    expect(notifyClassStartingSoon).not.toHaveBeenCalledWith(
      "school-a",
      "lcs-next-tick",
      expect.anything()
    )
  })

  it("every start minute is inside the window at one of two consecutive ticks", async () => {
    // For each minute-to-start m at this tick, the next tick sees m - 15.
    // One of the two must be due, for the default lead.
    const due = (m: number) => m >= 0 && m <= Math.max(10, 15) + 2
    for (let m = 15; m <= 32; m++) {
      expect(due(m) || due(m - 15), `start ${m} min out`).toBe(true)
    }
    // And the route agrees with that arithmetic at the edges.
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "edge-17",
        schoolId: "s",
        scheduledStart: new Date(NOW + 17 * 60 * 1000),
        school: null,
      },
      {
        id: "edge-18",
        schoolId: "s",
        scheduledStart: new Date(NOW + 18 * 60 * 1000),
        school: null,
      },
      {
        id: "edge-0",
        schoolId: "s",
        scheduledStart: new Date(NOW + 20 * 1000),
        school: null,
      },
    ] as never)
    await GET(req())
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("s", "edge-17", 17)
    expect(notifyClassStartingSoon).not.toHaveBeenCalledWith(
      "s",
      "edge-18",
      expect.anything()
    )
    // Twenty seconds out still gets "in 1 minute", never "in 0".
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("s", "edge-0", 1)
  })

  it("overnight, when the Worker ticks hourly, the window is an hour wide", async () => {
    // 20:00 UTC: the quiet hours' first tick; the next run is 21:00.
    vi.setSystemTime(new Date("2026-06-01T20:00:00Z"))
    const at = Date.now()
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "evening",
        schoolId: "s",
        scheduledStart: new Date(at + 45 * 60 * 1000),
        school: { conferenceReminderLeadMinutes: 10 },
      },
    ] as never)
    await GET(req())
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("s", "evening", 45)
  })

  it("sends the reminders' pushes in the same run, and only when something was due", async () => {
    await GET(req())
    expect(processPendingWebPushes).not.toHaveBeenCalled()
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        schoolId: "s",
        scheduledStart: new Date(NOW + 8 * 60 * 1000),
        school: null,
      },
    ] as never)
    vi.mocked(processPendingWebPushes).mockResolvedValueOnce({
      processed: 3,
      succeeded: 2,
      failed: 0,
      noDevice: 1,
      pruned: 0,
      skippedReason: null,
    })
    const res = await GET(req())
    const body = (await res.json()) as { pushed: number }
    expect(processPendingWebPushes).toHaveBeenCalledTimes(1)
    expect(body.pushed).toBe(2)
  })

  it("a push failure never costs the reminders", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-1",
        schoolId: "s",
        scheduledStart: new Date(NOW + 8 * 60 * 1000),
        school: null,
      },
    ] as never)
    vi.mocked(processPendingWebPushes).mockRejectedValueOnce(new Error("vapid"))
    const res = await GET(req())
    expect(res.status).toBe(200)
    const body = (await res.json()) as { dispatched: number; pushed: number }
    expect(body.dispatched).toBe(1)
    expect(body.pushed).toBe(0)
  })

  it("reminds only inside the school's own lead time", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      // 30 min out, school lead 10 → not yet
      {
        id: "lcs-early",
        schoolId: "school-a",
        scheduledStart: new Date(NOW + 30 * 60 * 1000),
        school: { conferenceReminderLeadMinutes: 10 },
      },
      // 30 min out, school lead 45 → now
      {
        id: "lcs-due",
        schoolId: "school-b",
        scheduledStart: new Date(NOW + 30 * 60 * 1000),
        school: { conferenceReminderLeadMinutes: 45 },
      },
      // 8 min out, default lead → now
      {
        id: "lcs-soon",
        schoolId: "school-a",
        scheduledStart: new Date(NOW + 8 * 60 * 1000),
        school: null,
      },
    ] as never)
    const res = await GET(req())
    const body = (await res.json()) as { dispatched: number }
    expect(body.dispatched).toBe(2)
    // Third arg is the session's OWN minutes-to-start (rounded, min 1), not
    // the school's configured lead — lcs-due is 30 min out, lcs-soon 8.
    expect(notifyClassStartingSoon).toHaveBeenCalledWith(
      "school-b",
      "lcs-due",
      30
    )
    expect(notifyClassStartingSoon).toHaveBeenCalledWith(
      "school-a",
      "lcs-soon",
      8
    )
    expect(notifyClassStartingSoon).not.toHaveBeenCalledWith(
      "school-a",
      "lcs-early",
      expect.anything()
    )
  })
})

describe("live-class-reminders cron — dispatch + idempotency", () => {
  it("notifies once per fresh session and skips already-reminded ones", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        id: "lcs-fresh",
        schoolId: "school-1",
        scheduledStart: new Date(NOW + 8 * 60 * 1000),
        school: null,
      },
      {
        id: "lcs-already",
        schoolId: "school-1",
        scheduledStart: new Date(NOW + 8 * 60 * 1000),
        school: null,
      },
    ] as never)
    // lcs-already already has a reminder event; lcs-fresh does not.
    vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([
      { sessionId: "lcs-already" },
    ] as never)

    const res = await GET(req())
    const body = (await res.json()) as { ok: boolean; dispatched: number }

    expect(body.ok).toBe(true)
    expect(body.dispatched).toBe(1)
    expect(notifyClassStartingSoon).toHaveBeenCalledTimes(1)
    // lcs-fresh is 8 min out at NOW.
    expect(notifyClassStartingSoon).toHaveBeenCalledWith(
      "school-1",
      "lcs-fresh",
      8
    )
    // One insert for the whole batch — the route stopped issuing a create per
    // session when the sweep was batched under the 60s budget.
    expect(db.conferenceEvent.createMany).toHaveBeenCalledTimes(1)
    expect(db.conferenceEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            schoolId: "school-1",
            sessionId: "lcs-fresh",
            eventType: "reminder_starting_soon",
          }),
        ],
      })
    )
  })
})
