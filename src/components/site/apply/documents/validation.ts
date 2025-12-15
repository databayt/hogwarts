// Documents Step Validation

import { z } from "zod"

export const documentsSchema = z.object({
  photoUrl: z.string().url("Invalid photo URL").optional().or(z.literal("")),
  signatureUrl: z
    .string()
    .url("Invalid signature URL")
    .optional()
    .or(z.literal("")),
  documents: z
    .array(
      z.object({
        type: z.string(),
        name: z.string(),
        url: z.string().url(),
        uploadedAt: z.string(),
      })
    )
    .optional()
    .default([]),
})

export type DocumentsSchemaType = z.infer<typeof documentsSchema>
