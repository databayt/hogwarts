// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
// Import actual server actions
import {
  createNotification,
  createNotificationBatch,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToEntityNotifications,
  unsubscribeFromEntityNotifications,
  updateNotificationPreferences,
} from "@/components/school-dashboard/notifications/actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    notificationBatch: {
      create: vi.fn(),
    },
    notificationPreference: {
      upsert: vi.fn(),
    },
    notificationSubscription: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    // updateNotificationPreferences runs upserts inside db.$transaction([...])
    // so the action requires a callable $transaction mock
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

describe("Notification Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-456"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ADMIN",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: { id: mockUserId, schoolId: mockSchoolId, role: "ADMIN" },
    } as any)
  })

  // ============================================================================
  // createNotification
  // ============================================================================

  describe("createNotification", () => {
    it("creates notification with correct schoolId scope", async () => {
      vi.mocked(db.notification.create).mockResolvedValue({
        id: "notif-1",
        schoolId: mockSchoolId,
      } as any)

      const result = await createNotification({
        userId: "target-user",
        type: "announcement",
        title: "Test Announcement",
        body: "This is a test",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe("notif-1")
      }
      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: "target-user",
            type: "announcement",
            title: "Test Announcement",
            body: "This is a test",
          }),
        })
      )
    })

    it("fails without authentication", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await createNotification({
        userId: "target-user",
        type: "announcement",
        title: "Test",
        body: "Test body",
      })

      expect(result.success).toBe(false)
    })

    it("fails without school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createNotification({
        userId: "target-user",
        type: "announcement",
        title: "Test",
        body: "Test body",
      })

      expect(result.success).toBe(false)
    })

    it("applies default priority when not specified", async () => {
      vi.mocked(db.notification.create).mockResolvedValue({
        id: "notif-2",
      } as any)

      await createNotification({
        userId: "target-user",
        type: "system_alert",
        title: "Alert",
        body: "Body",
      })

      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: "normal",
          }),
        })
      )
    })

    it("applies default channels when not specified", async () => {
      vi.mocked(db.notification.create).mockResolvedValue({
        id: "notif-3",
      } as any)

      await createNotification({
        userId: "target-user",
        type: "announcement",
        title: "Test",
        body: "Body",
      })

      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channels: ["in_app"],
          }),
        })
      )
    })

    it("rejects unauthorized notification types for role", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "STUDENT" },
      } as any)

      const result = await createNotification({
        userId: "target-user",
        type: "announcement",
        title: "Test",
        body: "Body",
      })

      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // markNotificationAsRead
  // ============================================================================

  describe("markNotificationAsRead", () => {
    it("marks notification as read with schoolId scope", async () => {
      vi.mocked(db.notification.findFirst).mockResolvedValue({
        id: "notif-1",
        userId: mockUserId,
        read: false,
      } as any)
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 1 })

      const result = await markNotificationAsRead({
        notificationId: "notif-1",
      })

      expect(result.success).toBe(true)
      expect(db.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
          data: expect.objectContaining({
            read: true,
          }),
        })
      )
    })

    it("skips if already read", async () => {
      vi.mocked(db.notification.findFirst).mockResolvedValue({
        id: "notif-1",
        userId: mockUserId,
        read: true,
      } as any)

      const result = await markNotificationAsRead({
        notificationId: "notif-1",
      })

      expect(result.success).toBe(true)
      expect(db.notification.updateMany).not.toHaveBeenCalled()
    })

    it("fails if notification not found", async () => {
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      const result = await markNotificationAsRead({
        notificationId: "nonexistent",
      })

      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // markAllNotificationsAsRead
  // ============================================================================

  describe("markAllNotificationsAsRead", () => {
    it("marks all unread notifications for user", async () => {
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 5 })

      const result = await markAllNotificationsAsRead({
        userId: mockUserId,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.count).toBe(5)
      }
      expect(db.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
            read: false,
          }),
        })
      )
    })

    it("rejects marking other users notifications", async () => {
      const result = await markAllNotificationsAsRead({
        userId: "other-user",
      })

      expect(result.success).toBe(false)
    })

    it("supports type filter", async () => {
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 2 })

      await markAllNotificationsAsRead({
        userId: mockUserId,
        type: "announcement",
      })

      expect(db.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "announcement",
          }),
        })
      )
    })
  })

  // ============================================================================
  // deleteNotification
  // ============================================================================

  describe("deleteNotification", () => {
    it("deletes notification with schoolId scope", async () => {
      vi.mocked(db.notification.findFirst).mockResolvedValue({
        id: "notif-1",
        userId: mockUserId,
      } as any)
      vi.mocked(db.notification.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteNotification({
        notificationId: "notif-1",
      })

      expect(result.success).toBe(true)
      expect(db.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
        })
      )
    })

    it("fails if notification not found", async () => {
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      const result = await deleteNotification({
        notificationId: "nonexistent",
      })

      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // createNotificationBatch
  // ============================================================================

  describe("createNotificationBatch", () => {
    it("creates batch with schoolId", async () => {
      vi.mocked(db.notificationBatch.create).mockResolvedValue({
        id: "batch-1",
      } as any)

      const result = await createNotificationBatch({
        type: "announcement",
        title: "Batch Title",
        body: "Batch Body",
        targetRole: "STUDENT",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.batchId).toBe("batch-1")
      }
      expect(db.notificationBatch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            type: "announcement",
            createdBy: mockUserId,
            status: "pending",
          }),
        })
      )
    })
  })

  // ============================================================================
  // updateNotificationPreferences
  // ============================================================================

  describe("updateNotificationPreferences", () => {
    it("upserts preferences with schoolId", async () => {
      vi.mocked(db.notificationPreference.upsert).mockResolvedValue({} as any)

      const result = await updateNotificationPreferences([
        {
          type: "announcement",
          channel: "email",
          enabled: true,
        },
      ])

      expect(result.success).toBe(true)
      expect(db.notificationPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
        })
      )
    })
  })

  // ============================================================================
  // subscribeToEntityNotifications
  // ============================================================================

  describe("subscribeToEntityNotifications", () => {
    it("creates subscription with schoolId", async () => {
      vi.mocked(db.notificationSubscription.upsert).mockResolvedValue({
        id: "sub-1",
      } as any)

      const result = await subscribeToEntityNotifications({
        entityType: "class",
        entityId: "class-1",
      })

      expect(result.success).toBe(true)
      expect(db.notificationSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
        })
      )
    })
  })

  // ============================================================================
  // unsubscribeFromEntityNotifications
  // ============================================================================

  describe("unsubscribeFromEntityNotifications", () => {
    it("updates subscription with schoolId scope", async () => {
      vi.mocked(db.notificationSubscription.updateMany).mockResolvedValue({
        count: 1,
      })

      const result = await unsubscribeFromEntityNotifications({
        subscriptionId: "sub-1",
        active: false,
      })

      expect(result.success).toBe(true)
      expect(db.notificationSubscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
        })
      )
    })
  })
})
