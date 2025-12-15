import { z } from "zod"

export const lessonBaseSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    classId: z.string().min(1, "Class is required"),
    lessonDate: z.date(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    objectives: z.string().optional(),
    materials: z.string().optional(),
    activities: z.string().optional(),
    assessment: z.string().optional(),
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

    // Ensure lesson date is not in the past (optional validation)
    if (val.lessonDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lessonDate = new Date(val.lessonDate)
      lessonDate.setHours(0, 0, 0, 0)
      if (lessonDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lesson date cannot be in the past",
          path: ["lessonDate"],
        })
      }
    }
  })

export const lessonCreateSchema = lessonBaseSchema

export const lessonUpdateSchema = lessonBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getLessonsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  classId: z.string().optional().default(""),
  status: z.string().optional().default(""),
  lessonDate: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
