// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const contactSchema = z.object({
  emailAddress: z.string().email("Valid email is required"),
  phone1: z.string().optional().default(""),
  phone2: z.string().optional().default(""),
})

export type ContactFormData = z.infer<typeof contactSchema>
