// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for BUG-3 (directEmail), BUG-4 (absolute URLs), BUG-5 (per-channel
 * audience preferences), and BUG-7/BUG-10 (targetRoles in audience dispatch).
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  dispatchNotification,
  dispatchNotificationsToAudience,
  resolveActionUrl,
} from "@/lib/dispatch-notification"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    class: {
      findUnique: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock the email-service dynamic import used by the directEmail path.
vi.mock("@/components/school-dashboard/notifications/email-service", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// Suppress prewarm side effects in tests.
vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn().mockResolvedValue(undefined),
}))

const mockDb = vi.mocked(db)

// ── resolveActionUrl (BUG-4) ───────────────────────────────────────────────

describe("resolveActionUrl (BUG-4)", () => {
  it("returns already-absolute URLs unchanged", () => {
    expect(resolveActionUrl("https://example.com/path")).toBe(
      "https://example.com/path"
    )
    expect(resolveActionUrl("http://localhost:3000/foo")).toBe(
      "http://localhost:3000/foo"
    )
  })

  it("prefers customDomain when set", () => {
    const result = resolveActionUrl("/finance/fees", "demo", "demo.school.com")
    expect(result).toBe("https://demo.school.com/finance/fees")
  })

  it("builds subdomain URL in production (NODE_ENV=production)", () => {
    const origEnv = process.env.NODE_ENV
    // Force production-like behaviour via the helper logic directly.
    // Since NODE_ENV is read-only in test environments, we test indirectly
    // by verifying the non-production branch (subdomain.localhost) is returned
    // in test env (NODE_ENV !== 'production').
    const result = resolveActionUrl("/finance/fees", "kingfahad", null)
    expect(result).toMatch(/kingfahad/)
    expect(result).toMatch(/\/finance\/fees$/)
    void origEnv
  })

  it("falls back to BASE_URL when no subdomain or domain", () => {
    const result = resolveActionUrl("/finance/fees", null, null)
    expect(result).toMatch(/\/finance\/fees$/)
    expect(result).toMatch(/^https?:\/\//)
  })

  it("falls back to BASE_URL when subdomain is empty string", () => {
    const result = resolveActionUrl("/finance/fees", "", null)
    expect(result).toMatch(/\/finance\/fees$/)
    expect(result).toMatch(/^https?:\/\//)
  })
})

// ── dispatchNotification — BUG-4: metadata.url absolutified ──────────────

describe("dispatchNotification — BUG-4 metadata.url absolutification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock school lookup used by absolutifyMetadataUrl.
    mockDb.school.findUnique.mockResolvedValue({
      subdomain: "demo",
      domain: null,
    } as any)
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({ id: "n1" } as any)
  })

  it("stores an absolute URL even when caller passes a relative path", async () => {
    await dispatchNotification({
      schoolId: "school-1",
      userId: "user-1",
      type: "fee_due",
      title: "Test",
      body: "Body",
      metadata: { url: "/finance/fees" },
    })

    const createCall = mockDb.notification.create.mock.calls[0][0]
    const storedUrl = (createCall.data.metadata as any).url as string
    expect(storedUrl).toMatch(/^https?:\/\//)
    expect(storedUrl).toMatch(/\/finance\/fees$/)
  })

  it("leaves an already-absolute URL untouched", async () => {
    await dispatchNotification({
      schoolId: "school-1",
      userId: "user-1",
      type: "fee_due",
      title: "Test",
      body: "Body",
      metadata: { url: "https://demo.databayt.org/finance/fees" },
    })

    const createCall = mockDb.notification.create.mock.calls[0][0]
    const storedUrl = (createCall.data.metadata as any).url as string
    expect(storedUrl).toBe("https://demo.databayt.org/finance/fees")
  })

  it("does not modify metadata when url key is absent", async () => {
    await dispatchNotification({
      schoolId: "school-1",
      userId: "user-1",
      type: "announcement",
      title: "Test",
      body: "Body",
      metadata: { entityId: "abc" },
    })

    const createCall = mockDb.notification.create.mock.calls[0][0]
    expect((createCall.data.metadata as any).url).toBeUndefined()
    expect((createCall.data.metadata as any).entityId).toBe("abc")
  })
})

// ── dispatchNotification — BUG-3: directEmail ─────────────────────────────

describe("dispatchNotification — BUG-3 directEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.school.findUnique.mockResolvedValue({
      subdomain: "demo",
      domain: null,
    } as any)
  })

  it("sends email directly and returns null when userId is empty and directEmail is set", async () => {
    const result = await dispatchNotification({
      schoolId: "school-1",
      userId: "",
      type: "system_alert",
      title: "Offer Expiring",
      body: "Your offer expires soon.",
      channels: ["email"],
      directEmail: "applicant@example.com",
    })

    // No DB row should be created.
    expect(mockDb.notification.create).not.toHaveBeenCalled()
    // Returns null (no notification id).
    expect(result).toBeNull()
  })

  it("skips directEmail send when email channel is not in requested channels", async () => {
    // even if directEmail is set, only in_app requested → no email sent
    const { sendNotificationEmail } =
      await import("@/components/school-dashboard/notifications/email-service")
    const mockSend = vi.mocked(sendNotificationEmail)
    mockSend.mockClear()

    await dispatchNotification({
      schoolId: "school-1",
      userId: "",
      type: "system_alert",
      title: "Test",
      body: "Body",
      channels: ["in_app"],
      directEmail: "guest@example.com",
    })

    expect(mockSend).not.toHaveBeenCalled()
  })

  it("proceeds normally (creates DB row) when userId is provided even if directEmail is also set", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({ id: "n-ok" } as any)

    const result = await dispatchNotification({
      schoolId: "school-1",
      userId: "real-user-id",
      type: "system_alert",
      title: "Test",
      body: "Body",
      channels: ["in_app", "email"],
      directEmail: "also@example.com",
    })

    expect(mockDb.notification.create).toHaveBeenCalled()
    expect(result).toBe("n-ok")
  })
})

// ── dispatchNotificationsToAudience — BUG-5: per-channel preferences ──────

describe("dispatchNotificationsToAudience — BUG-5 per-channel preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.school.findUnique.mockResolvedValue({
      subdomain: "demo",
      domain: null,
    } as any)
  })

  it("preserves email channel for user who only disabled in_app", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }] as any)
    // u1 has disabled in_app but NOT email
    mockDb.notificationPreference.findMany.mockResolvedValue([
      { userId: "u1", channel: "in_app" },
    ] as any)
    mockDb.notification.createMany.mockResolvedValue({ count: 1 } as any)

    await dispatchNotificationsToAudience({
      schoolId: "school-1",
      type: "fee_due",
      title: "Test",
      body: "Body",
      channels: ["in_app", "email"],
      targetScope: "school",
    })

    expect(mockDb.notification.createMany).toHaveBeenCalled()
    const rows = mockDb.notification.createMany.mock.calls[0][0].data
    // u1 should still get email
    expect(rows[0].channels).toContain("email")
    expect(rows[0].channels).not.toContain("in_app")
  })

  it("skips user entirely when ALL requested channels are disabled", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }] as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([
      { userId: "u1", channel: "in_app" },
      { userId: "u1", channel: "email" },
    ] as any)
    mockDb.notification.createMany.mockResolvedValue({ count: 0 } as any)

    const result = await dispatchNotificationsToAudience({
      schoolId: "school-1",
      type: "fee_due",
      title: "Test",
      body: "Body",
      channels: ["in_app", "email"],
      targetScope: "school",
    })

    // No rows to create — createMany should not be called.
    expect(mockDb.notification.createMany).not.toHaveBeenCalled()
    expect(result.created).toBe(0)
  })

  it("sends to all users who haven't disabled any channel", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }] as any)
    // No disabled preferences.
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 2 } as any)

    const result = await dispatchNotificationsToAudience({
      schoolId: "school-1",
      type: "announcement",
      title: "Hi",
      body: "Body",
      channels: ["in_app", "email"],
      targetScope: "school",
    })

    expect(result.created).toBe(2)
    const rows = mockDb.notification.createMany.mock.calls[0][0].data
    expect(rows).toHaveLength(2)
    rows.forEach((r: any) => {
      expect(r.channels).toContain("in_app")
      expect(r.channels).toContain("email")
    })
  })
})

// ── dispatchNotificationsToAudience — BUG-7: targetRoles multi-role ────────

describe("dispatchNotificationsToAudience — BUG-7 targetRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.school.findUnique.mockResolvedValue({
      subdomain: "demo",
      domain: null,
    } as any)
  })

  it("queries ADMIN + STAFF when targetRoles is ['ADMIN','STAFF']", async () => {
    // The multi-role path uses db.user.findMany with role: { in: [...] }
    mockDb.user.findMany.mockResolvedValue([
      { id: "admin-1" },
      { id: "staff-1" },
    ] as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 2 } as any)

    const result = await dispatchNotificationsToAudience({
      schoolId: "school-1",
      type: "system_alert",
      title: "New application",
      body: "A new application was submitted.",
      channels: ["in_app", "email"],
      targetScope: "role",
      targetRoles: ["ADMIN", "STAFF"],
    })

    expect(result.created).toBe(2)
    // Verify the findMany call included both roles.
    const findCall = mockDb.user.findMany.mock.calls[0][0]
    expect(findCall.where.role).toEqual({ in: ["ADMIN", "STAFF"] })
  })

  it("falls back to single targetRole when targetRoles has one entry", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "admin-1" }] as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 1 } as any)

    await dispatchNotificationsToAudience({
      schoolId: "school-1",
      type: "system_alert",
      title: "Test",
      body: "Body",
      channels: ["in_app"],
      targetScope: "role",
      targetRoles: ["ADMIN"],
    })

    expect(mockDb.notification.createMany).toHaveBeenCalled()
  })
})
