import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  buildNotificationOrderBy,
  buildNotificationWhere,
  buildPagination,
  getEntitySubscribers,
  getExpiredNotifications,
  getNotificationDetail,
  getNotificationPreference,
  getNotificationsByIds,
  getNotificationsByType,
  getNotificationsList,
  getNotificationStats,
  getPendingEmailNotifications,
  getRecentNotifications,
  getUnreadNotificationCount,
  getUnreadNotifications,
  getUserNotificationPreferences,
  getUserNotificationSubscriptions,
  isUserSubscribed,
  shouldSendNotification,
  verifyNotificationOwnership,
} from "../queries"

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    notificationPreference: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    notificationSubscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe("Notification Queries", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Query Builder Tests
  // ============================================================================

  describe("buildNotificationWhere", () => {
    it("includes schoolId and userId in base where clause", () => {
      const where = buildNotificationWhere(mockSchoolId, mockUserId)

      expect(where.schoolId).toBe(mockSchoolId)
      expect(where.userId).toBe(mockUserId)
    })

    it("filters by type when valid", () => {
      const where = buildNotificationWhere(mockSchoolId, mockUserId, {
        type: "message",
      })

      expect(where.type).toBe("message")
    })

    it("ignores invalid type", () => {
      const where = buildNotificationWhere(mockSchoolId, mockUserId, {
        type: "invalid_type",
      })

      expect(where.type).toBeUndefined()
    })

    it("filters by priority when valid", () => {
      const where = buildNotificationWhere(mockSchoolId, mockUserId, {
        priority: "high",
      })

      expect(where.priority).toBe("high")
    })

    it("filters by read status", () => {
      const whereRead = buildNotificationWhere(mockSchoolId, mockUserId, {
        read: "true",
      })
      const whereUnread = buildNotificationWhere(mockSchoolId, mockUserId, {
        read: "false",
      })

      expect(whereRead.read).toBe(true)
      expect(whereUnread.read).toBe(false)
    })

    it("adds search filter for title and body", () => {
      const where = buildNotificationWhere(mockSchoolId, mockUserId, {
        search: "test",
      })

      expect(where.OR).toHaveLength(2)
      expect(where.OR?.[0]).toEqual({
        title: { contains: "test", mode: "insensitive" },
      })
      expect(where.OR?.[1]).toEqual({
        body: { contains: "test", mode: "insensitive" },
      })
    })

    it("filters by actorId", () => {
      const where = buildNotificationWhere(mockSchoolId, mockUserId, {
        actorId: "actor-123",
      })

      expect(where.actorId).toBe("actor-123")
    })
  })

  describe("buildNotificationOrderBy", () => {
    it("returns default ordering when no params", () => {
      const orderBy = buildNotificationOrderBy()

      expect(orderBy).toEqual([{ read: "asc" }, { createdAt: "desc" }])
    })

    it("returns default ordering for empty array", () => {
      const orderBy = buildNotificationOrderBy([])

      expect(orderBy).toEqual([{ read: "asc" }, { createdAt: "desc" }])
    })

    it("builds custom ordering from sort params", () => {
      const orderBy = buildNotificationOrderBy([
        { id: "createdAt", desc: true },
        { id: "priority", desc: false },
      ])

      expect(orderBy).toEqual([{ createdAt: "desc" }, { priority: "asc" }])
    })
  })

  describe("buildPagination", () => {
    it("calculates skip and take correctly", () => {
      expect(buildPagination(1, 20)).toEqual({ skip: 0, take: 20 })
      expect(buildPagination(2, 20)).toEqual({ skip: 20, take: 20 })
      expect(buildPagination(3, 10)).toEqual({ skip: 20, take: 10 })
    })
  })

  // ============================================================================
  // Query Function Tests
  // ============================================================================

  describe("getNotificationsList", () => {
    it("includes schoolId in where clause (multi-tenant isolation)", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])
      vi.mocked(db.notification.count).mockResolvedValue(0)

      await getNotificationsList(mockSchoolId, mockUserId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
        })
      )
    })

    it("applies pagination parameters", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])
      vi.mocked(db.notification.count).mockResolvedValue(0)

      await getNotificationsList(mockSchoolId, mockUserId, {
        page: 2,
        perPage: 15,
      })

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15,
        })
      )
    })

    it("executes queries in parallel", async () => {
      const findManyPromise = Promise.resolve([])
      const countPromise = Promise.resolve(5)

      vi.mocked(db.notification.findMany).mockReturnValue(
        findManyPromise as any
      )
      vi.mocked(db.notification.count).mockReturnValue(countPromise as any)

      const result = await getNotificationsList(mockSchoolId, mockUserId)

      expect(db.notification.findMany).toHaveBeenCalled()
      expect(db.notification.count).toHaveBeenCalled()
      expect(result).toEqual({ rows: [], count: 5 })
    })
  })

  describe("getNotificationDetail", () => {
    it("includes schoolId and userId for ownership verification", async () => {
      vi.mocked(db.notification.findFirst).mockResolvedValue(null)

      await getNotificationDetail(mockSchoolId, mockUserId, "notif-123")

      expect(db.notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "notif-123",
            schoolId: mockSchoolId,
            userId: mockUserId,
          },
        })
      )
    })
  })

  describe("getUnreadNotificationCount", () => {
    it("counts only unread notifications", async () => {
      vi.mocked(db.notification.count).mockResolvedValue(10)

      const count = await getUnreadNotificationCount(mockSchoolId, mockUserId)

      expect(db.notification.count).toHaveBeenCalledWith({
        where: {
          schoolId: mockSchoolId,
          userId: mockUserId,
          read: false,
        },
      })
      expect(count).toBe(10)
    })
  })

  describe("getNotificationStats", () => {
    it("returns aggregated statistics", async () => {
      vi.mocked(db.notification.count).mockResolvedValue(100)
      vi.mocked(db.notification.groupBy).mockResolvedValue([])

      const stats = await getNotificationStats(mockSchoolId, mockUserId)

      expect(stats).toHaveProperty("total")
      expect(stats).toHaveProperty("unread")
      expect(stats).toHaveProperty("today")
      expect(stats).toHaveProperty("thisWeek")
      expect(stats).toHaveProperty("byType")
      expect(stats).toHaveProperty("byPriority")
    })
  })

  describe("getRecentNotifications", () => {
    it("limits results by default to 10", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getRecentNotifications(mockSchoolId, mockUserId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      )
    })

    it("orders by createdAt descending", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getRecentNotifications(mockSchoolId, mockUserId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      )
    })
  })

  describe("getUnreadNotifications", () => {
    it("filters to unread only", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getUnreadNotifications(mockSchoolId, mockUserId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            read: false,
          }),
        })
      )
    })

    it("orders by priority then createdAt", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getUnreadNotifications(mockSchoolId, mockUserId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        })
      )
    })
  })

  describe("getNotificationsByType", () => {
    it("filters by notification type", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getNotificationsByType(
        mockSchoolId,
        mockUserId,
        "assignment_created"
      )

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "assignment_created",
          }),
        })
      )
    })
  })

  describe("getExpiredNotifications", () => {
    it("filters by expiration date", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getExpiredNotifications(mockSchoolId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: expect.objectContaining({
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it("works without schoolId for school-dashboard-wide query", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getExpiredNotifications()

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            schoolId: expect.anything(),
          }),
        })
      )
    })
  })

  // ============================================================================
  // Preference Query Tests
  // ============================================================================

  describe("getUserNotificationPreferences", () => {
    it("scopes preferences by schoolId and userId", async () => {
      vi.mocked(db.notificationPreference.findMany).mockResolvedValue([])

      await getUserNotificationPreferences(mockSchoolId, mockUserId)

      expect(db.notificationPreference.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: mockSchoolId,
            userId: mockUserId,
          },
        })
      )
    })
  })

  describe("getNotificationPreference", () => {
    it("finds preference by type and channel", async () => {
      vi.mocked(db.notificationPreference.findFirst).mockResolvedValue(null)

      await getNotificationPreference(
        mockSchoolId,
        mockUserId,
        "message",
        "email"
      )

      expect(db.notificationPreference.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: mockSchoolId,
            userId: mockUserId,
            type: "message",
            channel: "email",
          },
        })
      )
    })
  })

  describe("shouldSendNotification", () => {
    it("returns true when no preference exists (default)", async () => {
      vi.mocked(db.notificationPreference.findFirst).mockResolvedValue(null)

      const result = await shouldSendNotification(
        mockSchoolId,
        mockUserId,
        "message",
        "in_app"
      )

      expect(result).toBe(true)
    })

    it("returns false when preference is disabled", async () => {
      vi.mocked(db.notificationPreference.findFirst).mockResolvedValue({
        enabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      } as any)

      const result = await shouldSendNotification(
        mockSchoolId,
        mockUserId,
        "message",
        "email"
      )

      expect(result).toBe(false)
    })
  })

  // ============================================================================
  // Subscription Query Tests
  // ============================================================================

  describe("getUserNotificationSubscriptions", () => {
    it("returns only active subscriptions", async () => {
      vi.mocked(db.notificationSubscription.findMany).mockResolvedValue([])

      await getUserNotificationSubscriptions(mockSchoolId, mockUserId)

      expect(db.notificationSubscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
          }),
        })
      )
    })
  })

  describe("isUserSubscribed", () => {
    it("returns true when subscription exists", async () => {
      vi.mocked(db.notificationSubscription.findFirst).mockResolvedValue({
        id: "sub-123",
      } as any)

      const result = await isUserSubscribed(
        mockSchoolId,
        mockUserId,
        "assignment",
        "assign-123"
      )

      expect(result).toBe(true)
    })

    it("returns false when subscription does not exist", async () => {
      vi.mocked(db.notificationSubscription.findFirst).mockResolvedValue(null)

      const result = await isUserSubscribed(
        mockSchoolId,
        mockUserId,
        "assignment",
        "assign-123"
      )

      expect(result).toBe(false)
    })
  })

  describe("getEntitySubscribers", () => {
    it("returns user IDs of active subscribers", async () => {
      vi.mocked(db.notificationSubscription.findMany).mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ] as any)

      const subscribers = await getEntitySubscribers(
        mockSchoolId,
        "assignment",
        "assign-123"
      )

      expect(subscribers).toEqual(["user-1", "user-2"])
    })
  })

  // ============================================================================
  // Bulk Query Tests
  // ============================================================================

  describe("verifyNotificationOwnership", () => {
    it("returns only IDs that user owns", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([
        { id: "n1" },
        { id: "n2" },
      ] as any)

      const ids = await verifyNotificationOwnership(mockSchoolId, mockUserId, [
        "n1",
        "n2",
        "n3",
      ])

      expect(ids).toEqual(["n1", "n2"])
    })
  })

  describe("getNotificationsByIds", () => {
    it("scopes query by schoolId and userId", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getNotificationsByIds(mockSchoolId, mockUserId, ["n1", "n2"])

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ["n1", "n2"] },
            schoolId: mockSchoolId,
            userId: mockUserId,
          }),
        })
      )
    })
  })

  describe("getPendingEmailNotifications", () => {
    it("filters by emailSent false and email channel", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getPendingEmailNotifications(mockSchoolId)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            emailSent: false,
            channels: { has: "email" },
          }),
        })
      )
    })

    it("limits results to specified amount", async () => {
      vi.mocked(db.notification.findMany).mockResolvedValue([])

      await getPendingEmailNotifications(mockSchoolId, 50)

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })
  })
})
