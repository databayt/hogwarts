/**
 * Timesheet Module - Type Definitions
 */

import type { TimesheetStatus } from '@prisma/client'
import type { timesheetSchema, timesheetEntrySchema } from './validation'
import type { z } from 'zod'

export type TimesheetInput = z.infer<typeof timesheetSchema>
export type TimesheetEntryInput = z.infer<typeof timesheetEntrySchema>

export interface TimesheetWithEntries {
  id: string
  userId: string
  periodStart: Date
  periodEnd: Date
  totalHours: number
  status: TimesheetStatus
  submittedAt: Date | null
  approvedAt: Date | null
  approvedById: string | null
  entries: TimesheetEntryWithDetails[]
  user: { id: string; name: string | null }
  schoolId: string
}

export interface TimesheetEntryWithDetails {
  id: string
  timesheetId: string
  date: Date
  hoursWorked: number
  description: string | null
  taskType: string | null
}

export interface TimesheetDashboardStats {
  periodsCount: number
  entriesCount: number
  pendingTimesheetsCount: number
  approvedTimesheetsCount: number
  totalHours: number
}

export interface TimesheetActionResult {
  success: boolean
  data?: TimesheetWithEntries
  error?: string
}
