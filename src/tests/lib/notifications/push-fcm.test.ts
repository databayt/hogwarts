// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { generateKeyPairSync } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  buildFcmMessage,
  fcmChannelFor,
  processPendingPushNotifications,
  resetFcmAccessToken,
} from "@/lib/notifications/push-fcm"

vi.mock("@/lib/dispatch-notification", () => ({
  resolveActionUrl: vi.fn(
    (p: string) => `https://demo.example/ar${p.startsWith("/") ? p : `/${p}`}`
  ),
}))
vi.mock("@/lib/db", () => ({
  db: {
    notification: { findMany: vi.fn(), update: vi.fn() },
    notificationSubscription: { findMany: vi.fn(), updateMany: vi.fn() },
    school: { findUnique: vi.fn(async () => ({ domain: "demo" })) },
    $executeRaw: vi.fn(),
  },
}))

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
})

const fetchMock = vi.fn()

function json(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}
const tokenOk = () => json(200, { access_token: "ya29.x", expires_in: 3600 })

const row = (over: Record<string, unknown> = {}) => ({
  id: "n1",
  userId: "u1",
  schoolId: "s1",
  type: "live_class_starting_soon",
  title: "Class soon",
  body: "Maths in 10 minutes",
  lang: "ar",
  priority: "high",
  metadata: { url: "/live/x/room", sessionId: "x", n: 3 },
  expiresAt: new Date(Date.now() + 30 * 60_000),
  ...over,
})

function fcmCalls() {
  return fetchMock.mock.calls.filter((c) =>
    String(c[0]).includes("fcm.googleapis.com")
  )
}

describe("push-fcm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetFcmAccessToken()
    vi.stubGlobal("fetch", fetchMock)
    process.env.FIREBASE_PROJECT_ID = "proj-1"
    process.env.FIREBASE_CLIENT_EMAIL = "svc@proj-1.iam.gserviceaccount.com"
    // Literal "\n" sequences, as a one-line env var arrives.
    process.env.FIREBASE_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n")
    vi.mocked(db.notificationSubscription.findMany).mockResolvedValue([
      { userId: "u1", entityId: "tok-phone" },
      { userId: "u1", entityId: "tok-tablet" },
    ] as never)
    vi.mocked(db.notification.findMany).mockResolvedValue([row()] as never)
    vi.mocked(db.$executeRaw).mockResolvedValue(1 as never)
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("oauth2") ? tokenOk() : json(200, { name: "m" })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.FIREBASE_PROJECT_ID
    delete process.env.FIREBASE_CLIENT_EMAIL
    delete process.env.FIREBASE_PRIVATE_KEY
  })

  it("is a clean no-op without credentials", async () => {
    delete process.env.FIREBASE_PRIVATE_KEY
    const res = await processPendingPushNotifications(10)
    expect(res).toEqual({
      processed: 0,
      succeeded: 0,
      failed: 0,
      skippedReason: "not_configured",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("mints one access token (RS256 JWT) and reuses it", async () => {
    await processPendingPushNotifications(10)
    vi.mocked(db.notification.findMany).mockResolvedValue([
      row({ id: "n2" }),
    ] as never)
    await processPendingPushNotifications(10)

    const oauth = fetchMock.mock.calls.filter((c) =>
      String(c[0]).includes("oauth2.googleapis.com/token")
    )
    expect(oauth).toHaveLength(1)
    const body = new URLSearchParams(oauth[0][1].body as string)
    expect(body.get("grant_type")).toBe(
      "urn:ietf:params:oauth:grant-type:jwt-bearer"
    )
    const [h, c, sig] = body.get("assertion")!.split(".")
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    })
    const claims = JSON.parse(Buffer.from(c, "base64url").toString())
    expect(claims.iss).toBe("svc@proj-1.iam.gserviceaccount.com")
    expect(claims.scope).toBe("https://www.googleapis.com/auth/firebase.messaging")
    expect(claims.aud).toBe("https://oauth2.googleapis.com/token")
    expect(claims.exp - claims.iat).toBe(3600)
    expect(sig.length).toBeGreaterThan(100)
    // Both runs sent with the same bearer.
    expect(
      new Set(fcmCalls().map((c) => c[1].headers.Authorization))
    ).toEqual(new Set(["Bearer ya29.x"]))
  })

  it("refreshes the token once it is within five minutes of expiry", async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2026-06-01T09:00:00Z"))
      await processPendingPushNotifications(10)
      vi.setSystemTime(new Date("2026-06-01T09:56:00Z")) // 4 min left
      await processPendingPushNotifications(10)
    } finally {
      vi.useRealTimers()
    }
    expect(
      fetchMock.mock.calls.filter((c) => String(c[0]).includes("oauth2"))
    ).toHaveLength(2)
  })

  it("sends to every device of the user with the message shape Android reads", async () => {
    const res = await processPendingPushNotifications(10)

    const calls = fcmCalls()
    expect(calls).toHaveLength(2) // phone + tablet
    expect(calls[0][0]).toBe(
      "https://fcm.googleapis.com/v1/projects/proj-1/messages:send"
    )
    const msgs = calls.map((c) => JSON.parse(c[1].body).message)
    expect(msgs.map((m) => m.token)).toEqual(["tok-phone", "tok-tablet"])
    const m = msgs[0]
    expect(m.notification).toEqual({
      title: "Class soon",
      body: "Maths in 10 minutes",
    })
    expect(m.android.priority).toBe("HIGH")
    expect(m.android.notification.channel_id).toBe("hogwarts_live")
    expect(m.data).toMatchObject({
      deep_link: "https://demo.example/ar/live/x/room",
      notification_id: "n1",
      type: "live_class_starting_soon",
      sessionId: "x",
      n: "3",
    })
    for (const v of Object.values(m.data)) expect(typeof v).toBe("string")
    expect(res).toMatchObject({ processed: 1, succeeded: 1, failed: 0 })
  })

  it("maps notification types to the channels the app creates", () => {
    expect(fcmChannelFor("attendance_alert")).toBe("hogwarts_attendance")
    expect(fcmChannelFor("absence_intention")).toBe("hogwarts_attendance")
    expect(fcmChannelFor("grade_posted")).toBe("hogwarts_grades")
    expect(fcmChannelFor("fee_overdue")).toBe("hogwarts_fees")
    expect(fcmChannelFor("message")).toBe("hogwarts_messages")
    expect(fcmChannelFor("announcement")).toBe("hogwarts_announcements")
    expect(fcmChannelFor("live_class_started")).toBe("hogwarts_live")
    expect(fcmChannelFor("system_alert")).toBe("hogwarts_general")
  })

  it("never lets metadata overwrite the reserved keys or ship nulls", () => {
    const { message } = buildFcmMessage("t", {
      notificationId: "n9",
      type: "announcement",
      title: "T",
      body: "B",
      deepLink: "https://x/y",
      metadata: { deep_link: "evil", url: "/rel", gcm_x: "1", nope: null, o: { a: 1 } },
    })
    expect(message.data.deep_link).toBe("https://x/y")
    expect(message.data).not.toHaveProperty("url")
    expect(message.data).not.toHaveProperty("gcm_x")
    expect(message.data).not.toHaveProperty("nope")
    expect(message.data.o).toBe('{"a":1}')
  })

  it("deactivates a token FCM reports as UNREGISTERED and still delivers to the other device", async () => {
    fetchMock.mockImplementation(async (url: string, init: { body: string }) => {
      if (String(url).includes("oauth2")) return tokenOk()
      return JSON.parse(init.body).message.token === "tok-phone"
        ? json(404, {
            error: {
              status: "NOT_FOUND",
              details: [{ errorCode: "UNREGISTERED" }],
            },
          })
        : json(200, {})
    })

    const res = await processPendingPushNotifications(10)

    expect(db.notificationSubscription.updateMany).toHaveBeenCalledWith({
      where: {
        entityType: { in: expect.arrayContaining(["fcm_device"]) },
        entityId: "tok-phone",
      },
      data: { active: false },
    })
    expect(res).toMatchObject({ succeeded: 1, deactivated: 1 })
  })

  it("deactivates on 400 INVALID_ARGUMENT about the token", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("oauth2")
        ? tokenOk()
        : json(400, {
            error: {
              status: "INVALID_ARGUMENT",
              message: "The registration token is not a valid FCM registration token",
            },
          })
    )
    const res = await processPendingPushNotifications(10)
    expect(db.notificationSubscription.updateMany).toHaveBeenCalledTimes(2)
    expect(res.succeeded).toBe(0)
  })

  it("leaves a 5xx row for retry: claim released, error recorded, not counted sent", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("oauth2")
        ? tokenOk()
        : json(503, { error: { status: "UNAVAILABLE", message: "later" } })
    )

    const res = await processPendingPushNotifications(10)

    expect(res).toMatchObject({ processed: 1, succeeded: 0, failed: 1 })
    expect(db.notificationSubscription.updateMany).not.toHaveBeenCalled()
    // claim + release
    expect(db.$executeRaw).toHaveBeenCalledTimes(2)
    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: "n1" },
      data: { pushError: expect.stringContaining("fcm: 503") },
    })
  })

  it("treats 429 as retryable too", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("oauth2")
        ? tokenOk()
        : json(429, { error: { status: "RESOURCE_EXHAUSTED" } })
    )
    const res = await processPendingPushNotifications(10)
    expect(res.failed).toBe(1)
    expect(db.$executeRaw).toHaveBeenCalledTimes(2)
  })

  it("skips a row another run already claimed", async () => {
    vi.mocked(db.$executeRaw).mockResolvedValue(0 as never)
    const res = await processPendingPushNotifications(10)
    expect(fcmCalls()).toHaveLength(0)
    expect(res.processed).toBe(0)
  })

  it("only looks at the last 48 hours, unexpired, for users with a device", async () => {
    const before = Date.now()
    await processPendingPushNotifications(10)

    const arg = vi.mocked(db.notification.findMany).mock.calls[0][0] as {
      where: {
        userId: { in: string[] }
        createdAt: { gte: Date }
        OR: unknown[]
      }
    }
    expect(arg.where.userId.in).toEqual(["u1"])
    const age = before - arg.where.createdAt.gte.getTime()
    expect(Math.abs(age - 48 * 3600_000)).toBeLessThan(5_000)
    expect(arg.where.OR).toHaveLength(2)
  })

  it("does not re-send a row already claimed by FCM", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([
      row({ metadata: { url: "/x", fcmClaimedAt: "2026-06-01T09:00:00Z" } }),
    ] as never)
    const res = await processPendingPushNotifications(10)
    expect(res.processed).toBe(0)
    expect(fcmCalls()).toHaveLength(0)
  })

  it("does nothing, and queries no notifications, when nobody has a device", async () => {
    vi.mocked(db.notificationSubscription.findMany).mockResolvedValue([] as never)
    const res = await processPendingPushNotifications(10)
    expect(res.processed).toBe(0)
    expect(db.notification.findMany).not.toHaveBeenCalled()
  })
})
