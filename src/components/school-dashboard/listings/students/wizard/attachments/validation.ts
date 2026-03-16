// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const attachmentsSchema = z.object({
  profilePhotoUrl: z.string().nullable().optional().default(""),
  degreeUrl: z.string().nullable().optional().default(""),
  transcriptUrl: z.string().nullable().optional().default(""),
  idUrl: z.string().nullable().optional().default(""),
  resumeUrl: z.string().nullable().optional().default(""),
  otherUrl: z.string().nullable().optional().default(""),
})

export type AttachmentsFormData = z.infer<typeof attachmentsSchema>
