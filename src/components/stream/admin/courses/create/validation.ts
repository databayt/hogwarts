import { z } from "zod"

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  categoryId: z.string().optional().nullable(),
  price: z
    .number()
    .min(0, "Price must be positive")
    .max(10000, "Price must be less than $10,000")
    .optional()
    .nullable(),
  imageUrl: z.string().url("Invalid image URL").optional().nullable(),
})

export const updateCourseSchema = createCourseSchema.partial().extend({
  isPublished: z.boolean().optional(),
})

export const createChapterSchema = z.object({
  title: z
    .string()
    .min(1, "Chapter title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  position: z.number().int().min(0),
  isFree: z.boolean().default(false),
})

export const createLessonSchema = z.object({
  title: z
    .string()
    .min(1, "Lesson title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  videoUrl: z.string().url("Invalid video URL").optional().nullable(),
  position: z.number().int().min(0),
  duration: z
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(600, "Duration must be less than 10 hours")
    .optional()
    .nullable(),
  isFree: z.boolean(),
})

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name must be less than 50 characters"),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type CreateChapterInput = z.infer<typeof createChapterSchema>
export type CreateLessonInput = z.infer<typeof createLessonSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
