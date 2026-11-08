"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Conference settings — per-school capacity + retention knobs stored on the
// School row (conferenceRetentionDays / conferenceMaxConcurrent /
// conferenceMaxDuration / conferenceRecordingDefault). ADMIN/DEVELOPER only.
import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
  schoolDayOfWeek,
  schoolDayToInstant,
} from "@/components/school-dashboard/live/day-window"
import {
  isLiveKitConfigured,
  isRecordingConfigured,
} from "@/components/school-dashboard/live/livekit/client"
import {
  isOnlineWindowActive,
  resolveOnlinePolicies,
} from "@/components/school-dashboard/live/online-policy"
import {
  deliveryModeSchema,
  liveClassSettingsSchema,
} from "@/components/school-dashboard/live/validation"

import { computeLiveLinkCoverage } from "../link-coverage"
import {
  liveListRevalidatePaths,
  liveRevalidatePath,
  requireContext,
} from "./helpers"
import { materializeSchoolDay } from "./materialize-day"

const SETTINGS_SELECT = {
  conferenceDeliveryMode: true,
  conferenceRecordingConsentNote: true,
  conferenceAutoPublishRecordings: true,
  conferenceGuardiansObserve: true,
  conferenceStudentsJoinMuted: true,
  conferenceToolChat: true,
  conferenceToolHands: true,
  conferenceToolPolls: true,
  conferenceToolWhiteboard: true,
  conferenceToolStudentShare: true,
  conferenceReminderLeadMinutes: true,
  conferenceLateGraceMinutes: true,
  conferenceMinPresenceMinutes: true,
  conferenceEarlyLeaveMinutes: true,
  conferenceRetentionDays: true,
  conferenceMaxConcurrent: true,
  conferenceMaxDuration: true,
  conferenceRecordingDefault: true,
  conferenceAttendanceSync: true,
  conferenceOnlineDefault: true,
  conferenceProviderDefault: true,
  conferenceOnlineMode: true,
  conferenceOnlineFrom: true,
  conferenceOnlineUntil: true,
  conferenceOnlineNote: true,
  conferenceFallbackUrl: true,
} as const

export async function getLiveSettings() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const school = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: { ...SETTINGS_SELECT, timezone: true },
  })
  if (!school) return actionError(ACTION_ERRORS.NOT_FOUND)
  const tz = school.timezone || DEFAULT_SCHOOL_TZ
  return {
    success: true as const,
    data: {
      ...school,
      // The form edits calendar DAYS, so hand it days — formatted in the
      // school's zone, which is the only zone in which the stored instant
      // means what the admin typed.
      conferenceOnlineFrom: schoolDayOfInstant(tz, school.conferenceOnlineFrom),
      conferenceOnlineUntil: schoolDayOfInstant(
        tz,
        school.conferenceOnlineUntil
      ),
      // Whether the stored window is in force TODAY, resolved in the school's
      // own timezone. The form cannot work this out client-side: the browser
      // is in the reader's zone, not the school's.
      windowActive: isOnlineWindowActive(school),
      // The stored preference is what the form edits; `livekitReady` tells the
      // UI whether that preference is currently in force or degraded to
      // external, so it can show the same provisioning hint the create wizard
      // shows instead of silently pretending the SFU is live.
      livekitReady: isLiveKitConfigured(),
      // Same idea for recording: the default is stored as chosen, but an
      // admin turning it on must see that no bucket exists to honour it.
      recordingReady: isRecordingConfigured(),
    },
  }
}

export async function updateLiveSettings(input: unknown) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response

  const parsed = liveClassSettingsSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const school = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  })

  const tz = school?.timezone || DEFAULT_SCHOOL_TZ
  // An empty string is the admin CLEARING a field, not a value to store — for
  // the fallback URL and for both ends of the window. Clearing `from` clears
  // the whole window, which is how a school comes back off the emergency
  // switch: there is no separate "cancel closure" verb to forget to call.
  const from = parsed.data.conferenceOnlineFrom
    ? schoolDayToInstant(tz, parsed.data.conferenceOnlineFrom)
    : null
  const until =
    from && parsed.data.conferenceOnlineUntil
      ? schoolDayToInstant(tz, parsed.data.conferenceOnlineUntil)
      : null

  // The delivery mode is the source of truth; the legacy school switch and
  // the window are DERIVED from it here so the stored row never says two
  // things. `physical` clears the window (through the same timezone path as
  // any other save); `online` forces the default on; `hybrid` keeps what the
  // admin chose. Today's already-materialized sessions are untouched — the
  // end-stale cron settles them, and the form says so.
  const mode = parsed.data.conferenceDeliveryMode
  const physical = mode === "physical"
  const onlineDefault =
    mode === "online"
      ? true
      : physical
        ? false
        : (parsed.data.conferenceOnlineDefault ?? undefined)
  const data = {
    ...parsed.data,
    conferenceOnlineDefault: onlineDefault,
    conferenceRecordingConsentNote:
      parsed.data.conferenceRecordingConsentNote?.trim() || null,
    conferenceFallbackUrl: parsed.data.conferenceFallbackUrl || null,
    conferenceOnlineFrom: physical ? null : from,
    conferenceOnlineUntil: physical ? null : until,
    conferenceOnlineNote:
      !physical && from ? parsed.data.conferenceOnlineNote || null : null,
  }

  try {
    await db.school.update({ where: { id: ctx.schoolId }, data })
  } catch {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }

  // Make the flip take effect NOW rather than at the next */15 tick. An
  // emergency is exactly the moment a 15-minute wait is unacceptable: an admin
  // who closes the school because of a storm expects today's classes to become
  // joinable while they are still looking at the page.
  //
  // `after()`, never a bare `void` — on a serverless runtime an unawaited
  // promise is not guaranteed to run once the response is sent. Best-effort by
  // design: the cron re-runs the same idempotent sweep, so a failure here
  // costs latency, never correctness.
  const schoolId = ctx.schoolId
  if (
    !physical &&
    (data.conferenceOnlineDefault ||
      isOnlineWindowActive({
        timezone: tz,
        conferenceOnlineFrom: data.conferenceOnlineFrom,
        conferenceOnlineUntil: data.conferenceOnlineUntil,
      }))
  ) {
    after(async () => {
      try {
        await materializeSchoolDay(schoolId)
      } catch (err) {
        console.error("[conference] settings-save materialization failed", {
          schoolId,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  revalidatePath(liveRevalidatePath("settings"), "page")
  for (const path of liveListRevalidatePaths()) {
    revalidatePath(path, "page")
  }
  return { success: true as const, data }
}

/**
 * The school's TEACHING MODE alone — in person / online / hybrid — for the
 * school configuration hub's own section. `updateLiveSettings` is a whole-form
 * save (an omitted window field CLEARS the window), so a one-control page must
 * not call it. Derives the legacy switch and the window exactly as it does:
 * `physical` turns the default off and clears the window, `online` forces the
 * default on, `hybrid` leaves both as the admin set them.
 */
export async function updateDeliveryMode(input: unknown) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response

  const parsed = deliveryModeSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  const mode = parsed.data.mode

  // The mode it is switching FROM: a school coming online for the first time
  // starts with recording off (below).
  const before = await db.school.findUnique({
    where: { id: ctx.schoolId },
    select: { conferenceDeliveryMode: true },
  })
  const comingOnline =
    mode !== "physical" &&
    (before?.conferenceDeliveryMode ?? "physical") === "physical"

  // In-app rooms for every online class, online OR hybrid (D-2026-11-08:
  // LiveKit for everyone). With the `external` default every slot needs a
  // pasted link and is skipped `no_link` without one — "Live" produced no
  // classes. A school that later chooses external on the live-class settings
  // page keeps that choice until it switches the teaching mode again.
  const liveDefaults = {
    ...(isLiveKitConfigured()
      ? { conferenceProviderDefault: "livekit" as const }
      : {}),
    // Recording starts OFF for a school coming online: every slot recorded is
    // egress minutes billed on the LiveKit plan plus S3 storage — at a fully
    // online school's volume the single largest line — and recording pupils
    // is a decision the school should take on purpose, on the live-class
    // settings page, not inherit from a column default.
    ...(comingOnline
      ? {
          conferenceRecordingDefault: false,
          // And the register follows the room: an online class's attendance
          // is written from who was actually in it (`attendance-sync`, with
          // its presence floor), instead of a teacher re-typing it after
          // every period — the hourly reminder cron leaves those classes
          // alone for the same reason.
          conferenceAttendanceSync: true,
        }
      : {}),
  }

  const data =
    mode === "physical"
      ? {
          conferenceDeliveryMode: mode,
          conferenceOnlineDefault: false,
          conferenceOnlineFrom: null,
          conferenceOnlineUntil: null,
          conferenceOnlineNote: null,
        }
      : mode === "online"
        ? {
            conferenceDeliveryMode: mode,
            conferenceOnlineDefault: true,
            ...liveDefaults,
          }
        : { conferenceDeliveryMode: mode, ...liveDefaults }

  try {
    await db.school.update({
      where: { id: ctx.schoolId },
      data,
      select: { id: true },
    })
  } catch {
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }

  // Same reasoning as updateLiveSettings: an online flip should make today's
  // classes joinable now, not at the next */15 tick.
  if (mode !== "physical") {
    const schoolId = ctx.schoolId
    after(async () => {
      try {
        await materializeSchoolDay(schoolId)
      } catch (err) {
        console.error("[conference] delivery-mode materialization failed", {
          schoolId,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    })
  }

  revalidatePath("/[lang]/s/[subdomain]/school/configuration", "layout")
  revalidatePath("/[lang]/s/[subdomain]/timetable", "layout")
  revalidatePath(liveRevalidatePath("settings"), "page")
  for (const path of liveListRevalidatePaths()) {
    revalidatePath(path, "page")
  }

  // What the switch did, in one number the admin can check: how many of
  // TODAY's classes are now online. Best-effort — a failed count must not
  // turn a saved setting into an error.
  let onlineToday: number | null = null
  if (mode !== "physical") {
    try {
      onlineToday = await countOnlineSlotsToday(ctx.schoolId)
    } catch {
      onlineToday = null
    }
  }
  return { success: true as const, data: { onlineToday } }
}

/**
 * Today's teaching slots (active term, school-calendar day, not a break, with
 * a section and a teacher — the sweep's own filter) whose section is online.
 */
async function countOnlineSlotsToday(schoolId: string): Promise<number> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true },
  })
  const tz = school?.timezone || DEFAULT_SCHOOL_TZ
  const { term } = await resolveActiveTerm(schoolId)
  if (!term) return 0
  const now = new Date()
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: term.id,
      dayOfWeek: schoolDayOfWeek(tz, now),
      weekOffset: 0,
      sectionId: { not: null },
      teacherId: { not: null },
      period: { isBreak: false },
    },
    select: { sectionId: true },
  })
  const sectionIds = slots
    .map((s) => s.sectionId)
    .filter((id): id is string => !!id)
  if (sectionIds.length === 0) return 0
  const policies = await resolveOnlinePolicies(schoolId, sectionIds, now)
  return sectionIds.filter((id) => policies.get(id)?.online).length
}

/**
 * Sections + their per-section conference policy (recording opt-out AND the
 * online override). ADMIN/DEVELOPER only.
 */
export async function listSectionRecordingPolicy() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const sections = await db.section.findMany({
    where: { schoolId: ctx.schoolId },
    select: {
      id: true,
      name: true,
      conferenceRecordingOptOut: true,
      conferenceOnline: true,
    },
    orderBy: { name: "asc" },
    // A school has tens of sections, not thousands — but an unbounded findMany
    // on a settings page is a standing invitation for a pathological tenant.
    take: 500,
  })
  return { success: true as const, data: sections }
}

/**
 * Set (or clear) a section's online override.
 *
 * `null` means "inherit the school-wide switch" — the tri-state is the point:
 * once a school flips itself online, an explicit per-section `false` is the
 * only way to hold one section back, and it must stay distinguishable from
 * "never decided".
 */
/**
 * Materialize today inline after a per-section / per-grade flip to ONLINE, so
 * the classes become joinable while the admin is still on the page instead of
 * at the next 15-minute cron tick. Same `after()` + best-effort contract as the school-
 * wide save above; the cron re-runs the same idempotent sweep either way.
 * Flipping to inherit/offline needs nothing: online is additive and existing
 * sessions are left to run.
 */
function materializeTodayAfterResponse(schoolId: string): void {
  after(async () => {
    try {
      await materializeSchoolDay(schoolId)
    } catch (err) {
      console.error("[conference] override-save materialization failed", {
        schoolId,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  })
}

export async function setSectionOnline(
  sectionId: string,
  online: boolean | null
) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  if (!sectionId) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const result = await db.section.updateMany({
    where: { id: sectionId, schoolId: ctx.schoolId },
    data: { conferenceOnline: online },
  })
  if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)
  if (online === true) materializeTodayAfterResponse(ctx.schoolId)

  revalidatePath(liveRevalidatePath("settings"), "page")
  return { success: true as const, data: { sectionId, online } }
}

/** Toggle a section's recording opt-out. Tenant-scoped write. */
export async function setSectionRecordingOptOut(
  sectionId: string,
  optOut: boolean
) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  if (!sectionId) return actionError(ACTION_ERRORS.VALIDATION_ERROR)

  const result = await db.section.updateMany({
    where: { id: sectionId, schoolId: ctx.schoolId },
    data: { conferenceRecordingOptOut: optOut },
  })
  if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)

  revalidatePath(liveRevalidatePath("settings"), "page")
  return { success: true as const, data: { sectionId, optOut } }
}

/**
 * How much of the active term's timetable can actually be joined online.
 *
 * The question this answers is the one an admin has minutes to answer in an
 * emergency: "if I flip the switch right now, does every class get a room?"
 * For the external provider — which is what every school gets until the SFU is
 * provisioned — a slot is only materializable when it has a meeting URL, and
 * the URL comes from a per-(section, subject) `ConferenceLink` or, failing
 * that, the school's standing fallback. Without either, the sweep skips the
 * pair with `no_link` and the only trace is a cron log. This surfaces it.
 *
 * Distinct pairs, not slots: a subject taught five times a week to one section
 * needs ONE link, so counting slots would make coverage look far worse than it
 * is.
 */
export async function getLiveLinkCoverage() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  return computeLiveLinkCoverage(ctx.schoolId)
}

/**
 * Grades + their per-grade online override (hybrid mode). Sits between the
 * school default and the per-section override: section ?? grade ?? school.
 */
export async function listGradeOnlinePolicy() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  const grades = await db.academicGrade.findMany({
    where: { schoolId: ctx.schoolId },
    select: { id: true, name: true, conferenceOnline: true },
    orderBy: { name: "asc" },
    take: 100,
  })
  return { success: true as const, data: grades }
}

export async function setGradeOnline(gradeId: string, online: boolean | null) {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response
  if (!gradeId) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  const result = await db.academicGrade.updateMany({
    where: { id: gradeId, schoolId: ctx.schoolId },
    data: { conferenceOnline: online },
  })
  if (result.count === 0) return actionError(ACTION_ERRORS.NOT_FOUND)
  if (online === true) materializeTodayAfterResponse(ctx.schoolId)
  revalidatePath(liveRevalidatePath("settings"), "page")
  return { success: true as const, data: { gradeId, online } }
}
