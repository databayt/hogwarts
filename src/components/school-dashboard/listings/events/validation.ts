// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

/**
 * Messages sourced from `school.events.validation.*`. Optional so server-side
 * parsing (where messages are never surfaced to a user) can call the factories
 * bare; client forms pass the dictionary subtree so errors render in-locale.
 */
export interface EventValidationMessages {
  titleRequired?: string
  startTimeRequired?: string
  endTimeRequired?: string
  endTimeAfterStart?: string
  eventDateNotPast?: string
  maxAttendeesMin?: string
  eventDateRequired?: string
  mustBeAtLeast1?: string
}

export const createEventBaseSchema = (v?: EventValidationMessages) =>
  z
    .object({
      title: z.string().min(1, v?.titleRequired),
      description: z.string().max(5000).optional(),
      eventType: z.enum([
        "ACADEMIC",
        "SPORTS",
        "CULTURAL",
        "PARENT_MEETING",
        "CELEBRATION",
        "WORKSHOP",
        "OTHER",
      ]),
      eventDate: z.date(),
      startTime: z.string().min(1, v?.startTimeRequired),
      endTime: z.string().min(1, v?.endTimeRequired),
      location: z.string().max(500).optional(),
      organizer: z.string().max(200).optional(),
      targetAudience: z.string().max(200).optional(),
      maxAttendees: z.number().min(1, v?.maxAttendeesMin).optional(),
      isPublic: z.boolean(),
      registrationRequired: z.boolean(),
      notes: z.string().max(5000).optional(),
    })
    .superRefine((val, ctx) => {
      // Ensure end time is after start time
      if (val.startTime && val.endTime) {
        const start = new Date(`2000-01-01T${val.startTime}`)
        const end = new Date(`2000-01-01T${val.endTime}`)
        if (end <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              v?.endTimeAfterStart ?? "End time must be after start time",
            path: ["endTime"],
          })
        }
      }

      // Ensure event date is not in the past
      if (val.eventDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (val.eventDate < today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v?.eventDateNotPast ?? "Event date cannot be in the past",
            path: ["eventDate"],
          })
        }
      }
    })

export const createEventCreateSchema = createEventBaseSchema

export const createEventUpdateSchema = (v?: EventValidationMessages) =>
  createEventBaseSchema(v)
    .partial()
    .extend({
      id: z.string().min(1, v?.titleRequired),
    })

export const eventBaseSchema = createEventBaseSchema()
export const eventCreateSchema = eventBaseSchema
export const eventUpdateSchema = createEventUpdateSchema()

export type EventFormData = z.infer<typeof eventCreateSchema>
export type EventUpdateData = z.infer<typeof eventUpdateSchema>

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getEventsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  eventType: z.string().optional().default(""),
  status: z.string().optional().default(""),
  eventDate: z.string().optional().default(""),
  location: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
  displayLang: z.enum(["ar", "en"]).optional(),
})
