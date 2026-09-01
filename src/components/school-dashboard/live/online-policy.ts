// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Does this school teach online, over which back-end, and delivered how?"
//
// One place decides, because the answer is read from five very different
// places — the materialization cron, the timetable Join resolver, the
// teacher's Start button, the settings UI, and the link-coverage panel — and
// they must never disagree about whether a given slot is an online class.
//
// The policy is stored, the sessions are not: a term's timetable is a weekly
// PATTERN, so pre-creating a Conference row per slot per week would be
// thousands of guesses per term. Rows are materialized per school-calendar day
// instead (see `actions/materialize-day.ts`).
//
// ── Online is ADDITIVE, not a closure ────────────────────────────────────────
// Turning a class online does not send the building home. A school can be
// physically open and online on the same day, online on Sunday and in person
// on Monday, or online for one section and not another. Nothing here ever
// cancels a physical class — it only decides whether a live channel is opened
// alongside it. That is why there is no precedence contest between the three
// sources below: the window temporarily raises the school-wide DEFAULT, and an
// explicit per-section decision still wins over the default exactly as it did
// before, in both directions.
import "server-only"

import type {
  ConferenceOnlineMode,
  ConferenceProvider,
  SchoolDeliveryMode,
} from "@prisma/client"

import { db } from "@/lib/db"

import { DEFAULT_SCHOOL_TZ, isWithinSchoolDayRange } from "./day-window"
import { isLiveKitConfigured } from "./livekit/client"

/** Which of the three stored sources put this section online. */
export type OnlineSource = "off" | "school" | "section" | "window"

export type OnlinePolicy = {
  /** Is this section delivered as a live class at all? */
  online: boolean
  /**
   * The back-end to materialize with. Never `livekit` while the SFU is
   * unconfigured — see the degrade note on `effectivePolicy`.
   */
  provider: ConferenceProvider
  /**
   * True when the school asked for `livekit` but the SFU is not provisioned,
   * so `provider` was degraded to `external`. The settings UI surfaces this as
   * the same provisioning hint the create wizard already shows.
   */
  degraded: boolean
  /**
   * HOW the online classes are delivered — bound to the timetable, a loose
   * open room, or both. Meaningless when `online` is false; pinned to
   * `timetable` there so callers never branch on a stale mode.
   */
  mode: ConferenceOnlineMode
  /** Which stored source decided this. Drives UI copy and the sweep tally. */
  source: OnlineSource
  /** The admin's reason for a temporary window ("closed — flooding"). */
  note: string | null
}

export const OFFLINE_POLICY: OnlinePolicy = {
  online: false,
  provider: "external",
  degraded: false,
  mode: "timetable",
  source: "off",
  note: null,
}

/**
 * The School columns every policy decision reads. Exported so the call sites
 * that hand-roll a `select` (the materialization sweep) cannot drift from the
 * resolver and silently lose the window.
 */
export const ONLINE_POLICY_SELECT = {
  conferenceDeliveryMode: true,
  timezone: true,
  conferenceOnlineDefault: true,
  conferenceProviderDefault: true,
  conferenceOnlineFrom: true,
  conferenceOnlineUntil: true,
  conferenceOnlineNote: true,
  conferenceOnlineMode: true,
} as const

export type SchoolPolicyRow = {
  /** physical / online / hybrid — read FIRST; the other fields only matter in hybrid. */
  conferenceDeliveryMode: SchoolDeliveryMode
  timezone: string | null
  conferenceOnlineDefault: boolean
  conferenceProviderDefault: ConferenceProvider
  conferenceOnlineFrom: Date | null
  conferenceOnlineUntil: Date | null
  conferenceOnlineNote: string | null
  conferenceOnlineMode: ConferenceOnlineMode
}

/**
 * Is the school inside its temporary "go online" window on `date`?
 *
 * Split out because the settings UI and the sweep's candidate filter both need
 * the answer without resolving a whole policy.
 */
export function isOnlineWindowActive(
  school: Pick<
    SchoolPolicyRow,
    "timezone" | "conferenceOnlineFrom" | "conferenceOnlineUntil"
  > | null,
  date: Date = new Date()
): boolean {
  if (!school) return false
  return isWithinSchoolDayRange(
    school.timezone || DEFAULT_SCHOOL_TZ,
    date,
    school.conferenceOnlineFrom,
    school.conferenceOnlineUntil
  )
}

/**
 * Resolve the school's stored intent into an effective policy for one date.
 *
 * The union, spelled out:
 *
 *     online = sectionOverride ?? (schoolDefault || windowActive)
 *
 * The window sits INSIDE the inherit, not outside it. It is a temporary lift
 * of the school-wide default, so the tri-state rule survives verbatim: `null`
 * inherits, and an explicit per-section boolean still wins in both directions
 * — one section can be held back from a school that went online, and one
 * section can go online in a school that has not. An admin who wants a
 * held-back section online during a closure clears its override; that is the
 * same control they already have, not a new one.
 *
 * Degrade rule: a school may select `livekit` before the SFU exists (the six
 * infra gates in RUNBOOK.md are ops, not code). Rather than blocking the
 * setting or silently writing sessions against a dead back-end, the preference
 * is stored as-is and degraded to `external` on every read until
 * `isLiveKitConfigured()` flips — at which point the school is promoted with
 * no migration and no re-setup.
 */
export function effectivePolicy(
  school: SchoolPolicyRow | null,
  sectionOverride: boolean | null | undefined,
  date: Date = new Date(),
  /** The section's grade override (hybrid only): section ?? grade ?? school. */
  gradeOverride: boolean | null | undefined = null
): OnlinePolicy {
  if (!school) return OFFLINE_POLICY

  // The delivery mode decides first. `physical` means physical: no section
  // override and no window can put a class online. `online` means every
  // section is online, full stop. Only `hybrid` consults the school default,
  // the per-section overrides and the go-online window — so an inconsistent
  // pair (mode physical, default true, written by some other tool) is
  // harmless by construction.
  const mode = school.conferenceDeliveryMode
  if (mode === "physical") return OFFLINE_POLICY
  const windowActive = mode === "hybrid" && isOnlineWindowActive(school, date)
  const inherited =
    mode === "online" || school.conferenceOnlineDefault || windowActive
  const override = sectionOverride ?? gradeOverride ?? null
  const online = mode === "online" ? true : (override ?? inherited)
  if (!online) return OFFLINE_POLICY
  const source: OnlineSource =
    mode === "online"
      ? "school"
      : override === true
        ? "section"
        : school.conferenceOnlineDefault
          ? "school"
          : "window"

  const wantsLiveKit = school.conferenceProviderDefault === "livekit"
  const canLiveKit = wantsLiveKit && isLiveKitConfigured()
  return {
    online: true,
    provider: canLiveKit ? "livekit" : "external",
    degraded: wantsLiveKit && !canLiveKit,
    mode: school.conferenceOnlineMode,
    source,
    note: source === "window" ? school.conferenceOnlineNote : null,
  }
}

/**
 * Effective policy for one section (or for the school when `sectionId` is
 * null — an assembly has no section to inherit from).
 */
export async function resolveOnlinePolicy(
  schoolId: string,
  sectionId: string | null,
  date: Date = new Date()
): Promise<OnlinePolicy> {
  const [school, section] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: ONLINE_POLICY_SELECT,
    }),
    sectionId
      ? db.section.findFirst({
          where: { id: sectionId, schoolId },
          select: {
            conferenceOnline: true,
            grade: { select: { conferenceOnline: true } },
          },
        })
      : Promise.resolve(null),
  ])
  return effectivePolicy(
    school,
    section?.conferenceOnline,
    date,
    section?.grade?.conferenceOnline ?? null
  )
}

/**
 * Batched variant for the materialization cron and the timetable read path,
 * which resolve many sections of ONE school at once. Same rules as
 * `resolveOnlinePolicy`; one query for the school and one for the overrides,
 * never one pair per section.
 */
export async function resolveOnlinePolicies(
  schoolId: string,
  sectionIds: string[],
  date: Date = new Date()
): Promise<Map<string, OnlinePolicy>> {
  const out = new Map<string, OnlinePolicy>()
  if (sectionIds.length === 0) return out

  const unique = [...new Set(sectionIds)]
  const [school, sections] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: ONLINE_POLICY_SELECT,
    }),
    db.section.findMany({
      where: { id: { in: unique }, schoolId },
      select: {
        id: true,
        conferenceOnline: true,
        grade: { select: { conferenceOnline: true } },
      },
    }),
  ])

  const rows = new Map(sections.map((s) => [s.id, s]))
  for (const id of unique) {
    const row = rows.get(id)
    out.set(
      id,
      row
        ? effectivePolicy(
            school,
            row.conferenceOnline,
            date,
            row.grade?.conferenceOnline ?? null
          )
        : OFFLINE_POLICY
    )
  }
  return out
}

/** Does this mode materialize one session per timetable slot? */
export function deliversTimetable(mode: ConferenceOnlineMode): boolean {
  return mode === "timetable" || mode === "both"
}

/** Does this mode materialize a loose, all-day open room per section? */
export function deliversOpenRoom(mode: ConferenceOnlineMode): boolean {
  return mode === "open" || mode === "both"
}
