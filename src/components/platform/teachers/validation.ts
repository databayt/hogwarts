import { z } from "zod"

export const teacherBaseSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  gender: z.enum(["male", "female"]).optional(),
  emailAddress: z.string().email("Valid email is required"),
})

export const teacherCreateSchema = teacherBaseSchema

export const teacherUpdateSchema = teacherBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getTeachersSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  emailAddress: z.string().optional().default(""),
  status: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
