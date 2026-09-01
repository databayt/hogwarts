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
  getOperatorRecentNotifications,
  getOperatorUnreadCount,
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
  getOperatorUnreadCount: vi.fn(),
  getOperatorRecentNotifications: vi.fn(),
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

// ============================================================================
// Operator (DEVELOPER) branch — the SaaS dashboard bell
// ============================================================================

describe("fetchNotificationBellData — operator branch", () => {
  const DEV = "dev-1"

  beforeEach(() => {
    vi.clearAllMocks()
    // A DEVELOPER has no schoolId and no tenant context on the SaaS dashboard.
    vi.mocked(auth).mockResolvedValue({
      user: { id: DEV, role: "DEVELOPER" },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({ schoolId: null } as any)
    vi.mocked(getOperatorUnreadCount).mockResolvedValue(3 as any)
    vi.mocked(getOperatorRecentNotifications).mockResolvedValue([] as any)
  })

  it("serves a DEVELOPER with no tenant context", async () => {
    // This guard used to return null, which the route turned into a 401 — for
    // the only role that can act on a platform notification.
    const data = await fetchNotificationBellData("en")
    expect(data).not.toBeNull()
    expect(data!.unreadCount).toBe(3)
    expect(getOperatorUnreadCount).toHaveBeenCalledWith(DEV)
    expect(getUnreadNotificationCount).not.toHaveBeenCalled()
  })

  it("still refuses a tenantless NON-developer", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u-9", role: "ADMIN" },
    } as any)
    expect(await fetchNotificationBellData("en")).toBeNull()
  })

  it("localizes per school when the operator's rows span several", async () => {
    // localize() takes exactly ONE schoolId, but an operator's rows carry the
    // id of whichever school submitted — group, then re-merge in order.
    vi.mocked(getOperatorRecentNotifications).mockResolvedValue([
      { ...baseNotification, id: "a", schoolId: "school-1", title: "A" },
      { ...baseNotification, id: "b", schoolId: "school-2", title: "B" },
      { ...baseNotification, id: "c", schoolId: "school-1", title: "C" },
    ] as any)

    const data = await fetchNotificationBellData("en")

    expect(vi.mocked(localize).mock.calls).toHaveLength(2)
    const schoolIds = vi
      .mocked(localize)
      .mock.calls.map((c: any) => c[2].schoolId)
      .sort()
    expect(schoolIds).toEqual(["school-1", "school-2"])
    // Original order preserved across the regrouping.
    expect(data!.recent.map((n) => n.id)).toEqual(["a", "b", "c"])
    expect(data!.recent.map((n) => n.title)).toEqual(["t(A)", "t(B)", "t(C)"])
  })

  it("uses the tenant path when a DEVELOPER is impersonating a school", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: "school-7",
    } as any)
    vi.mocked(getUnreadNotificationCount).mockResolvedValue(1 as any)
    vi.mocked(getRecentNotifications).mockResolvedValue([] as any)

    await fetchNotificationBellData("en")

    expect(getUnreadNotificationCount).toHaveBeenCalledWith("school-7", DEV)
    expect(getOperatorUnreadCount).not.toHaveBeenCalled()
  })
})
