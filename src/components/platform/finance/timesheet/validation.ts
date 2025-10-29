/**
 * Timesheet Module - Validation Schemas
 */

import { z } from 'zod'
import { PeriodStatus } from '@prisma/client'

export const timesheetSchema = z.object({
  name: z.string().min(1, 'Period name is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
})

export const timesheetEntrySchema = z.object({
  periodId: z.string().min(1, 'Period is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  entryDate: z.coerce.date(),
  hoursWorked: z.number().min(0.25, 'Minimum 0.25 hours').max(24, 'Maximum 24 hours per day'),
  overtimeHours: z.number().min(0).max(24).optional(),
  leaveHours: z.number().min(0).max(24).optional(),
  leaveType: z.string().max(100).optional(),
  notes: z.string().optional(),
})

export const timesheetApprovalSchema = z.object({
  timesheetId: z.string().min(1, 'Timesheet period is required'),
  status: z.enum(['OPEN', 'CLOSED', 'LOCKED']),
  notes: z.string().max(500).optional(),
})

export const timesheetFilterSchema = z.object({
  status: z.nativeEnum(PeriodStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})
