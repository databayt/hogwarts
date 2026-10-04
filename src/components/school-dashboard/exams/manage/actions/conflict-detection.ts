// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timetable Conflict Detection for Exam Scheduling
 */

"use server"

import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getStudentScopes, getTeacherPairs } from "@/lib/teaching-scope"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  examAudienceLabel,
  examAudienceSelect,
  examRosterWhere,
  pairExamsWhere,
  studentExamsWhere,
} from "@/components/school-dashboard/exams/lib/audience"

import type { ActionResponse } from "./types"

// Types
export interface ConflictDetail {
  type: "class" | "teacher" | "classroom" | "student"
  entityId: string
  entityName: string
  conflictingEvent: string
  conflictTime: string
  severity: "high" | "medium" | "low"
}

export interface TimeSlot {
  date: Date
  startTime: string
  endTime: string
  available: boolean
  conflicts: ConflictDetail[]
}

export interface AvailableSlot {
  startTime: string
  endTime: string
  score: number
  reasons: string[]
}

// Who sits the exam: a grade, or one of its sections.
const audienceFields = {
  gradeId: z.string().nullish(),
  sectionId: z.string().nullish(),
}

// Validation schemas
const checkConflictSchema = z.object({
  examDate: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  ...audienceFields,
  classroomId: z.string().optional(),
  teacherId: z.string().optional(),
  examId: z.string().optional(),
})

const findAvailableSlotsSchema = z.object({
  ...audienceFields,
  date: z.date(),
  duration: z.number().min(30).max(480),
  preferredPeriod: z.enum(["morning", "afternoon", "evening"]).optional(),
})

// Helper: Convert Date to day of week (0=Sunday, 6=Saturday)
function getDayOfWeek(date: Date): number {
  return date.getDay()
}

// Helper: Check if two time ranges overlap
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1)
  const e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  const e2 = timeToMinutes(end2)

  return s1 < e2 && s2 < e1
}

// Helper: Convert "HH:MM" to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Helper: Convert minutes to "HH:MM" format
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Helper: Convert DateTime @db.Time() to "HH:MM" string
function dateTimeToTimeString(date: Date): string {
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

type Audience = {
  gradeId: string | null
  sectionId: string | null
}

function toAudience(input: {
  gradeId?: string | null
  sectionId?: string | null
}): Audience {
  return {
    gradeId: input.gradeId ?? null,
    sectionId: input.sectionId ?? null,
  }
}

/** The audience's own timetable periods (this term's regular week). */
function audienceSlotsWhere(a: Audience): Prisma.TimetableWhereInput | null {
  if (a.sectionId) return { sectionId: a.sectionId }
  if (a.gradeId) return { section: { gradeId: a.gradeId } }
  return null
}

/**
 * Exams set for (part of) the same audience: the same section or its whole
 * grade, or any section of a whole-grade exam's grade.
 */
function sameAudienceExamsWhere(
  a: Audience
): Prisma.SchoolExamWhereInput | null {
  if (a.sectionId) {
    return {
      OR: [
        { sectionId: a.sectionId },
        ...(a.gradeId ? [{ sectionId: null, gradeId: a.gradeId }] : []),
      ],
    }
  }
  if (a.gradeId) return { gradeId: a.gradeId }
  return null
}

/** Section name for a timetable period. */
function slotLabel(entry: {
  section?: { name: string } | null
  subject?: { name: string } | null
}): string {
  return entry.section?.name ?? entry.subject?.name ?? ""
}

/**
 * Check for exam scheduling conflicts
 */
export async function checkExamConflicts(
  input: z.infer<typeof checkConflictSchema>
): Promise<
  ActionResponse<{
    hasConflicts: boolean
    conflicts: ConflictDetail[]
    suggestions?: AvailableSlot[]
  }>
> {
  try {
    const validated = checkConflictSchema.parse(input)
    const { examDate, startTime, endTime, classroomId, teacherId, examId } =
      validated
    const audience = toAudience(validated)

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const conflicts: ConflictDetail[] = []
    const dayOfWeek = getDayOfWeek(examDate)
    const { term } = await resolveActiveTerm(schoolId)
    const termWhere = term ? { termId: term.id, weekOffset: 0 } : {}
    const notThisExam = examId ? { NOT: { id: examId } } : {}
    const slotInclude = {
      period: true,
      section: { select: { name: true } },
      subject: { select: { name: true } },
    } as const

    // 1. The audience's own timetable periods on this day
    const ownSlots = audienceSlotsWhere(audience)
    if (ownSlots) {
      const timetableEntries = await db.timetable.findMany({
        where: { schoolId, dayOfWeek, ...termWhere, ...ownSlots },
        include: slotInclude,
      })

      for (const entry of timetableEntries) {
        const periodStart = dateTimeToTimeString(entry.period.startTime)
        const periodEnd = dateTimeToTimeString(entry.period.endTime)

        if (timeRangesOverlap(startTime, endTime, periodStart, periodEnd)) {
          conflicts.push({
            type: "class",
            entityId: entry.sectionId ?? "",
            entityName: slotLabel(entry),
            conflictingEvent: `Scheduled class period: ${entry.period.name}`,
            conflictTime: `${periodStart} - ${periodEnd}`,
            severity: "high",
          })
        }
      }
    }

    // 2. Overlapping exams for the same audience
    const sameAudience = sameAudienceExamsWhere(audience)
    const reported = new Set<string>()
    if (sameAudience) {
      const audienceExams = await db.schoolExam.findMany({
        where: { schoolId, examDate, ...notThisExam, ...sameAudience },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          subject: { select: { name: true } },
          ...examAudienceSelect,
        },
      })

      for (const exam of audienceExams) {
        if (
          timeRangesOverlap(startTime, endTime, exam.startTime, exam.endTime)
        ) {
          reported.add(exam.id)
          conflicts.push({
            type: "class",
            entityId: exam.sectionId ?? exam.gradeId ?? "",
            entityName: examAudienceLabel(exam),
            conflictingEvent: `${exam.subject.name} exam: ${exam.title}`,
            conflictTime: `${exam.startTime} - ${exam.endTime}`,
            severity: "high",
          })
        }
      }
    }

    // 3. Check teacher conflicts (if teacherId provided)
    if (teacherId) {
      // Check teacher's timetable on this day
      const teacherTimetable = await db.timetable.findMany({
        where: { schoolId, teacherId, dayOfWeek, ...termWhere },
        include: { ...slotInclude, teacher: true },
      })

      for (const entry of teacherTimetable) {
        const periodStart = dateTimeToTimeString(entry.period.startTime)
        const periodEnd = dateTimeToTimeString(entry.period.endTime)

        if (timeRangesOverlap(startTime, endTime, periodStart, periodEnd)) {
          conflicts.push({
            type: "teacher",
            entityId: entry.teacherId ?? "",
            entityName: entry.teacher
              ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
              : "",
            conflictingEvent: `Teaching ${slotLabel(entry) || "Unknown"} - ${entry.period.name}`,
            conflictTime: `${periodStart} - ${periodEnd}`,
            severity: "medium",
          })
        }
      }

      // The teacher's other exams that day: a section / grade where they
      // teach the exam's subject.
      const pairs = await getTeacherPairs(schoolId, teacherId)
      const teacherExams = await db.schoolExam.findMany({
        where: {
          schoolId,
          examDate,
          ...notThisExam,
          OR: pairExamsWhere(pairs),
        },
        select: {
          startTime: true,
          endTime: true,
          subject: { select: { name: true } },
          ...examAudienceSelect,
        },
      })

      for (const exam of teacherExams) {
        if (
          timeRangesOverlap(startTime, endTime, exam.startTime, exam.endTime)
        ) {
          conflicts.push({
            type: "teacher",
            entityId: teacherId,
            entityName: "Teacher", // Would need to fetch teacher separately for name
            conflictingEvent: `Proctoring ${examAudienceLabel(exam)} - ${exam.subject.name}`,
            conflictTime: `${exam.startTime} - ${exam.endTime}`,
            severity: "medium",
          })
        }
      }
    }

    // 4. Check classroom conflicts (if classroomId provided)
    if (classroomId) {
      // Check classroom timetable on this day
      const classroomTimetable = await db.timetable.findMany({
        where: { schoolId, classroomId, dayOfWeek, ...termWhere },
        include: { ...slotInclude, classroom: true },
      })

      for (const entry of classroomTimetable) {
        const periodStart = dateTimeToTimeString(entry.period.startTime)
        const periodEnd = dateTimeToTimeString(entry.period.endTime)

        if (timeRangesOverlap(startTime, endTime, periodStart, periodEnd)) {
          conflicts.push({
            type: "classroom",
            entityId: entry.classroomId,
            entityName: entry.classroom.roomName,
            conflictingEvent: `Occupied by ${slotLabel(entry) || "Unknown"} - ${entry.period.name}`,
            conflictTime: `${periodStart} - ${periodEnd}`,
            severity: "medium",
          })
        }
      }

      // The room's other exams that day: sections homed there.
      const classroomExams = await db.schoolExam.findMany({
        where: {
          schoolId,
          examDate,
          ...notThisExam,
          section: { classroomId },
        },
        select: {
          startTime: true,
          endTime: true,
          subject: { select: { name: true } },
          ...examAudienceSelect,
        },
      })

      for (const exam of classroomExams) {
        if (
          timeRangesOverlap(startTime, endTime, exam.startTime, exam.endTime)
        ) {
          conflicts.push({
            type: "classroom",
            entityId: classroomId,
            entityName: "Classroom",
            conflictingEvent: `${examAudienceLabel(exam)} - ${exam.subject.name} exam`,
            conflictTime: `${exam.startTime} - ${exam.endTime}`,
            severity: "medium",
          })
        }
      }
    }

    // 5. Students who sit this exam and another one at the same time
    const roster = await db.student.findMany({
      where: examRosterWhere(schoolId, audience),
      select: { id: true },
    })

    if (roster.length > 0) {
      const scopes = await getStudentScopes(
        schoolId,
        roster.map((s) => s.id)
      )
      const otherExams = await db.schoolExam.findMany({
        where: {
          schoolId,
          examDate,
          ...notThisExam,
          ...(reported.size > 0 ? { id: { notIn: [...reported] } } : {}),
          ...studentExamsWhere(scopes),
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          subject: { select: { name: true } },
          ...examAudienceSelect,
        },
      })

      for (const exam of otherExams) {
        if (
          timeRangesOverlap(startTime, endTime, exam.startTime, exam.endTime)
        ) {
          const affectedStudents = scopes.filter(
            (s) =>
              (exam.sectionId && s.sectionId === exam.sectionId) ||
              (!exam.sectionId && exam.gradeId && s.gradeId === exam.gradeId)
          ).length

          conflicts.push({
            type: "student",
            entityId: exam.sectionId ?? exam.gradeId ?? "",
            entityName: `${affectedStudents} student(s) in ${examAudienceLabel(exam)}`,
            conflictingEvent: `${exam.subject.name}: ${exam.title}`,
            conflictTime: `${exam.startTime} - ${exam.endTime}`,
            severity: "low",
          })
        }
      }
    }

    return {
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input",
        details: error.issues,
      }
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check conflicts",
    }
  }
}

/**
 * Find available time slots for an exam
 */
export async function findAvailableExamSlots(
  input: z.infer<typeof findAvailableSlotsSchema>
): Promise<ActionResponse<AvailableSlot[]>> {
  try {
    const validated = findAvailableSlotsSchema.parse(input)
    const { date, duration, preferredPeriod } = validated
    const audience = toAudience(validated)

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const dayOfWeek = getDayOfWeek(date)
    const { term } = await resolveActiveTerm(schoolId)
    const ownSlots = audienceSlotsWhere(audience)
    const sameAudience = sameAudienceExamsWhere(audience)

    // The audience's timetable periods on this day
    const timetableEntries = ownSlots
      ? await db.timetable.findMany({
          where: {
            schoolId,
            dayOfWeek,
            ...(term ? { termId: term.id, weekOffset: 0 } : {}),
            ...ownSlots,
          },
          include: { period: true },
        })
      : []

    // The audience's other exams on this date
    const existingExams = sameAudience
      ? await db.schoolExam.findMany({
          where: { schoolId, examDate: date, ...sameAudience },
          select: { startTime: true, endTime: true },
        })
      : []

    // Generate potential time slots (08:00 to 16:00 in 30-minute increments)
    const startHour = 8
    const endHour = 16
    const slotIncrement = 30 // minutes
    const potentialSlots: AvailableSlot[] = []

    for (
      let startMinutes = startHour * 60;
      startMinutes < endHour * 60;
      startMinutes += slotIncrement
    ) {
      const endMinutes = startMinutes + duration
      if (endMinutes > endHour * 60) break

      const slotStart = minutesToTime(startMinutes)
      const slotEnd = minutesToTime(endMinutes)

      // Check for conflicts with timetable
      let hasConflict = false
      for (const entry of timetableEntries) {
        const periodStart = dateTimeToTimeString(entry.period.startTime)
        const periodEnd = dateTimeToTimeString(entry.period.endTime)

        if (timeRangesOverlap(slotStart, slotEnd, periodStart, periodEnd)) {
          hasConflict = true
          break
        }
      }

      // Check for conflicts with existing exams
      if (!hasConflict) {
        for (const exam of existingExams) {
          if (
            timeRangesOverlap(slotStart, slotEnd, exam.startTime, exam.endTime)
          ) {
            hasConflict = true
            break
          }
        }
      }

      // If no conflict, add as available slot
      if (!hasConflict) {
        const reasons: string[] = []
        let score = 100

        // Score based on time of day preference
        const startMins = timeToMinutes(slotStart)
        if (startMins >= 8 * 60 && startMins < 10 * 60) {
          score += 20
          reasons.push("Early morning slot (good focus)")
        } else if (startMins >= 10 * 60 && startMins < 12 * 60) {
          score += 10
          reasons.push("Late morning slot")
        } else if (startMins >= 12 * 60 && startMins < 14 * 60) {
          score -= 10
          reasons.push("Post-lunch slot (lower energy)")
        } else if (startMins >= 14 * 60 && startMins < 16 * 60) {
          score += 5
          reasons.push("Afternoon slot")
        }

        // Apply preferred period bonus
        if (preferredPeriod === "morning" && startMins < 12 * 60) {
          score += 15
          reasons.push("Matches morning preference")
        } else if (preferredPeriod === "afternoon" && startMins >= 12 * 60) {
          score += 15
          reasons.push("Matches afternoon preference")
        }

        potentialSlots.push({
          startTime: slotStart,
          endTime: slotEnd,
          score,
          reasons,
        })
      }
    }

    // Sort by score (highest first)
    potentialSlots.sort((a, b) => b.score - a.score)

    return {
      success: true,
      data: potentialSlots,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input",
        details: error.issues,
      }
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to find available slots",
    }
  }
}
