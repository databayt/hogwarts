// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  createNotificationBatchSchema,
  createNotificationSchema,
  deleteNotificationSchema,
  markAllNotificationsReadSchema,
  markNotificationReadSchema,
  notificationFiltersSchema,
  notificationPreferenceSchema,
  notificationSubscriptionSchema,
  updateNotificationPreferencesSchema,
  updateNotificationSubscriptionSchema,
} from "@/components/school-dashboard/notifications/validation"

// ============================================================================
// createNotificationSchema
// ============================================================================

describe("createNotificationSchema", () => {
  const validData = {
    userId: "user-123",
    type: "announcement" as const,
    title: "Test Title",
    body: "Test body content",
  }

  it("accepts valid minimal data", () => {
    const result = createNotificationSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe("normal")
      expect(result.data.channels).toEqual(["in_app"])
    }
  })

  it("accepts all optional fields", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      priority: "urgent",
      channels: ["in_app", "email"],
      actorId: "actor-1",
      metadata: { url: "/dashboard" },
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing userId", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      userId: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing title", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      title: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing body", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      body: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects title over 255 characters", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      title: "x".repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid notification type", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      type: "invalid_type",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid priority", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      priority: "critical",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid channel", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      channels: ["telegram"],
    })
    expect(result.success).toBe(false)
  })

  it("rejects past expiration date", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    })
    expect(result.success).toBe(false)
  })

  it("accepts empty string expiresAt", () => {
    const result = createNotificationSchema.safeParse({
      ...validData,
      expiresAt: "",
    })
    expect(result.success).toBe(true)
  })

  it("accepts all 24 notification types", () => {
    // Mirror of Prisma enum NotificationType — keep in sync when adding new types
    const types = [
      "message",
      "message_mention",
      "assignment_created",
      "assignment_due",
      "assignment_graded",
      "grade_posted",
      "attendance_marked",
      "attendance_alert",
      "fee_due",
      "fee_overdue",
      "fee_paid",
      "announcement",
      "event_reminder",
      "class_cancelled",
      "class_rescheduled",
      "system_alert",
      "account_created",
      "password_reset",
      "login_alert",
      "document_shared",
      "report_ready",
      "absence_intention",
      "absence_intention_decision",
      "setup_guide",
    ]

    for (const type of types) {
      const result = createNotificationSchema.safeParse({ ...validData, type })
      expect(result.success).toBe(true)
    }
  })

  it("accepts all 5 notification channels", () => {
    const channels = ["in_app", "email", "push", "sms", "whatsapp"]
    for (const channel of channels) {
      const result = createNotificationSchema.safeParse({
        ...validData,
        channels: [channel],
      })
      expect(result.success).toBe(true)
    }
  })
})

// ============================================================================
// createNotificationBatchSchema
// ============================================================================

describe("createNotificationBatchSchema", () => {
  const validBatch = {
    type: "announcement" as const,
    title: "Batch Title",
    body: "Batch body",
    targetRole: "STUDENT",
  }

  it("accepts valid batch with targetRole", () => {
    const result = createNotificationBatchSchema.safeParse(validBatch)
    expect(result.success).toBe(true)
  })

  it("accepts valid batch with targetClassId", () => {
    const result = createNotificationBatchSchema.safeParse({
      type: "announcement",
      title: "Batch Title",
      body: "Batch body",
      targetClassId: "class-1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid batch with targetUserIds", () => {
    const result = createNotificationBatchSchema.safeParse({
      type: "announcement",
      title: "Batch Title",
      body: "Batch body",
      targetUserIds: ["user-1", "user-2"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects batch with no target", () => {
    const result = createNotificationBatchSchema.safeParse({
      type: "announcement",
      title: "Batch Title",
      body: "Batch body",
    })
    expect(result.success).toBe(false)
  })

  it("rejects batch with empty targetUserIds", () => {
    const result = createNotificationBatchSchema.safeParse({
      type: "announcement",
      title: "Batch Title",
      body: "Batch body",
      targetUserIds: [],
    })
    expect(result.success).toBe(false)
  })

  it("rejects past scheduledFor", () => {
    const result = createNotificationBatchSchema.safeParse({
      ...validBatch,
      scheduledFor: new Date(Date.now() - 86400000).toISOString(),
    })
    expect(result.success).toBe(false)
  })

  it("accepts future scheduledFor", () => {
    const result = createNotificationBatchSchema.safeParse({
      ...validBatch,
      scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty string scheduledFor", () => {
    const result = createNotificationBatchSchema.safeParse({
      ...validBatch,
      scheduledFor: "",
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// notificationPreferenceSchema
// ============================================================================

describe("notificationPreferenceSchema", () => {
  it("accepts valid preference", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "email",
      enabled: true,
    })
    expect(result.success).toBe(true)
  })

  it("accepts quiet hours when both provided", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      quietHoursStart: 22,
      quietHoursEnd: 8,
    })
    expect(result.success).toBe(true)
  })

  it("rejects quiet hours when only start provided", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      quietHoursStart: 22,
    })
    expect(result.success).toBe(false)
  })

  it("rejects quiet hours when only end provided", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      quietHoursEnd: 8,
    })
    expect(result.success).toBe(false)
  })

  it("rejects quiet hours with same start and end", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      quietHoursStart: 10,
      quietHoursEnd: 10,
    })
    expect(result.success).toBe(false)
  })

  it("rejects quiet hours out of range", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      quietHoursStart: 25,
      quietHoursEnd: 8,
    })
    expect(result.success).toBe(false)
  })

  it("rejects digest enabled without frequency", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      digestEnabled: true,
    })
    expect(result.success).toBe(false)
  })

  it("accepts digest enabled with frequency", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      digestEnabled: true,
      digestFrequency: "daily",
    })
    expect(result.success).toBe(true)
  })

  it("accepts digest disabled without frequency", () => {
    const result = notificationPreferenceSchema.safeParse({
      type: "announcement",
      channel: "in_app",
      enabled: true,
      digestEnabled: false,
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// updateNotificationPreferencesSchema
// ============================================================================

describe("updateNotificationPreferencesSchema", () => {
  it("accepts array of valid preferences", () => {
    const result = updateNotificationPreferencesSchema.safeParse([
      { type: "announcement", channel: "email", enabled: true },
      { type: "fee_due", channel: "in_app", enabled: false },
    ])
    expect(result.success).toBe(true)
  })

  it("accepts empty array", () => {
    const result = updateNotificationPreferencesSchema.safeParse([])
    expect(result.success).toBe(true)
  })

  it("rejects invalid item in array", () => {
    const result = updateNotificationPreferencesSchema.safeParse([
      { type: "invalid_type", channel: "email", enabled: true },
    ])
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// notificationFiltersSchema
// ============================================================================

describe("notificationFiltersSchema", () => {
  it("accepts empty filters", () => {
    const result = notificationFiltersSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts type filter array", () => {
    const result = notificationFiltersSchema.safeParse({
      type: ["announcement", "fee_due"],
    })
    expect(result.success).toBe(true)
  })

  it("accepts priority filter array", () => {
    const result = notificationFiltersSchema.safeParse({
      priority: ["high", "urgent"],
    })
    expect(result.success).toBe(true)
  })

  it("accepts read filter", () => {
    const result = notificationFiltersSchema.safeParse({ read: false })
    expect(result.success).toBe(true)
  })

  it("accepts valid date range", () => {
    const result = notificationFiltersSchema.safeParse({
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-12-31T23:59:59.000Z",
    })
    expect(result.success).toBe(true)
  })

  it("rejects startDate >= endDate", () => {
    const result = notificationFiltersSchema.safeParse({
      startDate: "2025-12-31T23:59:59.000Z",
      endDate: "2025-01-01T00:00:00.000Z",
    })
    expect(result.success).toBe(false)
  })

  it("rejects same startDate and endDate", () => {
    const result = notificationFiltersSchema.safeParse({
      startDate: "2025-06-15T00:00:00.000Z",
      endDate: "2025-06-15T00:00:00.000Z",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// Simple schemas
// ============================================================================

describe("markNotificationReadSchema", () => {
  it("accepts valid notificationId", () => {
    const result = markNotificationReadSchema.safeParse({
      notificationId: "notif-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty notificationId", () => {
    const result = markNotificationReadSchema.safeParse({ notificationId: "" })
    expect(result.success).toBe(false)
  })
})

describe("markAllNotificationsReadSchema", () => {
  it("accepts userId with optional type", () => {
    const result = markAllNotificationsReadSchema.safeParse({
      userId: "user-1",
      type: "announcement",
    })
    expect(result.success).toBe(true)
  })

  it("accepts userId without type", () => {
    const result = markAllNotificationsReadSchema.safeParse({
      userId: "user-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty userId", () => {
    const result = markAllNotificationsReadSchema.safeParse({ userId: "" })
    expect(result.success).toBe(false)
  })
})

describe("deleteNotificationSchema", () => {
  it("accepts valid notificationId", () => {
    const result = deleteNotificationSchema.safeParse({
      notificationId: "notif-1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty notificationId", () => {
    const result = deleteNotificationSchema.safeParse({ notificationId: "" })
    expect(result.success).toBe(false)
  })
})

describe("notificationSubscriptionSchema", () => {
  it("accepts valid subscription", () => {
    const result = notificationSubscriptionSchema.safeParse({
      entityType: "class",
      entityId: "class-1",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })

  it("rejects empty entityType", () => {
    const result = notificationSubscriptionSchema.safeParse({
      entityType: "",
      entityId: "class-1",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty entityId", () => {
    const result = notificationSubscriptionSchema.safeParse({
      entityType: "class",
      entityId: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateNotificationSubscriptionSchema", () => {
  it("accepts valid update", () => {
    const result = updateNotificationSubscriptionSchema.safeParse({
      subscriptionId: "sub-1",
      active: false,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty subscriptionId", () => {
    const result = updateNotificationSubscriptionSchema.safeParse({
      subscriptionId: "",
      active: false,
    })
    expect(result.success).toBe(false)
  })
})
