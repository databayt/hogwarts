/**
 * Timesheet Module - Validation Schemas
 */

import { z } from 'zod'
import { TimesheetStatus } from '@prisma/client'

export const timesheetSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
}).refine((data) => data.periodEnd >= data.periodStart, {
  message: 'Period end must be on or after period start',
})

export const timesheetEntrySchema = z.object({
  timesheetId: z.string().min(1, 'Timesheet is required'),
  date: z.coerce.date(),
  hoursWorked: z.number().min(0.25, 'Minimum 0.25 hours').max(24, 'Maximum 24 hours per day'),
  description: z.string().max(500).optional(),
  taskType: z.string().max(100).optional(),
})

export const timesheetApprovalSchema = z.object({
  timesheetId: z.string().min(1, 'Timesheet is required'),
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().max(500).optional(),
})

export const timesheetFilterSchema = z.object({
  status: z.nativeEnum(TimesheetStatus).optional(),
  userId: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
})
