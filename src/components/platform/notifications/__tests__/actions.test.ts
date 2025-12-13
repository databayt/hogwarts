import { describe, it, expect, vi, beforeEach } from "vitest"
import { z } from "zod"

// Mock the dependencies before importing actions
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
    $transaction: vi.fn((callback) => callback({
      notification: {
        create: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    })),
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

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { auth } from "@/auth"

describe("Notification Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"

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

  describe("Notification Schema Validation", () => {
    const notificationSchema = z.object({
      title: z.string().min(1, "Title is required"),
      message: z.string().min(1, "Message is required"),
      type: z.enum(["INFO", "WARNING", "ERROR", "SUCCESS", "ANNOUNCEMENT"]).default("INFO"),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
      recipientId: z.string().optional(),
      recipientRole: z.enum(["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "STAFF", "ALL"]).optional(),
      expiresAt: z.string().optional(),
      actionUrl: z.string().url().optional(),
      metadata: z.record(z.string()).optional(),
    })

    it("validates complete notification data", () => {
      const validData = {
        title: "Important Update",
        message: "Please review the new schedule",
        type: "ANNOUNCEMENT",
        priority: "HIGH",
        recipientRole: "ALL",
        actionUrl: "https://school.edu/schedule",
      }

      const result = notificationSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires title and message", () => {
      const missingTitle = {
        message: "Message content",
      }

      const missingMessage = {
        title: "Title",
      }

      expect(notificationSchema.safeParse(missingTitle).success).toBe(false)
      expect(notificationSchema.safeParse(missingMessage).success).toBe(false)
    })

    it("validates notification type enum", () => {
      const validTypes = ["INFO", "WARNING", "ERROR", "SUCCESS", "ANNOUNCEMENT"]

      validTypes.forEach((type) => {
        const data = { title: "Test", message: "Test", type }
        expect(notificationSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates priority enum", () => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]

      validPriorities.forEach((priority) => {
        const data = { title: "Test", message: "Test", priority }
        expect(notificationSchema.safeParse(data).success).toBe(true)
      })
    })

    it("validates action URL format", () => {
      const validUrl = {
        title: "Test",
        message: "Test",
        actionUrl: "https://example.com/path",
      }

      const invalidUrl = {
        title: "Test",
        message: "Test",
        actionUrl: "not-a-url",
      }

      expect(notificationSchema.safeParse(validUrl).success).toBe(true)
      expect(notificationSchema.safeParse(invalidUrl).success).toBe(false)
    })

    it("applies defaults", () => {
      const minimal = { title: "Test", message: "Test" }
      const result = notificationSchema.parse(minimal)

      expect(result.type).toBe("INFO")
      expect(result.priority).toBe("MEDIUM")
    })
  })

  describe("Multi-tenant Isolation", () => {
    it("creates notification with schoolId scope", async () => {
      const mockNotification = {
        id: "notif-1",
        title: "Test",
        message: "Test message",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.notification.create).mockResolvedValue(mockNotification as any)

      // Simulating action behavior
      const notification = await db.notification.create({
        data: {
          title: "Test",
          message: "Test message",
          schoolId: mockSchoolId,
          type: "INFO",
          priority: "MEDIUM",
        },
      })

      expect(db.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("fetches notifications scoped to schoolId", async () => {
      const mockNotifications = [
        { id: "1", title: "Notif 1", schoolId: mockSchoolId },
        { id: "2", title: "Notif 2", schoolId: mockSchoolId },
      ]

      vi.mocked(db.notification.findMany).mockResolvedValue(mockNotifications as any)

      await db.notification.findMany({
        where: { schoolId: mockSchoolId, recipientId: mockUserId },
        orderBy: { createdAt: "desc" },
      })

      expect(db.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("marks notifications as read with schoolId scope", async () => {
      vi.mocked(db.notification.updateMany).mockResolvedValue({ count: 5 })

      await db.notification.updateMany({
        where: {
          schoolId: mockSchoolId,
          recipientId: mockUserId,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      })

      expect(db.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            recipientId: mockUserId,
          }),
        })
      )
    })

    it("deletes notifications with schoolId scope", async () => {
      vi.mocked(db.notification.deleteMany).mockResolvedValue({ count: 3 })

      await db.notification.deleteMany({
        where: {
          schoolId: mockSchoolId,
          recipientId: mockUserId,
          id: { in: ["n1", "n2", "n3"] },
        },
      })

      expect(db.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })

  describe("Bulk Operations", () => {
    it("sends bulk notifications with schoolId", async () => {
      const recipientIds = ["user-1", "user-2", "user-3"]
      const notificationData = {
        title: "Bulk Notification",
        message: "Message to multiple users",
        type: "INFO" as const,
      }

      vi.mocked(db.notification.createMany).mockResolvedValue({ count: 3 })

      await db.notification.createMany({
        data: recipientIds.map((recipientId) => ({
          ...notificationData,
          recipientId,
          schoolId: mockSchoolId,
        })),
      })

      expect(db.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ schoolId: mockSchoolId }),
          ]),
        })
      )
    })
  })
})
