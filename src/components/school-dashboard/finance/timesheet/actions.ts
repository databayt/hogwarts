// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timesheet Module - Server Actions
 */

"use server"

import { revalidatePath } from "next/cache"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../guard"
import type { TimesheetActionResult } from "./types"
import {
  timesheetApprovalSchema,
  timesheetEntrySchema,
  timesheetSchema,
} from "./validation"

export async function createTimesheet(
  formData: FormData
): Promise<TimesheetActionResult> {
  try {
    const ctx = await requireFinanceActor("timesheet", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const data = {
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    }

    const validated = timesheetSchema.parse(data)

    const timesheet = await db.timesheetPeriod.create({
      data: {
        ...validated,
        schoolId: schoolId,
        status: "OPEN",
      },
      include: {
        entries: true,
      },
    })

    revalidatePath("/finance/timesheet")
    return { success: true, data: timesheet as any }
  } catch (error) {
    console.error("Error creating timesheet:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function addTimesheetEntry(formData: FormData) {
  try {
    const ctx = await requireFinanceActor("timesheet", "create")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const data = {
      periodId: formData.get("periodId"),
      teacherId: formData.get("teacherId"),
      entryDate: formData.get("entryDate"),
      hoursWorked: Number(formData.get("hoursWorked")),
      overtimeHours: formData.get("overtimeHours")
        ? Number(formData.get("overtimeHours"))
        : undefined,
      leaveHours: formData.get("leaveHours")
        ? Number(formData.get("leaveHours"))
        : undefined,
      leaveType: formData.get("leaveType") || undefined,
      notes: formData.get("notes") || undefined,
    }

    const validated = timesheetEntrySchema.parse(data)

    const result = await db.$transaction(async (tx) => {
      // Create entry
      const entry = await tx.timesheetEntry.create({
        data: {
          ...validated,
          schoolId: schoolId,
        },
      })

      // Get updated timesheet period
      const timesheet = await tx.timesheetPeriod.findUnique({
        where: {
          id: validated.periodId,
          schoolId: schoolId,
        },
        include: {
          entries: true,
        },
      })

      return { entry, timesheet }
    })

    revalidatePath("/finance/timesheet")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error adding timesheet entry:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function submitTimesheet(timesheetId: string) {
  try {
    const ctx = await requireFinanceActor("timesheet", "edit")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const timesheet = await db.timesheetPeriod.update({
      where: {
        id: timesheetId,
        schoolId: schoolId,
      },
      data: {
        status: "CLOSED",
        closedBy: userId,
        closedAt: new Date(),
      },
      include: {
        entries: true,
      },
    })

    revalidatePath("/finance/timesheet")
    return { success: true, data: timesheet }
  } catch (error) {
    console.error("Error submitting timesheet:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function approveTimesheet(formData: FormData) {
  try {
    const ctx = await requireFinanceActor("timesheet", "approve")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId, userId } = ctx

    const data = {
      timesheetId: formData.get("timesheetId"),
      status: formData.get("status"),
      notes: formData.get("notes") || undefined,
    }

    const validated = timesheetApprovalSchema.parse(data)

    const timesheet = await db.timesheetPeriod.update({
      where: {
        id: validated.timesheetId,
        schoolId: schoolId,
      },
      data: {
        status: validated.status,
        closedBy: userId,
        closedAt: new Date(),
      },
      include: {
        entries: true,
      },
    })

    revalidatePath("/finance/timesheet")
    return { success: true, data: timesheet }
  } catch (error) {
    console.error("Error approving timesheet:", error)
    return {
      success: false,
      error: "UNKNOWN",
    }
  }
}

export async function getTimesheets(filters?: {
  status?: string
  userId?: string
}) {
  try {
    const ctx = await requireFinanceActor("timesheet", "view")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const timesheets = await db.timesheetPeriod.findMany({
      where: {
        schoolId: schoolId,
        ...(filters?.status && { status: filters.status as any }),
      },
      include: {
        entries: {
          orderBy: { entryDate: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
      take: 50,
    })

    return { success: true, data: timesheets }
  } catch (error) {
    console.error("Error fetching timesheets:", error)
    return actionError(ACTION_ERRORS.PAYMENT_FAILED)
  }
}
