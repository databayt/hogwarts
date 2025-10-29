/**
 * Timesheet Module - Type Definitions
 */

import type { PeriodStatus, EntryStatus } from '@prisma/client'
import type { timesheetSchema, timesheetEntrySchema } from './validation'
import type { z } from 'zod'

export type TimesheetInput = z.infer<typeof timesheetSchema>
export type TimesheetEntryInput = z.infer<typeof timesheetEntrySchema>

export interface TimesheetPeriodWithEntries {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: PeriodStatus
  closedBy: string | null
  closedAt: Date | null
  entries: TimesheetEntryWithDetails[]
  schoolId: string
}

export interface TimesheetEntryWithDetails {
  id: string
  periodId: string
  teacherId: string
  entryDate: Date
  hoursWorked: number
  overtimeHours: number | null
  leaveHours: number | null
  leaveType: string | null
  notes: string | null
  status: EntryStatus
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
  data?: TimesheetPeriodWithEntries
  error?: string
}
