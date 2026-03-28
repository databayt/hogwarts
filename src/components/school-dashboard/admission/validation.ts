// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"

// ---------------------------------------------------------------------------
// Validation message helpers (i18n-safe)
// ---------------------------------------------------------------------------

type V = NonNullable<Dictionary["school"]["admission"]["validation"]>

function v(dict?: V) {
  return {
    nameMin: dict?.nameMin || "Name must be at least 3 characters",
    nameMax: dict?.nameMax || "Name must be at most 100 characters",
    academicYearRequired:
      dict?.academicYearRequired || "Academic year is required",
    academicYearMax:
      dict?.academicYearMax || "Academic year must be at most 20 characters",
    startDateRequired: dict?.startDateRequired || "Start date is required",
    endDateRequired: dict?.endDateRequired || "End date is required",
    statusRequired: dict?.statusRequired || "Status is required",
    totalSeatsRequired: dict?.totalSeatsRequired || "Total seats is required",
    totalSeatsMin: dict?.totalSeatsMin || "Must have at least 1 seat",
    feeNonNegative:
      dict?.feeNonNegative || "Application fee cannot be negative",
    endDateAfterStart:
      dict?.endDateAfterStart || "End date must be after start date",
  }
}

// ---------------------------------------------------------------------------
// Campaign schema factory
// ---------------------------------------------------------------------------

export function createCampaignSchema(dict?: V) {
  const m = v(dict)

  const base = z.object({
    name: z.string().min(3, m.nameMin).max(100, m.nameMax),
    academicYear: z
      .string()
      .min(4, m.academicYearRequired)
      .max(20, m.academicYearMax),
    startDate: z.coerce.date({ message: m.startDateRequired }),
    endDate: z.coerce.date({ message: m.endDateRequired }),
    status: z.enum(["DRAFT", "OPEN", "CLOSED", "PROCESSING", "COMPLETED"], {
      message: m.statusRequired,
    }),
    description: z.string().max(500).optional().nullable(),
    totalSeats: z
      .number({ message: m.totalSeatsRequired })
      .min(1, m.totalSeatsMin),
    applicationFee: z.number().min(0, m.feeNonNegative).optional().nullable(),
  })

  return base.refine((data) => data.endDate > data.startDate, {
    message: m.endDateAfterStart,
    path: ["endDate"],
  })
}

// Static schema (for server-side validation where dictionary is unavailable)
export const campaignSchema = createCampaignSchema()
export const campaignSchemaWithValidation = campaignSchema

export type CampaignFormData = z.infer<ReturnType<typeof createCampaignSchema>>

// Status option values (labels resolved from dictionary at render time)
export const CAMPAIGN_STATUS_VALUES = [
  "DRAFT",
  "OPEN",
  "CLOSED",
  "PROCESSING",
  "COMPLETED",
] as const
