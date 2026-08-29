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
  schoolDayToInstant,
} from "@/components/school-dashboard/conference/day-window"
import {
  isLiveKitConfigured,
  isRecordingConfigured,
} from "@/components/school-dashboard/conference/livekit/client"
import {
  isOnlineWindowActive,
  ONLINE_POLICY_SELECT,
} from "@/components/school-dashboard/conference/online-policy"
import { liveClassSettingsSchema } from "@/components/school-dashboard/conference/validation"

import {
  conferenceListRevalidatePaths,
  conferenceRevalidatePath,
  requireContext,
} from "./helpers"
import { materializeSchoolDay } from "./materialize-day"

const SETTINGS_SELECT = {
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

export async function getConferenceSettings() {
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

export async function updateConferenceSettings(input: unknown) {
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

  const data = {
    ...parsed.data,
    conferenceFallbackUrl: parsed.data.conferenceFallbackUrl || null,
    conferenceOnlineFrom: from,
    conferenceOnlineUntil: until,
    conferenceOnlineNote: from
      ? parsed.data.conferenceOnlineNote || null
      : null,
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
    data.conferenceOnlineDefault ||
    isOnlineWindowActive({
      timezone: tz,
      conferenceOnlineFrom: from,
      conferenceOnlineUntil: until,
    })
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

  revalidatePath(conferenceRevalidatePath("settings"), "page")
  for (const path of conferenceListRevalidatePaths()) {
    revalidatePath(path, "page")
  }
  return { success: true as const, data }
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

  revalidatePath(conferenceRevalidatePath("settings"), "page")
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

  revalidatePath(conferenceRevalidatePath("settings"), "page")
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
export async function getConferenceLinkCoverage() {
  const ctx = await requireContext("manage_settings")
  if (!ctx.ok) return ctx.response

  const [school, { term }] = await Promise.all([
    db.school.findUnique({
      where: { id: ctx.schoolId },
      select: { ...ONLINE_POLICY_SELECT, conferenceFallbackUrl: true },
    }),
    resolveActiveTerm(ctx.schoolId),
  ])
  if (!term) {
    return {
      success: true as const,
      data: {
        total: 0,
        covered: 0,
        gaps: [] as Array<{ section: string; subject: string }>,
        gapCount: 0,
        hasFallback: Boolean(school?.conferenceFallbackUrl),
        truncated: false,
      },
    }
  }

  const [slots, links] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId: ctx.schoolId,
        termId: term.id,
        weekOffset: 0,
        sectionId: { not: null },
        subjectId: { not: null },
        teacherId: { not: null },
        period: { isBreak: false },
      },
      select: {
        sectionId: true,
        subjectId: true,
        section: { select: { name: true } },
        subject: { select: { name: true } },
      },
      // A week of slots for a large school. Enough to enumerate every distinct
      // pair; flagged rather than silently truncated if a tenant exceeds it.
      take: 2001,
    }),
    db.conferenceLink.findMany({
      where: { schoolId: ctx.schoolId, termId: term.id },
      select: { sectionId: true, subjectId: true },
    }),
  ])

  const truncated = slots.length > 2000
  const linked = new Set(links.map((l) => `${l.sectionId}:${l.subjectId}`))

  const pairs = new Map<
    string,
    { sectionId: string; subjectId: string; section: string; subject: string }
  >()
  for (const s of slots.slice(0, 2000)) {
    if (!s.sectionId || !s.subjectId) continue
    const key = `${s.sectionId}:${s.subjectId}`
    if (pairs.has(key)) continue
    pairs.set(key, {
      sectionId: s.sectionId,
      subjectId: s.subjectId,
      section: s.section?.name ?? "",
      subject: s.subject?.name ?? "",
    })
  }

  const gaps = [...pairs.entries()]
    .filter(([key]) => !linked.has(key))
    .map(([, v]) => v)
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section) || a.subject.localeCompare(b.subject)
    )

  return {
    success: true as const,
    data: {
      total: pairs.size,
      covered: pairs.size - gaps.length,
      // Bounded: the panel names the first gaps and counts the rest, so a
      // school with 400 uncovered pairs doesn't ship 400 rows to the client.
      gaps: gaps.slice(0, 50),
      gapCount: gaps.length,
      // With a fallback set, an uncovered pair is still joinable (on a SHARED
      // room). Without one, it materializes nothing at all.
      hasFallback: Boolean(school?.conferenceFallbackUrl),
      truncated,
    },
  }
}
