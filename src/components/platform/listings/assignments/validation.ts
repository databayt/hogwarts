import { z } from "zod"

export const assignmentBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  type: z.enum([
    "HOMEWORK",
    "QUIZ",
    "TEST",
    "MIDTERM",
    "FINAL_EXAM",
    "PROJECT",
    "LAB_REPORT",
    "ESSAY",
    "PRESENTATION",
  ]),
  totalPoints: z.number().min(0.01, "Total points must be greater than 0"),
  weight: z
    .number()
    .min(0.01, "Weight must be greater than 0")
    .max(100, "Weight cannot exceed 100%"),
  dueDate: z.date(),
  instructions: z.string().optional(),
})

export const assignmentCreateSchema = assignmentBaseSchema

export const assignmentUpdateSchema = assignmentBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getAssignmentsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  type: z.string().optional().default(""),
  classId: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
