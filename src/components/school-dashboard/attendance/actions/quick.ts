"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { markAttendance, type ActionResponse } from "./core"
import { guardAttendance } from "./helpers"

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

const quickSubmitSchema = z.object({
  sectionId: z.string().min(1),
  date: z.string().min(1),
  absentStudentIds: z.array(z.string()).default([]),
  lateStudentIds: z.array(z.string()).default([]),
})

/**
 * Absent-oriented submission: everyone in the section is PRESENT except the
 * listed absent/late students. Delegates to markAttendance (revive-on-update,
 * auto-excuse, guardian notifications) after enforcing teacher-section
 * ownership, and reports how many absent students have a notifiable guardian.
 */
export async function submitQuickAttendance(input: unknown): Promise<
  ActionResponse<{
    total: number
    present: number
    absent: number
    late: number
    guardiansNotified: number
  }>
> {
  try {
    const g = await guardAttendance("mark")
    if (!g.ok) return g.error
    const { schoolId, userId, role } = g

    const parsed = quickSubmitSchema.parse(input)

    // SCOPE: a TEACHER may only quick-mark sections they own (homeroom or a
    // timetable slot on any day) — markAttendance itself is role-gated only.
    if (role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { schoolId, userId },
        select: { id: true },
      })
      const owned = teacher
        ? await db.section.findFirst({
            where: {
              id: parsed.sectionId,
              schoolId,
              OR: [
                { homeroomTeacherId: teacher.id },
                {
                  timetables: {
                    some: { schoolId, teacherId: teacher.id },
                  },
                },
              ],
            },
            select: { id: true },
          })
        : null
      if (!owned) {
        return actionError(ACTION_ERRORS.UNAUTHORIZED)
      }
    }

    // Roster from the section (tenant-scoped); submitted ids are intersected
    // against it so a foreign studentId can never ride along.
    const roster = await db.student.findMany({
      where: { schoolId, sectionId: parsed.sectionId },
      select: { id: true },
    })
    if (roster.length === 0) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }
    const rosterIds = new Set(roster.map((s) => s.id))
    const absentSet = new Set(
      parsed.absentStudentIds.filter((id) => rosterIds.has(id))
    )
    const lateSet = new Set(
      parsed.lateStudentIds.filter(
        (id) => rosterIds.has(id) && !absentSet.has(id)
      )
    )

    const records = roster.map((s) => ({
      studentId: s.id,
      status: absentSet.has(s.id)
        ? ("absent" as const)
        : lateSet.has(s.id)
          ? ("late" as const)
          : ("present" as const),
    }))

    const marked = await markAttendance({
      sectionId: parsed.sectionId,
      date: parsed.date,
      records,
    })
    if (!marked.success) {
      return { success: false, error: marked.error }
    }

    // How many of the absent students have at least one guardian with a user
    // account (i.e. will actually receive the absence notification)? Excused
    // students (approved intention) are not notified — mirror that here.
    let guardiansNotified = 0
    if (absentSet.size > 0) {
      const attendanceDate = new Date(parsed.date)
      const [excused, notifiable] = await Promise.all([
        db.absenceIntention.findMany({
          where: {
            schoolId,
            status: "APPROVED",
            dateFrom: { lte: attendanceDate },
            dateTo: { gte: attendanceDate },
            studentId: { in: [...absentSet] },
          },
          select: { studentId: true },
        }),
        db.studentGuardian.findMany({
          where: {
            schoolId,
            studentId: { in: [...absentSet] },
            guardian: { userId: { not: null } },
          },
          select: { studentId: true },
          distinct: ["studentId"],
        }),
      ])
      const excusedSet = new Set(excused.map((e) => e.studentId))
      guardiansNotified = notifiable.filter(
        (n) => !excusedSet.has(n.studentId)
      ).length
    }

    return {
      success: true,
      data: {
        total: roster.length,
        present: roster.length - absentSet.size - lateSet.size,
        absent: absentSet.size,
        late: lateSet.size,
        guardiansNotified,
      },
    }
  } catch (error) {
    console.error("[submitQuickAttendance] Error:", error)
    if (error instanceof z.ZodError) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}
