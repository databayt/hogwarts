/**
 * Timetable Conflict Detection for Exam Scheduling
 */

"use server"

import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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

// Validation schemas
const checkConflictSchema = z.object({
  examDate: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  classId: z.string(),
  classroomId: z.string().optional(),
  teacherId: z.string().optional(),
  examId: z.string().optional(),
})

const findAvailableSlotsSchema = z.object({
  classId: z.string(),
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
    const {
      examDate,
      startTime,
      endTime,
      classId,
      classroomId,
      teacherId,
      examId,
    } = validated

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const conflicts: ConflictDetail[] = []
    const dayOfWeek = getDayOfWeek(examDate)

    // 1. Check timetable conflicts for the class on this day
    const timetableEntries = await db.timetable.findMany({
      where: {
        schoolId,
        classId,
        dayOfWeek,
      },
      include: {
        period: true,
        class: true,
        teacher: true,
        classroom: true,
      },
    })

    for (const entry of timetableEntries) {
      const periodStart = dateTimeToTimeString(entry.period.startTime)
      const periodEnd = dateTimeToTimeString(entry.period.endTime)

      if (timeRangesOverlap(startTime, endTime, periodStart, periodEnd)) {
        conflicts.push({
          type: "class",
          entityId: entry.classId,
          entityName: entry.class.name,
          conflictingEvent: `Scheduled class period: ${entry.period.name}`,
          conflictTime: `${periodStart} - ${periodEnd}`,
          severity: "high",
        })
      }
    }

    // 2. Check for overlapping exams for the same class
    const classExams = await db.exam.findMany({
      where: {
        schoolId,
        classId,
        examDate,
        ...(examId ? { NOT: { id: examId } } : {}),
      },
      include: {
        class: true,
        subject: true,
      },
    })

    for (const exam of classExams) {
      if (timeRangesOverlap(startTime, endTime, exam.startTime, exam.endTime)) {
        conflicts.push({
          type: "class",
          entityId: exam.classId,
          entityName: exam.class.name,
          conflictingEvent: `${exam.subject.subjectName} exam: ${exam.title}`,
          conflictTime: `${exam.startTime} - ${exam.endTime}`,
          severity: "high",
        })
      }
    }

    // 3. Check teacher conflicts (if teacherId provided)
    if (teacherId) {
      // Check teacher's timetable on this day
      const teacherTimetable = await db.timetable.findMany({
        where: {
          schoolId,
          teacherId,
          dayOfWeek,
        },
        include: {
          period: true,
          teacher: true,
          class: true,
        },
      })

      for (const entry of teacherTimetable) {
        const periodStart = dateTimeToTimeString(entry.period.startTime)
        const periodEnd = dateTimeToTimeString(entry.period.endTime)

        if (timeRangesOverlap(startTime, endTime, periodStart, periodEnd)) {
          conflicts.push({
            type: "teacher",
            entityId: entry.teacherId,
            entityName: `${entry.teacher.givenName} ${entry.teacher.surname}`,
            conflictingEvent: `Teaching ${entry.class.name} - ${entry.period.name}`,
            conflictTime: `${periodStart} - ${periodEnd}`,
            severity: "medium",
          })
        }
      }

      // Check teacher's other exams on same date
      const teacherExams = await db.exam.findMany({
        where: {
          schoolId,
          examDate,
          class: {
            classTeachers: {
              some: { teacherId },
            },
          },
          ...(examId ? { NOT: { id: examId } } : {}),
        },
        include: {
          class: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              subjectName: true,
            },
          },
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
            conflictingEvent: `Proctoring ${exam.class.name} - ${exam.subject.subjectName}`,
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
        where: {
          schoolId,
          classroomId,
          dayOfWeek,
        },
        include: {
          period: true,
          classroom: true,
          class: true,
        },
      })

      for (const entry of classroomTimetable) {
        const periodStart = dateTimeToTimeString(entry.period.startTime)
        const periodEnd = dateTimeToTimeString(entry.period.endTime)

        if (timeRangesOverlap(startTime, endTime, periodStart, periodEnd)) {
          conflicts.push({
            type: "classroom",
            entityId: entry.classroomId,
            entityName: entry.classroom.roomName,
            conflictingEvent: `Occupied by ${entry.class.name} - ${entry.period.name}`,
            conflictTime: `${periodStart} - ${periodEnd}`,
            severity: "medium",
          })
        }
      }

      // Check classroom's other exams on same date
      const classroomExams = await db.exam.findMany({
        where: {
          schoolId,
          examDate,
          class: {
            classroomId,
          },
          ...(examId ? { NOT: { id: examId } } : {}),
        },
        include: {
          class: true,
          subject: true,
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
            conflictingEvent: `${exam.class.name} - ${exam.subject.subjectName} exam`,
            conflictTime: `${exam.startTime} - ${exam.endTime}`,
            severity: "medium",
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
    const { classId, date, duration, preferredPeriod } = validated

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const dayOfWeek = getDayOfWeek(date)

    // Get existing timetable entries for the class on this day
    const timetableEntries = await db.timetable.findMany({
      where: {
        schoolId,
        classId,
        dayOfWeek,
      },
      include: {
        period: true,
      },
    })

    // Get existing exams for the class on this date
    const existingExams = await db.exam.findMany({
      where: {
        schoolId,
        classId,
        examDate: date,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

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
