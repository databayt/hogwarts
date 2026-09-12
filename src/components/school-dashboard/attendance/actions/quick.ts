"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import type { ActionResponse } from "./core"
import { guardAttendance } from "./helpers"
import {
  quickSubmitSchema,
  submitQuickAttendanceCore,
  type QuickSubmitSummary,
} from "./quick-core"

// ============================================================================
// QUICK ATTENDANCE — teacher-first, absent-oriented marking
//
// Design: most students are present, so the teacher only touches the
// exceptions. submitQuickAttendance expands "absent/late lists + section"
// into a full roster submission and delegates to markAttendance (the
// hardened batch path: revive-on-update, auto-excuse from approved
// intentions, guardian notifications on ABSENT).
// ============================================================================

interface QuickSection {
  id: string
  name: string
  gradeName: string
  studentCount: number
  markedCount: number
  /** true when the section appears in one of the teacher's timetable slots today */
  scheduledToday: boolean
  periodName: string | null
  periodStart: string | null // "HH:mm"
  periodEnd: string | null // "HH:mm"
  /** the slot whose period window contains the current wall-clock time */
  isCurrent: boolean
}

/** "HH:mm" from a @db.Time value (stored on the 1970-01-01 epoch date). */
function timeHHmm(t: Date | null | undefined): string | null {
  if (!t) return null
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(
    t.getUTCMinutes()
  ).padStart(2, "0")}`
}

/**
 * Everything the quick-marking surface needs in one round trip:
 * today (+ isSchoolDay from SchoolWeekConfig), the caller's sections
 * (teacher: homeroom + timetable sections, current period first;
 * admin/staff: all sections), and each section's marked state for today.
 */
export async function getQuickMarkingContext(): Promise<
  ActionResponse<{
    today: string
    isSchoolDay: boolean
    sections: QuickSection[]
  }>
> {
  try {
    const g = await guardAttendance("mark")
    if (!g.ok) return g.error
    const { schoolId, userId, role } = g

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay()

    // Teacher identity + scoping
    let teacherId: string | null = null
    if (role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { schoolId, userId },
        select: { id: true },
      })
      if (!teacher) {
        return {
          success: true,
          data: { today: today.toISOString(), isSchoolDay: true, sections: [] },
        }
      }
      teacherId = teacher.id
    }

    const [weekConfigs, todaySlots, sections] = await Promise.all([
      db.schoolWeekConfig.findMany({
        where: { schoolId },
        select: { termId: true, workingDays: true, updatedAt: true },
      }),
      // Today's timetable slots (teacher-scoped when applicable) — gives the
      // "what am I teaching right now" ordering + current-period highlight.
      db.timetable.findMany({
        where: {
          schoolId,
          dayOfWeek,
          sectionId: { not: null },
          ...(teacherId ? { teacherId } : {}),
        },
        select: {
          sectionId: true,
          period: {
            select: { name: true, startTime: true, endTime: true },
          },
        },
      }),
      db.section.findMany({
        where: {
          schoolId,
          ...(teacherId
            ? {
                OR: [
                  { homeroomTeacherId: teacherId },
                  {
                    timetables: {
                      some: { schoolId, teacherId, sectionId: { not: null } },
                    },
                  },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          grade: { select: { name: true } },
          _count: { select: { students: true } },
        },
        orderBy: { name: "asc" },
      }),
    ])

    const weekConfig =
      weekConfigs.find((c) => c.termId === null) ??
      weekConfigs.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )[0]
    const isSchoolDay = weekConfig
      ? weekConfig.workingDays.includes(dayOfWeek)
      : true

    // Today's marked counts per section (distinct students with any record)
    const sectionIds = sections.map((s) => s.id)
    const markedRows = sectionIds.length
      ? await db.attendance.groupBy({
          by: ["sectionId"],
          where: {
            schoolId,
            sectionId: { in: sectionIds },
            date: today,
            periodId: null,
            deletedAt: null,
          },
          _count: { studentId: true },
        })
      : []
    const markedBySection = new Map(
      markedRows.map((r) => [r.sectionId, r._count.studentId])
    )

    // Slot lookup: earliest slot per section; current-period detection via
    // wall-clock HH:mm against the period's Time window.
    const now = new Date()
    const nowHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`
    const slotBySection = new Map<
      string,
      { name: string; start: string | null; end: string | null }
    >()
    for (const slot of todaySlots) {
      if (!slot.sectionId || !slot.period) continue
      const start = timeHHmm(slot.period.startTime)
      const end = timeHHmm(slot.period.endTime)
      const existing = slotBySection.get(slot.sectionId)
      if (!existing || (start && existing.start && start < existing.start)) {
        slotBySection.set(slot.sectionId, {
          name: slot.period.name,
          start,
          end,
        })
      }
    }

    const result: QuickSection[] = sections.map((s) => {
      const slot = slotBySection.get(s.id)
      const isCurrent = Boolean(
        slot?.start && slot?.end && nowHHmm >= slot.start && nowHHmm <= slot.end
      )
      return {
        id: s.id,
        name: s.name,
        gradeName: s.grade?.name ?? "",
        studentCount: s._count.students,
        markedCount: markedBySection.get(s.id) ?? 0,
        scheduledToday: Boolean(slot),
        periodName: slot?.name ?? null,
        periodStart: slot?.start ?? null,
        periodEnd: slot?.end ?? null,
        isCurrent,
      }
    })

    // Current period first, then today's schedule by start time, then the rest.
    result.sort((a, b) => {
      if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1
      if (a.scheduledToday !== b.scheduledToday)
        return a.scheduledToday ? -1 : 1
      if (a.periodStart && b.periodStart && a.periodStart !== b.periodStart)
        return a.periodStart < b.periodStart ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return {
      success: true,
      data: { today: today.toISOString(), isSchoolDay, sections: result },
    }
  } catch (error) {
    console.error("[getQuickMarkingContext] Error:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_NOT_FOUND)
  }
}

/**
 * Absent-oriented submission: everyone in the section is PRESENT except the
 * listed absent/late students. The logic lives in quick-core.ts so the
 * offline sync route can replay a mark made without a connection through the
 * same ownership check, roster intersection and markAttendance path.
 */
export async function submitQuickAttendance(input: unknown): Promise<
  ActionResponse<QuickSubmitSummary>
> {
  try {
    const g = await guardAttendance("mark")
    if (!g.ok) return g.error
    const { schoolId, userId, role } = g

    const parsed = quickSubmitSchema.parse(input)
    const out = await submitQuickAttendanceCore({
      schoolId,
      userId,
      role,
      input: parsed,
    })

    switch (out.status) {
      case "marked": {
        const { status: _status, ...data } = out
        return { success: true, data }
      }
      case "forbidden":
        return actionError(ACTION_ERRORS.UNAUTHORIZED)
      case "noStudents":
        return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
      case "stale":
        // Only an offline replay can be stale; the online path never sets `at`.
        return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
      case "failed":
        return { success: false, error: out.error ?? "" }
    }
  } catch (error) {
    console.error("[submitQuickAttendance] Error:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}
