// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ComplianceProvider, ConnectorMode } from "@prisma/client"
import { z } from "zod"

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export const updateComplianceConfigSchema = z.object({
  provider: z.nativeEnum(ComplianceProvider),
  enabled: z.boolean(),
  mode: z.nativeEnum(ConnectorMode),
  submissionTimeUtc: z
    .string()
    .regex(HHMM, "Must be in HH:MM (24h UTC) format"),
  parentContactSlaMinutes: z
    .number()
    .int()
    .min(15, "Minimum 15 minutes")
    .max(720, "Maximum 12 hours"),
  notifyAdminOnFailure: z.boolean(),
  sharedGroupId: z.string().nullable().optional(),
  providerConfig: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type UpdateComplianceConfigInput = z.infer<
  typeof updateComplianceConfigSchema
>

export const retrySubmissionSchema = z.object({
  submissionId: z.string().min(1),
})

export const downloadArtifactSchema = z.object({
  submissionId: z.string().min(1),
})

// DEVELOPER-only — cross-tenant shared credential group
export const createSharedGroupSchema = z.object({
  name: z.string().min(2).max(120),
  provider: z.nativeEnum(ComplianceProvider),
  secretJson: z.string().min(1), // JSON-encoded credentials, will be encrypted server-side
})
