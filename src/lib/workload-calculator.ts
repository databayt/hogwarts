/**
 * Workload Calculator Utility
 *
 * Calculates teacher workload metrics based on timetable data and configurable thresholds.
 * Used for workload analytics, overload detection, and resource optimization.
 */

import { db } from "@/lib/db"

export type WorkloadStatus = "UNDERUTILIZED" | "NORMAL" | "OVERLOAD"

export interface WorkloadConfig {
  minPeriodsPerWeek: number
  normalPeriodsPerWeek: number
  maxPeriodsPerWeek: number
  overloadThreshold: number
}

export interface TeacherWorkload {
  teacherId: string
  teacherName: string
  totalPeriodsPerWeek: number
  uniqueClassesCount: number
  uniqueSubjectsCount: number
  freePeriodsCount: number
  workloadStatus: WorkloadStatus
  workloadPercentage: number
}

/**
 * Get school's workload configuration with fallback defaults
 */
export async function getWorkloadConfig(schoolId: string): Promise<WorkloadConfig> {
  const config = await db.workloadConfig.findUnique({
    where: { schoolId },
  })

  return config || {
    minPeriodsPerWeek: 15,
    normalPeriodsPerWeek: 20,
    maxPeriodsPerWeek: 25,
    overloadThreshold: 25,
  }
}

/**
 * Calculate workload status based on periods and thresholds
 */
export function calculateWorkloadStatus(
  periodsPerWeek: number,
  config: WorkloadConfig
): WorkloadStatus {
  if (periodsPerWeek < config.minPeriodsPerWeek) {
    return "UNDERUTILIZED"
  }
  if (periodsPerWeek >= config.overloadThreshold) {
    return "OVERLOAD"
  }
  return "NORMAL"
}

/**
 * Calculate workload percentage (normalized to maxPeriodsPerWeek = 100%)
 */
export function calculateWorkloadPercentage(
  periodsPerWeek: number,
  config: WorkloadConfig
): number {
  return Math.round((periodsPerWeek / config.maxPeriodsPerWeek) * 100)
}

/**
 * Calculate workload for a single teacher
 */
export async function calculateTeacherWorkload(
  teacherId: string,
  schoolId: string,
  termId?: string
): Promise<TeacherWorkload | null> {
  const config = await getWorkloadConfig(schoolId)

  // Get teacher info
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  })

  if (!teacher) return null

  // Build timetable query
  const timetableWhere: any = {
    teacherId,
    schoolId,
  }
  if (termId) {
    timetableWhere.termId = termId
  }

  // Get all timetable entries for this teacher
  const timetableEntries = await db.timetable.findMany({
    where: timetableWhere,
    include: {
      class: {
        include: {
          subject: true,
        },
      },
    },
  })

  // Calculate metrics
  const totalPeriodsPerWeek = timetableEntries.length
  const uniqueClassIds = new Set(timetableEntries.map((t) => t.classId))
  const uniqueSubjectIds = new Set(timetableEntries.map((t) => t.class.subjectId))

  // Get total periods in a week to calculate free periods
  const allPeriods = await db.period.findMany({
    where: { schoolId },
    select: { id: true },
  })
  const totalPeriodsAvailable = allPeriods.length * 5 // 5 days per week

  const freePeriodsCount = totalPeriodsAvailable - totalPeriodsPerWeek

  const workloadStatus = calculateWorkloadStatus(totalPeriodsPerWeek, config)
  const workloadPercentage = calculateWorkloadPercentage(totalPeriodsPerWeek, config)

  return {
    teacherId: teacher.id,
    teacherName: `${teacher.givenName} ${teacher.surname}`,
    totalPeriodsPerWeek,
    uniqueClassesCount: uniqueClassIds.size,
    uniqueSubjectsCount: uniqueSubjectIds.size,
    freePeriodsCount,
    workloadStatus,
    workloadPercentage,
  }
}

/**
 * Calculate workload for all teachers in a school
 */
export async function calculateSchoolWorkload(
  schoolId: string,
  termId?: string
): Promise<TeacherWorkload[]> {
  const teachers = await db.teacher.findMany({
    where: {
      schoolId,
      employmentStatus: "ACTIVE", // Only active teachers
    },
    select: {
      id: true,
    },
  })

  const workloads = await Promise.all(
    teachers.map((teacher) =>
      calculateTeacherWorkload(teacher.id, schoolId, termId)
    )
  )

  return workloads.filter((w): w is TeacherWorkload => w !== null)
}

/**
 * Get workload distribution summary for a school
 */
export interface WorkloadDistribution {
  underutilized: number
  normal: number
  overload: number
  totalTeachers: number
  averagePeriodsPerWeek: number
}

export async function getWorkloadDistribution(
  schoolId: string,
  termId?: string
): Promise<WorkloadDistribution> {
  const workloads = await calculateSchoolWorkload(schoolId, termId)

  const distribution = {
    underutilized: 0,
    normal: 0,
    overload: 0,
    totalTeachers: workloads.length,
    averagePeriodsPerWeek: 0,
  }

  workloads.forEach((workload) => {
    if (workload.workloadStatus === "UNDERUTILIZED") {
      distribution.underutilized++
    } else if (workload.workloadStatus === "NORMAL") {
      distribution.normal++
    } else {
      distribution.overload++
    }
  })

  const totalPeriods = workloads.reduce(
    (sum, w) => sum + w.totalPeriodsPerWeek,
    0
  )
  distribution.averagePeriodsPerWeek =
    distribution.totalTeachers > 0
      ? Math.round(totalPeriods / distribution.totalTeachers)
      : 0

  return distribution
}

/**
 * Find teachers with availability (underutilized or with free periods)
 */
export async function findAvailableTeachers(
  schoolId: string,
  termId?: string,
  minFreePeriods: number = 5
): Promise<TeacherWorkload[]> {
  const workloads = await calculateSchoolWorkload(schoolId, termId)

  return workloads.filter(
    (w) =>
      w.workloadStatus === "UNDERUTILIZED" ||
      w.freePeriodsCount >= minFreePeriods
  )
}

/**
 * Find overloaded teachers (exceeding threshold)
 */
export async function findOverloadedTeachers(
  schoolId: string,
  termId?: string
): Promise<TeacherWorkload[]> {
  const workloads = await calculateSchoolWorkload(schoolId, termId)

  return workloads.filter((w) => w.workloadStatus === "OVERLOAD")
}

/**
 * Check if a teacher can take on additional classes
 */
export async function canTeacherTakeClass(
  teacherId: string,
  schoolId: string,
  termId?: string
): Promise<{ canTake: boolean; reason?: string }> {
  const workload = await calculateTeacherWorkload(teacherId, schoolId, termId)

  if (!workload) {
    return { canTake: false, reason: "Teacher not found" }
  }

  const config = await getWorkloadConfig(schoolId)

  if (workload.totalPeriodsPerWeek >= config.maxPeriodsPerWeek) {
    return {
      canTake: false,
      reason: `Teacher is at maximum capacity (${workload.totalPeriodsPerWeek}/${config.maxPeriodsPerWeek} periods)`,
    }
  }

  return {
    canTake: true,
  }
}
