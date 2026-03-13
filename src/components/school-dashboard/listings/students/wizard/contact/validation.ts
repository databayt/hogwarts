// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const contactSchema = z.object({
  // Contact tab
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobileNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
  // Emergency tab
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
})

export type ContactFormData = z.infer<typeof contactSchema>
