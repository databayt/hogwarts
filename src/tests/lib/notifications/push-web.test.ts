// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  NO_DEVICE,
  processPendingWebPushes,
} from "@/lib/notifications/push-web"

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
    // Two callers: the expiry sweep (no id) and the per-row claim (by id).
    vi.mocked(db.notification.updateMany).mockImplementation((async (args: {
      where: { id?: string }
    }) => ({ count: args.where.id ? 1 : 0 })) as never)
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

  // A school where nobody had alerts on had every row stamped `pushSent`, and
  // read as fully delivered.
  it("retires a row with no device behind it as NO_DEVICE, not as delivered", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)
    vi.mocked(db.pushSubscription.findMany).mockResolvedValue([] as never)

    const res = await processPendingWebPushes(10)

    expect(sendNotification).not.toHaveBeenCalled()
    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: {
        pushSent: true,
        pushSentAt: expect.any(Date),
        pushError: NO_DEVICE,
      },
    })
    expect(res.noDevice).toBe(1)
    expect(res.succeeded).toBe(0)
  })

  it("counts a row a device took as delivered, with no error left on it", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)

    const res = await processPendingWebPushes(10)

    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { pushSent: true, pushSentAt: expect.any(Date), pushError: null },
    })
    expect(res.succeeded).toBe(1)
    expect(res.noDevice).toBe(0)
  })

  // The drain now also runs inline, beside the cron's own run in the same
  // tick. Without a claim both would send the same notice.
  it("skips a row another run already claimed", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)
    vi.mocked(db.notification.updateMany).mockImplementation((async () => ({
      count: 0,
    })) as never)

    const res = await processPendingWebPushes(10)

    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "n1", pushSent: false },
      data: { pushSent: true, pushSentAt: expect.any(Date) },
    })
    expect(sendNotification).not.toHaveBeenCalled()
    expect(res.succeeded).toBe(0)
  })

  it("gives the claim back when every device failed for a passing reason", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)
    sendNotification.mockRejectedValueOnce(new Error("push service 503"))
    vi.mocked(db.pushSubscription.update).mockResolvedValue({} as never)
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await processPendingWebPushes(10)

    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: {
        pushSent: false,
        pushSentAt: null,
        pushError: "push service 503",
      },
    })
    expect(res.failed).toBe(1)
    quiet.mockRestore()
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
