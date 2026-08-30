// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

import {
  LIVE_CLASS_ONLINE_MODE_VALUES,
  LIVE_CLASS_PROVIDER_VALUES,
} from "./list-validation"

export const SCHOOL_DELIVERY_MODE_VALUES = [
  "physical",
  "online",
  "hybrid",
] as const

// ============================================================================
// Enums (mirror Prisma enums)
// ============================================================================

export const liveClassStatusEnum = z.enum([
  "scheduled",
  "live",
  "ended",
  "cancelled",
  "failed",
])
export type ConferenceStatusInput = z.infer<typeof liveClassStatusEnum>

export const conferenceParticipantRoleEnum = z.enum([
  "HOST",
  "CO_HOST",
  "PARTICIPANT",
  "OBSERVER",
])
export type ConferenceParticipantRoleInput = z.infer<
  typeof conferenceParticipantRoleEnum
>

// ============================================================================
// Shared shapes
// ============================================================================

const idSchema = z.string().min(1)
/** A calendar day as the native date input emits it. `""` means "not set". */
const DAY_STRING = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
])
const MAX_DURATION_MIN = 240 // hard ceiling; per-school override clamps below
const MAX_PARTICIPANTS_HARD = 300

// ============================================================================
// i18n-aware factory schemas (client-side)
// ============================================================================

export function createLiveClassScheduleSchema(v: ValidationHelper) {
  return z
    .object({
      title: z.string().min(1, v.required()).max(255, v.maxLength(255)),
      description: z.string().max(2000, v.maxLength(2000)).optional(),
      lang: z.string().min(2).max(8).default("ar"),
      timetableId: idSchema.optional(),
      sectionId: idSchema.optional(),
      subjectId: idSchema.optional(),
      scheduledStart: z.string().datetime(),
      scheduledEnd: z.string().datetime(),
      recordingEnabled: z.boolean().default(true),
      visibility: z.enum(["section", "school"]).default("section"),
      catalogLessonId: idSchema.optional(),
      maxParticipants: z
        .number()
        .int()
        .min(1, v.positive())
        .max(MAX_PARTICIPANTS_HARD, v.max(MAX_PARTICIPANTS_HARD))
        .default(50),
    })
    .refine((d) => new Date(d.scheduledEnd) > new Date(d.scheduledStart), {
      path: ["scheduledEnd"],
      message: "DATE_RANGE_INVALID",
    })
    .refine(
      (d) =>
        (new Date(d.scheduledEnd).getTime() -
          new Date(d.scheduledStart).getTime()) /
          60_000 <=
        MAX_DURATION_MIN,
      {
        path: ["scheduledEnd"],
        message: "MAX_DURATION_EXCEEDED",
      }
    )
}
export type LiveClassScheduleInput = z.infer<
  ReturnType<typeof createLiveClassScheduleSchema>
>

// ============================================================================
// Server-side raw schemas (no i18n — error codes only)
// ============================================================================

export const liveClassScheduleSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    lang: z.string().min(2).max(8).default("ar"),
    timetableId: idSchema.optional(),
    sectionId: idSchema.optional(),
    subjectId: idSchema.optional(),
    teacherId: idSchema,
    scheduledStart: z.string().datetime(),
    scheduledEnd: z.string().datetime(),
    recordingEnabled: z.boolean().default(true),
    visibility: z.enum(["section", "school"]).default("section"),
    catalogLessonId: idSchema.optional(),
    maxParticipants: z
      .number()
      .int()
      .min(1)
      .max(MAX_PARTICIPANTS_HARD)
      .default(50),
  })
  .refine((d) => new Date(d.scheduledEnd) > new Date(d.scheduledStart), {
    path: ["scheduledEnd"],
    message: "DATE_RANGE_INVALID",
  })
  .refine(
    (d) =>
      (new Date(d.scheduledEnd).getTime() -
        new Date(d.scheduledStart).getTime()) /
        60_000 <=
      MAX_DURATION_MIN,
    {
      path: ["scheduledEnd"],
      message: "MAX_DURATION_EXCEEDED",
    }
  )

// z.input, not z.infer: fields with .default() (recordingEnabled, visibility,
// maxParticipants…) stay optional for callers; safeParse fills them in.
export type LiveClassServerInput = z.input<typeof liveClassScheduleSchema>

export const idOnlySchema = z.object({ id: idSchema })
export type IdOnly = z.infer<typeof idOnlySchema>

export const timetableStartSchema = z.object({ timetableId: idSchema })
export type TimetableStartInput = z.infer<typeof timetableStartSchema>

export const cancelSchema = z.object({
  id: idSchema,
  reason: z.string().max(500).optional(),
})
export type CancelInput = z.infer<typeof cancelSchema>

export const liveClassSettingsSchema = z
  .object({
    conferenceRetentionDays: z.number().int().min(1).max(3650),
    conferenceMaxConcurrent: z.number().int().min(1).max(500),
    conferenceMaxDuration: z.number().int().min(15).max(MAX_DURATION_MIN),
    conferenceRecordingDefault: z.boolean(),
    // Opt-in: auto-mark attendance from live-class presence (LiveKit only).
    conferenceAttendanceSync: z.boolean().optional(),
    // Attendance-from-presence thresholds, minutes. 0 disables the rule.
    conferenceLateGraceMinutes: z.number().int().min(0).max(120).optional(),
    conferenceMinPresenceMinutes: z.number().int().min(0).max(240).optional(),
    conferenceEarlyLeaveMinutes: z.number().int().min(0).max(120).optional(),
    // "This school teaches online" + the back-end to deliver it over. The
    // provider is stored as chosen even when the SFU is unprovisioned; it is
    // degraded to `external` at READ time (see conference/online-policy.ts), so
    // a school can opt into LiveKit ahead of the infra and be promoted the day
    // it lands.
    // physical / online / hybrid — the first thing the policy engine reads.
    conferenceDeliveryMode: z.enum(SCHOOL_DELIVERY_MODE_VALUES).optional(),
    conferenceOnlineDefault: z.boolean().optional(),
    conferenceProviderDefault: z.enum(LIVE_CLASS_PROVIDER_VALUES).optional(),
    // HOW online classes are delivered — see ConferenceOnlineMode.
    conferenceOnlineMode: z.enum(LIVE_CLASS_ONLINE_MODE_VALUES).optional(),
    // The temporary "go online" window, as CALENDAR DAYS ("YYYY-MM-DD") — the
    // native date input's own format, and the only representation that
    // survives the trip without a timezone. A `Date` here would be parsed as
    // UTC midnight and land on the PREVIOUS day for every school west of
    // Greenwich; the action converts these to an instant using
    // `School.timezone`. `until` may be empty ("until further notice"). An
    // `until` with no `from` is NOT an error — it simply describes no window
    // at all, and the action drops it. Rejecting it would turn "the admin
    // cleared the start date" into an unexplained save failure, which is
    // exactly the moment they are trying to bring the school back off the
    // emergency switch.
    conferenceOnlineFrom: DAY_STRING.nullable().optional(),
    conferenceOnlineUntil: DAY_STRING.nullable().optional(),
    conferenceOnlineNote: z.string().trim().max(280).nullable().optional(),
    // Standing meeting link used when a (section, subject) has no
    // ConferenceLink. `.url()` alone admits `javascript:` / `data:` and this
    // value is rendered as an <a href> — keep the scheme lock.
    conferenceFallbackUrl: z
      .union([
        z.literal(""),
        z
          .string()
          .url()
          .regex(/^https?:\/\//i),
      ])
      .nullable()
      .optional(),
  })
  // Day-granular, so an `until` on the SAME day as `from` is a valid one-day
  // window; only a strictly earlier end is an error. Zero-padded ISO days
  // compare correctly as plain strings — which is exactly why they are carried
  // as strings, with no `new Date()` anywhere near them.
  .refine(
    (v) =>
      !v.conferenceOnlineFrom ||
      !v.conferenceOnlineUntil ||
      v.conferenceOnlineUntil >= v.conferenceOnlineFrom,
    { path: ["conferenceOnlineUntil"] }
  )
export type LiveClassSettingsInput = z.infer<typeof liveClassSettingsSchema>

export const adHocLiveClassSchema = liveClassScheduleSchema
export type AdHocLiveClassInput = LiveClassServerInput
