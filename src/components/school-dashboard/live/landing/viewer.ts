// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { LandingSession, LandingViewer } from "./types"

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
 * A student's rows are all their own section, so the section is the one label
 * that would read the same on every card they are shown.
 */
const OWN_SECTION_ROLES = ["STUDENT"]

/**
 * Everything the page needs to know about the reader, resolved once.
 *
 * Kept here rather than inline in the route file so it can be tested, and so
 * the five role lists live in one place instead of being restated per surface
 * — the hygiene item `ISSUE.md` raises about this block's route files.
 *
 * `teachesEveryRow` says the strip was actually narrowed to this reader's own
 * classes — the teacher filter on the page. It is passed in rather than read
 * off the role because that narrowing can FAIL to apply: a TEACHER account
 * with no `Teacher` row falls through to the whole-school scope, and a card
 * that then dropped the teacher's name would be hiding whose class it is.
 * Default false, so the page must have proved the narrowing before a card
 * leaves anything out.
 */
export function resolveLandingViewer(
  role: string,
  opts: { teachesEveryRow?: boolean } = {}
): LandingViewer {
  return {
    role,
    canSchedule: SCHEDULE_ROLES.includes(role),
    canConfigure: CONFIGURE_ROLES.includes(role),
    isHost: HOST_ROLES.includes(role),
    canJoin: JOIN_ROLES.includes(role),
    canViewRecordings: RECORDING_ROLES.includes(role),
    showsTeacher: !opts.teachesEveryRow,
    showsSection: !OWN_SECTION_ROLES.includes(role),
  }
}

/**
 * Where a class sits, in the words this reader needs — the badge beside a
 * card's heading.
 *
 * `Section.name` is "Grade 7-A", the grade INCLUDING the class letter, so
 * printing both is printing the grade twice. A reader who spans sections gets
 * the section; a student, whose rows are all one section, gets the grade.
 *
 * Lives here rather than in a card so the strip's row and the catch-up shelf's
 * card cannot disagree about it.
 */
export function rowContext(
  session: Pick<LandingSession, "sectionName" | "gradeName">,
  viewer: Pick<LandingViewer, "showsSection">
): string | null {
  return viewer.showsSection
    ? (session.sectionName ?? session.gradeName)
    : (session.gradeName ?? session.sectionName)
}
