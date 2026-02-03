/**
 * Timesheet Module - Server Actions
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

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
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const data = {
      name: formData.get("name"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    }

    const validated = timesheetSchema.parse(data)

    const timesheet = await db.timesheetPeriod.create({
      data: {
        ...validated,
        schoolId: session.user.schoolId,
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
      error:
        error instanceof Error ? error.message : "Failed to create timesheet",
    }
  }
}

export async function addTimesheetEntry(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

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
          schoolId: session.user.schoolId!,
        },
      })

      // Get updated timesheet period
      const timesheet = await tx.timesheetPeriod.findUnique({
        where: {
          id: validated.periodId,
          schoolId: session.user.schoolId,
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
      error: error instanceof Error ? error.message : "Failed to add entry",
    }
  }
}

export async function submitTimesheet(timesheetId: string) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const timesheet = await db.timesheetPeriod.update({
      where: {
        id: timesheetId,
        schoolId: session.user.schoolId,
      },
      data: {
        status: "CLOSED",
        closedBy: session.user.id,
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
      error:
        error instanceof Error ? error.message : "Failed to submit timesheet",
    }
  }
}

export async function approveTimesheet(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const data = {
      timesheetId: formData.get("timesheetId"),
      status: formData.get("status"),
      notes: formData.get("notes") || undefined,
    }

    const validated = timesheetApprovalSchema.parse(data)

    const timesheet = await db.timesheetPeriod.update({
      where: {
        id: validated.timesheetId,
        schoolId: session.user.schoolId,
      },
      data: {
        status: validated.status,
        closedBy: session.user.id,
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
      error:
        error instanceof Error ? error.message : "Failed to approve timesheet",
    }
  }
}

export async function getTimesheets(filters?: {
  status?: string
  userId?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const timesheets = await db.timesheetPeriod.findMany({
      where: {
        schoolId: session.user.schoolId,
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
    return { success: false, error: "Failed to fetch timesheets" }
  }
}
