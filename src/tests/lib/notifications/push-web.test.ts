// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { processPendingWebPushes } from "@/lib/notifications/push-web"

const sendNotification = vi.fn(async () => ({}))
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...a: unknown[]) => sendNotification(...(a as [])),
  },
  WebPushError: class extends Error {
    statusCode = 0
  },
}))
vi.mock("@/lib/dispatch-notification", () => ({
  resolveActionUrl: vi.fn(() => "https://demo.example/ar/live/x/room"),
}))
vi.mock("@/lib/db", () => ({
  db: {
    notification: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    pushSubscription: { findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    school: { findUnique: vi.fn(async () => ({ domain: "demo" })) },
  },
}))

const row = (over: Record<string, unknown> = {}) => ({
  id: "n1",
  userId: "u1",
  schoolId: "school1",
  title: "Class is live",
  body: "Maths",
  lang: "ar",
  metadata: { url: "/live/x/room" },
  priority: "high",
  expiresAt: new Date(Date.now() + 30 * 60_000),
  ...over,
})

describe("processPendingWebPushes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub"
    process.env.VAPID_PRIVATE_KEY = "priv"
    process.env.VAPID_SUBJECT = "mailto:x@example.com"
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.pushSubscription.findMany).mockResolvedValue([
      { id: "sub1", endpoint: "https://push", p256dh: "k", auth: "a" },
    ] as never)
  })

  // A school-wide "class is live" queued behind the day's reminders (oldest
  // first) arrived hours late; an expired one still went out.
  it("retires expired rows and pulls the most urgent first", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)

    await processPendingWebPushes(10)

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: { lte: expect.any(Date) },
        }),
        data: expect.objectContaining({ pushSent: true, pushError: "expired" }),
      })
    )
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      })
    )
  })

  it("sends a class alert with high urgency and a TTL that ends at expiry", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)

    await processPendingWebPushes(10)

    const opts = (sendNotification.mock.calls[0] as unknown[])[2] as {
      TTL: number
      urgency: string
    }
    expect(opts.urgency).toBe("high")
    expect(opts.TTL).toBeGreaterThan(60)
    expect(opts.TTL).toBeLessThanOrEqual(30 * 60)
  })

  it("keeps normal urgency and a day's TTL for ordinary rows", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([
      row({ priority: "normal", expiresAt: null }),
    ] as never)

    await processPendingWebPushes(10)

    const opts = (sendNotification.mock.calls[0] as unknown[])[2] as {
      TTL: number
      urgency: string
    }
    expect(opts.urgency).toBe("normal")
    expect(opts.TTL).toBe(60 * 60 * 24)
  })
})
