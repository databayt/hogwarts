// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const phoneNumberSchema = z.object({
  phoneType: z.enum(["mobile", "home", "work", "emergency"]),
  phoneNumber: z.string().min(1, "Phone number is required"),
  isPrimary: z.boolean().default(false),
})

export const contactSchema = z.object({
  phoneNumbers: z.array(phoneNumberSchema).optional().default([]),
})

export type ContactFormData = z.infer<typeof contactSchema>
