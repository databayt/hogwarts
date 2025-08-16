import { z } from "zod"

export const classBaseSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  termId: z.string().min(1, "Term is required"),
  startPeriodId: z.string().min(1, "Start period is required"),
  endPeriodId: z.string().min(1, "End period is required"),
  classroomId: z.string().min(1, "Classroom is required"),
})

export const classCreateSchema = classBaseSchema

export const classUpdateSchema = classBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getClassesSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  subjectId: z.string().optional().default(""),
  teacherId: z.string().optional().default(""),
  termId: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
