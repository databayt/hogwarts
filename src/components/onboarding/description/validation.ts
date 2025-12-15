import { z } from "zod"

export const descriptionSchema = z.object({
  schoolType: z
    .enum(["private", "public", "international", "technical", "special"])
    .describe("Please select a school type"),
})

export type DescriptionFormData = z.infer<typeof descriptionSchema>
