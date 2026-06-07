// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  CHANNEL_CONFIG,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_QUIET_HOURS,
  DIGEST_FREQUENCY_OPTIONS,
  NOTIFICATION_BELL_MAX_DISPLAY,
  NOTIFICATION_EXPIRATION,
  NOTIFICATION_FILTER_TYPES,
  NOTIFICATION_TYPE_CONFIG,
  NOTIFICATIONS_PER_PAGE,
  PRIORITY_CONFIG,
  SOCKET_EVENTS,
} from "@/components/school-dashboard/notifications/config"

// All NotificationType enum values from Prisma schema
// Source: prisma/models/notifications.prisma > enum NotificationType
const ALL_NOTIFICATION_TYPES = [
  "message",
  "message_mention",
  "assignment_created",
  "assignment_due",
  "assignment_graded",
  "grade_posted",
  "attendance_marked",
  "attendance_alert",
  "absence_intention",
  "absence_intention_decision",
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
  "setup_guide",
  "absence_unreported_followup",
  "live_class_scheduled",
  "live_class_starting_soon",
  "live_class_started",
  "live_class_cancelled",
  "live_class_recording_ready",
] as const

// All 4 NotificationPriority enum values
const ALL_PRIORITIES = ["low", "normal", "high", "urgent"] as const

// All 5 NotificationChannel enum values
// Source: prisma/models/notifications.prisma > enum NotificationChannel
const ALL_CHANNELS = ["in_app", "email", "push", "sms", "whatsapp"] as const

// ============================================================================
// NOTIFICATION_TYPE_CONFIG
// ============================================================================

describe("NOTIFICATION_TYPE_CONFIG", () => {
  it("has entries for all 24 NotificationType values", () => {
    for (const type of ALL_NOTIFICATION_TYPES) {
      expect(NOTIFICATION_TYPE_CONFIG).toHaveProperty(type)
    }
  })

  it("has no extra entries beyond the enum", () => {
    const configKeys = Object.keys(NOTIFICATION_TYPE_CONFIG)
    expect(configKeys.length).toBe(ALL_NOTIFICATION_TYPES.length)
  })

  it("every entry has icon and requiresAction", () => {
    for (const type of ALL_NOTIFICATION_TYPES) {
      const config = NOTIFICATION_TYPE_CONFIG[type]
      expect(config.icon).toBeDefined()
      expect(typeof config.requiresAction).toBe("boolean")
    }
  })
})

// ============================================================================
// PRIORITY_CONFIG
// ============================================================================

describe("PRIORITY_CONFIG", () => {
  it("has entries for all 4 NotificationPriority values", () => {
    for (const priority of ALL_PRIORITIES) {
      expect(PRIORITY_CONFIG).toHaveProperty(priority)
    }
  })

  it("has no extra entries beyond the enum", () => {
    expect(Object.keys(PRIORITY_CONFIG).length).toBe(ALL_PRIORITIES.length)
  })

  it("every entry has a valid badgeVariant", () => {
    const validVariants = ["default", "secondary", "destructive", "outline"]
    for (const priority of ALL_PRIORITIES) {
      expect(validVariants).toContain(PRIORITY_CONFIG[priority].badgeVariant)
    }
  })

  it("urgent priority uses destructive variant", () => {
    expect(PRIORITY_CONFIG.urgent.badgeVariant).toBe("destructive")
  })
})

// ============================================================================
// CHANNEL_CONFIG
// ============================================================================

describe("CHANNEL_CONFIG", () => {
  it("has entries for all 5 NotificationChannel values", () => {
    for (const channel of ALL_CHANNELS) {
      expect(CHANNEL_CONFIG).toHaveProperty(channel)
    }
  })

  it("has no extra entries beyond the enum", () => {
    expect(Object.keys(CHANNEL_CONFIG).length).toBe(ALL_CHANNELS.length)
  })

  it("in_app and email are enabled", () => {
    expect(CHANNEL_CONFIG.in_app.enabled).toBe(true)
    expect(CHANNEL_CONFIG.email.enabled).toBe(true)
  })

  it("push, sms, whatsapp are not yet enabled", () => {
    expect(CHANNEL_CONFIG.push.enabled).toBe(false)
    expect(CHANNEL_CONFIG.sms.enabled).toBe(false)
    expect(CHANNEL_CONFIG.whatsapp.enabled).toBe(false)
  })
})

// ============================================================================
// NOTIFICATION_EXPIRATION
// ============================================================================

describe("NOTIFICATION_EXPIRATION", () => {
  it("has entries for all 24 NotificationType values", () => {
    for (const type of ALL_NOTIFICATION_TYPES) {
      expect(NOTIFICATION_EXPIRATION).toHaveProperty(type)
    }
  })

  it("has no extra entries beyond the enum", () => {
    expect(Object.keys(NOTIFICATION_EXPIRATION).length).toBe(
      ALL_NOTIFICATION_TYPES.length
    )
  })

  it("every entry is a positive number or null", () => {
    for (const type of ALL_NOTIFICATION_TYPES) {
      const value = NOTIFICATION_EXPIRATION[type]
      expect(value === null || (typeof value === "number" && value > 0)).toBe(
        true
      )
    }
  })

  it("password_reset has shortest expiration (1 day)", () => {
    expect(NOTIFICATION_EXPIRATION.password_reset).toBe(1)
  })

  it("grade_posted has long retention (90 days)", () => {
    expect(NOTIFICATION_EXPIRATION.grade_posted).toBe(90)
  })
})

// ============================================================================
// DEFAULT_NOTIFICATION_PREFERENCES
// ============================================================================

describe("DEFAULT_NOTIFICATION_PREFERENCES", () => {
  const roles = [
    "ADMIN",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
    "ACCOUNTANT",
    "STAFF",
  ]

  it("has defaults for main school roles", () => {
    for (const role of roles) {
      expect(DEFAULT_NOTIFICATION_PREFERENCES).toHaveProperty(role)
    }
  })

  it("every role has all 4 channel defaults", () => {
    for (const role of roles) {
      const prefs = DEFAULT_NOTIFICATION_PREFERENCES[role]
      for (const channel of ALL_CHANNELS) {
        expect(typeof prefs[channel]).toBe("boolean")
      }
    }
  })

  it("all roles have in_app enabled by default", () => {
    for (const role of roles) {
      expect(DEFAULT_NOTIFICATION_PREFERENCES[role].in_app).toBe(true)
    }
  })

  it("push, sms, whatsapp disabled for all roles", () => {
    for (const role of roles) {
      expect(DEFAULT_NOTIFICATION_PREFERENCES[role].push).toBe(false)
      expect(DEFAULT_NOTIFICATION_PREFERENCES[role].sms).toBe(false)
      expect(DEFAULT_NOTIFICATION_PREFERENCES[role].whatsapp).toBe(false)
    }
  })
})

// ============================================================================
// Constants
// ============================================================================

describe("Constants", () => {
  it("NOTIFICATIONS_PER_PAGE is positive", () => {
    expect(NOTIFICATIONS_PER_PAGE).toBeGreaterThan(0)
  })

  it("NOTIFICATION_BELL_MAX_DISPLAY is positive", () => {
    expect(NOTIFICATION_BELL_MAX_DISPLAY).toBeGreaterThan(0)
  })

  it("DEFAULT_QUIET_HOURS has valid hour range", () => {
    expect(DEFAULT_QUIET_HOURS.start).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_QUIET_HOURS.start).toBeLessThanOrEqual(23)
    expect(DEFAULT_QUIET_HOURS.end).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_QUIET_HOURS.end).toBeLessThanOrEqual(23)
  })

  it("DIGEST_FREQUENCY_OPTIONS includes daily and weekly", () => {
    expect(DIGEST_FREQUENCY_OPTIONS).toContain("daily")
    expect(DIGEST_FREQUENCY_OPTIONS).toContain("weekly")
  })

  it("SOCKET_EVENTS has all required event names", () => {
    expect(SOCKET_EVENTS.NEW_NOTIFICATION).toBeDefined()
    expect(SOCKET_EVENTS.NOTIFICATION_READ).toBeDefined()
    expect(SOCKET_EVENTS.NOTIFICATION_DELETED).toBeDefined()
    expect(SOCKET_EVENTS.NOTIFICATION_COUNT).toBeDefined()
    expect(SOCKET_EVENTS.MARK_READ).toBeDefined()
    expect(SOCKET_EVENTS.MARK_ALL_READ).toBeDefined()
    expect(SOCKET_EVENTS.SUBSCRIBE).toBeDefined()
    expect(SOCKET_EVENTS.UNSUBSCRIBE).toBeDefined()
  })

  it("NOTIFICATION_FILTER_TYPES includes all and unread", () => {
    expect(NOTIFICATION_FILTER_TYPES).toContain("all")
    expect(NOTIFICATION_FILTER_TYPES).toContain("unread")
  })
})
