import { z } from "zod"

export const examBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  examDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 8 hours"),
  totalMarks: z.number().min(1, "Total marks must be at least 1").max(1000, "Total marks cannot exceed 1000"),
  passingMarks: z.number().min(1, "Passing marks must be at least 1"),
  examType: z.enum(["MIDTERM", "FINAL", "QUIZ", "TEST", "PRACTICAL"]),
  instructions: z.string().optional(),
}).superRefine((val, ctx) => {
  // Ensure end time is after start time
  if (val.startTime && val.endTime) {
    const start = new Date(`2000-01-01T${val.startTime}`);
    const end = new Date(`2000-01-01T${val.endTime}`);
    if (end <= start) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "End time must be after start time", 
        path: ["endTime"] 
      })
    }
  }
  
  // Ensure exam date is not in the past
  if (val.examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (val.examDate < today) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Exam date cannot be in the past", 
        path: ["examDate"] 
      })
    }
  }

  // Ensure passing marks don't exceed total marks
  if (val.passingMarks > val.totalMarks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passing marks cannot exceed total marks",
      path: ["passingMarks"]
    })
  }
})

export const examCreateSchema = examBaseSchema

export const examUpdateSchema = examBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({ id: z.string(), desc: z.boolean().optional() })

export const getExamsSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  title: z.string().optional().default(""),
  classId: z.string().optional().default(""),
  subjectId: z.string().optional().default(""),
  examType: z.string().optional().default(""),
  status: z.string().optional().default(""),
  examDate: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})
