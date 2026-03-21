// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  dispatchNotification,
  dispatchNotificationsToAudience,
} from "@/lib/dispatch-notification"

// Mock db before importing dispatch functions
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
  },
}))

const mockDb = vi.mocked(db)

describe("dispatchNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseParams = {
    schoolId: "school-1",
    userId: "user-1",
    type: "announcement" as const,
    title: "Test",
    body: "Test body",
  }

  it("creates notification with defaults", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({
      id: "notif-1",
    } as any)

    const result = await dispatchNotification(baseParams)

    expect(result).toBe("notif-1")
    expect(mockDb.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: "school-1",
        userId: "user-1",
        type: "announcement",
        title: "Test",
        body: "Test body",
        lang: "ar",
        priority: "normal",
        channels: ["in_app"],
        actorId: null,
      }),
    })
  })

  it("respects custom priority and channels", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({ id: "notif-2" } as any)

    await dispatchNotification({
      ...baseParams,
      priority: "urgent",
      channels: ["in_app", "email"],
      actorId: "actor-1",
      lang: "en",
    })

    expect(mockDb.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priority: "urgent",
        channels: ["in_app", "email"],
        actorId: "actor-1",
        lang: "en",
      }),
    })
  })

  it("returns null when user has disabled notification type", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue({
      enabled: false,
    } as any)

    const result = await dispatchNotification(baseParams)

    expect(result).toBeNull()
    expect(mockDb.notification.create).not.toHaveBeenCalled()
  })

  it("sends when no preference exists (default enabled)", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({ id: "notif-3" } as any)

    const result = await dispatchNotification(baseParams)

    expect(result).toBe("notif-3")
  })

  it("sets expiration date in the future", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockResolvedValue({ id: "notif-4" } as any)

    const before = new Date()
    await dispatchNotification(baseParams)
    const after = new Date()

    const createCall = mockDb.notification.create.mock.calls[0][0]
    const expiresAt = createCall.data.expiresAt as Date
    // Should be ~30 days in the future
    expect(expiresAt.getTime()).toBeGreaterThan(before.getTime())
    expect(expiresAt.getTime()).toBeGreaterThan(
      after.getTime() + 29 * 24 * 60 * 60 * 1000
    )
  })

  it("returns null on database error", async () => {
    mockDb.notificationPreference.findUnique.mockResolvedValue(null)
    mockDb.notification.create.mockRejectedValue(new Error("DB error"))

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await dispatchNotification(baseParams)

    expect(result).toBeNull()
    consoleSpy.mockRestore()
  })
})

describe("dispatchNotificationsToAudience", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseAudienceParams = {
    schoolId: "school-1",
    type: "announcement" as const,
    title: "School-wide",
    body: "Announcement body",
    targetScope: "school" as const,
  }

  it("creates notifications for all school users", async () => {
    mockDb.user.findMany.mockResolvedValue([
      { id: "u1" },
      { id: "u2" },
      { id: "u3" },
    ] as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 3 })

    const result = await dispatchNotificationsToAudience(baseAudienceParams)

    expect(result.created).toBe(3)
    expect(mockDb.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: "u1", schoolId: "school-1" }),
        expect.objectContaining({ userId: "u2" }),
        expect.objectContaining({ userId: "u3" }),
      ]),
      skipDuplicates: true,
    })
  })

  it("filters out users who disabled the notification type", async () => {
    mockDb.user.findMany.mockResolvedValue([
      { id: "u1" },
      { id: "u2" },
      { id: "u3" },
    ] as any)
    // u2 has disabled this type
    mockDb.notificationPreference.findMany.mockResolvedValue([
      { userId: "u2" },
    ] as any)
    mockDb.notification.createMany.mockResolvedValue({ count: 2 })

    const result = await dispatchNotificationsToAudience(baseAudienceParams)

    expect(result.created).toBe(2)
    const createCall = mockDb.notification.createMany.mock.calls[0][0]
    const userIds = createCall.data.map((d: any) => d.userId)
    expect(userIds).toContain("u1")
    expect(userIds).toContain("u3")
    expect(userIds).not.toContain("u2")
  })

  it("resolves class scope with students and teacher via User IDs", async () => {
    mockDb.class.findUnique.mockResolvedValue({
      teacher: { userId: "teacher-user-1" },
      studentClasses: [
        { student: { userId: "student-user-1" } },
        { student: { userId: "student-user-2" } },
      ],
    } as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 3 })

    const result = await dispatchNotificationsToAudience({
      ...baseAudienceParams,
      targetScope: "class",
      targetClassId: "class-1",
    })

    expect(result.created).toBe(3)
  })

  it("filters out students without linked user accounts", async () => {
    mockDb.class.findUnique.mockResolvedValue({
      teacher: { userId: "teacher-user-1" },
      studentClasses: [
        { student: { userId: "student-user-1" } },
        { student: { userId: null } },
      ],
    } as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 2 })

    const result = await dispatchNotificationsToAudience({
      ...baseAudienceParams,
      targetScope: "class",
      targetClassId: "class-1",
    })

    expect(result.created).toBe(2)
  })

  it("resolves role scope", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "t1" }, { id: "t2" }] as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([])
    mockDb.notification.createMany.mockResolvedValue({ count: 2 })

    const result = await dispatchNotificationsToAudience({
      ...baseAudienceParams,
      targetScope: "role",
      targetRole: "TEACHER",
    })

    expect(result.created).toBe(2)
  })

  it("returns 0 when no users found", async () => {
    mockDb.user.findMany.mockResolvedValue([])

    const result = await dispatchNotificationsToAudience(baseAudienceParams)

    expect(result.created).toBe(0)
    expect(mockDb.notification.createMany).not.toHaveBeenCalled()
  })

  it("returns 0 when all users have disabled the type", async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: "u1" }] as any)
    mockDb.notificationPreference.findMany.mockResolvedValue([
      { userId: "u1" },
    ] as any)

    const result = await dispatchNotificationsToAudience(baseAudienceParams)

    expect(result.created).toBe(0)
    expect(mockDb.notification.createMany).not.toHaveBeenCalled()
  })

  it("returns 0 on database error", async () => {
    mockDb.user.findMany.mockRejectedValue(new Error("DB error"))

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await dispatchNotificationsToAudience(baseAudienceParams)

    expect(result.created).toBe(0)
    consoleSpy.mockRestore()
  })

  it("returns 0 for class scope with missing classId", async () => {
    const result = await dispatchNotificationsToAudience({
      ...baseAudienceParams,
      targetScope: "class",
    })

    expect(result.created).toBe(0)
  })

  it("returns 0 for role scope with missing role", async () => {
    const result = await dispatchNotificationsToAudience({
      ...baseAudienceParams,
      targetScope: "role",
    })

    expect(result.created).toBe(0)
  })
})
