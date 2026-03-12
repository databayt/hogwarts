// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const employmentSchema = z
  .object({
    employeeId: z.string().optional(),
    joiningDate: z.coerce.date().optional(),
    employmentStatus: z
      .enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RETIRED"])
      .default("ACTIVE"),
    employmentType: z
      .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "SUBSTITUTE"])
      .default("FULL_TIME"),
    contractStartDate: z.coerce.date().optional(),
    contractEndDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.contractStartDate && data.contractEndDate) {
        return data.contractStartDate < data.contractEndDate
      }
      return true
    },
    {
      message: "Contract start date must be before end date",
      path: ["contractEndDate"],
    }
  )

export type EmploymentFormData = z.infer<typeof employmentSchema>
