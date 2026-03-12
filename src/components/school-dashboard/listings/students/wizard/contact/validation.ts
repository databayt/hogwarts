// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const contactSchema = z.object({
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobileNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
  currentAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
})

export type ContactFormData = z.infer<typeof contactSchema>
