// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
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
vi.mock(
  "@/components/school-dashboard/live/actions/notifications",
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
  it("scans [now+1min, now+60min] — the widest lead a school may set — then applies each school's own lead", async () => {
    await GET(req())
    const call = vi.mocked(db.conference.findMany).mock.calls[0][0] as {
      where: { scheduledStart: { gte: Date; lte: Date }; status: string }
    }
    const gte = call.where.scheduledStart.gte.getTime()
    const lte = call.where.scheduledStart.lte.getTime()
    expect(gte).toBe(NOW + 1 * 60 * 1000)
    expect(lte).toBe(NOW + 60 * 60 * 1000)
    expect(call.where.status).toBe("scheduled")
    // Wider than the cron cadence (*/15): no start time can fall in a gap.
    expect(lte - gte).toBeGreaterThanOrEqual(15 * 60 * 1000)
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
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("school-b", "lcs-due")
    expect(notifyClassStartingSoon).toHaveBeenCalledWith("school-a", "lcs-soon")
    expect(notifyClassStartingSoon).not.toHaveBeenCalledWith(
      "school-a",
      "lcs-early"
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
    expect(notifyClassStartingSoon).toHaveBeenCalledWith(
      "school-1",
      "lcs-fresh"
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
