// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"

// ---------------------------------------------------------------------------
// Validation message helpers (i18n-safe dictionary factory)
//
// Mirrors the admission campaign pattern: the schema is produced by a factory
// that takes the (optional) translated validation messages. The static schema
// (built with no dictionary) is used on the server where the dictionary is not
// available; the client builds a translated schema for form-level messages.
// ---------------------------------------------------------------------------

type V = NonNullable<Dictionary["school"]["liveClasses"]["validation"]>

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

function v(dict?: V) {
  return {
    titleRequired: dict?.titleRequired || "Title is required",
    titleMax: dict?.titleMax || "Title must be at most 200 characters",
    teacherRequired: dict?.teacherRequired || "Teacher is required",
    meetingUrlRequired: dict?.meetingUrlRequired || "Meeting URL is required",
    meetingUrlInvalid: dict?.meetingUrlInvalid || "Enter a valid URL",
    startDateRequired: dict?.startDateRequired || "Start date is required",
    endDateRequired: dict?.endDateRequired || "End date is required",
    startTimeInvalid:
      dict?.startTimeInvalid || "Enter a valid start time (HH:mm)",
    endTimeInvalid: dict?.endTimeInvalid || "Enter a valid end time (HH:mm)",
    endDateAfterStart:
      dict?.endDateAfterStart || "End date must be on or after start date",
    descriptionMax:
      dict?.descriptionMax || "Description must be at most 2000 characters",
    resourceOneRef:
      dict?.resourceOneRef || "Pick an exam, an assignment, or enter a link",
    resourceUrlInvalid: dict?.resourceUrlInvalid || "Enter a valid link URL",
  }
}

// ---------------------------------------------------------------------------
// Status values (labels resolved from dictionary at render time)
// ---------------------------------------------------------------------------

export const LIVE_CLASS_STATUS_VALUES = [
  "scheduled",
  "live",
  "ended",
  "cancelled",
  "failed",
] as const

export type ConferenceStatusValue = (typeof LIVE_CLASS_STATUS_VALUES)[number]

// Meeting back-end for a session. `livekit` = built-in in-app room (no URL —
// the room is provisioned on start and joined via /conference/[id]/room);
// `external` = pasted/auto-created vendor link (Meet / Zoom / Teams).
export const LIVE_CLASS_PROVIDER_VALUES = ["livekit", "external"] as const
export type ConferenceProviderValue =
  (typeof LIVE_CLASS_PROVIDER_VALUES)[number]

// Who inside the school can see & join. `section` = the session's section
// roster + their guardians (host-only when no section); `school` = every
// member of the school. Never cross-school — the tenant boundary is absolute.
export const LIVE_CLASS_VISIBILITY_VALUES = ["section", "school"] as const
export type ConferenceVisibilityValue =
  (typeof LIVE_CLASS_VISIBILITY_VALUES)[number]

// ---------------------------------------------------------------------------
// Schema factory
// ---------------------------------------------------------------------------

// One attached reference — exactly one of exam / assignment / ad-hoc URL per
// row (mirrors the ConferenceResource multi-nullable-FK model).
function createResourceItemSchema(m: ReturnType<typeof v>) {
  return z
    .object({
      schoolExamId: z.string().optional().nullable(),
      schoolAssignmentId: z.string().optional().nullable(),
      // .url() alone admits any scheme (javascript:, data:) — these values
      // render as <a href>, so lock to http(s).
      url: z
        .string()
        .url(m.resourceUrlInvalid)
        .regex(/^https?:\/\//i, m.resourceUrlInvalid)
        .max(2048)
        .optional()
        .nullable()
        .or(z.literal("")),
      title: z.string().max(200).optional().nullable(),
    })
    .refine(
      (r) =>
        [r.schoolExamId, r.schoolAssignmentId, r.url].filter(Boolean).length ===
        1,
      { message: m.resourceOneRef, path: ["url"] }
    )
}

export type LiveClassResourceInput = z.infer<
  ReturnType<typeof createResourceItemSchema>
>

export function createLiveClassSchema(dict?: V) {
  const m = v(dict)

  const base = z.object({
    title: z.string().min(1, m.titleRequired).max(200, m.titleMax),
    teacherId: z.string().min(1, m.teacherRequired),
    subjectId: z.string().optional().nullable(),
    sectionId: z.string().optional().nullable(),
    // In-app LiveKit room by default when the SFU is configured; external
    // pasted link otherwise. The URL is only meaningful (and required) for
    // `external` — enforced in the superRefine below, not on the field.
    provider: z.enum(LIVE_CLASS_PROVIDER_VALUES).default("external"),
    meetingUrl: z.string().max(2048).optional().nullable().or(z.literal("")),
    meetingProvider: z.string().max(50).optional().nullable(),
    startDate: z.coerce.date({ message: m.startDateRequired }),
    endDate: z.coerce.date({ message: m.endDateRequired }),
    startTime: z.string().regex(TIME_REGEX, m.startTimeInvalid),
    endTime: z.string().regex(TIME_REGEX, m.endTimeInvalid),
    status: z.enum(LIVE_CLASS_STATUS_VALUES).default("scheduled"),
    visibility: z.enum(LIVE_CLASS_VISIBILITY_VALUES).default("section"),
    description: z.string().max(2000, m.descriptionMax).optional().nullable(),
    // In-app room knobs (ignored for external links).
    recordingEnabled: z.boolean().optional().default(true),
    maxParticipants: z.number().int().min(1).max(300).optional().default(50),
    // Catalog lesson this session teaches — surfaces the lesson's videos,
    // materials, and practice questions on the session page.
    catalogLessonId: z.string().optional().nullable(),
    resources: z
      .array(createResourceItemSchema(m))
      .max(10)
      .optional()
      .default([]),
    // "Set once & reuse" — also store this meeting link as the recurring
    // default for its (subject, section, term) so the timetable Join button
    // resurfaces it every week without re-entering it.
    saveAsDefault: z.boolean().optional().default(false),
  })

  return base
    .refine(
      (data) => {
        // Compare date-only (time is applied separately on submit); require the
        // end date to be on or after the start date.
        const start = new Date(data.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(data.endDate)
        end.setHours(0, 0, 0, 0)
        return end >= start
      },
      {
        message: m.endDateAfterStart,
        path: ["endDate"],
      }
    )
    .superRefine((data, ctx) => {
      if (data.provider !== "external") return
      const url = data.meetingUrl ?? ""
      if (!url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: m.meetingUrlRequired,
          path: ["meetingUrl"],
        })
        return
      }
      // Scheme-locked: the link is rendered as <a href> / window.open —
      // never accept javascript:/data: URIs.
      if (
        !z.string().url().safeParse(url).success ||
        !/^https?:\/\//i.test(url)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: m.meetingUrlInvalid,
          path: ["meetingUrl"],
        })
      }
    })
}

// Static schema (server-side validation where dictionary is unavailable)
export const liveClassSchema = createLiveClassSchema()
export const createLiveClassSchemaWithValidation = liveClassSchema

export type LiveClassFormData = z.infer<typeof liveClassSchema>

// Update schema: partial base + required id (built from the raw object so we can
// .partial()/.extend before the .refine is applied).
export function createUpdateLiveClassSchema(dict?: V) {
  const m = v(dict)
  return z
    .object({
      id: z.string().min(1),
      title: z.string().min(1, m.titleRequired).max(200, m.titleMax).optional(),
      teacherId: z.string().min(1, m.teacherRequired).optional(),
      subjectId: z.string().optional().nullable(),
      sectionId: z.string().optional().nullable(),
      meetingUrl: z
        .string()
        .min(1, m.meetingUrlRequired)
        .url(m.meetingUrlInvalid)
        .regex(/^https?:\/\//i, m.meetingUrlInvalid)
        .optional(),
      meetingProvider: z.string().max(50).optional().nullable(),
      startDate: z.coerce.date({ message: m.startDateRequired }).optional(),
      endDate: z.coerce.date({ message: m.endDateRequired }).optional(),
      startTime: z.string().regex(TIME_REGEX, m.startTimeInvalid).optional(),
      endTime: z.string().regex(TIME_REGEX, m.endTimeInvalid).optional(),
      status: z.enum(LIVE_CLASS_STATUS_VALUES).optional(),
      // Provider is deliberately NOT updatable — a room-based session and a
      // link-based session have different lifecycles (roomName, SFU state).
      visibility: z.enum(LIVE_CLASS_VISIBILITY_VALUES).optional(),
      recordingEnabled: z.boolean().optional(),
      maxParticipants: z.number().int().min(1).max(300).optional(),
      catalogLessonId: z.string().optional().nullable(),
      resources: z.array(createResourceItemSchema(m)).max(10).optional(),
      description: z.string().max(2000, m.descriptionMax).optional().nullable(),
    })
    .refine(
      (data) => {
        if (!data.startDate || !data.endDate) return true
        const start = new Date(data.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(data.endDate)
        end.setHours(0, 0, 0, 0)
        return end >= start
      },
      {
        message: m.endDateAfterStart,
        path: ["endDate"],
      }
    )
}

export const updateLiveClassSchema = createUpdateLiveClassSchema()

export type UpdateLiveClassData = z.infer<typeof updateLiveClassSchema>

// List query schema
export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getLiveClassesSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  status: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
  displayLang: z.enum(["ar", "en"]).optional(),
})
