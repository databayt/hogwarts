// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timesheet Module - Validation Schemas
 */

import { PeriodStatus } from "@prisma/client"
import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export const createTimesheetSchema = (v: ValidationHelper) =>
  z
    .object({
      name: z.string().min(1, v.required()),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: "End date must be on or after start date", // TODO: add custom validation key
    })

export const createTimesheetEntrySchema = (v: ValidationHelper) =>
  z.object({
    periodId: z.string().min(1, v.required()),
    teacherId: z.string().min(1, v.required()),
    entryDate: z.coerce.date(),
    hoursWorked: z.number().min(0.25, v.min(0.25)).max(24, v.max(24)),
    overtimeHours: z.number().min(0).max(24).optional(),
    leaveHours: z.number().min(0).max(24).optional(),
    leaveType: z.string().max(100).optional(),
    notes: z.string().optional(),
  })

export const createTimesheetApprovalSchema = (v: ValidationHelper) =>
  z.object({
    timesheetId: z.string().min(1, v.required()),
    status: z.enum(["OPEN", "CLOSED", "LOCKED"]),
    notes: z.string().max(500).optional(),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

export const timesheetSchema = z
  .object({
    name: z.string().min(1, "Period name is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
  })

export const timesheetEntrySchema = z.object({
  periodId: z.string().min(1, "Period is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  entryDate: z.coerce.date(),
  hoursWorked: z
    .number()
    .min(0.25, "Minimum 0.25 hours")
    .max(24, "Maximum 24 hours per day"),
  overtimeHours: z.number().min(0).max(24).optional(),
  leaveHours: z.number().min(0).max(24).optional(),
  leaveType: z.string().max(100).optional(),
  notes: z.string().optional(),
})

export const timesheetApprovalSchema = z.object({
  timesheetId: z.string().min(1, "Timesheet period is required"),
  status: z.enum(["OPEN", "CLOSED", "LOCKED"]),
  notes: z.string().max(500).optional(),
})

export const timesheetFilterSchema = z.object({
  status: z.nativeEnum(PeriodStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})
