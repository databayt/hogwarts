// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Timetable (Schedule) Server Actions Module
 *
 * RESPONSIBILITY: School-wide schedule management with conflict detection and role-based visibility
 *
 * WHAT IT HANDLES:
 * - Timetable slots: Create/update class-teacher-room-time combinations
 * - Conflict detection: Prevent double-booking of teachers or rooms
 * - Weekly configuration: Define school operating hours (start/end times, day patterns)
 * - Multi-view access: Class view, teacher view, room view, analytics dashboard
 * - Term management: Schedule across multiple academic terms
 * - Free slot suggestions: AI-like recommendation for class/teacher availability
 *
 * KEY ALGORITHMS:
 * 1. detectTimetableConflicts(): Database-level grouping for O(conflicts) detection (optimized from O(n²))
 * 2. suggestFreeSlots(): Finds gap patterns across week, excluding existing bookings
 * 3. Role-based filtering: Different users see different views (teacher sees own classes, admin sees all)
 * 4. Week offset calculations: Support current week (0) and next week (1) views
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL queries include schoolId filter via getTenantContext()
 * - Permission layer validates user can view/edit specific classes, teachers, rooms
 * - Role-based access control: Teachers only see own classes, students see their schedule only
 * - Audit logging via logTimetableAction() tracks all schedule changes
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. Conflict detection happens AT INSERTION TIME, not validation during form (late error message)
 * 2. Term-based scheduling allows same teacher in multiple classes per term (check business logic)
 * 3. Room field is optional - may need to allow flexible room assignment
 * 4. getWeeklyTimetable returns BOTH termId AND weekOffset - must handle year boundary (Dec/Jan)
 * 5. Free slot suggestions assume linear availability (don't account for prep time, lunch, etc.)
 *
 * PERMISSION SYSTEM:
 * - requireAdminAccess(): School admin or school-dashboard admin only (can modify timetable)
 * - requireReadAccess(): Can view timetable (varies by role)
 * - logTimetableAction(): Audit trail for compliance (track who changed what when)
 * - filterTimetableByRole(): Client-side visibility filter (prevents info leakage)
 *
 * PERFORMANCE NOTES:
 * - detectTimetableConflicts uses database GROUP BY + HAVING for O(conflicts) performance
 * - Consider caching weekly timetables (immutable after term starts)
 * - getTimetableAnalytics aggregates across all classes - potential bottleneck
 * - Free slot suggestions could benefit from memoization (same input patterns daily)
 *
 * TERM & CALENDAR INTEGRATION:
 * - Terms define schedule boundaries (start/end dates)
 * - Week offsets (0/1) for current/next week within a term
 * - Assumes academic calendar configured in settings/academic
 * - No automatic holiday handling (manual blocking required)
 *
 * FUTURE IMPROVEMENTS:
 * - Implement indexed conflict detection (use database constraints instead of app logic)
 * - Add recurring pattern templates (e.g., "Math on M/W/F at 10am")
 * - Support advanced room scheduling (equipment, capacity constraints)
 * - Implement teacher prep time blocks (auto-block time between classes)
 * - Add holiday/break calendar integration
 * - Support student schedule viewing (currently only admin/teacher)
 * - Implement schedule optimization (minimize conflicts, balance teacher load)
 */

"use server"

import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { getModel, getModelOrThrow } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import { applyTimetableStructureForNewSchool } from "@/components/catalog/provision"
import { getDisplayLang } from "@/components/translation/locale"
import { getLabels, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

// Constants imported from ./constants.ts to avoid "use server" export restrictions
import { ABSENCE_TYPES, DRAFT_TERM_ID, SUBSTITUTION_STATUS } from "./config"
// ============================================================================
// AI-POWERED TIMETABLE GENERATION
// ============================================================================

import {
  generateSectionTimetable,
  generateTimetable as runGenerationAlgorithm,
  type ClassRequirement,
  type GeneratedSlot,
  type GenerationConfig,
  type GenerationResult,
  type RoomAvailability,
  type SectionRequirement,
  type SubjectAllocation,
  type TeacherAvailability,
} from "./generate/algorithm"
import { attachLiveClasses, getLiveClassIndicators } from "./live-class-join"
import {
  getPermissionContext,
  logTimetableAction,
  requireAdminAccess,
  requirePermission,
  requireReadAccess,
} from "./permissions"
import { getStructureBySlug } from "./structures"
// Types imported from ./types.ts to avoid "use server" export restrictions
import type {
  ConstraintViolation,
  ImportResult,
  ImportSlot,
  RoomConstraintCheck,
  TeacherConstraintCheck,
} from "./types"
import {
  addTeacherUnavailableBlockSchema,
  applyGeneratedTimetableSchema,
  applyTemplateToTermSchema,
  createPeriodSchema,
  createTemplateFromTermSchema,
  deleteTimetableSlotSchema,
  detectTimetableConflictsSchema,
  getClassesForSelectionSchema,
  getScheduleConfigSchema,
  getSubstitutionRecordsSchema,
  getTeachersForSelectionSchema,
  getWeeklyTimetableSchema,
  importTimetableSlotsSchema,
  moveTimetableSlotSchema,
  setActiveTermSchema,
  suggestFreeSlotsSchema,
  upsertSchoolWeekConfigSchema,
  upsertTeacherConstraintsSchema,
  upsertTimetableSlotSchema,
  type GetWeeklyTimetableInput as GetWeeklyTimetableValidated,
} from "./validation"

// Note: Types (ConstraintViolation, ImportResult, ImportSlot, etc.)
// should be imported directly from ./types.ts by consuming files

// ============================================================================
// TEACHER CONSTRAINT VALIDATION
// ============================================================================

/**
 * Validate teacher constraints for a proposed slot assignment
 * Returns violations (errors block assignment, warnings are advisory)
 *
 * INTERNAL helper — deliberately NOT exported, so it is not reachable as a
 * server action over HTTP. Its only caller (validateSlotConstraints) supplies
 * the tenant-resolved schoolId from getTenantContext(); never re-expose this
 * with a caller-supplied schoolId (that was a cross-tenant read hole).
 */
async function validateTeacherConstraints(input: {
  schoolId: string
  termId: string
  teacherId: string
  dayOfWeek: number
  periodId: string
  weekOffset?: number
  excludeSlotId?: string // Exclude this slot when checking (for updates)
}): Promise<TeacherConstraintCheck> {
  const violations: ConstraintViolation[] = []

  // Get teacher info
  const teacher = await db.teacher.findFirst({
    where: { id: input.teacherId, schoolId: input.schoolId },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!teacher) {
    return {
      isValid: false,
      violations: [
        {
          type: "UNAVAILABLE_BLOCK",
          severity: "error",
          message: "Teacher not found",
        },
      ],
      teacherId: input.teacherId,
      teacherName: "Unknown",
    }
  }

  const teacherName = `${teacher.firstName} ${teacher.lastName}`

  // Get teacher constraint (term-specific or school-wide)
  const constraint = await db.teacherConstraint.findFirst({
    where: {
      schoolId: input.schoolId,
      teacherId: input.teacherId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
    orderBy: { termId: "desc" }, // Prefer term-specific
    include: {
      unavailableBlocks: {
        where: {
          OR: [
            { isRecurring: true },
            {
              specificDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          ],
        },
      },
    },
  })

  // Check unavailable blocks
  if (constraint?.unavailableBlocks) {
    const isUnavailable = constraint.unavailableBlocks.some(
      (block) =>
        block.dayOfWeek === input.dayOfWeek && block.periodId === input.periodId
    )

    if (isUnavailable) {
      violations.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "error",
        message: `${teacherName} is marked as unavailable for this time slot`,
        details: { dayOfWeek: input.dayOfWeek, periodId: input.periodId },
      })
    }
  }

  // Check day preferences (unavailable = error, avoid = warning)
  if (constraint?.dayPreferences) {
    const dayPrefs = constraint.dayPreferences as Record<string, string>
    const dayPref = dayPrefs[String(input.dayOfWeek)]

    if (dayPref === "unavailable") {
      violations.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "error",
        message: `${teacherName} is unavailable on this day`,
        details: { dayOfWeek: input.dayOfWeek, preference: dayPref },
      })
    } else if (dayPref === "avoid") {
      violations.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "warning",
        message: `${teacherName} prefers to avoid teaching on this day`,
        details: { dayOfWeek: input.dayOfWeek, preference: dayPref },
      })
    }
  }

  // Check period preferences
  if (constraint?.periodPreferences) {
    const periodPrefs = constraint.periodPreferences as Record<string, string>
    const periodPref = periodPrefs[input.periodId]

    if (periodPref === "unavailable") {
      violations.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "error",
        message: `${teacherName} is unavailable during this period`,
        details: { periodId: input.periodId, preference: periodPref },
      })
    } else if (periodPref === "avoid") {
      violations.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "warning",
        message: `${teacherName} prefers to avoid this period`,
        details: { periodId: input.periodId, preference: periodPref },
      })
    }
  }

  // Get existing slots for this teacher in the same term/week
  const existingSlots = await db.timetable.findMany({
    where: {
      schoolId: input.schoolId,
      termId: input.termId,
      teacherId: input.teacherId,
      weekOffset: input.weekOffset ?? 0,
      ...(input.excludeSlotId && { id: { not: input.excludeSlotId } }),
    },
    include: {
      period: { select: { startTime: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: { startTime: "asc" } }],
  })

  // Check max periods per day
  const slotsOnSameDay = existingSlots.filter(
    (s) => s.dayOfWeek === input.dayOfWeek
  )
  const maxPerDay = constraint?.maxPeriodsPerDay ?? 6

  if (slotsOnSameDay.length >= maxPerDay) {
    violations.push({
      type: "MAX_PERIODS_DAY",
      severity: "error",
      message: `${teacherName} already has ${slotsOnSameDay.length} periods on this day (max: ${maxPerDay})`,
      details: {
        current: slotsOnSameDay.length,
        max: maxPerDay,
        dayOfWeek: input.dayOfWeek,
      },
    })
  } else if (slotsOnSameDay.length >= maxPerDay - 1) {
    violations.push({
      type: "MAX_PERIODS_DAY",
      severity: "warning",
      message: `${teacherName} will reach maximum periods (${maxPerDay}) for this day`,
      details: {
        current: slotsOnSameDay.length,
        max: maxPerDay,
        dayOfWeek: input.dayOfWeek,
      },
    })
  }

  // Check max periods per week
  const maxPerWeek = constraint?.maxPeriodsPerWeek ?? 25

  if (existingSlots.length >= maxPerWeek) {
    violations.push({
      type: "MAX_PERIODS_WEEK",
      severity: "error",
      message: `${teacherName} already has ${existingSlots.length} periods this week (max: ${maxPerWeek})`,
      details: { current: existingSlots.length, max: maxPerWeek },
    })
  } else if (existingSlots.length >= maxPerWeek - 3) {
    violations.push({
      type: "MAX_PERIODS_WEEK",
      severity: "warning",
      message: `${teacherName} is approaching maximum weekly periods (${existingSlots.length}/${maxPerWeek})`,
      details: { current: existingSlots.length, max: maxPerWeek },
    })
  }

  // Check consecutive periods (would this create too many in a row?)
  const maxConsecutive = constraint?.maxConsecutivePeriods ?? 3

  // Get periods ordered by start time for the same day
  const periods = await db.period.findMany({
    where: {
      schoolId: input.schoolId,
      id: { in: [...slotsOnSameDay.map((s) => s.periodId), input.periodId] },
    },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true },
  })

  // Check if adding this period creates a consecutive streak > maxConsecutive
  const periodOrder = periods.map((p) => p.id)
  const newPeriodIndex = periodOrder.indexOf(input.periodId)

  if (newPeriodIndex !== -1) {
    // Count consecutive periods including the new one
    let consecutiveCount = 1
    // Check backwards
    for (let i = newPeriodIndex - 1; i >= 0; i--) {
      if (slotsOnSameDay.some((s) => s.periodId === periodOrder[i])) {
        consecutiveCount++
      } else {
        break
      }
    }
    // Check forwards
    for (let i = newPeriodIndex + 1; i < periodOrder.length; i++) {
      if (slotsOnSameDay.some((s) => s.periodId === periodOrder[i])) {
        consecutiveCount++
      } else {
        break
      }
    }

    if (consecutiveCount > maxConsecutive) {
      violations.push({
        type: "CONSECUTIVE_PERIODS",
        severity: "warning",
        message: `${teacherName} will have ${consecutiveCount} consecutive periods (recommended max: ${maxConsecutive})`,
        details: { consecutive: consecutiveCount, max: maxConsecutive },
      })
    }
  }

  return {
    isValid: !violations.some((v) => v.severity === "error"),
    violations,
    teacherId: input.teacherId,
    teacherName,
  }
}

// ============================================================================
// ROOM CONSTRAINT VALIDATION
// ============================================================================

/**
 * Validate room constraints for a proposed slot assignment
 *
 * INTERNAL helper — deliberately NOT exported (see validateTeacherConstraints).
 */
async function validateRoomConstraints(input: {
  schoolId: string
  termId: string
  classroomId: string
  /** Legacy classId — used for student-count and subject-name when sectionId absent */
  classId?: string
  /** Section-based path: count students from Section.students */
  sectionId?: string
  /** Subject name for allowedSubjectTypes check (section-based path) */
  subjectName?: string
  dayOfWeek: number
  periodId: string
  weekOffset?: number
  excludeSlotId?: string
}): Promise<RoomConstraintCheck> {
  const violations: ConstraintViolation[] = []

  // Get room info
  const room = await db.classroom.findFirst({
    where: { id: input.classroomId, schoolId: input.schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      classroomType: { select: { name: true } },
    },
  })

  if (!room) {
    return {
      isValid: false,
      violations: [
        {
          type: "ROOM_RESERVED",
          severity: "error",
          message: "Room not found",
        },
      ],
      roomId: input.classroomId,
      roomName: "Unknown",
    }
  }

  // Resolve student count and subject name — prefer section-based path
  let studentCount = 0
  let subjectNameResolved = input.subjectName ?? ""

  if (input.sectionId) {
    // Section-based: count students enrolled in this section
    studentCount = await db.student.count({
      where: { schoolId: input.schoolId, sectionId: input.sectionId },
    })
    // subjectName already passed in from caller or resolved via subjectId lookup above
  } else if (input.classId) {
    // Legacy classId path — keep existing behaviour
    const classInfo = await db.class.findFirst({
      where: { id: input.classId, schoolId: input.schoolId },
      select: {
        name: true,
        subject: { select: { name: true } },
        _count: { select: { studentClasses: true } },
      },
    })
    studentCount = classInfo?._count?.studentClasses ?? 0
    if (!subjectNameResolved)
      subjectNameResolved = classInfo?.subject?.name ?? ""
  }

  // Get room constraint
  const constraint = await db.roomConstraint.findFirst({
    where: {
      schoolId: input.schoolId,
      classroomId: input.classroomId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
    orderBy: { termId: "desc" },
  })

  // Check room capacity
  const effectiveCapacity = room.capacity + (constraint?.capacityBuffer ?? 0)
  const strictCapacity = constraint?.strictCapacityLimit ?? true

  if (studentCount > effectiveCapacity) {
    violations.push({
      type: "ROOM_CAPACITY",
      severity: strictCapacity ? "error" : "warning",
      message: `Class has ${studentCount} students but ${room.roomName} only holds ${effectiveCapacity}`,
      details: {
        studentCount,
        roomCapacity: room.capacity,
        buffer: constraint?.capacityBuffer ?? 0,
      },
    })
  } else if (studentCount > room.capacity * 0.9) {
    violations.push({
      type: "ROOM_CAPACITY",
      severity: "warning",
      message: `${room.roomName} will be at ${Math.round((studentCount / room.capacity) * 100)}% capacity`,
      details: { studentCount, roomCapacity: room.capacity },
    })
  }

  // Check reserved periods
  if (constraint?.reservedPeriods) {
    const reserved = constraint.reservedPeriods as Record<string, string[]>
    const dayReserved = reserved[String(input.dayOfWeek)] || []

    if (dayReserved.includes(input.periodId)) {
      violations.push({
        type: "ROOM_RESERVED",
        severity: "error",
        message: `${room.roomName} is reserved during this time slot`,
        details: { dayOfWeek: input.dayOfWeek, periodId: input.periodId },
      })
    }
  }

  // Check subject type requirements using allowedSubjectTypes array
  if (
    constraint?.allowedSubjectTypes &&
    constraint.allowedSubjectTypes.length > 0
  ) {
    const name = subjectNameResolved.toLowerCase()
    const allowed = (constraint.allowedSubjectTypes as string[]).map(
      (t: string) => t.toLowerCase()
    )

    // Check if the subject matches any allowed type
    const isAllowed =
      !name || allowed.some((t: string) => name.includes(t) || t.includes(name))

    if (!isAllowed) {
      violations.push({
        type: "ROOM_EQUIPMENT",
        severity: "warning",
        message: `${subjectNameResolved} is not in the allowed subject types for ${room.roomName} (allowed: ${(constraint.allowedSubjectTypes as string[]).join(", ")})`,
        details: {
          name: subjectNameResolved,
          allowedTypes: constraint.allowedSubjectTypes,
          roomType: room.classroomType?.name,
        },
      })
    }
  }

  return {
    isValid: !violations.some((v) => v.severity === "error"),
    violations,
    roomId: input.classroomId,
    roomName: room.roomName,
  }
}

/**
 * Validate all constraints for a slot (teacher + room)
 * Use this before creating or updating a timetable slot
 *
 * INTERNAL helper — deliberately NOT exported. Callers (upsertTimetableSlot,
 * moveTimetableSlot) authenticate + resolve schoolId via getTenantContext()
 * BEFORE invoking this and pass that schoolId in; it is not an HTTP surface.
 */
async function validateSlotConstraints(input: {
  schoolId: string
  termId: string
  // Optional: a slot may be teacher-less (teacher attached later). When absent
  // the teacher-availability check is skipped — passing an undefined id to
  // `validateTeacherConstraints` would match a random teacher and report
  // phantom conflicts.
  teacherId?: string
  classroomId: string
  /** Legacy classId — optional when sectionId is present */
  classId?: string
  /** Section-based path for room capacity check */
  sectionId?: string
  /** Subject name for allowedSubjectTypes check (section-based) */
  subjectName?: string
  dayOfWeek: number
  periodId: string
  weekOffset?: number
  excludeSlotId?: string
  enforceConstraints?: boolean // If true, throw on violations; if false, return violations
}): Promise<{
  isValid: boolean
  teacherCheck: TeacherConstraintCheck
  roomCheck: RoomConstraintCheck
}> {
  const [teacherCheck, roomCheck] = await Promise.all([
    input.teacherId
      ? validateTeacherConstraints({
          schoolId: input.schoolId,
          termId: input.termId,
          teacherId: input.teacherId,
          dayOfWeek: input.dayOfWeek,
          periodId: input.periodId,
          weekOffset: input.weekOffset,
          excludeSlotId: input.excludeSlotId,
        })
      : Promise.resolve<TeacherConstraintCheck>({
          isValid: true,
          violations: [],
          teacherId: "",
          teacherName: "",
        }),
    validateRoomConstraints({
      schoolId: input.schoolId,
      termId: input.termId,
      classroomId: input.classroomId,
      classId: input.classId,
      sectionId: input.sectionId,
      subjectName: input.subjectName,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      weekOffset: input.weekOffset,
      excludeSlotId: input.excludeSlotId,
    }),
  ])

  const isValid = teacherCheck.isValid && roomCheck.isValid

  // If enforcing constraints, throw an error with all violations
  if (input.enforceConstraints && !isValid) {
    const errors = [
      ...teacherCheck.violations.filter((v) => v.severity === "error"),
      ...roomCheck.violations.filter((v) => v.severity === "error"),
    ]

    throw new Error(errors.map((e) => e.message).join("; "))
  }

  return { isValid, teacherCheck, roomCheck }
}

type Conflict = {
  type: "TEACHER" | "ROOM"
  classA: { id: string; name: string }
  classB: { id: string; name: string }
  teacher?: { id: string; name: string } | null
  room?: { id: string; name: string } | null
}

export async function detectTimetableConflicts(input?: unknown) {
  // Validate input
  const validatedInput = detectTimetableConflictsSchema.parse(input)

  // Check permissions - only admins can detect conflicts
  await requirePermission("manage_conflicts")

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Log action for audit trail
  await logTimetableAction("manage_conflicts", {
    entityType: "conflict",
    metadata: { termId: validatedInput?.termId },
  })

  const conflicts: Conflict[] = []

  // P0 OPTIMIZATION: Use database-level grouping instead of O(n²) in-memory comparison
  // This scales efficiently even with 100+ classes by leveraging database indexes
  const timetableModel = getModel("timetable")
  if (timetableModel) {
    const where: Record<string, unknown> = { schoolId }
    if (validatedInput?.termId) where.termId = validatedInput.termId

    // Step 1: Find teacher conflicts using database grouping
    // Query slots grouped by (dayOfWeek, periodId, teacherId) with count > 1
    const teacherConflicts = await db.$queryRaw<
      Array<{
        dayOfWeek: number
        periodId: string
        teacherId: string
        count: bigint
      }>
    >`
      SELECT "dayOfWeek", "periodId", "teacherId", COUNT(*) as count
      FROM timetables
      WHERE "schoolId" = ${schoolId}
        AND "teacherId" IS NOT NULL
        ${validatedInput?.termId ? Prisma.sql`AND "termId" = ${validatedInput.termId}` : Prisma.empty}
      GROUP BY "dayOfWeek", "periodId", "teacherId"
      HAVING COUNT(*) > 1
    `

    // Step 2: Find room conflicts using database grouping
    const roomConflicts = await db.$queryRaw<
      Array<{
        dayOfWeek: number
        periodId: string
        classroomId: string
        count: bigint
      }>
    >`
      SELECT "dayOfWeek", "periodId", "classroomId", COUNT(*) as count
      FROM timetables
      WHERE "schoolId" = ${schoolId}
        AND "classroomId" IS NOT NULL
        ${validatedInput?.termId ? Prisma.sql`AND "termId" = ${validatedInput.termId}` : Prisma.empty}
      GROUP BY "dayOfWeek", "periodId", "classroomId"
      HAVING COUNT(*) > 1
    `

    // Step 3: Batch-fetch details for ALL conflicting slots in 2 queries (not
    // N+M). Each group's slots are matched via a single OR clause, then grouped
    // in memory. Cohort identity falls back section → class (section-based
    // slots have classId = null, so `slot.class` is null and must NOT be
    // dereferenced directly — doing so previously crashed the whole detector).
    const conflictSlotSelect = {
      dayOfWeek: true,
      periodId: true,
      classId: true,
      sectionId: true,
      teacherId: true,
      classroomId: true,
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      teacher: { select: { firstName: true, lastName: true } },
      classroom: { select: { roomName: true } },
    } as const

    // Cohort identity for a slot — prefer class (legacy), else section.
    const cohortOf = (s: {
      class?: { id: string; name: string } | null
      section?: { id: string; name: string } | null
      classId?: string | null
      sectionId?: string | null
    }) => ({
      id: s.class?.id ?? s.section?.id ?? s.classId ?? s.sectionId ?? "",
      name: s.class?.name ?? s.section?.name ?? "",
    })

    if (teacherConflicts.length > 0) {
      const teacherSlots = await timetableModel.findMany({
        where: {
          schoolId,
          ...(validatedInput?.termId && { termId: validatedInput.termId }),
          OR: teacherConflicts.map((tc) => ({
            dayOfWeek: tc.dayOfWeek,
            periodId: tc.periodId,
            teacherId: tc.teacherId,
          })),
        },
        select: conflictSlotSelect,
      })

      const grouped = new Map<string, typeof teacherSlots>()
      for (const s of teacherSlots) {
        const key = `${s.dayOfWeek}|${s.periodId}|${s.teacherId}`
        const arr = grouped.get(key) ?? []
        if (arr.length < 2) arr.push(s)
        grouped.set(key, arr)
      }

      for (const slots of grouped.values()) {
        if (slots.length < 2) continue
        const [a, b] = slots
        conflicts.push({
          type: "TEACHER",
          classA: cohortOf(a),
          classB: cohortOf(b),
          teacher: {
            id: a.teacherId ?? "",
            name: [a.teacher?.firstName, a.teacher?.lastName]
              .filter(Boolean)
              .join(" "),
          },
          room: null,
        })
      }
    }

    if (roomConflicts.length > 0) {
      const roomSlots = await timetableModel.findMany({
        where: {
          schoolId,
          ...(validatedInput?.termId && { termId: validatedInput.termId }),
          OR: roomConflicts.map((rc) => ({
            dayOfWeek: rc.dayOfWeek,
            periodId: rc.periodId,
            classroomId: rc.classroomId,
          })),
        },
        select: conflictSlotSelect,
      })

      const grouped = new Map<string, typeof roomSlots>()
      for (const s of roomSlots) {
        const key = `${s.dayOfWeek}|${s.periodId}|${s.classroomId}`
        const arr = grouped.get(key) ?? []
        if (arr.length < 2) arr.push(s)
        grouped.set(key, arr)
      }

      for (const slots of grouped.values()) {
        if (slots.length < 2) continue
        const [a, b] = slots
        conflicts.push({
          type: "ROOM",
          classA: cohortOf(a),
          classB: cohortOf(b),
          teacher: null,
          room: {
            id: a.classroomId ?? "",
            name: a.classroom?.roomName ?? a.classroomId ?? "",
          },
        })
      }
    }

    return { conflicts }
  }

  // Fallback: Legacy conflict detection using Class model (for backward compatibility)
  const classModel = getModel("class")
  const periodModel = getModel("period")
  if (!classModel || !periodModel) return { conflicts: [] as Conflict[] }

  const where: { schoolId: string; termId?: string } = { schoolId }
  if (validatedInput?.termId) where.termId = validatedInput.termId

  const classes = await classModel.findMany({
    where,
    select: {
      id: true,
      name: true,
      teacherId: true,
      classroomId: true,
      startPeriodId: true,
      endPeriodId: true,
      teacher: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, roomName: true } },
      startPeriod: { select: { startTime: true } },
      endPeriod: { select: { endTime: true } },
    },
  })

  type Row = (typeof classes)[number]
  // Use the outer conflicts array (don't redeclare)

  const overlaps = (a: Row, b: Row) => {
    const aStart = new Date(a.startPeriod.startTime as Date).getTime()
    const aEnd = new Date(a.endPeriod.endTime as Date).getTime()
    const bStart = new Date(b.startPeriod.startTime as Date).getTime()
    const bEnd = new Date(b.endPeriod.endTime as Date).getTime()
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd)
  }

  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const a = classes[i]
      const b = classes[j]
      if (!overlaps(a, b)) continue
      if (a.teacherId && b.teacherId && a.teacherId === b.teacherId) {
        conflicts.push({
          type: "TEACHER",
          classA: { id: a.id, name: a.name },
          classB: { id: b.id, name: b.name },
          teacher: {
            id: a.teacherId,
            name: [a.teacher?.firstName, a.teacher?.lastName]
              .filter(Boolean)
              .join(" "),
          },
          room: null,
        })
      }
      if (a.classroomId && b.classroomId && a.classroomId === b.classroomId) {
        conflicts.push({
          type: "ROOM",
          classA: { id: a.id, name: a.name },
          classB: { id: b.id, name: b.name },
          teacher: null,
          room: {
            id: a.classroomId,
            name: a.classroom?.roomName ?? a.classroomId,
          },
        })
      }
    }
  }

  return { conflicts }
}

export async function getTermsForSelection() {
  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const termModel = getModel("term")
  if (!termModel) return { terms: [] as Array<{ id: string; label: string }> }

  const rows = await termModel.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: { id: true, termNumber: true },
  })

  return {
    terms: rows.map((t: any) => ({ id: t.id, label: `Term ${t.termNumber}` })),
  }
}

export async function getClassesForSelection(input: unknown) {
  // Validate input
  const validatedInput = getClassesForSelectionSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const timetableModel = getModel("timetable")
  if (timetableModel && validatedInput?.termId) {
    const rows = await timetableModel.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: { class: { select: { id: true, name: true } } },
      distinct: ["classId"],
    })
    return {
      // Section-based timetable rows have a null legacy `classId` (no `class`
      // relation); drop those so we never deref null.
      classes: rows
        .filter((r: any) => r.class)
        .map((r: any) => ({ id: r.class.id, label: r.class.name })),
    }
  }

  // Fallback: list classes by term
  const classModel = getModel("class")
  if (classModel && validatedInput?.termId) {
    const rows = await classModel.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: { id: true, name: true },
    })
    return { classes: rows.map((c: any) => ({ id: c.id, label: c.name })) }
  }

  return { classes: [] as Array<{ id: string; label: string }> }
}

export async function getTeachersForSelection(input: unknown) {
  // Validate input
  const validatedInput = getTeachersForSelectionSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const rows = await db.teacher.findMany({
    where: { schoolId },
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  })

  return {
    teachers: rows.map((t) => ({
      id: t.id,
      label: [t.firstName, t.lastName].filter(Boolean).join(" "),
    })),
  }
}

/**
 * Get sections for the slot editor dialog.
 * Returns all sections for this school with grade info.
 */
export async function getSectionsForTimetable(input?: { termId?: string }) {
  await requireReadAccess()
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const sections = await db.section.findMany({
    where: { schoolId },
    orderBy: [{ grade: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      gradeId: true,
      classroomId: true,
      grade: { select: { name: true } },
    },
  })

  return {
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      gradeId: s.gradeId,
      gradeName: s.grade?.name ?? "",
      classroomId: s.classroomId,
    })),
  }
}

/**
 * Get subjects active for a given grade (via SubjectSelection).
 * Used by the slot editor dialog to populate the subject picker.
 */
export async function getSubjectsForSection(input: { gradeId: string }) {
  await requireReadAccess()
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const selections = await db.subjectSelection.findMany({
    where: { schoolId, gradeId: input.gradeId, isActive: true },
    select: {
      catalogSubjectId: true,
      customName: true,
      subject: {
        select: { name: true, color: true },
      },
    },
  })

  return {
    subjects: selections.map((s) => ({
      id: s.catalogSubjectId,
      name: s.customName || s.subject?.name || "",
      color: s.subject?.color ?? "#6366f1",
    })),
  }
}

export async function upsertTimetableSlot(input: unknown) {
  // Validate input — section-first schema (sectionId + subjectId required; classId optional)
  const validatedInput = upsertTimetableSlotSchema.parse(input)

  // Admin access required
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // 1. Validate section exists and belongs to this school
  const section = await db.section.findFirst({
    where: { id: validatedInput.sectionId, schoolId },
    select: { id: true, name: true, gradeId: true },
  })
  if (!section) throw new Error("SECTION_NOT_FOUND")

  // 2. Soft-validate that the subject is in SubjectSelection for this grade.
  //    Decision: non-blocking warning (admins may legitimately schedule subjects
  //    not yet in the formal selection, e.g., trial periods / special programmes).
  const subjectSelected = await db.subjectSelection.findFirst({
    where: {
      schoolId,
      gradeId: section.gradeId,
      catalogSubjectId: validatedInput.subjectId,
      isActive: true,
    },
  })
  // Log but do not block
  if (!subjectSelected) {
    console.warn(
      `[upsertTimetableSlot] Subject ${validatedInput.subjectId} not in active SubjectSelection for grade ${section.gradeId} — allowed by admin override`
    )
  }

  // 3. Teacher expertise check — uses subjectId directly (section-based)
  if (validatedInput.teacherId) {
    const teacherExpertise = await db.teacherSubjectExpertise.findFirst({
      where: {
        schoolId,
        teacherId: validatedInput.teacherId,
        subjectId: validatedInput.subjectId,
      },
    })
    if (!teacherExpertise) {
      throw new Error("TEACHER_NOT_QUALIFIED")
    }
  }

  // 4. Find existing slot at this cell BEFORE validating constraints — an
  //    edit must exclude its own row from teacher/room conflict checks, or a
  //    teacher already at max periods can never have their slot re-saved.
  const existing = validatedInput.id
    ? await db.timetable.findFirst({
        where: { id: validatedInput.id, schoolId },
        select: { id: true, classId: true },
      })
    : await db.timetable.findFirst({
        where: {
          schoolId,
          termId: validatedInput.termId,
          dayOfWeek: validatedInput.dayOfWeek,
          periodId: validatedInput.periodId,
          weekOffset: validatedInput.weekOffset,
          OR: [
            { sectionId: validatedInput.sectionId },
            // Legacy: find a slot at this cell with a classId (non-null)
            ...(validatedInput.classId
              ? [
                  {
                    classId: validatedInput.classId,
                  },
                ]
              : []),
          ],
        },
        select: { id: true, classId: true },
      })

  // 5. Constraint validation (teacher availability + room capacity)
  //    Pass sectionId; classId is optional (null → capacity from section student count)
  await validateSlotConstraints({
    schoolId,
    termId: validatedInput.termId,
    teacherId: validatedInput.teacherId,
    classroomId: validatedInput.classroomId,
    classId: validatedInput.classId ?? "",
    sectionId: validatedInput.sectionId,
    dayOfWeek: validatedInput.dayOfWeek,
    periodId: validatedInput.periodId,
    weekOffset: validatedInput.weekOffset,
    excludeSlotId: existing?.id,
    enforceConstraints: true,
  })

  const timetableModel = getModelOrThrow("timetable")

  let row: { id: string }

  if (existing) {
    // UPDATE existing row — backfill sectionId/subjectId on legacy rows, keep classId intact
    row = await timetableModel.update({
      where: { id: existing.id },
      data: {
        sectionId: validatedInput.sectionId,
        subjectId: validatedInput.subjectId,
        teacherId: validatedInput.teacherId,
        classroomId: validatedInput.classroomId,
        // Preserve existing classId (legacy exams/results history must not lose it)
      },
    })
  } else {
    // CREATE new section-based slot
    row = await timetableModel.create({
      data: {
        schoolId,
        termId: validatedInput.termId,
        dayOfWeek: validatedInput.dayOfWeek,
        periodId: validatedInput.periodId,
        sectionId: validatedInput.sectionId,
        subjectId: validatedInput.subjectId,
        teacherId: validatedInput.teacherId,
        classroomId: validatedInput.classroomId,
        weekOffset: validatedInput.weekOffset,
        // Include classId only when explicitly provided (legacy callers)
        ...(validatedInput.classId ? { classId: validatedInput.classId } : {}),
      },
    })
  }

  await logTimetableAction("edit", {
    entityType: "slot",
    entityId: row.id,
    changes: {
      schoolId,
      termId: validatedInput.termId,
      dayOfWeek: validatedInput.dayOfWeek,
      periodId: validatedInput.periodId,
      sectionId: validatedInput.sectionId,
      subjectId: validatedInput.subjectId,
      teacherId: validatedInput.teacherId,
      classroomId: validatedInput.classroomId,
      weekOffset: validatedInput.weekOffset,
    },
  })

  return { id: row.id }
}

export async function upsertSchoolWeekConfig(input: unknown) {
  // Validate input
  const validatedInput = upsertSchoolWeekConfigSchema.parse(input)

  // Admin access required
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const schoolWeekConfigModel = getModelOrThrow("schoolWeekConfig")
  const row = await schoolWeekConfigModel.upsert({
    where: {
      schoolId_termId: {
        schoolId,
        termId: validatedInput.termId ?? null,
      },
    },
    update: {
      workingDays: validatedInput.workingDays,
      defaultLunchAfterPeriod: validatedInput.defaultLunchAfterPeriod ?? null,
    },
    create: {
      schoolId,
      termId: validatedInput.termId ?? null,
      workingDays: validatedInput.workingDays,
      defaultLunchAfterPeriod: validatedInput.defaultLunchAfterPeriod ?? null,
    },
  })

  // Log action for audit trail
  await logTimetableAction("configure_settings", {
    entityType: "config",
    entityId: row.id,
    changes: validatedInput,
  })

  return { id: row.id }
}

/**
 * Move a timetable slot to a new position with constraint validation
 * Used for drag-and-drop scheduling
 */
export async function moveTimetableSlot(rawInput: {
  slotId: string
  targetDayOfWeek: number
  targetPeriodId: string
  targetClassroomId?: string // Optional: also change room
  validateOnly?: boolean // If true, only check constraints without moving
}): Promise<{
  success: boolean
  slotId?: string
  warnings: ConstraintViolation[]
  errors: ConstraintViolation[]
}> {
  await requireAdminAccess()
  const input = moveTimetableSlotSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get the existing slot
  const existingSlot = await db.timetable.findFirst({
    where: { id: input.slotId, schoolId },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, roomName: true } },
    },
  })

  if (!existingSlot) {
    throw new Error("SLOT_NOT_FOUND")
  }

  const targetClassroomId = input.targetClassroomId ?? existingSlot.classroomId

  // Validate constraints at the new position. Pass sectionId so room-capacity
  // checks can count the section's students (section-based slots have
  // classId = null; without sectionId the room can be silently over-booked).
  const validation = await validateSlotConstraints({
    schoolId,
    termId: existingSlot.termId,
    teacherId: existingSlot.teacherId ?? "",
    classroomId: targetClassroomId ?? "",
    classId: existingSlot.classId ?? "",
    sectionId: existingSlot.sectionId ?? undefined,
    dayOfWeek: input.targetDayOfWeek,
    periodId: input.targetPeriodId,
    weekOffset: existingSlot.weekOffset,
    excludeSlotId: input.slotId, // Exclude current slot from validation
    enforceConstraints: false, // Don't throw, return violations
  })

  const errors = [
    ...validation.teacherCheck.violations.filter((v) => v.severity === "error"),
    ...validation.roomCheck.violations.filter((v) => v.severity === "error"),
  ]

  const warnings = [
    ...validation.teacherCheck.violations.filter(
      (v) => v.severity === "warning"
    ),
    ...validation.roomCheck.violations.filter((v) => v.severity === "warning"),
  ]

  // Check for conflicts at target position. Build the OR conditionally — a
  // null teacherId / classroomId / sectionId must NOT become `{ field: null }`,
  // which would match every unassigned slot in the cell and report phantom
  // conflicts. The sectionId arm catches a section double-book (two lessons for
  // the same cohort in one day+period) which teacher/room arms alone miss.
  const conflictOr: Prisma.TimetableWhereInput[] = []
  if (existingSlot.teacherId)
    conflictOr.push({ teacherId: existingSlot.teacherId })
  if (targetClassroomId) conflictOr.push({ classroomId: targetClassroomId })
  if (existingSlot.sectionId)
    conflictOr.push({ sectionId: existingSlot.sectionId })

  const conflictingSlot =
    conflictOr.length > 0
      ? await db.timetable.findFirst({
          where: {
            schoolId,
            termId: existingSlot.termId,
            dayOfWeek: input.targetDayOfWeek,
            periodId: input.targetPeriodId,
            weekOffset: existingSlot.weekOffset,
            OR: conflictOr,
            id: { not: input.slotId },
          },
          include: {
            class: { select: { name: true } },
            section: { select: { name: true } },
            teacher: { select: { firstName: true, lastName: true } },
          },
        })
      : null

  if (conflictingSlot) {
    const cohortName =
      conflictingSlot.class?.name ?? conflictingSlot.section?.name ?? ""
    if (
      existingSlot.teacherId &&
      conflictingSlot.teacherId === existingSlot.teacherId
    ) {
      errors.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "error",
        message: `Teacher is already scheduled for ${cohortName} at this time`,
        details: { conflictingSlotId: conflictingSlot.id },
      })
    }
    if (
      targetClassroomId &&
      conflictingSlot.classroomId === targetClassroomId
    ) {
      errors.push({
        type: "ROOM_RESERVED",
        severity: "error",
        message: `Room is already booked for ${cohortName} at this time`,
        details: { conflictingSlotId: conflictingSlot.id },
      })
    }
    if (
      existingSlot.sectionId &&
      conflictingSlot.sectionId === existingSlot.sectionId
    ) {
      errors.push({
        type: "SECTION_DOUBLE_BOOKED",
        severity: "error",
        message: `This section already has a lesson (${cohortName}) at this time`,
        details: { conflictingSlotId: conflictingSlot.id },
      })
    }
  }

  // If validate only, return without making changes
  if (input.validateOnly) {
    return {
      success: errors.length === 0,
      warnings,
      errors,
    }
  }

  // If there are errors, don't move
  if (errors.length > 0) {
    return {
      success: false,
      warnings,
      errors,
    }
  }

  // Perform the move (defense-in-depth: scope by schoolId)
  await db.timetable.updateMany({
    where: { id: input.slotId, schoolId },
    data: {
      dayOfWeek: input.targetDayOfWeek,
      periodId: input.targetPeriodId,
      classroomId: targetClassroomId,
    },
  })

  // Notify affected teacher about schedule change (non-blocking)
  if (existingSlot.teacher) {
    const teacherUser = await db.teacher.findFirst({
      where: { id: existingSlot.teacher.id, schoolId },
      select: { userId: true },
    })
    if (teacherUser?.userId) {
      const schoolPref = await db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const notifLang = schoolPref?.preferredLanguage ?? "ar"
      const cohort =
        existingSlot.class?.name ?? (notifLang === "ar" ? "الحصة" : "the class")
      dispatchNotification({
        schoolId,
        userId: teacherUser.userId,
        type: "class_rescheduled",
        title: notifLang === "ar" ? "تغيير في الجدول" : "Schedule change",
        body:
          notifLang === "ar"
            ? `تم نقل حصة ${cohort} إلى يوم ووقت جديد`
            : `${cohort} has been moved to a new day and time`,
        lang: notifLang,
        priority: "high",
        channels: ["in_app"],
        metadata: {
          slotId: input.slotId,
          className: existingSlot.class?.name,
          url: "/timetable",
        },
      }).catch((err) =>
        console.error("[moveTimetableSlot] Notification error:", err)
      )
    }
  }

  // Log action for audit trail
  await logTimetableAction("edit", {
    entityType: "slot",
    entityId: input.slotId,
    changes: {
      from: {
        dayOfWeek: existingSlot.dayOfWeek,
        periodId: existingSlot.periodId,
        classroomId: existingSlot.classroomId,
      },
      to: {
        dayOfWeek: input.targetDayOfWeek,
        periodId: input.targetPeriodId,
        classroomId: targetClassroomId,
      },
    },
    metadata: { action: "move" },
  })

  return {
    success: true,
    slotId: input.slotId,
    warnings,
    errors: [],
  }
}

/**
 * Preview constraint validation for a potential slot move
 * Used to show warnings during drag-over
 */
export async function previewMoveConstraints(input: {
  slotId: string
  targetDayOfWeek: number
  targetPeriodId: string
  targetClassroomId?: string
}): Promise<{
  isValid: boolean
  violations: ConstraintViolation[]
}> {
  const result = await moveTimetableSlot({
    ...input,
    validateOnly: true,
  })

  return {
    isValid: result.success,
    violations: [...result.errors, ...result.warnings],
  }
}

export async function suggestFreeSlots(input: unknown) {
  // Validate input
  const validatedInput = suggestFreeSlotsSchema.parse(input)

  // Admin access required for suggestions
  await requirePermission("edit")

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  if (!validatedInput.teacherId && !validatedInput.classId) {
    return {
      suggestions: [] as Array<{
        dayOfWeek: number
        periodId: string
        periodName: string
      }>,
    }
  }

  const { config } = await getScheduleConfig({ termId: validatedInput.termId })

  const termModel = getModelOrThrow("term")
  const term = await termModel.findFirst({
    where: { id: validatedInput.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) return { suggestions: [] }

  const periodModel = getModelOrThrow("period")
  const periods = await periodModel.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true },
  })

  const where: any = { schoolId, termId: validatedInput.termId }
  if (validatedInput.teacherId) where.teacherId = validatedInput.teacherId
  if (validatedInput.classId) where.classId = validatedInput.classId

  const timetableModel = getModelOrThrow("timetable")
  const occupied = await timetableModel.findMany({
    where,
    select: { dayOfWeek: true, periodId: true },
  })

  const occupiedSet = new Set(
    occupied.map((o: any) => `${o.dayOfWeek}:${o.periodId}`)
  )

  const suggestions: Array<{
    dayOfWeek: number
    periodId: string
    periodName: string
  }> = []

  // Use preferred days if provided, otherwise use all working days
  const daysToCheck = validatedInput.preferredDays || config.workingDays

  for (const d of daysToCheck) {
    for (const p of periods) {
      // Skip if preferred periods are specified and this isn't one
      if (
        validatedInput.preferredPeriods &&
        !validatedInput.preferredPeriods.includes(p.id)
      ) {
        continue
      }

      const key = `${d}:${p.id}`
      if (!occupiedSet.has(key)) {
        suggestions.push({ dayOfWeek: d, periodId: p.id, periodName: p.name })
      }
    }
  }

  return { suggestions }
}

type ScheduleConfig = {
  workingDays: number[]
  defaultLunchAfterPeriod?: number | null
}

function formatTimeRange(start: Date, end: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0")
  const sH = start.getUTCHours()
  const sM = start.getUTCMinutes()
  const eH = end.getUTCHours()
  const eM = end.getUTCMinutes()
  return `${pad(sH)}:${pad(sM)}~${pad(eH)}:${pad(eM)}`
}

export async function getScheduleConfig(
  input: unknown
): Promise<{ config: ScheduleConfig }> {
  // Validate input
  const validatedInput = getScheduleConfigSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Try per-term config then school default
  const schoolWeekConfigModel = getModel("schoolWeekConfig")
  const cfg = await schoolWeekConfigModel?.findFirst({
    where: {
      schoolId,
      OR: [{ termId: validatedInput?.termId }, { termId: null }],
    },
    orderBy: { termId: "desc" },
    select: { workingDays: true, defaultLunchAfterPeriod: true },
  })

  const workingDays: number[] =
    Array.isArray(cfg?.workingDays) && cfg!.workingDays.length > 0
      ? cfg!.workingDays
      : [0, 1, 2, 3, 4] // Default Sun–Thu
  const defaultLunchAfterPeriod = cfg?.defaultLunchAfterPeriod ?? null

  return { config: { workingDays, defaultLunchAfterPeriod } }
}

/**
 * School classification (country / type / level) for the schedule configurator's
 * recommended-structure default. Mirrors the data the onboarding schedule step
 * reads, but scoped to the current tenant.
 */
export async function getSchoolClassification(): Promise<{
  country: string | null
  schoolType: string | null
  schoolLevel: string | null
}> {
  await requireReadAccess()
  const { schoolId } = await getTenantContext()
  // No tenant context → return an empty classification; the configurator just
  // falls back to the first preset (no school-specific recommendation).
  if (!schoolId) return { country: null, schoolType: null, schoolLevel: null }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { country: true, schoolType: true, schoolLevel: true },
  })

  return {
    country: school?.country ?? null,
    schoolType: school?.schoolType ?? null,
    schoolLevel: school?.schoolLevel ?? null,
  }
}

type TimetableCell = {
  period: number
  subject: string
  teacher: string
  replaced: boolean
  original: { period: number; subject: string; teacher: string } | null
}

export async function getWeeklyTimetable(input: unknown): Promise<{
  days: number[]
  day_time: string[]
  timetable: TimetableCell[][]
  update_date: string
  lunchAfterPeriod: number | null
}> {
  // Validate input
  const validatedInput = getWeeklyTimetableSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId, role } = await getPermissionContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const weekOffset = validatedInput.weekOffset ?? 0

  // Resolve schedule config (days + lunch rules)
  const { config } = await getScheduleConfig({ termId: validatedInput.termId })
  const days = config.workingDays

  // Determine yearId to fetch periods
  const termModel = getModelOrThrow("term")
  const term = await termModel.findFirst({
    where: { id: validatedInput.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periodModel = getModelOrThrow("period")
  const periods = await periodModel.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const day_time = periods.map(
    (p: any, idx: number) =>
      `${idx + 1}(${formatTimeRange(new Date(p.startTime as Date), new Date(p.endTime as Date))})`
  )

  // Build timetable grid for selected view
  const whereBase: any = { schoolId, termId: validatedInput.termId, weekOffset }

  // Apply role-based filtering
  if (role === "TEACHER") {
    // Teacher can only view their own timetable
    const session = await auth()
    const userId = session?.user?.id
    if (userId) {
      // Resolve teacher record from user ID (user.id !== teacher.id)
      const teacher = await db.teacher.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      if (teacher) {
        whereBase.teacherId = teacher.id
      }
    }
  } else if (role === "STUDENT") {
    // Student can only view their own timetable.
    // Section-first: resolve sectionId from Student record and widen the
    // where clause with an OR so both section-based and legacy class-based
    // slots are visible.
    const session = await auth()
    const userId = session?.user?.id
    if (userId) {
      const studentRecord = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true, sectionId: true },
      })
      if (studentRecord) {
        const enrollments = await db.studentClass.findMany({
          where: { studentId: studentRecord.id, schoolId },
          select: { classId: true },
        })
        const classIds = enrollments.map((e) => e.classId)
        const sectionId = studentRecord.sectionId

        // Build an OR that covers both slot types
        const orClauses: any[] = []
        if (classIds.length > 0) orClauses.push({ classId: { in: classIds } })
        if (sectionId) orClauses.push({ sectionId })

        if (orClauses.length > 0) {
          whereBase.OR = orClauses
        }
      }
    }
  } else {
    // Admin/Developer can specify view filters
    if (validatedInput.view?.classId)
      whereBase.classId = validatedInput.view.classId
    if (validatedInput.view?.teacherId)
      whereBase.teacherId = validatedInput.view.teacherId
  }

  const timetableModel = getModelOrThrow("timetable")
  const rows = await timetableModel.findMany({
    where: whereBase,
    select: {
      dayOfWeek: true,
      periodId: true,
      sectionId: true,
      subjectId: true,
      section: {
        select: {
          id: true,
          name: true,
          letter: true,
          grade: { select: { name: true } },
        },
      },
      subject: {
        select: { id: true, name: true, color: true },
      },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
      teacher: { select: { firstName: true, lastName: true } },
    },
  })

  // Map rows by (day, period) for quick lookup
  const byKey = new Map<string, (typeof rows)[number]>()
  for (const r of rows) {
    byKey.set(`${r.dayOfWeek}:${r.periodId}`, r)
  }

  const timetable: TimetableCell[][] = days.map((day) => {
    return periods.map((p: any, idx: number) => {
      const key = `${day}:${p.id}`
      const row = byKey.get(key)
      if (!row) {
        return {
          period: idx + 1,
          subject: "",
          teacher: "",
          replaced: false,
          original: null,
        }
      }
      const teacherName =
        [row.teacher?.firstName, row.teacher?.lastName]
          .filter(Boolean)
          .join(" ") ||
        [row.class?.teacher?.firstName, row.class?.teacher?.lastName]
          .filter(Boolean)
          .join(" ")
      // Prefer section-based subject name, fall back to class-based for backward compat
      const name =
        row.subject?.name ?? row.class?.subject?.name ?? row.class?.name ?? ""
      return {
        period: idx + 1,
        subject: name,
        teacher: teacherName,
        replaced: false,
        original: null,
      }
    })
  })

  return {
    days,
    day_time,
    timetable,
    update_date: new Date().toISOString(),
    lunchAfterPeriod: config.defaultLunchAfterPeriod ?? null,
  }
}

// ============================================================================
// ADDITIONAL SERVER ACTIONS FOR SUB-ROUTES
// ============================================================================

/**
 * Get rooms for selection dropdown
 */
export async function getRoomsForSelection() {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const rows = await db.classroom.findMany({
    where: { schoolId },
    orderBy: { roomName: "asc" },
    select: { id: true, roomName: true, capacity: true },
  })

  return {
    rooms: rows.map((r) => ({
      id: r.id,
      label: r.roomName,
      capacity: r.capacity,
    })),
  }
}

/**
 * Get timetable filtered by a specific class
 */
export async function getTimetableByClass(input: {
  termId: string
  classId: string
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      classId: input.classId,
      weekOffset: input.weekOffset ?? 0,
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, roomName: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
        },
      },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
  })

  const classInfo = await db.class.findFirst({
    where: { id: input.classId, schoolId },
    select: {
      id: true,
      name: true,
      subject: { select: { name: true } },
    },
  })

  return {
    classInfo: classInfo
      ? {
          id: classInfo.id,
          name: classInfo.name,
          subject: classInfo.subject?.name,
        }
      : null,
    workingDays: config.workingDays,
    periods: periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
    })),
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      teacher: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : "",
      teacherId: s.teacherId ?? undefined,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId ?? undefined,
      subject: s.class?.subject?.name || s.class?.name || "",
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
  }
}

/**
 * Internal helper: get timetable for multiple class IDs (student/guardian views)
 */
async function getTimetableByClassIds(input: {
  termId: string
  classIds: string[]
  sectionId?: string
  weekOffset?: 0 | 1
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const hasClassIds = input.classIds.length > 0
  const hasSectionId = !!input.sectionId

  // Slots + today's live/scheduled Conference indicators load in parallel —
  // both are read-only and independent (see getLiveClassIndicators for the
  // tenant-scoped query it runs).
  const [slots, liveIndicators] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        termId: input.termId,
        weekOffset: input.weekOffset ?? 0,
        ...(hasClassIds || hasSectionId
          ? {
              OR: [
                ...(hasClassIds ? [{ classId: { in: input.classIds } }] : []),
                ...(hasSectionId ? [{ sectionId: input.sectionId }] : []),
              ],
            }
          : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { id: true, roomName: true } },
        class: {
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
          },
        },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        period: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
      },
    }),
    getLiveClassIndicators(schoolId),
  ])

  return {
    workingDays: config.workingDays,
    periods: periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
    })),
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      teacher: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : "",
      teacherId: s.teacherId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.subject?.name || s.class?.subject?.name || s.class?.name || "",
      classId: s.classId,
      sectionId: s.sectionId,
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
    liveIndicators,
  }
}

/**
 * Get full weekly timetable for a student based on their grade level
 * Returns all subjects scheduled for the student's homeroom (e.g., "Grade 10")
 */
export async function getTimetableByStudentGrade(input: {
  termId: string
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("NOT_AUTHENTICATED")

  // Get student record with their enrolled classes via StudentClass relation
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      sectionId: true,
      studentClasses: {
        where: { schoolId },
        select: {
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
              termId: true,
              subject: { select: { name: true } },
            },
          },
        },
      },
    },
  })
  if (!student) throw new Error("STUDENT_NOT_FOUND")

  // Get student's current year level for display
  const studentYearLevel = await db.studentYearLevel.findFirst({
    where: { studentId: student.id, schoolId },
    orderBy: { createdAt: "desc" },
    select: {
      yearLevel: { select: { id: true, levelName: true, lang: true } },
    },
  })

  const gradeName = studentYearLevel?.yearLevel?.levelName || "Unknown Grade"
  const gradeLang = studentYearLevel?.yearLevel?.lang

  // Filter enrolled classes by the requested term
  // StudentClass now directly gives us the classes the student is enrolled in
  const enrolledClasses = student.studentClasses
    .filter((sc) => sc.class.termId === input.termId)
    .map((sc) => sc.class)

  // If no direct enrollment found for this term, fall back to name pattern matching
  // This maintains backward compatibility with existing data
  let classIds: string[]
  let subjectCount: number

  if (enrolledClasses.length > 0) {
    // Use StudentClass enrollment data (preferred)
    classIds = enrolledClasses.map((c) => c.id)
    subjectCount = enrolledClasses.length
  } else if (gradeName && gradeName !== "Unknown Grade") {
    // Fallback: Pattern match by grade name for backward compatibility
    const gradeClasses = await db.class.findMany({
      where: {
        schoolId,
        termId: input.termId,
        name: { endsWith: ` - ${gradeName}` },
      },
      select: {
        id: true,
        name: true,
        subject: { select: { name: true } },
      },
    })
    classIds = gradeClasses.map((c) => c.id)
    subjectCount = gradeClasses.length
  } else {
    // No classes found
    classIds = []
    subjectCount = 0
  }

  // Get schedule config
  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  // Get school name for PDF export
  const school = await db.school.findFirst({
    where: { id: schoolId },
    select: { name: true },
  })

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const studentSectionId = student.sectionId ?? undefined
  const hasClassIds = classIds.length > 0
  const hasSectionId = !!studentSectionId

  // Get all timetable slots for all classes in this grade (and section-based
  // slots), alongside today's live/scheduled Conference indicators — both
  // read-only and independent, so they run in parallel.
  const [slots, liveIndicators] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        termId: input.termId,
        weekOffset: input.weekOffset ?? 0,
        ...(hasClassIds || hasSectionId
          ? {
              OR: [
                ...(hasClassIds ? [{ classId: { in: classIds } }] : []),
                ...(hasSectionId ? [{ sectionId: studentSectionId }] : []),
              ],
            }
          : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        classroom: { select: { id: true, roomName: true } },
        class: {
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
          },
        },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        period: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
      },
    }),
    getLiveClassIndicators(schoolId),
  ])

  return {
    studentInfo: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      gradeName,
      gradeLang,
    },
    schoolName: school?.name || "",
    subjectCount,
    workingDays: config.workingDays,
    periods: periods.map((p, idx) => ({
      id: p.id,
      name: p.name,
      order: idx + 1,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak:
        p.name.toLowerCase().includes("break") ||
        p.name.toLowerCase().includes("lunch"),
    })),
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      teacher: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : "",
      teacherId: s.teacherId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.subject?.name || s.class?.subject?.name || s.class?.name || "",
      className: s.class?.name || "",
      classId: s.classId,
      sectionId: s.sectionId,
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
    liveIndicators,
  }
}

/**
 * Get timetable for a specific grade level (for admin class view)
 * Returns all subjects scheduled for a homeroom (e.g., "Grade 10")
 */
export async function getTimetableByGradeLevel(input: {
  termId: string
  gradeName: string // e.g., "Grade 10", "KG 1"
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get all classes for this grade level
  const gradeClasses = await db.class.findMany({
    where: {
      schoolId,
      termId: input.termId,
      name: { endsWith: ` - ${input.gradeName}` },
    },
    select: {
      id: true,
      name: true,
      subject: { select: { name: true } },
    },
  })

  const classIds = gradeClasses.map((c) => c.id)

  // Section axis: sections whose grade matches the requested grade name —
  // section-based slots carry no classId, so the class filter alone would
  // return an empty grid for migrated schools. Grade display names vary by
  // curriculum config, so match by extracted grade number with a name-equality
  // fallback.
  const { extractGradeNumber } = await import("@/lib/grade-utils")
  const gradeNumber = extractGradeNumber(input.gradeName)
  const gradeSections = await db.section.findMany({
    where: {
      schoolId,
      grade: gradeNumber !== null ? { gradeNumber } : { name: input.gradeName },
    },
    select: { id: true },
  })
  const sectionIds = gradeSections.map((s) => s.id)

  // Get schedule config
  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  // Get all timetable slots for this grade — both axes
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      weekOffset: input.weekOffset ?? 0,
      OR: [
        ...(classIds.length > 0 ? [{ classId: { in: classIds } }] : []),
        ...(sectionIds.length > 0 ? [{ sectionId: { in: sectionIds } }] : []),
        // Neither axis resolvable → match nothing (preserves empty result)
        ...(classIds.length === 0 && sectionIds.length === 0
          ? [{ id: { in: [] as string[] } }]
          : []),
      ],
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, roomName: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
        },
      },
      section: { select: { id: true, name: true } },
      subject: { select: { name: true } },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
  })

  // Get year level info for Arabic name
  const yearLevel = await db.yearLevel.findFirst({
    where: { schoolId, levelName: input.gradeName },
    select: { lang: true },
  })

  return {
    gradeInfo: {
      name: input.gradeName,
      lang: yearLevel?.lang || "ar",
    },
    subjectCount: gradeClasses.length,
    subjects: gradeClasses.map((c) => ({
      id: c.id,
      name: c.subject?.name || c.name,
    })),
    workingDays: config.workingDays,
    periods: periods.map((p, idx) => ({
      id: p.id,
      name: p.name,
      order: idx + 1,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak:
        p.name.toLowerCase().includes("break") ||
        p.name.toLowerCase().includes("lunch"),
    })),
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      teacher: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : "",
      teacherId: s.teacherId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.class?.subject?.name || s.class?.name || "",
      className: s.class?.name || "",
      classId: s.classId,
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
  }
}

/**
 * Get list of all grade levels for timetable selection dropdown
 */
export async function getGradeLevelsForSelection(input?: { termId?: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get year levels that have classes in the specified term
  const yearLevels = await db.yearLevel.findMany({
    where: { schoolId },
    orderBy: { levelOrder: "asc" },
    select: {
      id: true,
      levelName: true,
      lang: true,
      levelOrder: true,
    },
  })

  // If termId provided, filter to only grades with classes in that term
  if (input?.termId) {
    const classesInTerm = await db.class.findMany({
      where: { schoolId, termId: input.termId },
      select: { name: true },
    })

    const gradesWithClasses = new Set<string>()
    for (const c of classesInTerm) {
      // Extract grade from class name like "Mathematics - Grade 10"
      const match = c.name.match(/ - (.+)$/)
      if (match) {
        gradesWithClasses.add(match[1])
      }
    }

    return {
      gradeLevels: yearLevels
        .filter((yl) => gradesWithClasses.has(yl.levelName))
        .map((yl) => ({
          id: yl.id,
          name: yl.levelName,
          lang: yl.lang,
          order: yl.levelOrder,
        })),
    }
  }

  return {
    gradeLevels: yearLevels.map((yl) => ({
      id: yl.id,
      name: yl.levelName,
      lang: yl.lang,
      order: yl.levelOrder,
    })),
  }
}

/**
 * Get timetable filtered by a specific teacher
 */
export async function getTimetableByTeacher(input: {
  termId: string
  teacherId: string
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  // Slots + today's live/scheduled Conference indicators load in parallel —
  // both are read-only and independent.
  const [slots, teacherInfo, liveIndicators] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        termId: input.termId,
        teacherId: input.teacherId,
        weekOffset: input.weekOffset ?? 0,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
          },
        },
        subject: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        classroom: { select: { id: true, roomName: true } },
        period: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
      },
    }),
    db.teacher.findFirst({
      where: { id: input.teacherId, schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        emailAddress: true,
      },
    }),
    getLiveClassIndicators(schoolId),
  ])

  // Calculate workload
  const uniqueDays = new Set(slots.map((s) => s.dayOfWeek))
  const totalPeriods = slots.length

  // Localize subject names to the app language (catalog names are stored in one
  // language; e.g. show "Geography" on /en and its Arabic on /ar). Batched.
  const lang = await getDisplayLang()
  const rawSubject = (s: (typeof slots)[number]) =>
    s.class?.subject?.name || s.subject?.name || s.class?.name || ""
  const subjectLabels = await getLabels(slots.map(rawSubject), lang, schoolId)
  const teacherDisplayName = teacherInfo
    ? (
        await getNames(
          [teacherInfo],
          (t) => ({ firstName: t.firstName, lastName: t.lastName }),
          lang,
          schoolId
        )
      ).get(`${teacherInfo.firstName} ${teacherInfo.lastName}`.trim()) ||
      `${teacherInfo.firstName} ${teacherInfo.lastName}`
    : ""

  return {
    teacherInfo: teacherInfo
      ? {
          id: teacherInfo.id,
          name: teacherDisplayName,
          email: teacherInfo.emailAddress,
        }
      : null,
    workingDays: config.workingDays,
    periods: periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
    })),
    slots: slots.map((s) => {
      const subject = rawSubject(s)
      return {
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        periodId: s.periodId,
        periodName: s.period.name,
        className: s.class?.name || s.section?.name || "",
        classId: s.classId,
        sectionId: s.sectionId,
        room: s.classroom?.roomName || "",
        roomId: s.classroomId,
        subject: subjectLabels.get(subject) || subject,
      }
    }),
    workload: {
      daysPerWeek: uniqueDays.size,
      periodsPerWeek: totalPeriods,
      classesTeaching: [...new Set(slots.map((s) => s.classId))].length,
    },
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
    liveIndicators,
  }
}

/**
 * Get timetable filtered by a specific room
 */
export async function getTimetableByRoom(input: {
  termId: string
  roomId: string
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  // Slots + today's live/scheduled Conference indicators load in parallel —
  // both are read-only and independent.
  const [slots, liveIndicators] = await Promise.all([
    db.timetable.findMany({
      where: {
        schoolId,
        termId: input.termId,
        classroomId: input.roomId,
        weekOffset: input.weekOffset ?? 0,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: { select: { name: true } },
          },
        },
        subject: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        period: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
      },
    }),
    getLiveClassIndicators(schoolId),
  ])

  const roomInfo = await db.classroom.findFirst({
    where: { id: input.roomId, schoolId },
    select: { id: true, roomName: true, capacity: true },
  })

  // Calculate utilization
  const totalPossibleSlots =
    config.workingDays.length *
    periods.filter(
      (p) => !p.name.includes("Break") && !p.name.includes("Lunch")
    ).length
  const utilizationRate =
    totalPossibleSlots > 0 ? (slots.length / totalPossibleSlots) * 100 : 0

  // Localize teacher and subject names to the app language (stored names may be
  // Arabic; the grid must read e.g. "Mariam Ibrahim" / "Geography" on /en).
  const lang = await getDisplayLang()
  const rawSubject = (s: (typeof slots)[number]) =>
    s.class?.subject?.name || s.subject?.name || s.class?.name || ""
  const subjectLabels = await getLabels(slots.map(rawSubject), lang, schoolId)
  const teacherNames = await getNames(
    slots.filter((s) => s.teacher).map((s) => s.teacher!),
    (t) => ({ firstName: t.firstName, lastName: t.lastName }),
    lang,
    schoolId
  )

  return {
    roomInfo: roomInfo
      ? {
          id: roomInfo.id,
          name: roomInfo.roomName,
          capacity: roomInfo.capacity,
        }
      : null,
    workingDays: config.workingDays,
    periods: periods.map((p) => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime,
    })),
    slots: slots.map((s) => {
      const subject = rawSubject(s)
      const rawTeacher = s.teacher
        ? `${s.teacher.firstName} ${s.teacher.lastName}`.trim()
        : ""
      return {
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        periodId: s.periodId,
        periodName: s.period.name,
        className: s.class?.name || s.section?.name || "",
        classId: s.classId,
        sectionId: s.sectionId,
        teacher: rawTeacher ? teacherNames.get(rawTeacher) || rawTeacher : "",
        teacherId: s.teacherId,
        subject: subjectLabels.get(subject) || subject,
      }
    }),
    utilization: {
      usedSlots: slots.length,
      totalSlots: totalPossibleSlots,
      rate: Math.round(utilizationRate),
    },
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
    liveIndicators,
  }
}

/**
 * Get timetable analytics data
 */
export async function getTimetableAnalytics(input: { termId: string }) {
  await requirePermission("view_analytics")

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
  })

  const slots = await db.timetable.findMany({
    where: { schoolId, termId: input.termId, weekOffset: 0 },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      classroom: { select: { id: true, roomName: true, capacity: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { name: true } },
        },
      },
    },
  })

  // Teacher workload analysis
  const teacherWorkload = new Map<
    string,
    {
      name: string
      periods: number
      classes: Set<string>
      subjects: Set<string>
    }
  >()
  for (const slot of slots) {
    if (slot.teacher) {
      const key = slot.teacherId ?? ""
      const existing = teacherWorkload.get(key) || {
        name: `${slot.teacher.firstName} ${slot.teacher.lastName}`,
        periods: 0,
        classes: new Set(),
        subjects: new Set(),
      }
      existing.periods++
      if (slot.classId) existing.classes.add(slot.classId)
      if (slot.class?.subject?.name)
        existing.subjects.add(slot.class.subject.name)
      teacherWorkload.set(key, existing)
    }
  }

  // Room utilization analysis
  const rooms = await db.classroom.findMany({
    where: { schoolId },
    select: { id: true, roomName: true, capacity: true },
  })

  const teachingPeriods = periods.filter(
    (p) => !p.name.includes("Break") && !p.name.includes("Lunch")
  )
  const maxSlotsPerRoom = config.workingDays.length * teachingPeriods.length

  // Count used slots per room in ONE pass over the slots (already in memory)
  // instead of re-filtering the whole slots array for every room — the latter
  // is O(rooms × slots) (e.g. 30 × 840 ≈ 25k comparisons on the albayan seed).
  const slotsPerRoom = new Map<string, number>()
  for (const s of slots) {
    if (s.classroomId)
      slotsPerRoom.set(
        s.classroomId,
        (slotsPerRoom.get(s.classroomId) ?? 0) + 1
      )
  }

  const roomUtilization = rooms.map((room) => {
    const usedSlots = slotsPerRoom.get(room.id) ?? 0
    return {
      id: room.id,
      name: room.roomName,
      capacity: room.capacity,
      usedSlots,
      totalSlots: maxSlotsPerRoom,
      utilizationRate:
        maxSlotsPerRoom > 0
          ? Math.round((usedSlots / maxSlotsPerRoom) * 100)
          : 0,
    }
  })

  // Subject distribution
  const subjectDist = new Map<
    string,
    { name: string; periods: number; classes: Set<string> }
  >()
  for (const slot of slots) {
    const subject = slot.class?.subject?.name || slot.class?.name || "Unknown"
    const existing = subjectDist.get(subject) || {
      name: subject,
      periods: 0,
      classes: new Set(),
    }
    existing.periods++
    if (slot.classId) existing.classes.add(slot.classId)
    subjectDist.set(subject, existing)
  }

  // Detect conflicts
  const { conflicts } = await detectTimetableConflicts({ termId: input.termId })

  return {
    summary: {
      totalSlots: slots.length,
      totalTeachers: teacherWorkload.size,
      totalRooms: rooms.length,
      totalClasses: [...new Set(slots.map((s) => s.classId))].length,
      conflictCount: conflicts.length,
    },
    teacherWorkload: Array.from(teacherWorkload.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        periodsPerWeek: data.periods,
        classesCount: data.classes.size,
        subjects: Array.from(data.subjects),
      }))
      .sort((a, b) => b.periodsPerWeek - a.periodsPerWeek),
    roomUtilization: roomUtilization.sort(
      (a, b) => b.utilizationRate - a.utilizationRate
    ),
    subjectDistribution: Array.from(subjectDist.entries())
      .map(([name, data]) => ({
        name,
        periodsPerWeek: data.periods,
        classesCount: data.classes.size,
      }))
      .sort((a, b) => b.periodsPerWeek - a.periodsPerWeek),
    conflicts,
  }
}

/**
 * Delete a timetable slot.
 * Section-first: accepts slot `id` (works for both section-based and legacy slots).
 * Legacy composite-key fields kept for backward compat — ignored when id is present.
 */
export async function deleteTimetableSlot(rawInput: {
  /** Preferred: delete by primary key — works for all slot types */
  id?: string
  // Legacy composite key fields (used only when id is absent)
  termId?: string
  dayOfWeek?: number
  periodId?: string
  classId?: string
  weekOffset?: 0 | 1
}) {
  await requireAdminAccess()
  const input = deleteTimetableSlotSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Resolve the slot — prefer id, fall back to legacy composite key
  let slotToDelete: {
    id: string
    dayOfWeek: number
    teacher: {
      userId: string | null
      firstName: string | null
      lastName: string | null
    } | null
    class: { name: string } | null
    section: { name: string } | null
  } | null = null

  if (input.id) {
    slotToDelete = await db.timetable.findFirst({
      where: { id: input.id, schoolId },
      include: {
        teacher: { select: { userId: true, firstName: true, lastName: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    })
  } else if (
    input.termId &&
    input.dayOfWeek !== undefined &&
    input.periodId &&
    input.classId &&
    input.weekOffset !== undefined
  ) {
    // Legacy composite-key lookup
    slotToDelete = await db.timetable.findFirst({
      where: {
        schoolId,
        termId: input.termId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
        classId: input.classId,
        weekOffset: input.weekOffset,
      },
      include: {
        teacher: { select: { userId: true, firstName: true, lastName: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    })
  }

  if (!slotToDelete) {
    throw new Error("SLOT_NOT_FOUND")
  }

  // Delete by primary key (works for section-based and legacy slots alike)
  await db.timetable.delete({ where: { id: slotToDelete.id } })

  await logTimetableAction("delete", {
    entityType: "slot",
    metadata: { id: slotToDelete.id, ...input },
  })

  // Notify teacher about removed slot (non-blocking)
  if (slotToDelete?.teacher?.userId) {
    const schoolPref2 = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const notifLang2 = schoolPref2?.preferredLanguage ?? "ar"
    const slotLabel =
      slotToDelete.section?.name ||
      slotToDelete.class?.name ||
      (notifLang2 === "ar" ? "الحصة" : "the class")
    dispatchNotification({
      schoolId,
      userId: slotToDelete.teacher.userId,
      type: "class_cancelled",
      title: notifLang2 === "ar" ? "إلغاء حصة" : "Class cancelled",
      body:
        notifLang2 === "ar"
          ? `تم إلغاء حصة ${slotLabel} من الجدول`
          : `${slotLabel} has been removed from the schedule`,
      lang: notifLang2,
      priority: "normal",
      channels: ["in_app"],
      metadata: {
        dayOfWeek: slotToDelete.dayOfWeek,
        slotLabel,
        url: "/timetable",
      },
    }).catch((err) =>
      console.error("[deleteTimetableSlot] Notification error:", err)
    )
  }

  return { success: true }
}

/**
 * Get all periods for the current term
 */
export async function getPeriodsForTerm(input: { termId: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  return {
    periods: periods.map((p, idx) => ({
      id: p.id,
      name: p.name,
      order: idx + 1,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak:
        p.name.toLowerCase().includes("break") ||
        p.name.toLowerCase().includes("lunch"),
    })),
  }
}

// ============================================================================
// ACTIVE TERM & ROLE-BASED TIMETABLE ACTIONS
// ============================================================================

/**
 * Build a display-only schedule (term shell + period grid) from the school's
 * timetable structure, for schools that have no real `Term` yet.
 *
 * Pure read: writes NOTHING to the database. Used to render an empty fallback
 * grid instead of hard-blocking with "No term configured". The school's
 * `timetableStructure` slug drives the periods/working-days; falls back to the
 * always-present "us-standard" structure when unset/unknown.
 */
async function buildDraftSchedule(schoolId: string) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { timetableStructure: true },
  })
  const structure =
    getStructureBySlug(school?.timetableStructure ?? "us-standard") ??
    getStructureBySlug("us-standard")!

  const now = new Date()
  const startYear =
    now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const startDate = new Date(startYear, 8, 1) // Sep 1
  const endDate = new Date(startYear + 1, 5, 30) // Jun 30

  const periods = structure.periods.map((p, idx) => {
    const [sh, sm] = p.startTime.split(":").map(Number)
    const [eh, em] = p.endTime.split(":").map(Number)
    return {
      id: `draft-${idx}`,
      name: p.name,
      order: idx + 1,
      startTime: new Date(Date.UTC(1970, 0, 1, sh, sm)),
      endTime: new Date(Date.UTC(1970, 0, 1, eh, em)),
      isBreak: p.type !== "class",
    }
  })

  return {
    yearName: structure.name,
    startDate,
    endDate,
    workingDays: structure.workingDays,
    lunchAfterPeriod: structure.lunchAfterPeriod,
    periods,
  }
}

/**
 * Get the active term for the current school
 * Priority: 1) Term.isActive=true 2) Today within term dates 3) Most recent
 * Fallback: when the school has NO term yet, return a display-only draft term
 * (id = DRAFT_TERM_ID) so the timetable still renders an empty grid.
 */
export async function getActiveTerm() {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const { term, source } = await resolveActiveTerm(schoolId)

  if (!term) {
    // No real term yet — synthesize a draft so the grid renders (no DB writes).
    const draft = await buildDraftSchedule(schoolId)
    return {
      term: {
        id: DRAFT_TERM_ID,
        termNumber: 1,
        label: `${draft.yearName} — Draft`,
        startDate: draft.startDate,
        endDate: draft.endDate,
        yearId: DRAFT_TERM_ID,
      },
      source: "none" as const,
      isDraft: true,
    }
  }

  // Fetch year name for label
  const schoolYear = await db.schoolYear.findFirst({
    where: { id: term.yearId },
    select: { yearName: true },
  })

  return {
    term: {
      id: term.id,
      termNumber: term.termNumber,
      label: `${schoolYear?.yearName ?? "Unknown"} - Term ${term.termNumber}`,
      startDate: term.startDate,
      endDate: term.endDate,
      yearId: term.yearId,
    },
    source,
    isDraft: false,
  }
}

/**
 * Set a term as active (admin only)
 */
export async function setActiveTerm(input: { termId: string }) {
  await requireAdminAccess()

  const { termId } = setActiveTermSchema.parse(input)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Verify the term belongs to this school BEFORE deactivating anything —
  // otherwise a foreign/invalid termId would deactivate all of this school's
  // terms and activate none (leaving zero active terms).
  const term = await db.term.findFirst({
    where: { id: termId, schoolId },
    select: { id: true },
  })
  if (!term) throw new Error("TERM_NOT_FOUND")

  // Atomic flip: deactivate all, activate the target — in one transaction so a
  // crash between the two writes can never leave every term inactive.
  await db.$transaction([
    db.term.updateMany({ where: { schoolId }, data: { isActive: false } }),
    db.term.updateMany({
      where: { id: termId, schoolId },
      data: { isActive: true },
    }),
  ])

  await logTimetableAction("configure_settings", {
    entityType: "term",
    entityId: termId,
    changes: { isActive: true },
  })

  return { success: true }
}

/**
 * Provision a real academic year + terms + periods + week config from the
 * school's timetable structure. Backs the timetable "Set up timetable" CTA that
 * appears on the draft fallback grid. Admin-only.
 *
 * Idempotent + non-destructive: skips entirely if a term already exists, and
 * only invokes the structure applier when there are zero periods AND zero terms
 * (applyTimetableStructureForNewSchool duplicates periods on re-run, so the
 * count guard is mandatory).
 */
export async function provisionTimetableForSchool() {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Already has a resolvable term — nothing to do.
  const existing = await resolveActiveTerm(schoolId)
  if (existing.term) return { success: true, provisioned: false }

  const [periodCount, termCount] = await Promise.all([
    db.period.count({ where: { schoolId } }),
    db.term.count({ where: { schoolId } }),
  ])

  if (periodCount === 0 && termCount === 0) {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { timetableStructure: true },
    })
    await applyTimetableStructureForNewSchool(
      schoolId,
      school?.timetableStructure ?? "us-standard"
    )
    await logTimetableAction("configure_settings", {
      entityType: "term",
      entityId: "auto-provision",
      changes: { provisioned: true },
    })
    return { success: true, provisioned: true }
  }

  // Partial state (periods or terms exist but no term resolved) — don't risk
  // duplicate periods; surface so it can be fixed in settings.
  return { success: false, errorCode: "TIMETABLE_PARTIAL_STATE" as const }
}

type ViewType = "admin" | "teacher" | "student" | "guardian"

/**
 * Get personalized timetable based on user role
 * Returns appropriate view type and data based on session
 */
export async function getPersonalizedTimetable(input: {
  termId: string
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId, role } = await getPermissionContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("NOT_AUTHENTICATED")

  // Determine view type based on role
  let viewType: ViewType = "admin"
  let editable = true
  let filterData: {
    teacherId?: string
    classId?: string
    classIds?: string[]
    childrenIds?: string[]
  } = {}

  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      viewType = "admin"
      break

    case "TEACHER": {
      viewType = "teacher"
      // Get teacher record linked to user
      const teacher = await db.teacher.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      if (teacher) {
        filterData.teacherId = teacher.id
      }
      break
    }

    case "STUDENT": {
      viewType = "student"
      // Get student record and ALL enrolled classes
      const student = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      if (student) {
        // Get ALL class enrollments (not just one)
        const enrollments = await db.studentClass.findMany({
          where: { studentId: student.id, schoolId },
          select: { classId: true },
        })
        const classIds = enrollments.map((e) => e.classId)
        if (classIds.length > 0) {
          filterData.classIds = classIds
        }
      }
      break
    }

    case "GUARDIAN": {
      viewType = "guardian"
      // Get guardian record
      const guardian = await db.guardian.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      if (guardian) {
        // Get linked children (students)
        const studentGuardians = await db.studentGuardian.findMany({
          where: { guardianId: guardian.id, schoolId },
          select: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        })
        filterData.childrenIds = studentGuardians.map((sg) => sg.student.id)
      }
      break
    }

    case "ACCOUNTANT":
    case "STAFF":
      viewType = "admin"
      editable = false
      break

    default:
      viewType = "student" // Default to most restricted view
  }

  // Draft fallback: no real term yet — render a read-only grid built from the
  // school's structure. Writes nothing; editing is unlocked once an admin
  // provisions a real term via provisionTimetableForSchool().
  if (input.termId === DRAFT_TERM_ID) {
    const draft = await buildDraftSchedule(schoolId)
    return {
      viewType,
      editable: false,
      filterData,
      termInfo: {
        id: DRAFT_TERM_ID,
        termNumber: 1,
        yearName: draft.yearName,
        label: `${draft.yearName} — Draft`,
      },
      workingDays: draft.workingDays,
      periods: draft.periods,
      lunchAfterPeriod: draft.lunchAfterPeriod,
      isDraft: true,
      canProvision: role === "ADMIN" || role === "DEVELOPER",
    }
  }

  // Get base schedule data
  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: {
      yearId: true,
      termNumber: true,
      schoolYear: { select: { yearName: true } },
    },
  })
  if (!term) throw new Error("INVALID_TERM")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  return {
    viewType,
    editable,
    filterData,
    termInfo: {
      id: input.termId,
      termNumber: term.termNumber,
      yearName: term.schoolYear.yearName,
      label: `${term.schoolYear.yearName} - Term ${term.termNumber}`,
    },
    workingDays: config.workingDays,
    periods: periods.map((p, idx) => ({
      id: p.id,
      name: p.name,
      order: idx + 1,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak:
        p.name.toLowerCase().includes("break") ||
        p.name.toLowerCase().includes("lunch"),
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
  }
}

/**
 * Get children linked to the authenticated guardian
 */
export async function getGuardianChildren() {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("NOT_AUTHENTICATED")

  // Get guardian record with linked students in a single query (fixes N+1)
  // Include student classes and year levels for complete data
  const guardian = await db.guardian.findFirst({
    where: { userId, schoolId },
    select: {
      id: true,
      studentGuardians: {
        where: { schoolId },
        select: {
          isPrimary: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
              studentClasses: {
                where: { schoolId },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  class: {
                    select: {
                      id: true,
                      name: true,
                      subject: { select: { name: true } },
                    },
                  },
                },
              },
              studentYearLevels: {
                where: { schoolId },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                  yearLevel: {
                    select: {
                      levelName: true,
                      lang: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!guardian) {
    return { children: [] }
  }

  // Transform the data into the expected format
  const children = guardian.studentGuardians.map((sg) => {
    const enrollment = sg.student.studentClasses[0]
    const yearLevel = sg.student.studentYearLevels[0]

    return {
      id: sg.student.id,
      name: `${sg.student.firstName} ${sg.student.lastName}`,
      photoUrl: sg.student.profilePhotoUrl,
      classId: enrollment?.class.id,
      className: enrollment?.class.name,
      gradeName: yearLevel?.yearLevel?.levelName,
      gradeLang: yearLevel?.yearLevel?.lang,
      isPrimary: sg.isPrimary,
    }
  })

  return { children }
}

/**
 * Get timetable for a specific child (guardian view)
 */
export async function getChildTimetable(input: {
  termId: string
  childId: string
  weekOffset?: 0 | 1
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!userId) throw new Error("NOT_AUTHENTICATED")

  // Verify guardian has access to this child (unless admin). A caller with
  // NO guardian record in this school must be denied too — skipping the
  // check would let any authenticated user fetch any child's timetable.
  if (role !== "DEVELOPER" && role !== "ADMIN") {
    const guardian = await db.guardian.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    if (!guardian) {
      throw new Error("ACCESS_DENIED")
    }

    const hasAccess = await db.studentGuardian.findFirst({
      where: {
        guardianId: guardian.id,
        studentId: input.childId,
        schoolId,
      },
    })

    if (!hasAccess) {
      throw new Error("ACCESS_DENIED")
    }
  }

  // Get ALL student's enrolled classes (legacy axis) + section placement (primary)
  const enrollments = await db.studentClass.findMany({
    where: { studentId: input.childId, schoolId },
    select: { classId: true },
  })

  const student = await db.student.findFirst({
    where: { id: input.childId, schoolId },
    select: { id: true, firstName: true, lastName: true, sectionId: true },
  })

  const classIds = enrollments.map((e) => e.classId)

  // A child placed in a section but not yet enrolled in course classes still
  // has a visible timetable — section-based slots cover them.
  if (classIds.length === 0 && !student?.sectionId) {
    return {
      studentInfo: null,
      slots: [],
      workingDays: [],
      periods: [],
      lunchAfterPeriod: null,
    }
  }

  const timetableData = await getTimetableByClassIds({
    termId: input.termId,
    classIds,
    sectionId: student?.sectionId ?? undefined,
    weekOffset: input.weekOffset,
  })

  return {
    studentInfo: student
      ? {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
        }
      : null,
    ...timetableData,
  }
}

/**
 * Today's schedule for a guardian's selected child, with live-class Join
 * targets attached. Mirrors the STUDENT branch of getTodaySchedule but resolves
 * the child by id behind the same guardian-access gate as getChildTimetable —
 * so the guardian timetable can surface a Join button (guardians join as
 * OBSERVER; external links open the meeting URL directly).
 */
export async function getChildTodaySchedule(input: {
  childId: string
  date?: Date
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!userId) throw new Error("NOT_AUTHENTICATED")

  // Same guardian-access gate as getChildTimetable: a caller with no guardian
  // record (and not ADMIN/DEV) is denied; a guardian must own the child.
  if (role !== "DEVELOPER" && role !== "ADMIN") {
    const guardian = await db.guardian.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!guardian) throw new Error("ACCESS_DENIED")
    const hasAccess = await db.studentGuardian.findFirst({
      where: { guardianId: guardian.id, studentId: input.childId, schoolId },
      select: { id: true },
    })
    if (!hasAccess) throw new Error("ACCESS_DENIED")
  }

  const targetDate = input.date || new Date()
  const dayOfWeek = targetDate.getDay()

  const { term } = await getActiveTerm()
  if (!term) return { schedule: [], dayOfWeek, message: "No active term" }

  const [periods, student] = await Promise.all([
    db.period.findMany({
      where: { schoolId, yearId: term.yearId },
      orderBy: { startTime: "asc" },
      select: { id: true, name: true, startTime: true, endTime: true },
    }),
    db.student.findFirst({
      where: { id: input.childId, schoolId },
      select: { id: true, sectionId: true },
    }),
  ])

  if (!student) return { schedule: [], dayOfWeek }

  // Section-based slots (primary) + legacy class enrollments — same OR axis as
  // the STUDENT branch of getTodaySchedule.
  const enrollments = await db.studentClass.findMany({
    where: { studentId: student.id, schoolId },
    select: { classId: true },
  })
  const classIds = enrollments.map((e) => e.classId)
  const orClauses: Array<Record<string, unknown>> = []
  if (classIds.length > 0) orClauses.push({ classId: { in: classIds } })
  if (student.sectionId) orClauses.push({ sectionId: student.sectionId })
  if (orClauses.length === 0) return { schedule: [], dayOfWeek }

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: term.id,
      dayOfWeek,
      weekOffset: 0,
      OR: orClauses,
    },
    include: {
      class: { select: { name: true, subject: { select: { name: true } } } },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true } },
      classroom: { select: { roomName: true } },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  const schedule = slots.map((slot) => ({
    periodId: slot.periodId,
    periodName: slot.period.name,
    startTime: slot.period.startTime,
    endTime: slot.period.endTime,
    subject:
      slot.subject?.name || slot.class?.subject?.name || slot.class?.name || "",
    className: slot.class?.name || slot.section?.name || "",
    teacher: slot.teacher
      ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
      : "",
    room: slot.classroom?.roomName || "",
    sectionId: slot.sectionId,
    subjectId: slot.subjectId,
    timetableId: slot.id,
    isBreak: false,
  }))

  const fullSchedule = periods.map((period) => {
    const existing = schedule.find((s) => s.periodId === period.id)
    if (existing) return existing
    const isBreak =
      period.name.toLowerCase().includes("break") ||
      period.name.toLowerCase().includes("lunch")
    return {
      periodId: period.id,
      periodName: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      subject: isBreak ? period.name : "",
      className: "",
      teacher: "",
      room: "",
      sectionId: null,
      subjectId: null,
      timetableId: null,
      isBreak,
    }
  })

  const scheduleWithLiveClasses = await attachLiveClasses(
    schoolId,
    term.id,
    targetDate,
    fullSchedule
  )

  return {
    schedule: scheduleWithLiveClasses,
    dayOfWeek,
    date: targetDate.toISOString(),
  }
}

/**
 * Get today's schedule for the authenticated user
 */
export async function getTodaySchedule(input?: { date?: Date }) {
  await requireReadAccess()

  const { schoolId, role } = await getPermissionContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("NOT_AUTHENTICATED")

  const targetDate = input?.date || new Date()
  const dayOfWeek = targetDate.getDay() // 0 = Sunday

  // Get active term
  const { term } = await getActiveTerm()
  if (!term) {
    return { schedule: [], dayOfWeek, message: "No active term" }
  }

  // Fetch periods (role-independent) alongside the role-entity lookup so the
  // today-view doesn't pay two serial round-trips on its hottest endpoint.
  const [periods, teacher, student] = await Promise.all([
    db.period.findMany({
      where: { schoolId, yearId: term.yearId },
      orderBy: { startTime: "asc" },
      select: { id: true, name: true, startTime: true, endTime: true },
    }),
    role === "TEACHER"
      ? db.teacher.findFirst({
          where: { userId, schoolId },
          select: { id: true },
        })
      : Promise.resolve(null),
    role === "STUDENT"
      ? db.student.findFirst({
          where: { userId, schoolId },
          select: { id: true, sectionId: true },
        })
      : Promise.resolve(null),
  ])

  // Build filter based on role
  const where: {
    schoolId: string
    termId: string
    dayOfWeek: number
    weekOffset: number
    teacherId?: string
    classId?: string | { in: string[] }
    OR?: Array<Record<string, unknown>>
  } = {
    schoolId,
    termId: term.id,
    dayOfWeek,
    weekOffset: 0,
  }

  if (role === "TEACHER") {
    if (teacher) where.teacherId = teacher.id
  } else if (role === "STUDENT") {
    if (student) {
      const enrollments = await db.studentClass.findMany({
        where: { studentId: student.id, schoolId },
        select: { classId: true },
      })
      const classIds = enrollments.map((e) => e.classId)
      // Section-based slots (primary) + legacy class enrollments
      const orClauses: Array<Record<string, unknown>> = []
      if (classIds.length > 0) orClauses.push({ classId: { in: classIds } })
      if (student.sectionId) orClauses.push({ sectionId: student.sectionId })
      if (orClauses.length > 0) where.OR = orClauses
    }
  }

  const slots = await db.timetable.findMany({
    where,
    include: {
      class: {
        select: { name: true, subject: { select: { name: true } } },
      },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      teacher: { select: { firstName: true, lastName: true } },
      classroom: { select: { roomName: true } },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
    orderBy: { period: { startTime: "asc" } },
  })

  const schedule = slots.map((slot) => ({
    periodId: slot.periodId,
    periodName: slot.period.name,
    startTime: slot.period.startTime,
    endTime: slot.period.endTime,
    subject:
      slot.subject?.name || slot.class?.subject?.name || slot.class?.name || "",
    className: slot.class?.name || slot.section?.name || "",
    teacher: slot.teacher
      ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
      : "",
    room: slot.classroom?.roomName || "",
    // Anchors for live-class matching (section-based slots carry these).
    sectionId: slot.sectionId,
    subjectId: slot.subjectId,
    // Timetable slot id — lets the teacher start a live class from this slot.
    timetableId: slot.id,
    isBreak: false,
  }))

  // Fill in empty periods
  const fullSchedule = periods.map((period) => {
    const existing = schedule.find((s) => s.periodId === period.id)
    if (existing) return existing

    const isBreak =
      period.name.toLowerCase().includes("break") ||
      period.name.toLowerCase().includes("lunch")
    return {
      periodId: period.id,
      periodName: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      subject: isBreak ? period.name : "",
      className: "",
      teacher: "",
      room: "",
      sectionId: null,
      subjectId: null,
      timetableId: null,
      isBreak,
    }
  })

  // Attach the Join target (today's session, else the recurring default link)
  // for each entry. Scoped by schoolId + active term.
  const scheduleWithLiveClasses = await attachLiveClasses(
    schoolId,
    term.id,
    targetDate,
    fullSchedule
  )

  return {
    schedule: scheduleWithLiveClasses,
    dayOfWeek,
    date: targetDate.toISOString(),
    termLabel: term.label,
  }
}

// ============================================================================
// TEACHER CONSTRAINT MANAGEMENT ACTIONS
// ============================================================================

/**
 * Get teacher constraints
 */
export async function getTeacherConstraints(input: {
  teacherId: string
  termId?: string
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const constraint = await db.teacherConstraint.findFirst({
    where: {
      schoolId,
      teacherId: input.teacherId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
    include: {
      unavailableBlocks: true,
      teacher: { select: { firstName: true, lastName: true } },
    },
    orderBy: { termId: "desc" },
  })

  if (!constraint) {
    return { constraint: null }
  }

  return {
    constraint: {
      id: constraint.id,
      teacherId: constraint.teacherId,
      teacherName: `${constraint.teacher.firstName} ${constraint.teacher.lastName}`,
      termId: constraint.termId,
      maxPeriodsPerDay: constraint.maxPeriodsPerDay,
      maxPeriodsPerWeek: constraint.maxPeriodsPerWeek,
      minFreePeriods: constraint.minFreePeriods,
      maxConsecutivePeriods: constraint.maxConsecutivePeriods,
      dayPreferences: constraint.dayPreferences as Record<string, string>,
      periodPreferences: constraint.periodPreferences as Record<string, string>,
      enforceSubjectMatch: constraint.enforceSubjectMatch,
      lunchBreakRequired: constraint.lunchBreakRequired,
      notes: constraint.notes,
      unavailableBlocks: constraint.unavailableBlocks.map((block) => ({
        id: block.id,
        dayOfWeek: block.dayOfWeek,
        periodId: block.periodId,
        reason: block.reason,
        isRecurring: block.isRecurring,
        specificDate: block.specificDate,
      })),
    },
  }
}

/**
 * Upsert teacher constraints (admin only)
 */
export async function upsertTeacherConstraints(rawInput: {
  teacherId: string
  termId?: string | null
  maxPeriodsPerDay?: number
  maxPeriodsPerWeek?: number
  minFreePeriods?: number
  maxConsecutivePeriods?: number
  dayPreferences?: Record<string, string>
  periodPreferences?: Record<string, string>
  enforceSubjectMatch?: boolean
  lunchBreakRequired?: boolean
  notes?: string | null
}) {
  await requireAdminAccess()
  // Zod bounds the numeric fields (e.g. maxPeriodsPerDay 1..15) so an
  // unrealistic value can't be written and later disable conflict detection.
  const input = upsertTeacherConstraintsSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Teacher IDs are globally-unique CUIDs, so the FK alone does not enforce
  // tenancy. Verify the teacher belongs to THIS school before writing a
  // constraint, otherwise an admin of school A could create/overwrite a
  // constraint for a teacher in school B (cross-tenant corruption).
  const teacherInSchool = await db.teacher.findFirst({
    where: { id: input.teacherId, schoolId },
    select: { id: true },
  })
  if (!teacherInSchool) throw new Error("TEACHER_NOT_FOUND")

  const data = {
    schoolId,
    teacherId: input.teacherId,
    termId: input.termId ?? null,
    maxPeriodsPerDay: input.maxPeriodsPerDay ?? 6,
    maxPeriodsPerWeek: input.maxPeriodsPerWeek ?? 25,
    minFreePeriods: input.minFreePeriods ?? 1,
    maxConsecutivePeriods: input.maxConsecutivePeriods ?? 3,
    dayPreferences: input.dayPreferences ?? {},
    periodPreferences: input.periodPreferences ?? {},
    enforceSubjectMatch: input.enforceSubjectMatch ?? true,
    lunchBreakRequired: input.lunchBreakRequired ?? true,
    notes: input.notes ?? null,
  }

  // Find existing constraint (handling nullable termId)
  const existing = await db.teacherConstraint.findFirst({
    where: {
      schoolId,
      teacherId: input.teacherId,
      termId: input.termId ?? null,
    },
  })

  let constraintId: string
  if (existing) {
    // Defense-in-depth: scope update by schoolId
    await db.teacherConstraint.updateMany({
      where: { id: existing.id, schoolId },
      data,
    })
    constraintId = existing.id
  } else {
    const constraint = await db.teacherConstraint.create({ data })
    constraintId = constraint.id
  }

  await logTimetableAction("configure_settings", {
    entityType: "teacher_constraint",
    entityId: constraintId,
    changes: input,
  })

  return { id: constraintId }
}

/**
 * Add unavailable block for a teacher
 */
export async function addTeacherUnavailableBlock(rawInput: {
  teacherConstraintId: string
  dayOfWeek: number
  periodId: string
  reason?: string
  isRecurring?: boolean
  specificDate?: Date
}) {
  await requireAdminAccess()
  const input = addTeacherUnavailableBlockSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Verify the parent constraint belongs to this school before attaching a
  // block to it (teacherConstraintId is a global CUID — the FK alone does not
  // enforce tenancy).
  const parentConstraint = await db.teacherConstraint.findFirst({
    where: { id: input.teacherConstraintId, schoolId },
    select: { id: true },
  })
  if (!parentConstraint) throw new Error("TEACHER_CONSTRAINT_NOT_FOUND")

  const block = await db.teacherUnavailableBlock.create({
    data: {
      schoolId,
      teacherConstraintId: input.teacherConstraintId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      reason: input.reason,
      isRecurring: input.isRecurring ?? true,
      specificDate: input.specificDate,
    },
  })

  return { id: block.id }
}

/**
 * Remove unavailable block
 */
export async function removeTeacherUnavailableBlock(input: {
  blockId: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  await db.teacherUnavailableBlock.delete({
    where: { id: input.blockId, schoolId },
  })

  return { success: true }
}

// ============================================================================
// ROOM CONSTRAINT MANAGEMENT ACTIONS
// ============================================================================

/**
 * Get room constraints
 */
export async function getRoomConstraints(input: {
  classroomId: string
  termId?: string
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const constraint = await db.roomConstraint.findFirst({
    where: {
      schoolId,
      classroomId: input.classroomId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
    include: {
      classroom: { select: { roomName: true, capacity: true } },
    },
    orderBy: { termId: "desc" },
  })

  if (!constraint) {
    return { constraint: null }
  }

  return {
    constraint: {
      id: constraint.id,
      classroomId: constraint.classroomId,
      roomName: constraint.classroom.roomName,
      capacity: constraint.classroom.capacity,
      termId: constraint.termId,
      allowedSubjectTypes: constraint.allowedSubjectTypes,
      strictCapacityLimit: constraint.strictCapacityLimit,
      capacityBuffer: constraint.capacityBuffer,
      wheelchairAccessible: constraint.wheelchairAccessible,
      hasElevatorAccess: constraint.hasElevatorAccess,
      floorLevel: constraint.floorLevel,
      reservedPeriods: constraint.reservedPeriods as Record<string, string[]>,
      maintenanceBlocks: constraint.maintenanceBlocks as Array<{
        dayOfWeek: number
        periodId: string
        reason: string
        startDate?: string
        endDate?: string
      }>,
    },
  }
}

/**
 * Upsert room constraints (admin only)
 */
export async function upsertRoomConstraints(input: {
  classroomId: string
  termId?: string | null
  allowedSubjectTypes?: string[]
  strictCapacityLimit?: boolean
  capacityBuffer?: number
  wheelchairAccessible?: boolean
  hasElevatorAccess?: boolean
  floorLevel?: number | null
  reservedPeriods?: Record<string, string[]>
  maintenanceBlocks?: Array<{
    dayOfWeek: number
    periodId: string
    reason: string
    startDate?: string
    endDate?: string
  }>
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const data = {
    schoolId,
    classroomId: input.classroomId,
    termId: input.termId ?? null,
    allowedSubjectTypes: input.allowedSubjectTypes ?? [],
    strictCapacityLimit: input.strictCapacityLimit ?? true,
    capacityBuffer: input.capacityBuffer ?? 0,
    wheelchairAccessible: input.wheelchairAccessible ?? false,
    hasElevatorAccess: input.hasElevatorAccess ?? false,
    floorLevel: input.floorLevel ?? null,
    reservedPeriods: input.reservedPeriods ?? {},
    maintenanceBlocks: input.maintenanceBlocks ?? [],
  }

  // Find existing constraint (handling nullable termId)
  const existing = await db.roomConstraint.findFirst({
    where: {
      schoolId,
      classroomId: input.classroomId,
      termId: input.termId ?? null,
    },
  })

  let constraintId: string
  if (existing) {
    // Defense-in-depth: scope update by schoolId
    await db.roomConstraint.updateMany({
      where: { id: existing.id, schoolId },
      data,
    })
    constraintId = existing.id
  } else {
    const constraint = await db.roomConstraint.create({ data })
    constraintId = constraint.id
  }

  await logTimetableAction("configure_settings", {
    entityType: "room_constraint",
    entityId: constraintId,
    changes: input,
  })

  return { id: constraintId }
}

// ============================================================================
// TEMPLATE MANAGEMENT ACTIONS
// ============================================================================

/**
 * List all timetable templates for the school
 */
export async function listTimetableTemplates() {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const templates = await db.timetableTemplate.findMany({
    where: { schoolId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      version: true,
      isDefault: true,
      rotationType: true,
      totalSlots: true,
      classCount: true,
      teacherCount: true,
      createdAt: true,
      createdBy: { select: { email: true } },
      sourceTerm: {
        select: {
          termNumber: true,
          schoolYear: { select: { yearName: true } },
        },
      },
    },
  })

  return {
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      version: t.version,
      isDefault: t.isDefault,
      rotationType: t.rotationType,
      stats: {
        totalSlots: t.totalSlots,
        classCount: t.classCount,
        teacherCount: t.teacherCount,
      },
      source: t.sourceTerm
        ? `${t.sourceTerm.schoolYear.yearName} Term ${t.sourceTerm.termNumber}`
        : null,
      createdBy: t.createdBy?.email,
      createdAt: t.createdAt,
    })),
  }
}

/**
 * Create a template from an existing term's timetable
 */
export async function createTemplateFromTerm(rawInput: {
  name: string
  description?: string
  sourceTermId: string
}) {
  await requireAdminAccess()
  const input = createTemplateFromTermSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id

  // Get all slots from the source term
  const slots = await db.timetable.findMany({
    where: { schoolId, termId: input.sourceTermId, weekOffset: 0 },
    select: {
      dayOfWeek: true,
      periodId: true,
      classId: true,
      teacherId: true,
      classroomId: true,
      rotationWeek: true,
    },
  })

  // Get working days config
  const { config } = await getScheduleConfig({ termId: input.sourceTermId })

  // Build slot patterns (anonymized for template reuse)
  const slotPatterns = slots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    periodId: s.periodId,
    classId: s.classId,
    teacherId: s.teacherId,
    classroomId: s.classroomId,
    rotationWeek: s.rotationWeek,
  }))

  // Calculate statistics
  const uniqueClasses = new Set(slots.map((s) => s.classId))
  const uniqueTeachers = new Set(slots.map((s) => s.teacherId))

  // Check for existing template with same name
  const existing = await db.timetableTemplate.findFirst({
    where: { schoolId, name: input.name },
    orderBy: { version: "desc" },
    select: { version: true },
  })

  const version = existing ? existing.version + 1 : 1

  const template = await db.timetableTemplate.create({
    data: {
      schoolId,
      name: input.name,
      description: input.description,
      version,
      sourceTermId: input.sourceTermId,
      createdById: userId,
      workingDays: config.workingDays,
      slotPatterns,
      totalSlots: slots.length,
      classCount: uniqueClasses.size,
      teacherCount: uniqueTeachers.size,
    },
  })

  await logTimetableAction("configure_settings", {
    entityType: "template",
    entityId: template.id,
    changes: { name: input.name, sourceTermId: input.sourceTermId },
  })

  return { id: template.id, version }
}

/**
 * Apply a template to a target term
 */
export async function applyTemplateToTerm(rawInput: {
  templateId: string
  targetTermId: string
  clearExisting?: boolean
  teacherMapping?: Record<string, string>
  roomMapping?: Record<string, string>
}) {
  await requireAdminAccess()
  const input = applyTemplateToTermSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id

  // Get template (defense-in-depth: scope by schoolId)
  const template = await db.timetableTemplate.findFirst({
    where: { id: input.templateId, schoolId },
    select: { slotPatterns: true, workingDays: true },
  })

  if (!template) throw new Error("TEMPLATE_NOT_FOUND")

  const slotPatterns = template.slotPatterns as Array<{
    dayOfWeek: number
    periodId: string
    classId: string
    teacherId: string
    classroomId: string
    rotationWeek: number
  }>

  // LEGACY REPLAY: templates store classId-based patterns only, so the replayed
  // rows carry no sectionId and section-based student/guardian reads cannot see
  // them until templates capture sectionId/subjectId (tracked in ISSUE.md).
  const rows = slotPatterns.map((pattern) => ({
    schoolId,
    termId: input.targetTermId,
    dayOfWeek: pattern.dayOfWeek,
    periodId: pattern.periodId,
    classId: pattern.classId,
    teacherId: input.teacherMapping?.[pattern.teacherId] || pattern.teacherId,
    classroomId:
      input.roomMapping?.[pattern.classroomId] || pattern.classroomId,
    weekOffset: 0,
    rotationWeek: pattern.rotationWeek,
  }))

  // Atomic replace: clear (if requested) + bulk insert in ONE transaction so a
  // partial failure can never destroy the term's existing slots while leaving
  // an incomplete replacement. createMany({ skipDuplicates }) lets the unique
  // index drop conflicting patterns instead of aborting (and replaces the old
  // N create round-trips with a single insert).
  const ops: Prisma.PrismaPromise<Prisma.BatchPayload>[] = []
  if (input.clearExisting) {
    ops.push(
      db.timetable.deleteMany({
        where: { schoolId, termId: input.targetTermId },
      })
    )
  }
  ops.push(db.timetable.createMany({ data: rows, skipDuplicates: true }))
  const results = await db.$transaction(ops)
  const slotsCreated = results[results.length - 1].count
  const conflictsFound = rows.length - slotsCreated

  // Record application
  await db.templateApplication.create({
    data: {
      schoolId,
      templateId: input.templateId,
      termId: input.targetTermId,
      appliedById: userId,
      options: {
        clearExisting: input.clearExisting,
        teacherMapping: input.teacherMapping,
        roomMapping: input.roomMapping,
      },
      slotsCreated,
      conflictsFound,
    },
  })

  await logTimetableAction("configure_settings", {
    entityType: "template_application",
    metadata: {
      templateId: input.templateId,
      targetTermId: input.targetTermId,
    },
  })

  return { slotsCreated, conflictsFound }
}

/**
 * Delete a template
 */
export async function deleteTemplate(input: { templateId: string }) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Soft delete by marking inactive
  await db.timetableTemplate.update({
    where: { id: input.templateId, schoolId },
    data: { isActive: false },
  })

  await logTimetableAction("delete", {
    entityType: "template",
    entityId: input.templateId,
  })

  return { success: true }
}

/**
 * Set a template as default
 */
export async function setDefaultTemplate(input: { templateId: string }) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Remove default from all templates
  await db.timetableTemplate.updateMany({
    where: { schoolId },
    data: { isDefault: false },
  })

  // Set new default
  await db.timetableTemplate.update({
    where: { id: input.templateId, schoolId },
    data: { isDefault: true },
  })

  return { success: true }
}

// ============================================================================
// CONSTRAINT VALIDATION PIPELINE
// ============================================================================

type ValidationResult = {
  isValid: boolean
  violations: Array<{
    type:
      | "teacher_unavailable"
      | "teacher_overload"
      | "room_reserved"
      | "room_capacity"
      | "conflict"
      | "consecutive_limit"
    severity: "error" | "warning"
    message: string
    details?: Record<string, unknown>
  }>
}

/**
 * Prepare data and generate a timetable using the AI algorithm
 * Returns preview data that can be approved and saved
 */
export async function generateTimetablePreview(input: {
  termId: string
  config?: Partial<GenerationConfig>
}): Promise<{
  success: boolean
  preview: GeneratedSlot[]
  stats: GenerationResult["stats"]
  unplacedClasses: string[]
  warnings: string[]
  errors: string[]
  sectionNames: Record<string, string>
  subjectNames: Record<string, string>
}> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get term info
  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("INVALID_TERM")

  // Get schedule config
  const { config: scheduleConfig } = await getScheduleConfig({
    termId: input.termId,
  })

  // Get periods
  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true },
  })

  // Build generation config
  const generationConfig: GenerationConfig = {
    workingDays: scheduleConfig.workingDays,
    periodsPerDay: periods
      .filter(
        (p) =>
          !p.name.toLowerCase().includes("break") &&
          !p.name.toLowerCase().includes("lunch")
      )
      .map((p) => p.id),
    constraints: {
      enforceTeacherExpertise:
        input.config?.constraints?.enforceTeacherExpertise ?? true,
      enforceRoomCapacity:
        input.config?.constraints?.enforceRoomCapacity ?? true,
      maxTeacherPeriodsPerDay:
        input.config?.constraints?.maxTeacherPeriodsPerDay ?? 6,
      maxTeacherPeriodsPerWeek:
        input.config?.constraints?.maxTeacherPeriodsPerWeek ?? 25,
      maxConsecutivePeriods:
        input.config?.constraints?.maxConsecutivePeriods ?? 3,
      requireLunchBreak: input.config?.constraints?.requireLunchBreak ?? true,
      preventBackToBack: input.config?.constraints?.preventBackToBack ?? false,
    },
    preferences: {
      balanceSubjectDistribution:
        input.config?.preferences?.balanceSubjectDistribution ?? true,
      preferMorningForCore:
        input.config?.preferences?.preferMorningForCore ?? true,
      avoidLastPeriodForLab:
        input.config?.preferences?.avoidLastPeriodForLab ?? true,
      groupSameSubjectDays:
        input.config?.preferences?.groupSameSubjectDays ?? false,
    },
  }

  // Get sections with their grade and classroom
  const sectionsData = await db.section.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      gradeId: true,
      classroomId: true,
      maxCapacity: true,
      _count: { select: { students: true } },
    },
  })

  // Get subject selections for each grade (links Subjects to grades with weeklyPeriods)
  const subjectSelections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: {
      catalogSubjectId: true,
      gradeId: true,
      weeklyPeriods: true,
      isRequired: true,
      subject: { select: { id: true, name: true } },
    },
  })

  // Build lookup: gradeId -> subject allocations
  const gradeSubjectsMap = new Map<
    string,
    Array<{
      subjectId: string
      subjectName: string
      hoursPerWeek: number
      isRequired: boolean
    }>
  >()
  for (const sel of subjectSelections) {
    if (!sel.subject) continue
    const list = gradeSubjectsMap.get(sel.gradeId) || []
    list.push({
      subjectId: sel.catalogSubjectId,
      subjectName: sel.subject.name,
      hoursPerWeek: sel.weeklyPeriods ?? 3,
      isRequired: sel.isRequired,
    })
    gradeSubjectsMap.set(sel.gradeId, list)
  }

  // Get teacher expertise mapping (subjectId -> teacherIds[])
  const teacherExpertise = await db.teacherSubjectExpertise.findMany({
    where: { schoolId },
    select: { teacherId: true, subjectId: true },
  })

  const subjectTeachers = new Map<string, string[]>()
  for (const te of teacherExpertise) {
    if (!subjectTeachers.has(te.subjectId)) {
      subjectTeachers.set(te.subjectId, [])
    }
    subjectTeachers.get(te.subjectId)!.push(te.teacherId)
  }

  // Build SectionRequirement[] for the algorithm
  const sectionRequirements: SectionRequirement[] = sectionsData.map((s) => {
    const gradeSubjects = gradeSubjectsMap.get(s.gradeId) || []

    const subjects: SubjectAllocation[] = gradeSubjects.map((gs) => ({
      subjectId: gs.subjectId,
      subjectName: gs.subjectName,
      hoursPerWeek: gs.hoursPerWeek,
      requiresLab: gs.subjectName.toLowerCase().includes("lab"),
      preferredTeacherIds: subjectTeachers.get(gs.subjectId) || [],
    }))

    return {
      sectionId: s.id,
      sectionName: s.name,
      gradeId: s.gradeId,
      classroomId: s.classroomId,
      studentCount: s._count.students,
      subjects,
    }
  })

  // Get teachers with constraints
  const teachersData = await db.teacher.findMany({
    where: { schoolId, employmentStatus: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      subjectExpertise: {
        where: { schoolId },
        select: { subjectId: true },
      },
      constraints: {
        where: { schoolId, OR: [{ termId: input.termId }, { termId: null }] },
        orderBy: { termId: "desc" },
        take: 1,
        select: {
          maxPeriodsPerDay: true,
          maxPeriodsPerWeek: true,
          maxConsecutivePeriods: true,
          dayPreferences: true,
          periodPreferences: true,
          unavailableBlocks: {
            select: { dayOfWeek: true, periodId: true },
          },
        },
      },
    },
  })

  const teachers: TeacherAvailability[] = teachersData.map((t) => {
    const constraint = t.constraints[0]
    const dayPrefs =
      (constraint?.dayPreferences as Record<string, string>) || {}
    const periodPrefs =
      (constraint?.periodPreferences as Record<string, string>) || {}

    return {
      teacherId: t.id,
      teacherName: `${t.firstName} ${t.lastName}`,
      maxPeriodsPerDay: constraint?.maxPeriodsPerDay || 6,
      maxPeriodsPerWeek: constraint?.maxPeriodsPerWeek || 25,
      maxConsecutive: constraint?.maxConsecutivePeriods || 3,
      subjectExpertise: t.subjectExpertise.map(
        (e: { subjectId: string }) => e.subjectId
      ),
      unavailableBlocks: constraint?.unavailableBlocks || [],
      preferredPeriods: Object.entries(periodPrefs)
        .filter(([, v]) => v === "preferred")
        .map(([periodId]) => ({ dayOfWeek: 0, periodId })),
      avoidedPeriods: Object.entries(periodPrefs)
        .filter(([, v]) => v === "avoid")
        .map(([periodId]) => ({ dayOfWeek: 0, periodId })),
    }
  })

  // Get rooms with constraints
  const roomsData = await db.classroom.findMany({
    where: { schoolId },
    select: {
      id: true,
      roomName: true,
      capacity: true,
      classroomType: {
        select: { name: true },
      },
      constraints: {
        where: { schoolId, OR: [{ termId: input.termId }, { termId: null }] },
        orderBy: { termId: "desc" },
        take: 1,
        select: {
          allowedSubjectTypes: true,
          reservedPeriods: true,
        },
      },
    },
  })

  const rooms: RoomAvailability[] = roomsData.map((r) => {
    const constraint = r.constraints[0]
    const reserved =
      (constraint?.reservedPeriods as Record<string, string[]>) || {}

    const reservedBlocks: Array<{ dayOfWeek: number; periodId: string }> = []
    for (const [dayStr, periodIds] of Object.entries(reserved)) {
      for (const periodId of periodIds) {
        reservedBlocks.push({ dayOfWeek: parseInt(dayStr), periodId })
      }
    }

    return {
      roomId: r.id,
      roomName: r.roomName,
      capacity: r.capacity || 30,
      roomType: r.classroomType?.name || "regular",
      allowedSubjectTypes: constraint?.allowedSubjectTypes || [],
      reservedBlocks,
      hasAccessibility: false,
    }
  })

  // Run section-based generation algorithm
  const result = generateSectionTimetable(
    sectionRequirements,
    teachers,
    rooms,
    {
      schoolId,
      termId: input.termId,
      yearId: term.yearId,
      config: generationConfig,
    }
  )

  await logTimetableAction("generate_preview", {
    entityType: "generation",
    metadata: {
      termId: input.termId,
      totalSlots: result.stats.totalSlots,
      placedSlots: result.stats.placedSlots,
      success: result.success,
    },
  })

  // Build name lookup maps from the section requirements for the preview UI
  const sectionNames: Record<string, string> = {}
  const subjectNames: Record<string, string> = {}
  for (const sec of sectionRequirements) {
    sectionNames[sec.sectionId] = sec.sectionName
    for (const sub of sec.subjects) {
      subjectNames[sub.subjectId] = sub.subjectName
    }
  }

  return {
    success: result.success,
    preview: result.slots,
    stats: result.stats,
    unplacedClasses: result.unplacedClasses,
    warnings: result.warnings,
    errors: result.errors,
    sectionNames,
    subjectNames,
  }
}

/**
 * Apply generated timetable preview to the database
 */
export async function applyGeneratedTimetable(rawInput: {
  termId: string
  slots: GeneratedSlot[]
  clearExisting?: boolean
}): Promise<{ success: boolean; createdCount: number; errors: string[] }> {
  await requireAdminAccess()
  const input = applyGeneratedTimetableSchema.parse(rawInput) as typeof rawInput

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const errors: string[] = []
  let createdCount = 0

  try {
    // Clear existing slots if requested
    if (input.clearExisting) {
      await db.timetable.deleteMany({
        where: { schoolId, termId: input.termId },
      })
    }

    // Batch insert all slots using createMany (skip duplicates)
    const slotData = input.slots.map((slot) => ({
      schoolId,
      termId: input.termId,
      dayOfWeek: slot.dayOfWeek,
      periodId: slot.periodId,
      sectionId: slot.sectionId || undefined,
      subjectId: slot.subjectId || undefined,
      classId: slot.classId || undefined, // Empty string → undefined for section-based
      teacherId: slot.teacherId ?? undefined,
      classroomId: slot.classroomId,
      weekOffset: 0,
      constraintViolations: slot.violations,
    }))

    const result = await db.timetable.createMany({
      data: slotData,
      skipDuplicates: true,
    })
    createdCount = result.count

    await logTimetableAction("apply_generated", {
      entityType: "generation",
      metadata: {
        termId: input.termId,
        createdCount,
        clearExisting: input.clearExisting,
      },
    })

    return { success: true, createdCount, errors }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown error")
    return { success: false, createdCount, errors }
  }
}

// ============================================================================
// BULK IMPORT SERVER ACTION
// ============================================================================
// Types ImportSlot and ImportResult are imported from ./types.ts

/**
 * Bulk import timetable slots with validation
 * Supports Excel, CSV, JSON formats
 */
export async function importTimetableSlots(rawInput: {
  termId: string
  slots: ImportSlot[]
  options: {
    overwrite: boolean
    validateOnly: boolean
  }
}): Promise<ImportResult> {
  await requireAdminAccess()
  // Bounds the slot array (max 2000) and validates each row's id/day formats
  // before the function's own membership checks run.
  const input = importTimetableSlotsSchema.parse(rawInput) as typeof rawInput

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const result: ImportResult = {
    success: false,
    totalRows: input.slots.length,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    errors: [],
    warnings: [],
  }

  // Validate term exists
  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) {
    result.errors.push({ row: 0, message: "Invalid term ID" })
    return result
  }

  // Get valid IDs for validation
  const validClasses = new Set(
    (
      await db.class.findMany({
        where: { schoolId, termId: input.termId },
        select: { id: true },
      })
    ).map((c) => c.id)
  )

  const validTeachers = new Set(
    (
      await db.teacher.findMany({
        where: { schoolId },
        select: { id: true },
      })
    ).map((t) => t.id)
  )

  const validRooms = new Set(
    (
      await db.classroom.findMany({
        where: { schoolId },
        select: { id: true },
      })
    ).map((r) => r.id)
  )

  const validPeriods = new Set(
    (
      await db.period.findMany({
        where: { schoolId, yearId: term.yearId },
        select: { id: true },
      })
    ).map((p) => p.id)
  )

  // Get teacher expertise for validation
  const teacherExpertise = await db.teacherSubjectExpertise.findMany({
    where: { schoolId },
    select: { teacherId: true, subjectId: true },
  })
  const expertiseMap = new Map<string, Set<string>>()
  for (const te of teacherExpertise) {
    if (!expertiseMap.has(te.teacherId)) {
      expertiseMap.set(te.teacherId, new Set())
    }
    expertiseMap.get(te.teacherId)!.add(te.subjectId)
  }

  // Get class subjects for expertise validation
  const classSubjects = await db.class.findMany({
    where: { schoolId, termId: input.termId },
    select: { id: true, subjectId: true },
  })
  const classSubjectMap = new Map(classSubjects.map((c) => [c.id, c.subjectId]))

  // Validate each slot
  const validSlots: ImportSlot[] = []

  for (let i = 0; i < input.slots.length; i++) {
    const slot = input.slots[i]
    const rowNum = i + 1
    let isValid = true

    // Validate day of week
    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      result.errors.push({
        row: rowNum,
        message: `Invalid day of week: ${slot.dayOfWeek}`,
      })
      isValid = false
    }

    // Validate period
    if (!validPeriods.has(slot.periodId)) {
      result.errors.push({
        row: rowNum,
        message: `Invalid period ID: ${slot.periodId}`,
      })
      isValid = false
    }

    // Validate class
    if (!validClasses.has(slot.classId)) {
      result.errors.push({
        row: rowNum,
        message: `Invalid class ID: ${slot.classId}`,
      })
      isValid = false
    }

    // Validate teacher
    if (!validTeachers.has(slot.teacherId)) {
      result.errors.push({
        row: rowNum,
        message: `Invalid teacher ID: ${slot.teacherId}`,
      })
      isValid = false
    }

    // Validate room
    if (!validRooms.has(slot.classroomId)) {
      result.errors.push({
        row: rowNum,
        message: `Invalid classroom ID: ${slot.classroomId}`,
      })
      isValid = false
    }

    // Validate teacher expertise (warning only)
    const classSubjectId = classSubjectMap.get(slot.classId)
    if (classSubjectId) {
      const teacherSubjects = expertiseMap.get(slot.teacherId)
      if (!teacherSubjects?.has(classSubjectId)) {
        result.warnings.push({
          row: rowNum,
          message: `Teacher ${slot.teacherId} may not be qualified for subject`,
        })
      }
    }

    if (isValid) {
      validSlots.push(slot)
    } else {
      result.failedCount++
    }
  }

  // If validate only, return results without inserting
  if (input.options.validateOnly) {
    result.success = result.failedCount === 0
    result.successCount = validSlots.length
    return result
  }

  // Insert valid slots
  try {
    await db.$transaction(async (tx) => {
      // Clear existing if overwrite mode
      if (input.options.overwrite) {
        await tx.timetable.deleteMany({
          where: { schoolId, termId: input.termId },
        })
      }

      // Insert new slots
      for (const slot of validSlots) {
        try {
          await tx.timetable.upsert({
            where: {
              schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
                schoolId,
                termId: input.termId,
                dayOfWeek: slot.dayOfWeek,
                periodId: slot.periodId,
                classId: slot.classId,
                weekOffset: slot.weekOffset ?? 0,
              },
            },
            update: {
              teacherId: slot.teacherId,
              classroomId: slot.classroomId,
            },
            create: {
              schoolId,
              termId: input.termId,
              dayOfWeek: slot.dayOfWeek,
              periodId: slot.periodId,
              classId: slot.classId,
              teacherId: slot.teacherId,
              classroomId: slot.classroomId,
              weekOffset: slot.weekOffset ?? 0,
            },
          })
          result.successCount++
        } catch {
          result.skippedCount++
        }
      }
    })

    result.success = true
  } catch (error) {
    result.errors.push({
      row: 0,
      message: error instanceof Error ? error.message : "Database error",
    })
  }

  await logTimetableAction("bulk_import", {
    entityType: "import",
    metadata: {
      termId: input.termId,
      totalRows: result.totalRows,
      successCount: result.successCount,
      failedCount: result.failedCount,
      overwrite: input.options.overwrite,
    },
  })

  return result
}

// ============================================================================
// PERIOD MANAGEMENT ACTIONS
// ============================================================================

/**
 * Create a new period for a school year
 */
export async function createPeriod(rawInput: {
  yearId: string
  name: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}): Promise<{ id: string }> {
  await requireAdminAccess()
  // Zod enforces yearId CUID, name length, and HH:MM time format (throws
  // INVALID_TIME_FORMAT via the regex message on bad times).
  const input = createPeriodSchema.parse(rawInput)

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Parse times to Date objects (using UTC for consistency)
  const [startHour, startMin] = input.startTime.split(":").map(Number)
  const [endHour, endMin] = input.endTime.split(":").map(Number)

  const startTime = new Date(Date.UTC(1970, 0, 1, startHour, startMin))
  const endTime = new Date(Date.UTC(1970, 0, 1, endHour, endMin))

  if (startTime >= endTime) {
    throw new Error("INVALID_TIME_RANGE")
  }

  // Check for overlapping periods
  const existingPeriods = await db.period.findMany({
    where: { schoolId, yearId: input.yearId },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  for (const existing of existingPeriods) {
    const existStart = new Date(existing.startTime)
    const existEnd = new Date(existing.endTime)

    // Check for overlap
    if (
      (startTime >= existStart && startTime < existEnd) ||
      (endTime > existStart && endTime <= existEnd) ||
      (startTime <= existStart && endTime >= existEnd)
    ) {
      throw new Error("PERIOD_TIME_OVERLAP")
    }
  }

  const period = await db.period.create({
    data: {
      schoolId,
      yearId: input.yearId,
      name: input.name,
      startTime,
      endTime,
    },
  })

  await logTimetableAction("create_period", {
    entityType: "period",
    entityId: period.id,
    changes: input,
  })

  return { id: period.id }
}

function formatTimeOnly(date: Date): string {
  const d = new Date(date)
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
}

/**
 * Update an existing period
 */
export async function updatePeriod(input: {
  periodId: string
  name?: string
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
}): Promise<{ success: boolean }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get existing period
  const existing = await db.period.findFirst({
    where: { id: input.periodId, schoolId },
    select: { id: true, yearId: true, startTime: true, endTime: true },
  })
  if (!existing) throw new Error("PERIOD_NOT_FOUND")

  const updateData: { name?: string; startTime?: Date; endTime?: Date } = {}

  if (input.name) {
    updateData.name = input.name
  }

  if (input.startTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(input.startTime)) {
      throw new Error("INVALID_TIME_FORMAT")
    }
    const [hour, min] = input.startTime.split(":").map(Number)
    updateData.startTime = new Date(Date.UTC(1970, 0, 1, hour, min))
  }

  if (input.endTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(input.endTime)) {
      throw new Error("INVALID_TIME_FORMAT")
    }
    const [hour, min] = input.endTime.split(":").map(Number)
    updateData.endTime = new Date(Date.UTC(1970, 0, 1, hour, min))
  }

  // Validate times if both are being updated
  const newStart = updateData.startTime || new Date(existing.startTime)
  const newEnd = updateData.endTime || new Date(existing.endTime)

  if (newStart >= newEnd) {
    throw new Error("INVALID_TIME_RANGE")
  }

  // Check for overlapping periods (excluding this one)
  const otherPeriods = await db.period.findMany({
    where: { schoolId, yearId: existing.yearId, NOT: { id: input.periodId } },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  for (const other of otherPeriods) {
    const existStart = new Date(other.startTime)
    const existEnd = new Date(other.endTime)

    if (
      (newStart >= existStart && newStart < existEnd) ||
      (newEnd > existStart && newEnd <= existEnd) ||
      (newStart <= existStart && newEnd >= existEnd)
    ) {
      throw new Error("PERIOD_TIME_OVERLAP")
    }
  }

  // Defense-in-depth: scope update by schoolId
  await db.period.updateMany({
    where: { id: input.periodId, schoolId },
    data: updateData,
  })

  await logTimetableAction("update_period", {
    entityType: "period",
    entityId: input.periodId,
    changes: input,
  })

  return { success: true }
}

/**
 * Delete a period
 */
export async function deletePeriod(input: {
  periodId: string
}): Promise<{ success: boolean }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Check if period is used in any timetable slots
  const usageCount = await db.timetable.count({
    where: { schoolId, periodId: input.periodId },
  })

  if (usageCount > 0) {
    throw new Error("PERIOD_IN_USE")
  }

  await db.period.delete({
    where: { id: input.periodId, schoolId },
  })

  await logTimetableAction("delete_period", {
    entityType: "period",
    entityId: input.periodId,
  })

  return { success: true }
}

/**
 * Copy periods from one school year to another
 */
export async function copyPeriodsToYear(input: {
  sourceYearId: string
  targetYearId: string
  overwrite?: boolean
}): Promise<{ copiedCount: number; skippedCount: number }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get source periods
  const sourcePeriods = await db.period.findMany({
    where: { schoolId, yearId: input.sourceYearId },
    orderBy: { startTime: "asc" },
  })

  if (sourcePeriods.length === 0) {
    throw new Error("NO_PERIODS_IN_SOURCE")
  }

  // Check target year exists
  const targetYear = await db.schoolYear.findFirst({
    where: { id: input.targetYearId, schoolId },
  })
  if (!targetYear) throw new Error("TARGET_YEAR_NOT_FOUND")

  // Get existing target periods
  const existingTargetPeriods = await db.period.findMany({
    where: { schoolId, yearId: input.targetYearId },
  })

  let copiedCount = 0
  let skippedCount = 0

  // Delete existing if overwrite mode
  if (input.overwrite && existingTargetPeriods.length > 0) {
    // Check if any are in use
    const usedPeriods = await db.timetable.findMany({
      where: {
        schoolId,
        periodId: { in: existingTargetPeriods.map((p) => p.id) },
      },
      select: { periodId: true },
      distinct: ["periodId"],
    })

    if (usedPeriods.length > 0) {
      throw new Error("PERIODS_IN_USE")
    }

    await db.period.deleteMany({
      where: { schoolId, yearId: input.targetYearId },
    })
  }

  // Copy periods
  for (const period of sourcePeriods) {
    // Check if period with same name exists
    const exists = existingTargetPeriods.find((p) => p.name === period.name)
    if (exists && !input.overwrite) {
      skippedCount++
      continue
    }

    await db.period.create({
      data: {
        schoolId,
        yearId: input.targetYearId,
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
      },
    })
    copiedCount++
  }

  await logTimetableAction("copy_periods", {
    entityType: "period",
    metadata: {
      sourceYearId: input.sourceYearId,
      targetYearId: input.targetYearId,
      copiedCount,
      skippedCount,
    },
  })

  return { copiedCount, skippedCount }
}

/**
 * Get school years for period management
 */
export async function getSchoolYearsForSelection(): Promise<{
  years: Array<{ id: string; name: string; isCurrent: boolean }>
}> {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const years = await db.schoolYear.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      yearName: true,
      startDate: true,
      endDate: true,
    },
  })

  const now = new Date()

  return {
    years: years.map((y) => ({
      id: y.id,
      name: y.yearName,
      isCurrent: now >= y.startDate && now <= y.endDate,
    })),
  }
}

/**
 * Create a set of default periods for a school year
 */
export async function createDefaultPeriods(input: {
  yearId: string
  template: "standard_8" | "standard_6" | "half_day"
}): Promise<{ createdCount: number }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Check if periods already exist
  const existing = await db.period.count({
    where: { schoolId, yearId: input.yearId },
  })

  if (existing > 0) {
    throw new Error("PERIODS_ALREADY_EXIST")
  }

  const templates: Record<
    string,
    Array<{ name: string; start: string; end: string }>
  > = {
    standard_8: [
      { name: "Period 1", start: "07:30", end: "08:15" },
      { name: "Period 2", start: "08:20", end: "09:05" },
      { name: "Period 3", start: "09:10", end: "09:55" },
      { name: "Break", start: "09:55", end: "10:15" },
      { name: "Period 4", start: "10:15", end: "11:00" },
      { name: "Period 5", start: "11:05", end: "11:50" },
      { name: "Lunch", start: "11:50", end: "12:30" },
      { name: "Period 6", start: "12:30", end: "13:15" },
      { name: "Period 7", start: "13:20", end: "14:05" },
      { name: "Period 8", start: "14:10", end: "14:55" },
    ],
    standard_6: [
      { name: "Period 1", start: "08:00", end: "08:50" },
      { name: "Period 2", start: "08:55", end: "09:45" },
      { name: "Break", start: "09:45", end: "10:05" },
      { name: "Period 3", start: "10:05", end: "10:55" },
      { name: "Period 4", start: "11:00", end: "11:50" },
      { name: "Lunch", start: "11:50", end: "12:30" },
      { name: "Period 5", start: "12:30", end: "13:20" },
      { name: "Period 6", start: "13:25", end: "14:15" },
    ],
    half_day: [
      { name: "Period 1", start: "08:00", end: "08:45" },
      { name: "Period 2", start: "08:50", end: "09:35" },
      { name: "Break", start: "09:35", end: "09:50" },
      { name: "Period 3", start: "09:50", end: "10:35" },
      { name: "Period 4", start: "10:40", end: "11:25" },
      { name: "Period 5", start: "11:30", end: "12:15" },
    ],
  }

  const selectedTemplate = templates[input.template]
  if (!selectedTemplate) {
    throw new Error("INVALID_TEMPLATE")
  }

  let createdCount = 0

  for (const period of selectedTemplate) {
    const [startHour, startMin] = period.start.split(":").map(Number)
    const [endHour, endMin] = period.end.split(":").map(Number)

    await db.period.create({
      data: {
        schoolId,
        yearId: input.yearId,
        name: period.name,
        startTime: new Date(Date.UTC(1970, 0, 1, startHour, startMin)),
        endTime: new Date(Date.UTC(1970, 0, 1, endHour, endMin)),
      },
    })
    createdCount++
  }

  await logTimetableAction("create_default_periods", {
    entityType: "period",
    metadata: { yearId: input.yearId, template: input.template, createdCount },
  })

  return { createdCount }
}

/**
 * Apply a timetable structure from the catalog.
 * Creates Period records from the structure definition and updates week config.
 */
export async function applyTimetableStructure(input: {
  yearId: string
  structureSlug: string
  replaceExisting?: boolean
}): Promise<{ createdCount: number }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Import dynamically to avoid circular dependency with "use server"
  const { getStructureBySlug, LEGACY_TEMPLATE_MAP } =
    await import("./structures")

  // Support legacy template names
  const slug = LEGACY_TEMPLATE_MAP[input.structureSlug] || input.structureSlug
  const structure = getStructureBySlug(slug)
  if (!structure) throw new Error("UNKNOWN_STRUCTURE")

  // Check existing periods
  const existing = await db.period.count({
    where: { schoolId, yearId: input.yearId },
  })

  if (existing > 0) {
    if (input.replaceExisting) {
      await db.period.deleteMany({
        where: { schoolId, yearId: input.yearId },
      })
    } else {
      throw new Error("PERIODS_ALREADY_EXIST")
    }
  }

  let createdCount = 0
  for (const period of structure.periods) {
    const [startHour, startMin] = period.startTime.split(":").map(Number)
    const [endHour, endMin] = period.endTime.split(":").map(Number)

    await db.period.create({
      data: {
        schoolId,
        yearId: input.yearId,
        name: period.name,
        startTime: new Date(Date.UTC(1970, 0, 1, startHour, startMin)),
        endTime: new Date(Date.UTC(1970, 0, 1, endHour, endMin)),
      },
    })
    createdCount++
  }

  // Update week config with structure's working days
  const schoolWeekConfigModel = getModel("schoolWeekConfig")
  if (schoolWeekConfigModel) {
    await schoolWeekConfigModel.upsert({
      where: {
        schoolId_termId: { schoolId, termId: null },
      },
      update: {
        workingDays: structure.workingDays,
        defaultLunchAfterPeriod: structure.lunchAfterPeriod,
      },
      create: {
        schoolId,
        termId: null,
        workingDays: structure.workingDays,
        defaultLunchAfterPeriod: structure.lunchAfterPeriod,
      },
    })
  }

  await logTimetableAction("apply_structure", {
    entityType: "period",
    metadata: {
      yearId: input.yearId,
      structureSlug: slug,
      createdCount,
      replaced: input.replaceExisting ?? false,
    },
  })

  return { createdCount }
}

// ============================================================================
// TERM SETTINGS & HOLIDAY CALENDAR
// ============================================================================

/**
 * Get term details for schedule settings
 */
export async function getTermDetails(input: { termId: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      isActive: true,
      schoolYear: {
        select: { id: true, yearName: true },
      },
    },
  })

  if (!term) throw new Error("TERM_NOT_FOUND")

  return term
}

/**
 * Update term dates
 */
export async function updateTermDates(input: {
  termId: string
  startDate: Date
  endDate: Date
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Validate dates
  if (input.startDate >= input.endDate) {
    throw new Error("INVALID_DATE_RANGE")
  }

  // Verify ownership (defense-in-depth)
  const existing = await db.term.findFirst({
    where: { id: input.termId, schoolId },
  })
  if (!existing) throw new Error("TERM_NOT_FOUND")

  // Defense-in-depth: scope update by schoolId
  await db.term.updateMany({
    where: { id: input.termId, schoolId },
    data: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
  })

  await logTimetableAction("update_term_dates", {
    entityId: input.termId,
    entityType: "term",
    metadata: {
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
    },
  })

  return { success: true }
}

/**
 * Get all schedule exceptions (holidays, events) for a term
 */
export async function getScheduleExceptions(input: { termId: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const exceptions = await db.scheduleException.findMany({
    where: {
      schoolId,
      OR: [{ termId: input.termId }, { termId: null }], // Term-specific and school-wide
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      exceptionType: true,
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      isAllDay: true,
      affectsAllClasses: true,
      isRecurring: true,
      recurrenceRule: true,
      termId: true,
    },
  })

  return exceptions
}

/**
 * Create a schedule exception (holiday, event, modified schedule)
 */
export async function createScheduleException(input: {
  termId?: string
  exceptionType: "HOLIDAY" | "EVENT" | "MODIFIED_SCHEDULE" | "CANCELLED"
  title: string
  description?: string
  startDate: Date
  endDate: Date
  isAllDay?: boolean
  affectsAllClasses?: boolean
  isRecurring?: boolean
  recurrenceRule?: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Validate dates
  if (input.startDate > input.endDate) {
    throw new Error("INVALID_DATE_RANGE")
  }

  const exception = await db.scheduleException.create({
    data: {
      schoolId,
      termId: input.termId || null,
      exceptionType: input.exceptionType,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      isAllDay: input.isAllDay ?? true,
      affectsAllClasses: input.affectsAllClasses ?? true,
      isRecurring: input.isRecurring ?? false,
      recurrenceRule: input.recurrenceRule,
    },
  })

  await logTimetableAction("create_schedule_exception", {
    entityId: exception.id,
    entityType: "scheduleException",
    metadata: {
      type: input.exceptionType,
      title: input.title,
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
    },
  })

  return exception
}

/**
 * Update a schedule exception
 */
export async function updateScheduleException(input: {
  id: string
  exceptionType?: "HOLIDAY" | "EVENT" | "MODIFIED_SCHEDULE" | "CANCELLED"
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  isAllDay?: boolean
  affectsAllClasses?: boolean
  isRecurring?: boolean
  recurrenceRule?: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Verify ownership
  const existing = await db.scheduleException.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!existing) throw new Error("EXCEPTION_NOT_FOUND")

  // Validate dates if provided
  const startDate = input.startDate ?? existing.startDate
  const endDate = input.endDate ?? existing.endDate
  if (startDate > endDate) {
    throw new Error("INVALID_DATE_RANGE")
  }

  // Defense-in-depth: scope update by schoolId
  await db.scheduleException.updateMany({
    where: { id: input.id, schoolId },
    data: {
      exceptionType: input.exceptionType,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      isAllDay: input.isAllDay,
      affectsAllClasses: input.affectsAllClasses,
      isRecurring: input.isRecurring,
      recurrenceRule: input.recurrenceRule,
    },
  })

  await logTimetableAction("update_schedule_exception", {
    entityId: input.id,
    entityType: "scheduleException",
    metadata: { title: input.title },
  })

  return { success: true }
}

/**
 * Delete a schedule exception
 */
export async function deleteScheduleException(input: { id: string }) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Verify ownership
  const existing = await db.scheduleException.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!existing) throw new Error("EXCEPTION_NOT_FOUND")

  // Defense-in-depth: scope delete by schoolId
  await db.scheduleException.deleteMany({
    where: { id: input.id, schoolId },
  })

  await logTimetableAction("delete_schedule_exception", {
    entityId: input.id,
    entityType: "scheduleException",
    metadata: { title: existing.title },
  })

  return { success: true }
}

/**
 * Copy schedule settings (working days, lunch config) from one term to another
 */
export async function copyScheduleSettings(input: {
  sourceTermId: string
  targetTermId: string
  includeExceptions?: boolean
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get source config
  const sourceConfig = await db.schoolWeekConfig.findFirst({
    where: { schoolId, termId: input.sourceTermId },
  })

  if (!sourceConfig) {
    throw new Error("SOURCE_TERM_NO_CONFIG")
  }

  // Upsert target config
  await db.schoolWeekConfig.upsert({
    where: {
      schoolId_termId: { schoolId, termId: input.targetTermId },
    },
    create: {
      schoolId,
      termId: input.targetTermId,
      workingDays: sourceConfig.workingDays,
      defaultLunchAfterPeriod: sourceConfig.defaultLunchAfterPeriod,
      extraLunchRules: sourceConfig.extraLunchRules ?? Prisma.JsonNull,
    },
    update: {
      workingDays: sourceConfig.workingDays,
      defaultLunchAfterPeriod: sourceConfig.defaultLunchAfterPeriod,
      extraLunchRules: sourceConfig.extraLunchRules ?? Prisma.JsonNull,
    },
  })

  // Optionally copy exceptions
  if (input.includeExceptions) {
    const sourceExceptions = await db.scheduleException.findMany({
      where: { schoolId, termId: input.sourceTermId },
    })

    for (const exc of sourceExceptions) {
      await db.scheduleException.create({
        data: {
          schoolId,
          termId: input.targetTermId,
          exceptionType: exc.exceptionType,
          title: exc.title,
          description: exc.description,
          startDate: exc.startDate,
          endDate: exc.endDate,
          isAllDay: exc.isAllDay,
          affectsAllClasses: exc.affectsAllClasses,
          affectedClassIds: exc.affectedClassIds,
          affectedTeacherIds: exc.affectedTeacherIds,
          isRecurring: exc.isRecurring,
          recurrenceRule: exc.recurrenceRule,
        },
      })
    }
  }

  await logTimetableAction("copy_schedule_settings", {
    entityType: "scheduleConfig",
    metadata: {
      sourceTermId: input.sourceTermId,
      targetTermId: input.targetTermId,
      includeExceptions: input.includeExceptions,
    },
  })

  return { success: true }
}

/**
 * Get list of all terms for copying settings
 */
export async function getTermsForCopy() {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const terms = await db.term.findMany({
    where: { schoolId },
    orderBy: [{ schoolYear: { yearName: "desc" } }, { termNumber: "asc" }],
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      schoolYear: {
        select: { id: true, yearName: true },
      },
    },
  })

  return terms.map((t) => ({
    id: t.id,
    label: `${t.schoolYear.yearName} - Term ${t.termNumber}`,
    startDate: t.startDate,
    endDate: t.endDate,
    yearId: t.schoolYear.id,
  }))
}

// ============================================================================
// SUBSTITUTION MANAGEMENT
// ============================================================================
// Note: Constants moved to ./constants.ts to avoid "use server" export restrictions

/**
 * Create a teacher absence record
 */
export async function createTeacherAbsence(input: {
  teacherId: string
  startDate: Date
  endDate: Date
  absenceType: keyof typeof ABSENCE_TYPES
  reason?: string
  isAllDay?: boolean
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Verify teacher exists in this school
  const teacher = await db.teacher.findFirst({
    where: { id: input.teacherId, schoolId },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!teacher) throw new Error("TEACHER_NOT_FOUND")

  // Check for overlapping absences
  const existing = await db.teacherAbsence.findFirst({
    where: {
      schoolId,
      teacherId: input.teacherId,
      status: { not: "CANCELLED" },
      OR: [
        {
          startDate: { lte: input.endDate },
          endDate: { gte: input.startDate },
        },
      ],
    },
  })

  if (existing) {
    throw new Error("OVERLAPPING_ABSENCE")
  }

  const absence = await db.teacherAbsence.create({
    data: {
      schoolId,
      teacherId: input.teacherId,
      startDate: input.startDate,
      endDate: input.endDate,
      absenceType: input.absenceType,
      reason: input.reason,
      isAllDay: input.isAllDay ?? true,
      status: "PENDING",
    },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
    },
  })

  await logTimetableAction("create_schedule_exception", {
    entityType: "scheduleException",
    entityId: absence.id,
    metadata: {
      teacherId: input.teacherId,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      absenceType: input.absenceType,
      startDate: input.startDate.toISOString(),
      endDate: input.endDate.toISOString(),
    },
  })

  return { success: true, absence }
}

/**
 * Update a teacher absence (status, dates, etc.)
 */
export async function updateTeacherAbsence(input: {
  id: string
  status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  startDate?: Date
  endDate?: Date
  reason?: string
  absenceType?: keyof typeof ABSENCE_TYPES
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const session = await auth()
  const userId = session?.user?.id

  const existing = await db.teacherAbsence.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!existing) throw new Error("ABSENCE_NOT_FOUND")

  const updateData: Record<string, unknown> = {}
  if (input.status) {
    updateData.status = input.status
    if (input.status === "APPROVED") {
      updateData.approvedBy = userId
      updateData.approvedAt = new Date()
    }
  }
  if (input.startDate) updateData.startDate = input.startDate
  if (input.endDate) updateData.endDate = input.endDate
  if (input.reason !== undefined) updateData.reason = input.reason
  if (input.absenceType) updateData.absenceType = input.absenceType

  // Defense-in-depth: scope update by schoolId
  await db.teacherAbsence.updateMany({
    where: { id: input.id, schoolId },
    data: updateData,
  })

  await logTimetableAction("update_schedule_exception", {
    entityType: "scheduleException",
    entityId: input.id,
    metadata: { changes: updateData },
  })

  return { success: true }
}

/**
 * Get teacher absences with filters
 */
export async function getTeacherAbsences(input: {
  teacherId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const where: Record<string, unknown> = { schoolId }
  if (input.teacherId) where.teacherId = input.teacherId
  if (input.status) where.status = input.status
  if (input.startDate || input.endDate) {
    where.OR = []
    if (input.startDate) {
      ;(where.OR as unknown[]).push({ startDate: { gte: input.startDate } })
    }
    if (input.endDate) {
      ;(where.OR as unknown[]).push({ endDate: { lte: input.endDate } })
    }
  }

  const [absences, total] = await Promise.all([
    db.teacherAbsence.findMany({
      where,
      orderBy: { startDate: "desc" },
      take: input.limit ?? 50,
      skip: input.offset ?? 0,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        substitutionRecords: {
          include: {
            substituteTeacher: {
              select: { id: true, firstName: true, lastName: true },
            },
            originalSlot: {
              include: {
                period: {
                  select: { name: true, startTime: true, endTime: true },
                },
                class: {
                  select: {
                    name: true,
                    subject: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.teacherAbsence.count({ where }),
  ])

  return {
    absences: absences.map((a) => ({
      id: a.id,
      teacherId: a.teacherId,
      teacherName: `${a.teacher.firstName} ${a.teacher.lastName}`,
      startDate: a.startDate,
      endDate: a.endDate,
      absenceType: a.absenceType,
      reason: a.reason,
      status: a.status,
      isAllDay: a.isAllDay,
      substitutions: a.substitutionRecords.map((s) => ({
        id: s.id,
        status: s.status,
        slotDate: s.slotDate,
        substituteId: s.substituteTeacherId,
        substituteName: `${s.substituteTeacher.firstName} ${s.substituteTeacher.lastName}`,
        periodName: s.originalSlot.period.name,
        className: s.originalSlot.class?.name,
        name: s.originalSlot.class?.subject?.name,
      })),
    })),
    total,
  }
}

/**
 * Find available substitute teachers for a specific slot
 */
export async function findAvailableSubstitutes(input: {
  originalTeacherId: string
  dayOfWeek: number
  periodId: string
  slotDate: Date
  termId: string
  subjectId?: string // Optional: prefer teachers with this subject expertise
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get all active teachers except the absent one
  const teachers = await db.teacher.findMany({
    where: {
      schoolId,
      id: { not: input.originalTeacherId },
      employmentStatus: "ACTIVE",
    },
    include: {
      subjectExpertise: {
        select: { subjectId: true, expertiseLevel: true },
      },
      constraints: {
        where: {
          OR: [{ termId: input.termId }, { termId: null }],
        },
        include: {
          unavailableBlocks: {
            where: {
              dayOfWeek: input.dayOfWeek,
              periodId: input.periodId,
            },
          },
        },
      },
      timetables: {
        where: {
          termId: input.termId,
          dayOfWeek: input.dayOfWeek,
          periodId: input.periodId,
        },
      },
    },
  })

  const available: Array<{
    id: string
    name: string
    hasSubjectExpertise: boolean
    expertiseLevel: string | null
    currentWorkload: number
    isPreferred: boolean
    unavailableReason: string | null
  }> = []

  for (const teacher of teachers) {
    // Check if already teaching at this time
    if (teacher.timetables.length > 0) {
      continue // Skip - already scheduled
    }

    // Check for unavailable blocks
    const hasUnavailableBlock = teacher.constraints.some(
      (c) => c.unavailableBlocks.length > 0
    )
    if (hasUnavailableBlock) {
      continue // Skip - marked as unavailable
    }

    // Check subject expertise
    const subjectExp = input.subjectId
      ? teacher.subjectExpertise.find((e) => e.subjectId === input.subjectId)
      : null

    // Count current workload (periods this week)
    const weekSlots = await db.timetable.count({
      where: {
        schoolId,
        termId: input.termId,
        teacherId: teacher.id,
      },
    })

    available.push({
      id: teacher.id,
      name: `${teacher.firstName} ${teacher.lastName}`,
      hasSubjectExpertise: !!subjectExp,
      expertiseLevel: subjectExp?.expertiseLevel || null,
      currentWorkload: weekSlots,
      isPreferred: subjectExp?.expertiseLevel === "PRIMARY",
      unavailableReason: null,
    })
  }

  // Sort by preference: subject expertise first, then lower workload
  available.sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1
    if (!a.isPreferred && b.isPreferred) return 1
    if (a.hasSubjectExpertise && !b.hasSubjectExpertise) return -1
    if (!a.hasSubjectExpertise && b.hasSubjectExpertise) return 1
    return a.currentWorkload - b.currentWorkload
  })

  return { substitutes: available }
}

/**
 * Assign a substitute teacher to a timetable slot
 */
export async function assignSubstitute(input: {
  absenceId: string
  originalSlotId: string
  substituteTeacherId: string
  slotDate: Date
  notes?: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Verify absence exists
  const absence = await db.teacherAbsence.findFirst({
    where: { id: input.absenceId, schoolId },
    include: { teacher: { select: { firstName: true, lastName: true } } },
  })

  if (!absence) throw new Error("ABSENCE_NOT_FOUND")

  // Verify original slot
  const originalSlot = await db.timetable.findFirst({
    where: { id: input.originalSlotId, schoolId },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      class: {
        select: { name: true, subject: { select: { name: true } } },
      },
      period: { select: { name: true } },
    },
  })

  if (!originalSlot) throw new Error("TIMETABLE_SLOT_NOT_FOUND")

  // Verify substitute teacher
  const substitute = await db.teacher.findFirst({
    where: { id: input.substituteTeacherId, schoolId },
    select: { id: true, firstName: true, lastName: true },
  })

  if (!substitute) throw new Error("SUBSTITUTE_TEACHER_NOT_FOUND")

  // Check if substitution already exists for this slot on this date
  const existing = await db.substitutionRecord.findFirst({
    where: {
      schoolId,
      originalSlotId: input.originalSlotId,
      slotDate: input.slotDate,
      status: { not: "CANCELLED" },
    },
  })

  if (existing) {
    throw new Error("DUPLICATE_SUBSTITUTION")
  }

  // Create substitution record
  const substitution = await db.substitutionRecord.create({
    data: {
      schoolId,
      absenceId: input.absenceId,
      originalSlotId: input.originalSlotId,
      originalTeacherId: originalSlot.teacherId ?? "",
      substituteTeacherId: input.substituteTeacherId,
      slotDate: input.slotDate,
      status: "PENDING",
      notes: input.notes,
    },
    include: {
      substituteTeacher: { select: { firstName: true, lastName: true } },
      originalTeacher: { select: { firstName: true, lastName: true } },
    },
  })

  await logTimetableAction("create_schedule_exception", {
    entityType: "scheduleException",
    entityId: substitution.id,
    metadata: {
      type: "substitution",
      originalTeacher: `${originalSlot.teacher?.firstName} ${originalSlot.teacher?.lastName}`,
      substituteTeacher: `${substitute.firstName} ${substitute.lastName}`,
      slotDate: input.slotDate.toISOString(),
      periodName: originalSlot.period?.name,
      className: originalSlot.class?.name,
    },
  })

  // Notify substitute teacher about assignment (non-blocking)
  const subTeacherUser = await db.teacher.findFirst({
    where: { id: input.substituteTeacherId, schoolId },
    select: { userId: true },
  })
  if (subTeacherUser?.userId) {
    const schoolPref3 = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const notifLang3 = schoolPref3?.preferredLanguage ?? "ar"
    const origTeacher = [
      originalSlot.teacher?.firstName,
      originalSlot.teacher?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
    dispatchNotification({
      schoolId,
      userId: subTeacherUser.userId,
      type: "system_alert",
      title: notifLang3 === "ar" ? "تعيين بديل" : "Substitute assigned",
      body:
        notifLang3 === "ar"
          ? `تم تعيينك كبديل لـ ${origTeacher} في ${originalSlot.class?.name} (${originalSlot.period?.name})`
          : `You have been assigned as a substitute for ${origTeacher} in ${originalSlot.class?.name} (${originalSlot.period?.name})`,
      lang: notifLang3,
      priority: "high",
      channels: ["in_app", "email"],
      metadata: {
        substitutionId: substitution.id,
        originalSlotId: input.originalSlotId,
        slotDate: input.slotDate.toISOString(),
        url: "/timetable",
      },
    }).catch((err) =>
      console.error("[assignSubstitute] Notification error:", err)
    )
  }

  return { success: true, substitution }
}

/**
 * Confirm or decline a substitution assignment
 */
export async function respondToSubstitution(input: {
  id: string
  response: "CONFIRMED" | "DECLINED"
  declineReason?: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const record = await db.substitutionRecord.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!record) throw new Error("SUBSTITUTION_NOT_FOUND")
  if (record.status !== "PENDING") {
    throw new Error("SUBSTITUTION_NOT_PENDING")
  }

  const updateData: Record<string, unknown> = {
    status: input.response,
  }

  if (input.response === "CONFIRMED") {
    updateData.confirmedAt = new Date()
  } else if (input.response === "DECLINED") {
    updateData.declineReason = input.declineReason
  }

  // Defense-in-depth: scope update by schoolId
  await db.substitutionRecord.updateMany({
    where: { id: input.id, schoolId },
    data: updateData,
  })

  await logTimetableAction("update_schedule_exception", {
    entityType: "scheduleException",
    entityId: input.id,
    metadata: {
      action: input.response.toLowerCase(),
      declineReason: input.declineReason,
    },
  })

  // If declined, notify admins so they can find another substitute (non-blocking)
  if (input.response === "DECLINED") {
    const schoolPref4 = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const notifLang4 = schoolPref4?.preferredLanguage ?? "ar"
    const admins = await db.user.findMany({
      where: { schoolId, role: "ADMIN" },
      select: { id: true },
    })
    for (const admin of admins) {
      dispatchNotification({
        schoolId,
        userId: admin.id,
        type: "system_alert",
        title: notifLang4 === "ar" ? "رفض البدالة" : "Substitution declined",
        body:
          notifLang4 === "ar"
            ? `رفض المعلم البديل التعيين${input.declineReason ? `: ${input.declineReason}` : ""}`
            : `The substitute teacher declined the assignment${input.declineReason ? `: ${input.declineReason}` : ""}`,
        lang: notifLang4,
        priority: "high",
        channels: ["in_app"],
        metadata: {
          substitutionId: input.id,
          url: "/timetable/substitutions",
        },
      }).catch((err) =>
        console.error("[respondToSubstitution] Notification error:", err)
      )
    }
  }

  return { success: true }
}

/**
 * Get substitution records with filters
 */
export async function getSubstitutionRecords(rawInput: {
  absenceId?: string
  substituteTeacherId?: string
  originalTeacherId?: string
  status?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  await requireReadAccess()
  const input = getSubstitutionRecordsSchema.parse(rawInput ?? {})

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const where: Record<string, unknown> = { schoolId }
  if (input.absenceId) where.absenceId = input.absenceId
  if (input.substituteTeacherId)
    where.substituteTeacherId = input.substituteTeacherId
  if (input.originalTeacherId) where.originalTeacherId = input.originalTeacherId
  if (input.status) where.status = input.status
  if (input.startDate || input.endDate) {
    if (input.startDate && input.endDate) {
      where.slotDate = {
        gte: input.startDate,
        lte: input.endDate,
      }
    } else if (input.startDate) {
      where.slotDate = { gte: input.startDate }
    } else {
      where.slotDate = { lte: input.endDate }
    }
  }

  const [records, total] = await Promise.all([
    db.substitutionRecord.findMany({
      where,
      orderBy: { slotDate: "desc" },
      take: input.limit ?? 50,
      skip: input.offset ?? 0,
      include: {
        originalTeacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        substituteTeacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        originalSlot: {
          include: {
            period: { select: { name: true, startTime: true, endTime: true } },
            class: {
              select: {
                name: true,
                subject: { select: { name: true } },
              },
            },
            classroom: { select: { roomName: true } },
          },
        },
        absence: {
          select: { absenceType: true, reason: true },
        },
      },
    }),
    db.substitutionRecord.count({ where }),
  ])

  return {
    records: records.map((r) => ({
      id: r.id,
      slotDate: r.slotDate,
      status: r.status,
      notes: r.notes,
      declineReason: r.declineReason,
      confirmedAt: r.confirmedAt,
      originalTeacher: {
        id: r.originalTeacher.id,
        name: `${r.originalTeacher.firstName} ${r.originalTeacher.lastName}`,
      },
      substituteTeacher: {
        id: r.substituteTeacher.id,
        name: `${r.substituteTeacher.firstName} ${r.substituteTeacher.lastName}`,
      },
      slot: {
        id: r.originalSlotId,
        dayOfWeek: r.originalSlot.dayOfWeek,
        periodName: r.originalSlot.period.name,
        periodTime: `${r.originalSlot.period.startTime} - ${r.originalSlot.period.endTime}`,
        className: r.originalSlot.class?.name,
        name: r.originalSlot.class?.subject?.name,
        roomName: r.originalSlot.classroom?.roomName,
      },
      absence: {
        type: r.absence.absenceType,
        reason: r.absence.reason,
      },
    })),
    total,
  }
}

/**
 * Cancel a substitution assignment
 */
export async function cancelSubstitution(input: {
  id: string
  reason?: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const record = await db.substitutionRecord.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!record) throw new Error("SUBSTITUTION_NOT_FOUND")
  if (record.status === "COMPLETED") {
    throw new Error("SUBSTITUTION_ALREADY_COMPLETED")
  }

  // Defense-in-depth: scope update by schoolId
  await db.substitutionRecord.updateMany({
    where: { id: input.id, schoolId },
    data: {
      status: "CANCELLED",
      notes: input.reason
        ? `${record.notes || ""}\nCancellation reason: ${input.reason}`.trim()
        : record.notes,
    },
  })

  await logTimetableAction("delete_schedule_exception", {
    entityType: "scheduleException",
    entityId: input.id,
    metadata: { reason: input.reason },
  })

  // Notify substitute teacher about cancellation (non-blocking)
  const subTeacher = await db.teacher.findFirst({
    where: { id: record.substituteTeacherId, schoolId },
    select: { userId: true },
  })
  if (subTeacher?.userId) {
    const schoolPref5 = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    dispatchNotification({
      schoolId,
      userId: subTeacher.userId,
      type: "system_alert",
      title: "إلغاء البدالة",
      body: `تم إلغاء تعيينك كبديل${input.reason ? `: ${input.reason}` : ""}`,
      lang: schoolPref5?.preferredLanguage ?? "ar",
      priority: "normal",
      channels: ["in_app"],
      metadata: {
        substitutionId: input.id,
        url: "/timetable",
      },
    }).catch((err) =>
      console.error("[cancelSubstitution] Notification error:", err)
    )
  }

  return { success: true }
}

/**
 * Get upcoming substitutions for a teacher (as substitute)
 */
export async function getMyUpcomingSubstitutions(input: { limit?: number }) {
  await requireReadAccess()

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("NOT_AUTHENTICATED")

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Find teacher by user ID
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
  })

  if (!teacher) {
    return { substitutions: [] }
  }

  const records = await db.substitutionRecord.findMany({
    where: {
      schoolId,
      substituteTeacherId: teacher.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      slotDate: { gte: new Date() },
    },
    orderBy: { slotDate: "asc" },
    take: input.limit ?? 10,
    include: {
      originalTeacher: { select: { firstName: true, lastName: true } },
      originalSlot: {
        include: {
          period: { select: { name: true, startTime: true, endTime: true } },
          class: {
            select: { name: true, subject: { select: { name: true } } },
          },
          classroom: { select: { roomName: true } },
        },
      },
    },
  })

  return {
    substitutions: records.map((r) => ({
      id: r.id,
      slotDate: r.slotDate,
      status: r.status,
      originalTeacher: `${r.originalTeacher.firstName} ${r.originalTeacher.lastName}`,
      periodName: r.originalSlot.period.name,
      periodTime: `${r.originalSlot.period.startTime} - ${r.originalSlot.period.endTime}`,
      className: r.originalSlot.class?.name,
      name: r.originalSlot.class?.subject?.name,
      roomName: r.originalSlot.classroom?.roomName,
      dayOfWeek: r.originalSlot.dayOfWeek,
    })),
  }
}

/**
 * Get slots that need substitutes for an absence
 */
export async function getSlotsNeedingSubstitutes(input: {
  absenceId: string
  termId: string
}) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Get the absence details
  const absence = await db.teacherAbsence.findFirst({
    where: { id: input.absenceId, schoolId },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      substitutionRecords: {
        select: { originalSlotId: true, slotDate: true, status: true },
      },
    },
  })

  if (!absence) throw new Error("ABSENCE_NOT_FOUND")

  // Get the teacher's timetable slots
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      teacherId: absence.teacherId,
    },
    include: {
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { id: true, name: true } },
        },
      },
      classroom: { select: { id: true, roomName: true } },
    },
  })

  // Calculate the dates in the absence range
  const dates: Date[] = []
  const current = new Date(absence.startDate)
  const end = new Date(absence.endDate)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  // Build list of slot-date combinations that need substitutes
  const slotsNeeding: Array<{
    slotId: string
    date: Date
    dayOfWeek: number
    periodId: string
    periodName: string
    className: string | undefined
    subjectId: string | undefined
    name: string | undefined
    roomName: string | undefined
    hasSubstitute: boolean
    substituteStatus: string | null
  }> = []

  for (const date of dates) {
    const dayOfWeek = date.getDay()

    for (const slot of slots) {
      if (slot.dayOfWeek !== dayOfWeek) continue

      // Check if substitution already exists
      const existing = absence.substitutionRecords.find(
        (s) =>
          s.originalSlotId === slot.id &&
          s.slotDate.toDateString() === date.toDateString() &&
          s.status !== "CANCELLED"
      )

      slotsNeeding.push({
        slotId: slot.id,
        date,
        dayOfWeek,
        periodId: slot.periodId,
        periodName: slot.period.name,
        className: slot.class?.name,
        subjectId: slot.class?.subject?.id,
        name: slot.class?.subject?.name,
        roomName: slot.classroom?.roomName,
        hasSubstitute: !!existing,
        substituteStatus: existing?.status || null,
      })
    }
  }

  // Sort by date then period
  slotsNeeding.sort((a, b) => {
    const dateCompare = a.date.getTime() - b.date.getTime()
    if (dateCompare !== 0) return dateCompare
    return a.periodName.localeCompare(b.periodName)
  })

  return {
    teacher: {
      id: absence.teacherId,
      name: `${absence.teacher.firstName} ${absence.teacher.lastName}`,
    },
    absence: {
      id: absence.id,
      startDate: absence.startDate,
      endDate: absence.endDate,
      absenceType: absence.absenceType,
    },
    slots: slotsNeeding,
    unassignedCount: slotsNeeding.filter((s) => !s.hasSubstitute).length,
    totalCount: slotsNeeding.length,
  }
}

// ============================================================================
// SLOT EDITOR RESOURCE ACTIONS
// ============================================================================

/**
 * Get subjects available for the slot editor dialog.
 * Returns SubjectInfo[] derived from classes in the given term.
 */
export async function getSubjectsForSlotEditor(_input?: { termId?: string }) {
  await requireReadAccess()
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  // Read the school's active catalog subjects from SubjectSelection — this is
  // term-INDEPENDENT. (The old query read Class rows scoped by the active
  // termId, which returned nothing when the school's classes lived under a
  // different term than the resolved active one — the empty-picker bug.)
  const selections = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    select: {
      catalogSubjectId: true,
      gradeId: true,
      subject: { select: { id: true, name: true, department: true } },
    },
  })

  // Group by subject, collecting the grades each subject is selected for so the
  // slot editor can filter the picker to the clicked room's grade. (The old
  // query collapsed grades with distinct: ["catalogSubjectId"], which made
  // grade-aware filtering impossible.)
  const bySubject = new Map<
    string,
    {
      subject: { id: string; name: string; department: string | null }
      gradeIds: string[]
    }
  >()
  for (const s of selections) {
    if (!s.subject) continue
    const entry = bySubject.get(s.subject.id)
    if (entry) {
      if (!entry.gradeIds.includes(s.gradeId)) entry.gradeIds.push(s.gradeId)
    } else {
      bySubject.set(s.subject.id, { subject: s.subject, gradeIds: [s.gradeId] })
    }
  }

  const classes = Array.from(bySubject.values()).sort((a, b) =>
    a.subject.name > b.subject.name ? 1 : -1
  )

  const SLOT_EDITOR_COLORS = [
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#6366F1",
    "#EC4899",
    "#14B8A6",
    "#F59E0B",
    "#84CC16",
    "#0EA5E9",
    "#F43F5E",
    "#F97316",
    "#A855F7",
    "#22C55E",
    "#EF4444",
    "#64748B",
  ]

  return {
    subjects: classes.map((c, idx) => ({
      id: c.subject.id,
      name: c.subject.name,
      code: c.subject.name.slice(0, 4).toUpperCase(),
      color: SLOT_EDITOR_COLORS[idx % SLOT_EDITOR_COLORS.length],
      department: c.subject.department ?? undefined,
      hoursPerWeek: 3,
      isCore: true,
      gradeIds: c.gradeIds,
    })),
  }
}

/**
 * Get teachers with subject expertise for the slot editor dialog.
 * Returns TeacherInfo[] with subjects[] populated from TeacherSubjectExpertise.
 */
export async function getTeachersForSlotEditor(input: { termId: string }) {
  await requireReadAccess()
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("MISSING_SCHOOL_CONTEXT")

  const teachers = await db.teacher.findMany({
    where: { schoolId, employmentStatus: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: { select: { email: true, image: true } },
      teacherDepartments: {
        where: { isPrimary: true },
        select: { department: { select: { departmentName: true } } },
        take: 1,
      },
      subjectExpertise: {
        where: { schoolId },
        select: { subjectId: true },
      },
    },
  })

  // Localize names to the app language (stored names may be Arabic; the picker
  // must read "Minerva McGonagall" on /en). Then dedupe by display name — the
  // demo seed reuses a small name pool across many teacher rows, so the raw list
  // shows the same name several times.
  const lang = await getDisplayLang()
  const nameMap = await getNames(
    teachers,
    (t) => ({ firstName: t.firstName, lastName: t.lastName }),
    lang,
    schoolId
  )

  const seen = new Set<string>()
  const out: Array<{
    id: string
    firstName: string
    lastName: string
    name: string
    email: string
    photoUrl?: string
    department?: string
    subjects: string[]
  }> = []
  for (const t of teachers) {
    const raw = fullName({ firstName: t.firstName, lastName: t.lastName })
    const name = nameMap.get(raw) || raw
    if (seen.has(name)) continue
    seen.add(name)
    out.push({
      id: t.id,
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      name,
      email: t.user?.email || "",
      photoUrl: t.user?.image || undefined,
      department: t.teacherDepartments[0]?.department?.departmentName,
      subjects: t.subjectExpertise.map((e) => e.subjectId),
    })
  }

  return { teachers: out }
}
