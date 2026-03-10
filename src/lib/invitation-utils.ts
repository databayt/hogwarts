// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Invitation lifecycle utilities.
 *
 * Centralizes expiry logic, token generation, and constants
 * used by membership invitation actions and cron jobs.
 */

import { randomUUID } from "crypto"

/** Number of days before an invitation expires */
export const INVITATION_EXPIRY_DAYS = 30

/** Maximum number of times an invitation can be resent */
export const MAX_RESEND_COUNT = 5

/** Number of days before expiry to send a reminder */
export const REMINDER_THRESHOLD_DAYS = 3

/** Minimum hours between reminder emails to avoid spamming */
export const REMINDER_COOLDOWN_HOURS = 24

/**
 * Generate a unique invitation token using crypto.randomUUID().
 */
export function generateInvitationToken(): string {
  return randomUUID()
}

/**
 * Calculate the expiry date from now, based on INVITATION_EXPIRY_DAYS.
 */
export function calculateExpiryDate(): Date {
  return new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Check if an invitation has expired.
 *
 * Returns false if expiresAt is null (no expiry set, treated as never-expiring
 * for backwards compatibility with older invitations).
 */
export function isInvitationExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  return new Date() > expiresAt
}

/**
 * Check if an invitation is expiring soon (within REMINDER_THRESHOLD_DAYS).
 */
export function isExpiringSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  const now = new Date()
  const thresholdDate = new Date(
    now.getTime() + REMINDER_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  )
  return expiresAt <= thresholdDate && expiresAt > now
}
