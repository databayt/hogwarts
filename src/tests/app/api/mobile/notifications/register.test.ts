// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  FCM_DEVICE_ENTITY_TYPES,
  fcmEntityType,
} from "@/lib/notifications/fcm-device"

vi.mock("@/lib/db", () => ({
  db: {
    notificationSubscription: { upsert: vi.fn(), updateMany: vi.fn() },
  },
}))

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

const USER = "user-1"
const SCHOOL = "school-1"

function post(body: unknown) {
  return new NextRequest("http://localhost/api/mobile/notifications/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: "Bearer test" },
  })
}

beforeEach(async () => {
  vi.clearAllMocks()
  const auth = await import("@/app/api/mobile/lib/authenticate")
  vi.mocked(auth.authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role: "STUDENT",
  })
})

describe("fcmEntityType", () => {
  it("tags by platform and falls back to the bare type", () => {
    expect(fcmEntityType("android")).toBe("fcm_device:android")
    expect(fcmEntityType("ios")).toBe("fcm_device:ios")
    expect(fcmEntityType(undefined)).toBe("fcm_device")
    expect(fcmEntityType("web")).toBe("fcm_device")
    expect(FCM_DEVICE_ENTITY_TYPES).toEqual([
      "fcm_device",
      "fcm_device:android",
      "fcm_device:ios",
    ])
  })
})

describe("POST /api/mobile/notifications/register", () => {
  it("401 when unauthenticated", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { POST } =
      await import("@/app/api/mobile/notifications/register/route")
    expect((await POST(post({ device_token: "t" }))).status).toBe(401)
  })

  it("400 without a device token", async () => {
    const { POST } =
      await import("@/app/api/mobile/notifications/register/route")
    expect((await POST(post({ platform: "android" }))).status).toBe(400)
  })

  it("stores an android token as fcm_device:android and retires only other android tokens", async () => {
    const { POST } =
      await import("@/app/api/mobile/notifications/register/route")
    const res = await POST(post({ device_token: "tok-a", platform: "android" }))
    expect(res.status).toBe(200)
    expect(db.notificationSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_entityType_entityId: {
            userId: USER,
            entityType: "fcm_device:android",
            entityId: "tok-a",
          },
        },
        create: expect.objectContaining({
          schoolId: SCHOOL,
          entityType: "fcm_device:android",
        }),
      })
    )
    expect(db.notificationSubscription.updateMany).toHaveBeenCalledWith({
      where: {
        userId: USER,
        schoolId: SCHOOL,
        active: true,
        OR: [
          { entityType: "fcm_device:android", entityId: { not: "tok-a" } },
          { entityType: "fcm_device", entityId: "tok-a" },
        ],
      },
      data: { active: false },
    })
  })

  it("an ios registration never touches android tokens", async () => {
    const { POST } =
      await import("@/app/api/mobile/notifications/register/route")
    await POST(post({ device_token: "tok-i", platform: "ios" }))
    const where = vi.mocked(db.notificationSubscription.updateMany).mock
      .calls[0][0]!.where as { OR: Array<{ entityType: string }> }
    expect(where.OR.map((c) => c.entityType)).toEqual([
      "fcm_device:ios",
      "fcm_device",
    ])
  })

  it("without a platform stores bare fcm_device and deactivates nothing", async () => {
    const { POST } =
      await import("@/app/api/mobile/notifications/register/route")
    await POST(post({ device_token: "tok-x" }))
    expect(db.notificationSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ entityType: "fcm_device" }),
      })
    )
    expect(db.notificationSubscription.updateMany).not.toHaveBeenCalled()
  })
})
