// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Edge cases covering subtle correctness issues in actions/queries:
 * - expiration is derived from NOTIFICATION_EXPIRATION when not provided
 * - quiet-hours window covers normal and overnight ranges
 * - markAll without schoolId is rejected (tenant isolation)
 * - subscription upsert respects unique constraint
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createNotification,
  markAllNotificationsAsRead,
  subscribeToEntityNotifications,
} from "../actions"
import { NOTIFICATION_EXPIRATION } from "../config"
import { shouldSendNotification } from "../queries"

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    notificationPreference: {
      findFirst: vi.fn(),
    },
    notificationSubscription: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown) =>
      Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(ops)
    ),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const SCHOOL = "school-edge"
const USER = "user-edge"

describe("createNotification — expiration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "edge",
      role: "ADMIN",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "ADMIN" },
    } as any)
  })

  it("derives expiresAt from NOTIFICATION_EXPIRATION when not supplied", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({ id: "n-1" } as any)

    await createNotification({
      userId: "target",
      type: "password_reset",
      title: "Reset",
      body: "Click",
    })

    const call = vi.mocked(db.notification.create).mock.calls[0]?.[0]
    const expiresAt = call?.data.expiresAt as Date | null | undefined
    expect(expiresAt).toBeInstanceOf(Date)
    if (expiresAt instanceof Date) {
      const days = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      // password_reset = 1 day; allow 0.99 — 1.01 to absorb test latency
      expect(days).toBeGreaterThan(0.99 - 0.01)
      expect(days).toBeLessThan(NOTIFICATION_EXPIRATION.password_reset! + 0.01)
    }
  })

  it("uses caller-provided expiresAt when valid future date", async () => {
    vi.mocked(db.notification.create).mockResolvedValue({ id: "n-2" } as any)
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    await createNotification({
      userId: "target",
      type: "announcement",
      title: "T",
      body: "B",
      expiresAt: future,
    })

    const call = vi.mocked(db.notification.create).mock.calls[0]?.[0]
    expect((call?.data.expiresAt as Date).toISOString()).toBe(future)
  })

  it("rejects past expiresAt via Zod superRefine", async () => {
    // Intentionally invalid input — silence the diagnostic console.error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const past = new Date(Date.now() - 60 * 1000).toISOString()
    const result = await createNotification({
      userId: "target",
      type: "announcement",
      title: "T",
      body: "B",
      expiresAt: past,
    })
    expect(result.success).toBe(false)
    expect(db.notification.create).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe("markAllNotificationsAsRead — tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects when getTenantContext returns no schoolId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: null, role: "USER" },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "",
      role: "USER",
      locale: "en",
    })

    const result = await markAllNotificationsAsRead({ userId: USER })
    expect(result.success).toBe(false)
    expect(db.notification.updateMany).not.toHaveBeenCalled()
  })

  it("scopes the bulk update to the tenant's schoolId", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "STUDENT" },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "edge",
      role: "STUDENT",
      locale: "en",
    })
    vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 7 })

    await markAllNotificationsAsRead({ userId: USER })

    const where = vi.mocked(db.notification.updateMany).mock.calls[0]?.[0]
      ?.where as Record<string, unknown>
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.userId).toBe(USER)
    expect(where.read).toBe(false)
  })
})

describe("subscribeToEntityNotifications — upsert by unique constraint", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "edge",
      role: "STUDENT",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER, schoolId: SCHOOL, role: "STUDENT" },
    } as any)
  })

  it("targets the userId_entityType_entityId unique key", async () => {
    vi.mocked(db.notificationSubscription.upsert).mockResolvedValue({
      id: "sub-1",
    } as any)

    await subscribeToEntityNotifications({
      entityType: "assignment",
      entityId: "asgn-1",
    })

    const call = vi.mocked(db.notificationSubscription.upsert).mock
      .calls[0]?.[0]
    expect(call?.where).toEqual({
      userId_entityType_entityId: {
        userId: USER,
        entityType: "assignment",
        entityId: "asgn-1",
      },
    })
  })
})

describe("shouldSendNotification — quiet hours", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns true when no preference exists (default)", async () => {
    vi.mocked(db.notificationPreference.findFirst).mockResolvedValue(null)

    expect(
      await shouldSendNotification(SCHOOL, USER, "announcement", "in_app")
    ).toBe(true)
  })

  it("blocks during a normal-range window (9-17)", async () => {
    vi.mocked(db.notificationPreference.findFirst).mockResolvedValue({
      enabled: true,
      quietHoursStart: 9,
      quietHoursEnd: 17,
    } as any)

    const fixed = new Date()
    fixed.setHours(12, 0, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixed)
    try {
      expect(
        await shouldSendNotification(SCHOOL, USER, "announcement", "email")
      ).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("blocks during an overnight-range window (22-8)", async () => {
    vi.mocked(db.notificationPreference.findFirst).mockResolvedValue({
      enabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 8,
    } as any)

    // 02:00 — inside the overnight window
    const fixed = new Date()
    fixed.setHours(2, 0, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixed)
    try {
      expect(
        await shouldSendNotification(SCHOOL, USER, "announcement", "email")
      ).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("allows outside an overnight-range window", async () => {
    vi.mocked(db.notificationPreference.findFirst).mockResolvedValue({
      enabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 8,
    } as any)

    // 12:00 — outside the overnight window
    const fixed = new Date()
    fixed.setHours(12, 0, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixed)
    try {
      expect(
        await shouldSendNotification(SCHOOL, USER, "announcement", "email")
      ).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
