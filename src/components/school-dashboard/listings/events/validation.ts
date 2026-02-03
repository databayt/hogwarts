import { z } from "zod"

export const eventBaseSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
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
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    location: z.string().optional(),
    organizer: z.string().optional(),
    targetAudience: z.string().optional(),
    maxAttendees: z
      .number()
      .min(1, "Max attendees must be at least 1")
      .optional(),
    isPublic: z.boolean(),
    registrationRequired: z.boolean(),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // Ensure end time is after start time
    if (val.startTime && val.endTime) {
      const start = new Date(`2000-01-01T${val.startTime}`)
      const end = new Date(`2000-01-01T${val.endTime}`)
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
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
          message: "Event date cannot be in the past",
          path: ["eventDate"],
        })
      }
    }
  })

export const eventCreateSchema = eventBaseSchema

export const eventUpdateSchema = eventBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

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
})
