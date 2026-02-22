import { z } from "zod"

export const lessonVideoSchema = z.object({
  catalogLessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  storageProvider: z.string().optional().nullable(),
  storageKey: z.string().optional().nullable(),
})

export type LessonVideoInput = z.infer<typeof lessonVideoSchema>
