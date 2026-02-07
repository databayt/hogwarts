"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import type {
  ActionResponse,
  GeneratedReportSummary,
  GenerateReportsOutput,
  ProgressScheduleSummary,
} from "./types"
import {
  progressScheduleCreateSchema,
  progressScheduleUpdateSchema,
} from "./validation"

// Types available from "./types" directly (not re-exported from "use server" module)

// ============================================================================
// HELPERS
// ============================================================================

async function getSchoolId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.schoolId ?? null
}

async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

function calculateNextRunAt(frequency: string, from: Date = new Date()): Date {
  const next = new Date(from)
  switch (frequency) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7)
      break
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14)
      break
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1)
      break
    case "TERM_END":
      next.setMonth(next.getMonth() + 3)
      break
  }
  return next
}

// ============================================================================
// SCHEDULE CRUD
// ============================================================================

export async function createProgressSchedule(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const schoolId = await getSchoolId()
    const userId = await getUserId()

    if (!schoolId || !userId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = progressScheduleCreateSchema.parse(input)

    // Validate classId if provided
    if (parsed.classId) {
      const classExists = await db.class.findFirst({
        where: { id: parsed.classId, schoolId },
      })
      if (!classExists) {
        return {
          success: false,
          error: "Class not found",
          code: "CLASS_NOT_FOUND",
        }
      }
    }

    const nextRunAt = calculateNextRunAt(parsed.frequency)

    const schedule = await db.progressReportSchedule.create({
      data: {
        schoolId,
        classId: parsed.classId ?? null,
        frequency: parsed.frequency,
        includeExamResults: parsed.includeExamResults,
        includeAttendance: parsed.includeAttendance,
        includeAssignments: parsed.includeAssignments,
        includeBehavior: parsed.includeBehavior,
        recipientTypes: parsed.recipientTypes,
        channels: parsed.channels,
        nextRunAt,
        createdBy: userId,
      },
    })

    revalidatePath("/exams/progress")
    return { success: true, data: { id: schedule.id } }
  } catch (error) {
    console.error("Error creating progress schedule:", error)
    return {
      success: false,
      error: "Failed to create schedule",
      code: "CREATE_FAILED",
    }
  }
}

export async function getProgressSchedules(): Promise<
  ProgressScheduleSummary[]
> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return []

    const schedules = await db.progressReportSchedule.findMany({
      where: { schoolId },
      include: {
        class: {
          select: { name: true },
        },
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return schedules.map((s) => ({
      id: s.id,
      classId: s.classId,
      className: s.class?.name ?? null,
      frequency: s.frequency,
      isActive: s.isActive,
      includeExamResults: s.includeExamResults,
      includeAttendance: s.includeAttendance,
      includeAssignments: s.includeAssignments,
      includeBehavior: s.includeBehavior,
      recipientTypes: s.recipientTypes,
      channels: s.channels,
      lastRunAt: s.lastRunAt,
      nextRunAt: s.nextRunAt,
      reportCount: s._count.reports,
      createdAt: s.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching progress schedules:", error)
    return []
  }
}

export async function getProgressSchedule(id: string) {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return null

    return await db.progressReportSchedule.findFirst({
      where: { id, schoolId },
      include: {
        class: {
          select: { name: true },
        },
        _count: {
          select: { reports: true },
        },
      },
    })
  } catch (error) {
    console.error("Error fetching progress schedule:", error)
    return null
  }
}

export async function updateProgressSchedule(
  input: unknown
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = progressScheduleUpdateSchema.parse(input)
    const { id, ...data } = parsed

    const existing = await db.progressReportSchedule.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Schedule not found", code: "NOT_FOUND" }
    }

    // Validate classId if provided
    if (data.classId) {
      const classExists = await db.class.findFirst({
        where: { id: data.classId, schoolId },
      })
      if (!classExists) {
        return {
          success: false,
          error: "Class not found",
          code: "CLASS_NOT_FOUND",
        }
      }
    }

    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    // Recalculate nextRunAt if frequency changed
    if (data.frequency && data.frequency !== existing.frequency) {
      updateData.nextRunAt = calculateNextRunAt(
        data.frequency,
        existing.lastRunAt ?? new Date()
      )
    }

    await db.progressReportSchedule.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/exams/progress")
    return { success: true }
  } catch (error) {
    console.error("Error updating progress schedule:", error)
    return {
      success: false,
      error: "Failed to update schedule",
      code: "UPDATE_FAILED",
    }
  }
}

export async function deleteProgressSchedule(
  id: string
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const existing = await db.progressReportSchedule.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Schedule not found", code: "NOT_FOUND" }
    }

    await db.progressReportSchedule.delete({ where: { id } })

    revalidatePath("/exams/progress")
    return { success: true }
  } catch (error) {
    console.error("Error deleting progress schedule:", error)
    return {
      success: false,
      error: "Failed to delete schedule",
      code: "DELETE_FAILED",
    }
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

export async function generateProgressReports(
  scheduleId: string
): Promise<ActionResponse<GenerateReportsOutput>> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const schedule = await db.progressReportSchedule.findFirst({
      where: { id: scheduleId, schoolId, isActive: true },
    })

    if (!schedule) {
      return {
        success: false,
        error: "Schedule not found or inactive",
        code: "SCHEDULE_NOT_FOUND",
      }
    }

    // Get students based on scope
    const students = await db.student.findMany({
      where: {
        schoolId,
        ...(schedule.classId
          ? {
              studentClasses: {
                some: { classId: schedule.classId },
              },
            }
          : {}),
      },
      select: {
        id: true,
        givenName: true,
        middleName: true,
        surname: true,
      },
    })

    let generated = 0
    let failed = 0

    for (const student of students) {
      try {
        const studentName =
          `${student.givenName} ${student.middleName || ""} ${student.surname}`.trim()

        // Collect report data based on toggles
        const reportData: Record<string, unknown> = {
          studentId: student.id,
          studentName,
          generatedAt: new Date(),
        }

        // Include exam results if enabled
        if (schedule.includeExamResults) {
          const examResults = await db.examResult.findMany({
            where: {
              studentId: student.id,
              schoolId,
            },
            include: {
              exam: {
                select: { title: true, examDate: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10, // Last 10 exams
          })

          reportData.examResults = examResults.map((r) => ({
            examTitle: r.exam.title,
            examDate: r.exam.examDate,
            percentage: r.percentage,
            grade: r.grade,
            isAbsent: r.isAbsent,
          }))
        }

        // Include attendance if enabled
        if (schedule.includeAttendance) {
          const attendanceStats = await db.attendance.groupBy({
            by: ["status"],
            where: {
              studentId: student.id,
              schoolId,
            },
            _count: true,
          })

          reportData.attendance = {
            present:
              attendanceStats.find((s) => s.status === "PRESENT")?._count || 0,
            absent:
              attendanceStats.find((s) => s.status === "ABSENT")?._count || 0,
            late: attendanceStats.find((s) => s.status === "LATE")?._count || 0,
            excused:
              attendanceStats.find((s) => s.status === "EXCUSED")?._count || 0,
          }
        }

        // Include assignments if enabled (placeholder - requires Assignment model)
        if (schedule.includeAssignments) {
          reportData.assignments = {
            note: "Assignment data not available",
          }
        }

        // Include behavior if enabled (placeholder - requires Behavior model)
        if (schedule.includeBehavior) {
          reportData.behavior = {
            note: "Behavior data not available",
          }
        }

        // Create generated report
        await db.generatedProgressReport.create({
          data: {
            schoolId,
            scheduleId: schedule.id,
            studentId: student.id,
            reportData: reportData as any,
          },
        })

        generated++
      } catch (error) {
        console.error(
          `Error generating report for student ${student.id}:`,
          error
        )
        failed++
      }
    }

    // Update schedule's lastRunAt and nextRunAt
    const now = new Date()
    const nextRunAt = calculateNextRunAt(schedule.frequency, now)

    await db.progressReportSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: now,
        nextRunAt,
      },
    })

    revalidatePath("/exams/progress")
    return {
      success: true,
      data: { generated, failed },
    }
  } catch (error) {
    console.error("Error generating progress reports:", error)
    return {
      success: false,
      error: "Failed to generate reports",
      code: "GENERATE_FAILED",
    }
  }
}

export async function getGeneratedReports(
  scheduleId: string
): Promise<GeneratedReportSummary[]> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return []

    const reports = await db.generatedProgressReport.findMany({
      where: {
        scheduleId,
        schoolId,
      },
      include: {
        student: {
          select: {
            givenName: true,
            middleName: true,
            surname: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return reports.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName:
        `${r.student.givenName} ${r.student.middleName || ""} ${r.student.surname}`.trim(),
      reportData: r.reportData,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching generated reports:", error)
    return []
  }
}
