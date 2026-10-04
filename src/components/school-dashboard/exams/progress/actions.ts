"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { audienceLabel, audienceRosterWhere } from "@/lib/teaching-audience"
import { getTenantContext } from "@/lib/tenant-context"

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
  // Honour impersonation + subdomain header before falling back to the session.
  const { schoolId } = await getTenantContext()
  return schoolId
}

/** Who may manage schedules (matches the page's canManage). */
const MANAGER_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]

async function getManager(): Promise<{
  schoolId: string
  userId: string
} | null> {
  const [session, schoolId] = await Promise.all([auth(), getSchoolId()])
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!schoolId || !userId || !role || !MANAGER_ROLES.includes(role)) {
    return null
  }
  return { schoolId, userId }
}

/**
 * A schedule's scope: a section (its grade comes with it), a whole grade,
 * or neither — the whole school. Both must be this school's.
 */
async function resolveScheduleScope(
  schoolId: string,
  input: { gradeId?: string | null; sectionId?: string | null }
): Promise<
  | { ok: true; gradeId: string | null; sectionId: string | null }
  | { ok: false; code: string }
> {
  if (input.sectionId) {
    const section = await db.section.findFirst({
      where: { id: input.sectionId, schoolId },
      select: { id: true, gradeId: true },
    })
    if (!section) return { ok: false, code: ACTION_ERRORS.INVALID_SECTION }
    return { ok: true, gradeId: section.gradeId, sectionId: section.id }
  }
  if (input.gradeId) {
    const grade = await db.academicGrade.findFirst({
      where: { id: input.gradeId, schoolId },
      select: { id: true },
    })
    if (!grade) return { ok: false, code: ACTION_ERRORS.GRADE_NOT_FOUND }
    return { ok: true, gradeId: grade.id, sectionId: null }
  }
  return { ok: true, gradeId: null, sectionId: null }
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
    const manager = await getManager()
    if (!manager) {
      return { ...actionError(ACTION_ERRORS.UNAUTHORIZED), code: "NO_SCHOOL" }
    }
    const { schoolId, userId } = manager

    const parsed = progressScheduleCreateSchema.parse(input)

    const scope = await resolveScheduleScope(schoolId, parsed)
    if (!scope.ok)
      return { success: false, error: scope.code, code: scope.code }

    const nextRunAt = calculateNextRunAt(parsed.frequency)

    const schedule = await db.progressReportSchedule.create({
      data: {
        schoolId,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
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

    refreshPage("/exams/progress")
    return { success: true, data: { id: schedule.id } }
  } catch (error) {
    console.error("Error creating progress schedule:", error)
    return { ...actionError(ACTION_ERRORS.CREATE_FAILED) }
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
        section: { select: { name: true } },
        grade: { select: { name: true } },
        class: { select: { name: true } },
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return schedules.map((s) => ({
      id: s.id,
      gradeId: s.gradeId,
      sectionId: s.sectionId,
      // The scope as people say it; null = the whole school
      className: audienceLabel(s) || null,
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
        section: { select: { name: true } },
        grade: { select: { name: true } },
        class: { select: { name: true } },
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
    const manager = await getManager()
    if (!manager) {
      return { ...actionError(ACTION_ERRORS.UNAUTHORIZED), code: "NO_SCHOOL" }
    }
    const { schoolId } = manager

    const parsed = progressScheduleUpdateSchema.parse(input)
    const { id, gradeId, sectionId, ...data } = parsed

    const existing = await db.progressReportSchedule.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Schedule not found", code: "NOT_FOUND" }
    }

    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    // A new scope replaces the old one, legacy class included
    if (gradeId !== undefined || sectionId !== undefined) {
      const scope = await resolveScheduleScope(schoolId, { gradeId, sectionId })
      if (!scope.ok) {
        return { success: false, error: scope.code, code: scope.code }
      }
      updateData.gradeId = scope.gradeId
      updateData.sectionId = scope.sectionId
      updateData.classId = null
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

    refreshPage("/exams/progress")
    return { success: true }
  } catch (error) {
    console.error("Error updating progress schedule:", error)
    return { ...actionError(ACTION_ERRORS.UPDATE_FAILED) }
  }
}

export async function deleteProgressSchedule(
  id: string
): Promise<ActionResponse> {
  try {
    const manager = await getManager()
    if (!manager) {
      return { ...actionError(ACTION_ERRORS.UNAUTHORIZED), code: "NO_SCHOOL" }
    }
    const { schoolId } = manager

    const existing = await db.progressReportSchedule.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Schedule not found", code: "NOT_FOUND" }
    }

    await db.progressReportSchedule.delete({ where: { id } })

    refreshPage("/exams/progress")
    return { success: true }
  } catch (error) {
    console.error("Error deleting progress schedule:", error)
    return { ...actionError(ACTION_ERRORS.DELETE_FAILED) }
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

export async function generateProgressReports(
  scheduleId: string
): Promise<ActionResponse<GenerateReportsOutput>> {
  try {
    const manager = await getManager()
    if (!manager) {
      return { ...actionError(ACTION_ERRORS.UNAUTHORIZED), code: "NO_SCHOOL" }
    }
    const { schoolId } = manager

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

    // The scope's students: a section, a whole grade, a legacy class — or,
    // with none, the whole school
    const scoped =
      schedule.sectionId || schedule.gradeId || schedule.classId
        ? audienceRosterWhere(schoolId, {
            classId: schedule.classId,
            gradeId: schedule.gradeId,
            sectionId: schedule.sectionId,
          })
        : { schoolId }
    const students = await db.student.findMany({
      where: scoped,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
      },
    })

    let generated = 0
    let failed = 0

    for (const student of students) {
      try {
        const studentName =
          `${student.firstName} ${student.middleName || ""} ${student.lastName}`.trim()

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

    refreshPage("/exams/progress")
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
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return reports.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName:
        `${r.student.firstName} ${r.student.middleName || ""} ${r.student.lastName}`.trim(),
      reportData: r.reportData,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching generated reports:", error)
    return []
  }
}
