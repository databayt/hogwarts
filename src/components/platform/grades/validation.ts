import { z } from "zod"

export const resultBaseSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  assignmentId: z.string().min(1, "Assignment is required"),
  classId: z.string().min(1, "Class is required"),
  score: z.number().min(0, "Score must be 0 or greater"),
  maxScore: z.number().min(0.01, "Max score must be greater than 0"),
  grade: z.string().min(1, "Grade is required"),
  feedback: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.score > val.maxScore) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: "Score cannot exceed max score", 
      path: ["score"] 
    })
  }
})

export const resultCreateSchema = resultBaseSchema

export const resultUpdateSchema = resultBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getResultsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  studentId: z.string().optional().default(""),
  assignmentId: z.string().optional().default(""),
  classId: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
