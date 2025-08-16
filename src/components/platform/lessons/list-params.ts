import { z } from 'zod'
import { getLessonsSchema } from './validation'

export const lessonsSearchParams = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(20),
  title: z.string().optional(),
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  subjectId: z.string().optional(),
  status: z.string().optional(),
  lessonDate: z.string().optional(),
  sort: z.array(z.object({ id: z.string(), desc: z.coerce.boolean() })).optional(),
})

export type LessonsSearchParams = z.infer<typeof lessonsSearchParams>
