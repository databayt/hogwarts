// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for poll-actions: the polling fallback used when WebSocket is
 * unavailable. The action must:
 *   1. Refuse to leak data when there's no session/school context.
 *   2. Translate notification content via getDisplayText to the caller's locale.
 *   3. Serialize Date fields to ISO strings for client consumption.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getTenantContext } from "@/lib/tenant-context"
import { fetchNotificationBellData } from "@/components/school-dashboard/notifications/poll-actions"
import {
  getRecentNotifications,
  getUnreadNotificationCount,
} from "@/components/school-dashboard/notifications/queries"
import { localize } from "@/components/translation/localize"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/translation/localize", () => ({
  localize: vi.fn(async (model: string, rows: any[], opts?: any) => {
    return rows.map((r) => ({
      ...r,
      title: `t(${r.title})`,
      body: `t(${r.body})`,
    }))
  }),
}))
vi.mock("@/components/school-dashboard/notifications/queries", () => ({
  getUnreadNotificationCount: vi.fn(),
  getRecentNotifications: vi.fn(),
}))
vi.mock("next/headers", () => ({
  headers: () => ({ get: () => "" }),
}))

const SCHOOL = "school-1"
const USER = "user-1"

const baseNotification = {
  id: "n-1",
  schoolId: SCHOOL,
  userId: USER,
  type: "announcement" as const,
  priority: "normal" as const,
  title: "Hello",
  body: "World",
  lang: "ar",
  metadata: null,
  actorId: null,
  actor: null,
  read: false,
  readAt: null,
  channels: ["in_app"] as ("in_app" | "email")[],
  emailSent: false,
  emailSentAt: null,
  createdAt: new Date("2026-04-25T00:00:00.000Z"),
  updatedAt: new Date("2026-04-25T00:00:00.000Z"),
}

describe("fetchNotificationBellData", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null when there's no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "x",
      role: "USER",
      locale: "en",
    })

    expect(await fetchNotificationBellData("en")).toBeNull()
    expect(getRecentNotifications).not.toHaveBeenCalled()
  })

  it("returns null when there's no school context", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: USER } } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "",
      role: "USER",
      locale: "en",
    })

    expect(await fetchNotificationBellData("en")).toBeNull()
  })

  it("translates title+body via getDisplayText and serializes dates", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: USER } } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "x",
      role: "USER",
      locale: "en",
    })
    vi.mocked(getUnreadNotificationCount).mockResolvedValue(3)
    vi.mocked(getRecentNotifications).mockResolvedValue([
      baseNotification,
    ] as any)

    const data = await fetchNotificationBellData("en")
    expect(data?.unreadCount).toBe(3)
    expect(data?.recent).toHaveLength(1)

    const item = data!.recent[0]!
    expect(item.title).toBe("t(Hello)")
    expect(item.body).toBe("t(World)")
    expect(item.createdAt).toBe("2026-04-25T00:00:00.000Z")
    expect(typeof item.createdAt).toBe("string")
    expect(item.lang).toBe("ar")
    expect(localize).toHaveBeenCalledWith("Notification", expect.any(Array), {
      schoolId: SCHOOL,
      lang: "en",
    })
  })

  it("uses 'ar' as fallback when notification.lang is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: USER } } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "x",
      role: "USER",
      locale: "en",
    })
    vi.mocked(getUnreadNotificationCount).mockResolvedValue(0)
    vi.mocked(getRecentNotifications).mockResolvedValue([
      { ...baseNotification, lang: null as any },
    ] as any)

    const data = await fetchNotificationBellData("en")
    expect(data?.recent[0]?.lang).toBe("ar")

    expect(localize).toHaveBeenCalledWith("Notification", expect.any(Array), {
      schoolId: SCHOOL,
      lang: "en",
    })
  })

  it("returns null on error rather than throwing", async () => {
    vi.mocked(auth).mockRejectedValue(new Error("boom"))
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const data = await fetchNotificationBellData("en")
    expect(data).toBeNull()
    consoleSpy.mockRestore()
  })
})
