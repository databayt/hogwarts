import { z } from "zod"

export const visibilitySchema = z.object({
  informationSharing: z
    .enum(["full-transparency", "limited-sharing"])
    .describe("Please select an information sharing level"),
  parentAccess: z.boolean().default(true),
  studentAccess: z.boolean().default(true),
  publicDirectory: z.boolean().default(false),
})

export type VisibilityFormData = z.infer<typeof visibilitySchema>
