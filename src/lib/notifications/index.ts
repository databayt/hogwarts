// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Notifications Module
 *
 * Unified notification system supporting multiple channels:
 * - In-app notifications (always available)
 * - Email notifications (always available)
 * - SMS notifications (requires Twilio configuration)
 * - Push notifications (requires additional setup)
 */
export * from "./sms"

// Re-export types
export type { SMSOptions, SMSResult, NotificationChannel } from "./sms"
