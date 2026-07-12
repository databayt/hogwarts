// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

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

export const liveClassSettingsSchema = z.object({
  conferenceRetentionDays: z.number().int().min(1).max(3650),
  conferenceMaxConcurrent: z.number().int().min(1).max(500),
  conferenceMaxDuration: z.number().int().min(15).max(MAX_DURATION_MIN),
  conferenceRecordingDefault: z.boolean(),
  // Opt-in: auto-mark attendance from live-class presence (LiveKit only).
  conferenceAttendanceSync: z.boolean().optional(),
})
export type LiveClassSettingsInput = z.infer<typeof liveClassSettingsSchema>

export const adHocLiveClassSchema = liveClassScheduleSchema
export type AdHocLiveClassInput = LiveClassServerInput
