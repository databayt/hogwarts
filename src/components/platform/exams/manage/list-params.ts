import { z } from 'zod'
import { getExamsSchema } from './validation'

export const examsSearchParams = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(20),
  title: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  examType: z.string().optional(),
  status: z.string().optional(),
  examDate: z.string().optional(),
  sort: z.array(z.object({ id: z.string(), desc: z.coerce.boolean() })).optional(),
})

export type ExamsSearchParams = z.infer<typeof examsSearchParams>
