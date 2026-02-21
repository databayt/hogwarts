import { z } from "zod"

export const gradeConfigSchema = z.object({
  gradeId: z.string().min(1, "Grade is required"),
  sections: z.coerce.number().int().min(1).max(10),
  capacityPerSection: z.coerce.number().int().min(1).max(500),
  roomType: z.string().min(1, "Room type is required"),
})

export const generateSectionsSchema = z.object({
  grades: z.array(gradeConfigSchema).min(1, "At least one grade is required"),
})

export type GradeConfigInput = z.infer<typeof gradeConfigSchema>
export type GenerateSectionsInput = z.infer<typeof generateSectionsSchema>
