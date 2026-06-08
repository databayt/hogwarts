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

// ---------------------------------------------------------------------------
// Schema factory
// ---------------------------------------------------------------------------

export function createLiveClassSchema(dict?: V) {
  const m = v(dict)

  const base = z.object({
    title: z.string().min(1, m.titleRequired).max(200, m.titleMax),
    teacherId: z.string().min(1, m.teacherRequired),
    subjectId: z.string().optional().nullable(),
    sectionId: z.string().optional().nullable(),
    meetingUrl: z
      .string()
      .min(1, m.meetingUrlRequired)
      .url(m.meetingUrlInvalid),
    meetingProvider: z.string().max(50).optional().nullable(),
    startDate: z.coerce.date({ message: m.startDateRequired }),
    endDate: z.coerce.date({ message: m.endDateRequired }),
    startTime: z.string().regex(TIME_REGEX, m.startTimeInvalid),
    endTime: z.string().regex(TIME_REGEX, m.endTimeInvalid),
    status: z.enum(LIVE_CLASS_STATUS_VALUES).default("scheduled"),
    description: z.string().max(2000, m.descriptionMax).optional().nullable(),
    // "Set once & reuse" — also store this meeting link as the recurring
    // default for its (subject, section, term) so the timetable Join button
    // resurfaces it every week without re-entering it.
    saveAsDefault: z.boolean().optional().default(false),
  })

  return base.refine(
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
        .optional(),
      meetingProvider: z.string().max(50).optional().nullable(),
      startDate: z.coerce.date({ message: m.startDateRequired }).optional(),
      endDate: z.coerce.date({ message: m.endDateRequired }).optional(),
      startTime: z.string().regex(TIME_REGEX, m.startTimeInvalid).optional(),
      endTime: z.string().regex(TIME_REGEX, m.endTimeInvalid).optional(),
      status: z.enum(LIVE_CLASS_STATUS_VALUES).optional(),
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
