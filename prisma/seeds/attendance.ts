// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attendance Seed
 * Creates 60 days of attendance records with realistic MENA patterns
 *
 * Phase 13: Operations (Attendance)
 *
 * Features:
 * - 60 school days (~12 weeks of Term 1)
 * - Student behavior patterns (80% consistent, 10% frequently late, 5% chronic absent, 5% mixed)
 * - Day-of-week variation (Sunday/Thursday higher absence)
 * - Ramadan effect (last 2 weeks: +15% late, +5% absent)
 * - Mixed methods: 65% MANUAL, 20% QR_CODE, 10% BARCODE, 5% KIOSK
 * - Period tracking for 30% of secondary students
 * - createMany batch processing for performance
 */

import type {
  AttendanceMethod,
  AttendanceStatus,
  PrismaClient,
} from "@prisma/client"

import type { PeriodRef, StudentRef, TeacherRef } from "./types"
import { logPhase, logSuccess, randomNumber } from "./utils"

// ============================================================================
// CONFIGURATION
// ============================================================================

const ATTENDANCE_DAYS = 60
const SCHOOL_DAYS = [0, 1, 2, 3, 4] // Sunday to Thursday
const BATCH_SIZE = 500

// Student behavior categories (assigned once, consistent across days)
type StudentPattern =
  | "consistent"
  | "frequently_late"
  | "chronic_absent"
  | "mixed"

// Ramadan 2026 starts ~Feb 18 - for 2025 term we simulate last 2 weeks of term as "Ramadan effect"
const RAMADAN_EFFECT_START_DAY = 50 // Day 50-60 get Ramadan adjustments

// Method distribution
const METHOD_WEIGHTS: { method: AttendanceMethod; weight: number }[] = [
  { method: "MANUAL", weight: 65 },
  { method: "QR_CODE", weight: 85 },
  { method: "BARCODE", weight: 95 },
  { method: "KIOSK", weight: 100 },
]

// ============================================================================
// HELPERS
// ============================================================================

function getMethod(): AttendanceMethod {
  const rand = randomNumber(1, 100)
  for (const { method, weight } of METHOD_WEIGHTS) {
    if (rand <= weight) return method
  }
  return "MANUAL"
}

function assignPattern(index: number): StudentPattern {
  const bucket = index % 100
  if (bucket < 80) return "consistent"
  if (bucket < 90) return "frequently_late"
  if (bucket < 95) return "chronic_absent"
  return "mixed"
}

function getStatus(
  pattern: StudentPattern,
  dayOfWeek: number,
  dayIndex: number
): AttendanceStatus {
  const isWeekendBorder = dayOfWeek === 0 || dayOfWeek === 4 // Sunday or Thursday
  const isRamadan = dayIndex >= RAMADAN_EFFECT_START_DAY

  let presentProb: number
  let lateProb: number
  let absentProb: number

  switch (pattern) {
    case "consistent":
      presentProb = 90
      lateProb = 6
      absentProb = 3
      break
    case "frequently_late":
      presentProb = 50
      lateProb = 35
      absentProb = 10
      break
    case "chronic_absent":
      presentProb = 40
      lateProb = 10
      absentProb = 40
      break
    case "mixed":
      presentProb = 70
      lateProb = 15
      absentProb = 10
      break
  }

  // Day-of-week adjustment
  if (isWeekendBorder) {
    presentProb -= 5
    absentProb += 3
    lateProb += 2
  }

  // Ramadan effect
  if (isRamadan) {
    presentProb -= 20
    lateProb += 15
    absentProb += 5
  }

  const rand = randomNumber(1, 100)
  if (rand <= presentProb) return "PRESENT"
  if (rand <= presentProb + lateProb) return "LATE"
  if (rand <= presentProb + lateProb + absentProb) return "ABSENT"
  return "EXCUSED"
}

function getSchoolDays(startDate: Date, count: number): Date[] {
  const days: Date[] = []
  const current = new Date(startDate)
  while (days.length < count) {
    if (SCHOOL_DAYS.includes(current.getDay())) {
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return days
}

// ============================================================================
// MAIN SEED
// ============================================================================

export async function seedAttendance(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  teachers: TeacherRef[],
  periods?: PeriodRef[]
): Promise<number> {
  logPhase(12, "OPERATIONS - ATTENDANCE", "الحضور - 60 يوماً")

  // Delete existing attendance for clean re-seed
  await prisma.attendance.deleteMany({ where: { schoolId } })

  const termStart = new Date("2025-09-01")
  const schoolDays = getSchoolDays(termStart, ATTENDANCE_DAYS)

  // Each student is marked in their own section (classes are retired)
  const placed = await prisma.student.findMany({
    where: { schoolId, sectionId: { not: null } },
    select: { id: true, sectionId: true },
  })
  const sectionOf = new Map(placed.map((p) => [p.id, p.sectionId as string]))

  // Assign behavior patterns to students (deterministic by index)
  const studentPatterns = new Map<string, StudentPattern>()
  students.forEach((s, i) => {
    studentPatterns.set(s.id, assignPattern(i))
  })

  // Get teaching periods for secondary period tracking
  const teachingPeriods = (periods || []).filter(
    (p) => !p.name.toLowerCase().includes("break")
  )

  const teacher = teachers[0]
  let totalRecords = 0

  // Process in day batches
  for (let dayIndex = 0; dayIndex < schoolDays.length; dayIndex++) {
    const date = schoolDays[dayIndex]
    const dayOfWeek = date.getDay()

    // Build batch for createMany
    const records: {
      schoolId: string
      studentId: string
      sectionId: string
      date: Date
      status: AttendanceStatus
      checkInTime: Date | null
      markedBy: string | null
      markedAt: Date
      method: AttendanceMethod
      periodId: string | null
      periodName: string | null
    }[] = []

    for (const student of students) {
      const sectionId = sectionOf.get(student.id)
      if (!sectionId) continue

      const pattern = studentPatterns.get(student.id) || "consistent"
      const status = getStatus(pattern, dayOfWeek, dayIndex)
      const method = getMethod()

      let checkInTime: Date | null = null
      if (status === "PRESENT") {
        // 7:30 - 7:50 AM
        checkInTime = new Date(date)
        checkInTime.setHours(7, 30 + randomNumber(0, 20), 0, 0)
      } else if (status === "LATE") {
        // 8:05 - 8:45 AM
        checkInTime = new Date(date)
        checkInTime.setHours(8, 5 + randomNumber(0, 40), 0, 0)
      }

      const markedAt = new Date(date)
      markedAt.setHours(8, 0, 0, 0)

      // 30% of students get period-specific tracking
      const usePeriod = teachingPeriods.length > 0 && randomNumber(1, 100) <= 30

      if (usePeriod) {
        // Pick a random period
        const period =
          teachingPeriods[randomNumber(0, teachingPeriods.length - 1)]
        records.push({
          schoolId,
          studentId: student.id,
          sectionId,
          date,
          status,
          checkInTime,
          markedBy: teacher?.id || null,
          markedAt,
          method,
          periodId: period.id,
          periodName: period.name,
        })
      } else {
        records.push({
          schoolId,
          studentId: student.id,
          sectionId,
          date,
          status,
          checkInTime,
          markedBy: teacher?.id || null,
          markedAt,
          method,
          periodId: null,
          periodName: null,
        })
      }
    }

    // Insert in batches using createMany
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      try {
        const result = await prisma.attendance.createMany({
          data: batch,
          skipDuplicates: true,
        })
        totalRecords += result.count
      } catch {
        // Fall back to individual creates if batch fails (unique constraint issues)
        for (const record of batch) {
          try {
            await prisma.attendance.create({ data: record })
            totalRecords++
          } catch {
            // Skip duplicates
          }
        }
      }
    }
  }

  logSuccess(
    "Attendance Records",
    totalRecords,
    `${ATTENDANCE_DAYS} days, patterns: 80/10/5/5, mixed methods`
  )

  return totalRecords
}
