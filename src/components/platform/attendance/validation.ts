import { z } from 'zod'

export const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({ studentId: z.string().min(1), status: z.enum(['present', 'absent', 'late']) }))
})

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>



