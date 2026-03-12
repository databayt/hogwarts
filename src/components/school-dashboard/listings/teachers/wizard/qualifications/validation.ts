// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const qualificationSchema = z
  .object({
    qualificationType: z
      .enum(["DEGREE", "CERTIFICATION", "LICENSE"])
      .default("DEGREE"),
    name: z.string().min(1, "Qualification name is required"),
    institution: z.string().optional(),
    major: z.string().optional(),
    dateObtained: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    licenseNumber: z.string().optional(),
    documentUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.dateObtained && data.expiryDate) {
        return data.expiryDate > data.dateObtained
      }
      return true
    },
    {
      message: "Expiry date must be after date obtained",
      path: ["expiryDate"],
    }
  )

export const qualificationsSchema = z.object({
  qualifications: z.array(qualificationSchema).default([]),
})

export type QualificationFormData = z.infer<typeof qualificationSchema>
export type QualificationsFormData = z.infer<typeof qualificationsSchema>
