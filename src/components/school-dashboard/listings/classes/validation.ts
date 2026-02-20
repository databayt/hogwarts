import { z } from "zod"

export const classBaseSchema = z
  .object({
    name: z.string().min(1, "Class name is required"),
    subjectId: z.string().min(1, "Subject is required"),
    teacherId: z.string().min(1, "Teacher is required"),
    termId: z.string().min(1, "Term is required"),
    startPeriodId: z.string().min(1, "Start period is required"),
    endPeriodId: z.string().min(1, "End period is required"),
    classroomId: z.string().min(1, "Classroom is required"),
    gradeId: z.string().optional().nullable(),

    // Course Management Fields
    courseCode: z.string().optional(),
    credits: z.coerce.number().min(0).max(999.99).optional(),
    evaluationType: z.enum(["NORMAL", "GPA", "CWA", "CCE"]),
    minCapacity: z.coerce.number().int().min(1).optional(),
    maxCapacity: z.coerce.number().int().min(1).optional(),
    duration: z.coerce.number().int().min(1).optional(),
    prerequisiteId: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    // Ensure maxCapacity >= minCapacity if both are provided
    if (
      val.minCapacity &&
      val.maxCapacity &&
      val.maxCapacity < val.minCapacity
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Maximum capacity must be greater than or equal to minimum capacity",
        path: ["maxCapacity"],
      })
    }
  })

export const classCreateSchema = classBaseSchema

export const classUpdateSchema = classBaseSchema.partial().extend({
  id: z.string().min(1, "Required"),
})

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean().optional(),
})

export const getClassesSchema = z.object({
  page: z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(200).default(20),
  name: z.string().optional().default(""),
  subjectId: z.string().optional().default(""),
  teacherId: z.string().optional().default(""),
  termId: z.string().optional().default(""),
  sort: z.array(sortItemSchema).optional().default([]),
})

// ============================================================================
// ClassTeacher (Subject Teacher Assignment) Schemas
// ============================================================================

export const classTeacherRoles = ["PRIMARY", "CO_TEACHER", "ASSISTANT"] as const
export type ClassTeacherRole = (typeof classTeacherRoles)[number]

export const classTeacherCreateSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  role: z.enum(classTeacherRoles).default("ASSISTANT"),
})

export const classTeacherUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  role: z.enum(classTeacherRoles).optional(),
})

export type ClassTeacherCreateInput = z.infer<typeof classTeacherCreateSchema>
export type ClassTeacherUpdateInput = z.infer<typeof classTeacherUpdateSchema>
