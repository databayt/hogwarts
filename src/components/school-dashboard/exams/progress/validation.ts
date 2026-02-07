import { z } from "zod"

export const progressScheduleCreateSchema = z.object({
  classId: z.string().optional(),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "TERM_END"]),
  includeExamResults: z.boolean().default(true),
  includeAttendance: z.boolean().default(true),
  includeAssignments: z.boolean().default(false),
  includeBehavior: z.boolean().default(false),
  recipientTypes: z
    .array(z.string())
    .min(1, "At least one recipient type is required"),
  channels: z.array(z.string()).min(1, "At least one channel is required"),
})

export const progressScheduleUpdateSchema = progressScheduleCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, "ID is required"),
  })
