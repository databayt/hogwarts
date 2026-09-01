// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LandingViewer } from "./types"

/**
 * Who may open /live at all. Everyone else is redirected to the dashboard.
 */
export const LANDING_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "ACCOUNTANT",
] as const

const SCHEDULE_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]
const CONFIGURE_ROLES = ["DEVELOPER", "ADMIN"]
const HOST_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]

/**
 * ACCOUNTANT is the awkward one, and deliberately so.
 *
 * It passes `read_school_dashboard` and `resolveViewerSectionScope` hands it
 * the whole school, so it can LIST every session — but `authorization.ts`
 * grants it neither a join role nor `view_recordings`, and `SESSION_STAFF_ROLES`
 * in `actions/helpers.ts` leaves it out. The permission layer is right; the old
 * landing page just ignored it and offered a "Join now" button that would have
 * been refused. These two lists keep the page honest about it.
 */
const JOIN_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
]
const RECORDING_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
]

/** Is this role allowed on the landing page at all. */
export function canOpenLanding(role: string): boolean {
  return (LANDING_ROLES as readonly string[]).includes(role)
}

/**
 * Everything the page needs to know about the reader, resolved once.
 *
 * Kept here rather than inline in the route file so it can be tested, and so
 * the five role lists live in one place instead of being restated per surface
 * — the hygiene item `ISSUE.md` raises about this block's route files.
 */
export function resolveLandingViewer(role: string): LandingViewer {
  return {
    role,
    canSchedule: SCHEDULE_ROLES.includes(role),
    canConfigure: CONFIGURE_ROLES.includes(role),
    isHost: HOST_ROLES.includes(role),
    canJoin: JOIN_ROLES.includes(role),
    canViewRecordings: RECORDING_ROLES.includes(role),
  }
}
