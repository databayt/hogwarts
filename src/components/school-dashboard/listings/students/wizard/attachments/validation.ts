// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const attachmentsSchema = z.object({
  profilePhotoUrl: z.string().optional().default(""),
  degreeUrl: z.string().optional().default(""),
  transcriptUrl: z.string().optional().default(""),
  idUrl: z.string().optional().default(""),
  cvUrl: z.string().optional().default(""),
  otherUrl: z.string().optional().default(""),
})

export type AttachmentsFormData = z.infer<typeof attachmentsSchema>
