import { z } from "zod"

export const studentBaseSchema = z.object({
  givenName: z.string().optional(),
  middleName: z.string().optional(),
  surname: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date YYYY-MM-DD
  gender: z.enum(["male", "female"]).optional(),
  enrollmentDate: z.string().optional(), // ISO date YYYY-MM-DD
  userId: z.string().optional(),
})

export const studentCreateSchema = studentBaseSchema

export const studentUpdateSchema = studentBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getStudentsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  className: z.string().optional().default(""),
  status: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})


