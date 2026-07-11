// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Application status machine — single source of truth shared by the server
 * action (`updateApplicationStatus`) and the client status menus, so the UI
 * never offers a transition the server rejects.
 *
 * ADMITTED is reachable ONLY via `confirmEnrollment`, never via the status
 * dropdowns, so it never appears as a target here.
 */

/** Statuses settable through `updateApplicationStatus` (targets). */
export const VALID_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ENTRANCE_SCHEDULED",
  "INTERVIEW_SCHEDULED",
  "SHORTLISTED",
  "SELECTED",
  "WAITLISTED",
  "REJECTED",
  "WITHDRAWN",
] as const

/**
 * Allowed status transitions. Keys are the CURRENT status; values are the
 * statuses it may move to. The terminal states (REJECTED, WITHDRAWN, ADMITTED)
 * have NO outgoing edges — this is what stops a rejected/withdrawn applicant
 * being flipped back to SELECTED to silently re-issue an offer.
 */
export const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"],
  SUBMITTED: [
    "UNDER_REVIEW",
    "SHORTLISTED",
    "WAITLISTED",
    "REJECTED",
    "WITHDRAWN",
    "ENTRANCE_SCHEDULED",
    "INTERVIEW_SCHEDULED",
  ],
  UNDER_REVIEW: [
    "SHORTLISTED",
    "WAITLISTED",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
    "ENTRANCE_SCHEDULED",
    "INTERVIEW_SCHEDULED",
  ],
  ENTRANCE_SCHEDULED: [
    "INTERVIEW_SCHEDULED",
    "SHORTLISTED",
    "WAITLISTED",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
  ],
  INTERVIEW_SCHEDULED: [
    "SHORTLISTED",
    "WAITLISTED",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
  ],
  SHORTLISTED: ["SELECTED", "WAITLISTED", "REJECTED", "WITHDRAWN"],
  WAITLISTED: ["SELECTED", "SHORTLISTED", "REJECTED", "WITHDRAWN"],
  SELECTED: ["WAITLISTED", "REJECTED", "WITHDRAWN"],
  REJECTED: [],
  WITHDRAWN: [],
  ADMITTED: [],
}

/** Transitions available from `current` (empty for terminal/unknown states). */
export function getAllowedTransitions(current: string): readonly string[] {
  return ALLOWED_TRANSITIONS[current] ?? []
}

/** True when `status` is a status settable via `updateApplicationStatus`. */
export function isValidTargetStatus(status: string): boolean {
  return (VALID_STATUSES as readonly string[]).includes(status)
}

/** True when moving `from` → `to` is a permitted transition. */
export function isTransitionAllowed(from: string, to: string): boolean {
  return getAllowedTransitions(from).includes(to)
}
