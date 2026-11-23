// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { processPendingPushNotifications } from "@/lib/notifications/push-fcm"
import { processPendingWebPushes } from "@/lib/notifications/push-web"
import { GET } from "@/app/api/cron/live-class-reminders/route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findMany: vi.fn() },
    conferenceEvent: { findMany: vi.fn(), createMany: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassStartingSoon: vi.fn(async () => ({ created: 1 })),
}))
vi.mock("@/components/school-dashboard/live/actions/materialize-day", () => ({
  materializeOnlineSchools: vi.fn(async () => ({
    schools: 0,
    created: 0,
    skipped: 0,
    truncated: 0,
  })),
}))
vi.mock("@/components/school-dashboard/live/actions/daily-digest", () => ({
  runLiveDailyDigest: vi.fn(async () => ({ sent: 0 })),
}))
vi.mock("@/components/school-dashboard/live/actions/usage-guard", () => ({
  runLiveMinutesGuard: vi.fn(async () => ({ ran: false })),
}))
vi.mock("@/lib/notifications/push-web", () => ({
  processPendingWebPushes: vi.fn(async () => ({ succeeded: 2 })),
}))
vi.mock("@/lib/notifications/push-fcm", () => ({
  processPendingPushNotifications: vi.fn(async () => ({ succeeded: 3 })),
}))

const req = () => new Request("http://localhost/api/cron/live-class-reminders")

function dueSession() {
  return [
    {
      id: "c1",
      schoolId: "s1",
      scheduledStart: new Date(Date.now() + 8 * 60_000),
      school: { conferenceReminderLeadMinutes: 10 },
    },
  ]
}

describe("live-class-reminders cron — native push drain", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([] as never)
    vi.mocked(db.conferenceEvent.createMany).mockResolvedValue({
      count: 1,
    } as never)
  })

  it("drains FCM after the reminders are written", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue(dueSession() as never)

    const body = await (await GET(req())).json()

    expect(processPendingWebPushes).toHaveBeenCalledTimes(1)
    expect(processPendingPushNotifications).toHaveBeenCalledWith(400)
    expect(body.pushed).toBe(2)
    expect(body.pushedNative).toBe(3)
  })

  it("does not drain anything when no reminder was due", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
    await GET(req())
    expect(processPendingPushNotifications).not.toHaveBeenCalled()
  })

  it("an FCM failure never costs the run", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue(dueSession() as never)
    vi.mocked(processPendingPushNotifications).mockRejectedValueOnce(
      new Error("boom")
    )
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})
