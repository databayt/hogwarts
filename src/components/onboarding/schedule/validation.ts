import { z } from "zod"

export const scheduleSchema = z.object({
  structureSlug: z.string().min(1, "Please select a timetable structure"),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>
