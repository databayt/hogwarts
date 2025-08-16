import { z } from "zod"

export const subjectBaseSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  departmentId: z.string().min(1, "Department is required"),
})

export const subjectCreateSchema = subjectBaseSchema

export const subjectUpdateSchema = subjectBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getSubjectsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  subjectName: z.string().optional().default(""),
  departmentId: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
