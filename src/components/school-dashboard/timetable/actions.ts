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
import { getModel, getModelOrThrow } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"

// Constants imported from ./constants.ts to avoid "use server" export restrictions
import { ABSENCE_TYPES, SUBSTITUTION_STATUS } from "./constants"
// ============================================================================
// AI-POWERED TIMETABLE GENERATION
// ============================================================================

import {
  generateTimetable as runGenerationAlgorithm,
  type ClassRequirement,
  type GeneratedSlot,
  type GenerationConfig,
  type GenerationResult,
  type RoomAvailability,
  type TeacherAvailability,
} from "./generate/algorithm"
import {
  filterTimetableByRole,
  getPermissionContext,
  logTimetableAction,
  requireAdminAccess,
  requirePermission,
  requireReadAccess,
} from "./permissions"
// Types imported from ./types.ts to avoid "use server" export restrictions
import type {
  ConstraintViolation,
  ImportResult,
  ImportSlot,
  RoomConstraintCheck,
  TeacherConstraintCheck,
} from "./types"
import {
  detectTimetableConflictsSchema,
  getClassesForSelectionSchema,
  getScheduleConfigSchema,
  getTeachersForSelectionSchema,
  getWeeklyTimetableSchema,
  suggestFreeSlotsSchema,
  upsertSchoolWeekConfigSchema,
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
 */
export async function validateTeacherConstraints(input: {
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
    select: { id: true, givenName: true, surname: true },
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

  const teacherName = `${teacher.givenName} ${teacher.surname}`

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
 */
export async function validateRoomConstraints(input: {
  schoolId: string
  termId: string
  classroomId: string
  classId: string
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

  // Get class info (student count)
  const classInfo = await db.class.findFirst({
    where: { id: input.classId, schoolId: input.schoolId },
    select: {
      name: true,
      subject: { select: { subjectName: true } },
      _count: { select: { studentClasses: true } },
    },
  })

  const studentCount = classInfo?._count?.studentClasses ?? 0

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
    const subjectName = classInfo?.subject?.subjectName?.toLowerCase() || ""
    const allowed = (constraint.allowedSubjectTypes as string[]).map(
      (t: string) => t.toLowerCase()
    )

    // Check if the class's subject matches any allowed type
    const isAllowed = allowed.some(
      (t: string) => subjectName.includes(t) || t.includes(subjectName)
    )

    if (!isAllowed) {
      violations.push({
        type: "ROOM_EQUIPMENT",
        severity: "warning",
        message: `${classInfo?.subject?.subjectName} is not in the allowed subject types for ${room.roomName} (allowed: ${(constraint.allowedSubjectTypes as string[]).join(", ")})`,
        details: {
          subjectName: classInfo?.subject?.subjectName,
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
 */
export async function validateSlotConstraints(input: {
  schoolId: string
  termId: string
  teacherId: string
  classroomId: string
  classId: string
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
    validateTeacherConstraints({
      schoolId: input.schoolId,
      termId: input.termId,
      teacherId: input.teacherId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      weekOffset: input.weekOffset,
      excludeSlotId: input.excludeSlotId,
    }),
    validateRoomConstraints({
      schoolId: input.schoolId,
      termId: input.termId,
      classroomId: input.classroomId,
      classId: input.classId,
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
  if (!schoolId) throw new Error("Missing school context")

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

    // Step 3: Fetch details for conflicting slots (only the ones we need)
    // This is O(conflicts) not O(all slots)
    for (const tc of teacherConflicts) {
      const conflictSlots = await timetableModel.findMany({
        where: {
          schoolId,
          dayOfWeek: tc.dayOfWeek,
          periodId: tc.periodId,
          teacherId: tc.teacherId,
          ...(validatedInput?.termId && { termId: validatedInput.termId }),
        },
        select: {
          classId: true,
          teacherId: true,
          class: { select: { id: true, name: true } },
          teacher: { select: { givenName: true, surname: true } },
        },
        take: 2, // We only need 2 to show conflict
      })

      if (conflictSlots.length >= 2) {
        const [a, b] = conflictSlots
        conflicts.push({
          type: "TEACHER",
          classA: { id: a.class.id, name: a.class.name },
          classB: { id: b.class.id, name: b.class.name },
          teacher: {
            id: a.teacherId,
            name: [a.teacher?.givenName, a.teacher?.surname]
              .filter(Boolean)
              .join(" "),
          },
          room: null,
        })
      }
    }

    for (const rc of roomConflicts) {
      const conflictSlots = await timetableModel.findMany({
        where: {
          schoolId,
          dayOfWeek: rc.dayOfWeek,
          periodId: rc.periodId,
          classroomId: rc.classroomId,
          ...(validatedInput?.termId && { termId: validatedInput.termId }),
        },
        select: {
          classId: true,
          classroomId: true,
          class: { select: { id: true, name: true } },
          classroom: { select: { roomName: true } },
        },
        take: 2,
      })

      if (conflictSlots.length >= 2) {
        const [a, b] = conflictSlots
        conflicts.push({
          type: "ROOM",
          classA: { id: a.class.id, name: a.class.name },
          classB: { id: b.class.id, name: b.class.name },
          teacher: null,
          room: {
            id: a.classroomId,
            name: a.classroom?.roomName ?? a.classroomId,
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
      teacher: { select: { id: true, givenName: true, surname: true } },
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
            name: [a.teacher?.givenName, a.teacher?.surname]
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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

  const timetableModel = getModel("timetable")
  if (timetableModel && validatedInput?.termId) {
    const rows = await timetableModel.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: { class: { select: { id: true, name: true } } },
      distinct: ["classId"],
    })
    return {
      classes: rows.map((r: any) => ({ id: r.class.id, label: r.class.name })),
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
  if (!schoolId) throw new Error("Missing school context")

  const timetableModel = getModel("timetable")
  if (timetableModel && validatedInput?.termId) {
    const rows = await timetableModel.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: {
        teacher: { select: { id: true, givenName: true, surname: true } },
      },
      distinct: ["teacherId"],
    })
    return {
      teachers: rows.map((r: any) => ({
        id: r.teacher.id,
        label: [r.teacher.givenName, r.teacher.surname]
          .filter(Boolean)
          .join(" "),
      })),
    }
  }

  const teacherModel = getModel("teacher")
  if (teacherModel) {
    const rows = await teacherModel.findMany({
      where: { schoolId },
      select: { id: true, givenName: true, surname: true },
    })
    return {
      teachers: rows.map((t: any) => ({
        id: t.id,
        label: [t.givenName, t.surname].filter(Boolean).join(" "),
      })),
    }
  }

  return { teachers: [] as Array<{ id: string; label: string }> }
}

export async function upsertTimetableSlot(input: unknown) {
  // Validate input
  const validatedInput = upsertTimetableSlotSchema.parse(input)

  // Admin access required
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // P0 FIX: Validate teacher-subject expertise before assignment
  // Get the class's subject to check teacher qualification
  const classInfo = await db.class.findFirst({
    where: { id: validatedInput.classId, schoolId },
    select: {
      subjectId: true,
      subject: { select: { subjectName: true } },
    },
  })

  if (classInfo?.subjectId && validatedInput.teacherId) {
    // Check if teacher has expertise in this subject
    const teacherExpertise = await db.teacherSubjectExpertise.findFirst({
      where: {
        schoolId,
        teacherId: validatedInput.teacherId,
        subjectId: classInfo.subjectId,
      },
    })

    if (!teacherExpertise) {
      // Get teacher name for better error message
      const teacher = await db.teacher.findFirst({
        where: { id: validatedInput.teacherId, schoolId },
        select: { givenName: true, surname: true },
      })
      const teacherName = teacher
        ? `${teacher.givenName} ${teacher.surname}`
        : "Selected teacher"
      const subjectName = classInfo.subject?.subjectName || "this subject"

      throw new Error(
        `${teacherName} is not qualified to teach ${subjectName}. ` +
          `Please assign a teacher with subject expertise or add this subject to the teacher's qualifications.`
      )
    }
  }

  // P2 FIX: Validate teacher and room constraints before assignment
  // This checks max periods/day, max periods/week, unavailable blocks, room capacity, etc.
  await validateSlotConstraints({
    schoolId,
    termId: validatedInput.termId,
    teacherId: validatedInput.teacherId,
    classroomId: validatedInput.classroomId,
    classId: validatedInput.classId,
    dayOfWeek: validatedInput.dayOfWeek,
    periodId: validatedInput.periodId,
    weekOffset: validatedInput.weekOffset,
    enforceConstraints: true, // Throw error on constraint violations
  })

  const data = {
    schoolId,
    termId: validatedInput.termId,
    dayOfWeek: validatedInput.dayOfWeek,
    periodId: validatedInput.periodId,
    classId: validatedInput.classId,
    teacherId: validatedInput.teacherId,
    classroomId: validatedInput.classroomId,
    weekOffset: validatedInput.weekOffset,
  }

  // Upsert by unique composite (class at day/period)
  const timetableModel = getModelOrThrow("timetable")
  const row = await timetableModel.upsert({
    where: {
      schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
        schoolId,
        termId: validatedInput.termId,
        dayOfWeek: validatedInput.dayOfWeek,
        periodId: validatedInput.periodId,
        classId: validatedInput.classId,
        weekOffset: validatedInput.weekOffset,
      },
    },
    update: {
      teacherId: validatedInput.teacherId,
      classroomId: validatedInput.classroomId,
    },
    create: data,
  })

  // Log action for audit trail
  await logTimetableAction("edit", {
    entityType: "slot",
    entityId: row.id,
    changes: data,
  })

  return { id: row.id }
}

export async function upsertSchoolWeekConfig(input: unknown) {
  // Validate input
  const validatedInput = upsertSchoolWeekConfigSchema.parse(input)

  // Admin access required
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
export async function moveTimetableSlot(input: {
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

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Get the existing slot
  const existingSlot = await db.timetable.findFirst({
    where: { id: input.slotId, schoolId },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true } },
    },
  })

  if (!existingSlot) {
    throw new Error("Slot not found")
  }

  const targetClassroomId = input.targetClassroomId ?? existingSlot.classroomId

  // Validate constraints at the new position
  const validation = await validateSlotConstraints({
    schoolId,
    termId: existingSlot.termId,
    teacherId: existingSlot.teacherId,
    classroomId: targetClassroomId,
    classId: existingSlot.classId,
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

  // Check for conflicts at target position
  const conflictingSlot = await db.timetable.findFirst({
    where: {
      schoolId,
      termId: existingSlot.termId,
      dayOfWeek: input.targetDayOfWeek,
      periodId: input.targetPeriodId,
      weekOffset: existingSlot.weekOffset,
      OR: [
        { teacherId: existingSlot.teacherId },
        { classroomId: targetClassroomId },
      ],
      id: { not: input.slotId },
    },
    include: {
      class: { select: { name: true } },
      teacher: { select: { givenName: true, surname: true } },
    },
  })

  if (conflictingSlot) {
    if (conflictingSlot.teacherId === existingSlot.teacherId) {
      errors.push({
        type: "UNAVAILABLE_BLOCK",
        severity: "error",
        message: `Teacher is already scheduled for ${conflictingSlot.class?.name} at this time`,
        details: { conflictingSlotId: conflictingSlot.id },
      })
    }
    if (conflictingSlot.classroomId === targetClassroomId) {
      errors.push({
        type: "ROOM_RESERVED",
        severity: "error",
        message: `Room is already booked for ${conflictingSlot.class?.name} at this time`,
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

  // Perform the move
  const updatedSlot = await db.timetable.update({
    where: { id: input.slotId },
    data: {
      dayOfWeek: input.targetDayOfWeek,
      periodId: input.targetPeriodId,
      classroomId: targetClassroomId,
    },
  })

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
    slotId: updatedSlot.id,
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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!term) throw new Error("Invalid term")

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
    const teacherId = session?.user?.id // Assuming user ID maps to teacher ID
    if (teacherId) {
      whereBase.teacherId = teacherId
    }
  } else if (role === "STUDENT") {
    // Student can only view their class timetable
    const session = await auth()
    const studentId = session?.user?.id
    if (studentId) {
      // Get student's class
      const studentModel = getModel("student")
      const student = await studentModel?.findFirst({
        where: { id: studentId, schoolId },
        select: { classId: true },
      })
      if (student?.classId) {
        whereBase.classId = student.classId
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
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { subjectName: true } },
          teacher: { select: { givenName: true, surname: true } },
        },
      },
      teacher: { select: { givenName: true, surname: true } },
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
        [row.teacher?.givenName, row.teacher?.surname]
          .filter(Boolean)
          .join(" ") ||
        [row.class?.teacher?.givenName, row.class?.teacher?.surname]
          .filter(Boolean)
          .join(" ")
      const subjectName =
        row.class?.subject?.subjectName ?? row.class?.name ?? ""
      return {
        period: idx + 1,
        subject: subjectName,
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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

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
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { subjectName: true } },
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
      subject: { select: { subjectName: true } },
    },
  })

  return {
    classInfo: classInfo
      ? {
          id: classInfo.id,
          name: classInfo.name,
          subject: classInfo.subject?.subjectName,
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
      teacher: s.teacher ? `${s.teacher.givenName} ${s.teacher.surname}` : "",
      teacherId: s.teacherId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.class?.subject?.subjectName || s.class?.name || "",
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
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
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) throw new Error("Not authenticated")

  // Get student record with their enrolled classes via StudentClass relation
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      studentClasses: {
        where: { schoolId },
        select: {
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
              termId: true,
              subject: { select: { subjectName: true } },
            },
          },
        },
      },
    },
  })
  if (!student) throw new Error("Student not found")

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
        subject: { select: { subjectName: true } },
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
  if (!term) throw new Error("Invalid term")

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

  // Get all timetable slots for all classes in this grade
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      classId: { in: classIds },
      weekOffset: input.weekOffset ?? 0,
    },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { subjectName: true } },
        },
      },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
  })

  return {
    studentInfo: {
      id: student.id,
      name: `${student.givenName} ${student.surname}`,
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
      teacher: s.teacher ? `${s.teacher.givenName} ${s.teacher.surname}` : "",
      teacherId: s.teacherId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.class?.subject?.subjectName || s.class?.name || "",
      className: s.class?.name || "",
      classId: s.classId,
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
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
  if (!schoolId) throw new Error("Missing school context")

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
      subject: { select: { subjectName: true } },
    },
  })

  const classIds = gradeClasses.map((c) => c.id)

  // Get schedule config
  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  // Get all timetable slots for all classes in this grade
  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      classId: { in: classIds },
      weekOffset: input.weekOffset ?? 0,
    },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { subjectName: true } },
        },
      },
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
      name: c.subject?.subjectName || c.name,
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
      teacher: s.teacher ? `${s.teacher.givenName} ${s.teacher.surname}` : "",
      teacherId: s.teacherId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.class?.subject?.subjectName || s.class?.name || "",
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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const slots = await db.timetable.findMany({
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
          subject: { select: { subjectName: true } },
        },
      },
      classroom: { select: { id: true, roomName: true } },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
  })

  const teacherInfo = await db.teacher.findFirst({
    where: { id: input.teacherId, schoolId },
    select: { id: true, givenName: true, surname: true, emailAddress: true },
  })

  // Calculate workload
  const uniqueDays = new Set(slots.map((s) => s.dayOfWeek))
  const totalPeriods = slots.length

  return {
    teacherInfo: teacherInfo
      ? {
          id: teacherInfo.id,
          name: `${teacherInfo.givenName} ${teacherInfo.surname}`,
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
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      className: s.class?.name || "",
      classId: s.classId,
      room: s.classroom?.roomName || "",
      roomId: s.classroomId,
      subject: s.class?.subject?.subjectName || s.class?.name || "",
    })),
    workload: {
      daysPerWeek: uniqueDays.size,
      periodsPerWeek: totalPeriods,
      classesTeaching: [...new Set(slots.map((s) => s.classId))].length,
    },
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
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
  if (!schoolId) throw new Error("Missing school context")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const slots = await db.timetable.findMany({
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
          subject: { select: { subjectName: true } },
        },
      },
      teacher: { select: { id: true, givenName: true, surname: true } },
      period: {
        select: { id: true, name: true, startTime: true, endTime: true },
      },
    },
  })

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
    slots: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      className: s.class?.name || "",
      classId: s.classId,
      teacher: s.teacher ? `${s.teacher.givenName} ${s.teacher.surname}` : "",
      teacherId: s.teacherId,
      subject: s.class?.subject?.subjectName || s.class?.name || "",
    })),
    utilization: {
      usedSlots: slots.length,
      totalSlots: totalPossibleSlots,
      rate: Math.round(utilizationRate),
    },
    lunchAfterPeriod: config.defaultLunchAfterPeriod,
  }
}

/**
 * Get timetable analytics data
 */
export async function getTimetableAnalytics(input: { termId: string }) {
  await requirePermission("view_analytics")

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
  })

  const slots = await db.timetable.findMany({
    where: { schoolId, termId: input.termId, weekOffset: 0 },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true, capacity: true } },
      class: {
        select: {
          id: true,
          name: true,
          subject: { select: { subjectName: true } },
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
      const key = slot.teacherId
      const existing = teacherWorkload.get(key) || {
        name: `${slot.teacher.givenName} ${slot.teacher.surname}`,
        periods: 0,
        classes: new Set(),
        subjects: new Set(),
      }
      existing.periods++
      existing.classes.add(slot.classId)
      if (slot.class?.subject?.subjectName)
        existing.subjects.add(slot.class.subject.subjectName)
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

  const roomUtilization = rooms.map((room) => {
    const roomSlots = slots.filter((s) => s.classroomId === room.id)
    return {
      id: room.id,
      name: room.roomName,
      capacity: room.capacity,
      usedSlots: roomSlots.length,
      totalSlots: maxSlotsPerRoom,
      utilizationRate:
        maxSlotsPerRoom > 0
          ? Math.round((roomSlots.length / maxSlotsPerRoom) * 100)
          : 0,
    }
  })

  // Subject distribution
  const subjectDist = new Map<
    string,
    { name: string; periods: number; classes: Set<string> }
  >()
  for (const slot of slots) {
    const subject =
      slot.class?.subject?.subjectName || slot.class?.name || "Unknown"
    const existing = subjectDist.get(subject) || {
      name: subject,
      periods: 0,
      classes: new Set(),
    }
    existing.periods++
    existing.classes.add(slot.classId)
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
 * Delete a timetable slot
 */
export async function deleteTimetableSlot(input: {
  termId: string
  dayOfWeek: number
  periodId: string
  classId: string
  weekOffset: 0 | 1
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  await db.timetable.delete({
    where: {
      schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
        schoolId,
        termId: input.termId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
        classId: input.classId,
        weekOffset: input.weekOffset,
      },
    },
  })

  await logTimetableAction("delete", {
    entityType: "slot",
    metadata: input,
  })

  return { success: true }
}

/**
 * Get all periods for the current term
 */
export async function getPeriodsForTerm(input: { termId: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

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
 * Get the active term for the current school
 * Priority: 1) Term.isActive=true 2) Today within term dates 3) Most recent
 */
export async function getActiveTerm() {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const today = new Date()

  // Priority 1: Explicitly marked as active
  const activeTerm = await db.term.findFirst({
    where: { schoolId, isActive: true },
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      schoolYear: { select: { id: true, yearName: true } },
    },
  })

  if (activeTerm) {
    return {
      term: {
        id: activeTerm.id,
        termNumber: activeTerm.termNumber,
        label: `${activeTerm.schoolYear.yearName} - Term ${activeTerm.termNumber}`,
        startDate: activeTerm.startDate,
        endDate: activeTerm.endDate,
        yearId: activeTerm.schoolYear.id,
      },
      source: "explicit" as const,
    }
  }

  // Priority 2: Current date falls within term dates
  const currentTerm = await db.term.findFirst({
    where: {
      schoolId,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      schoolYear: { select: { id: true, yearName: true } },
    },
  })

  if (currentTerm) {
    return {
      term: {
        id: currentTerm.id,
        termNumber: currentTerm.termNumber,
        label: `${currentTerm.schoolYear.yearName} - Term ${currentTerm.termNumber}`,
        startDate: currentTerm.startDate,
        endDate: currentTerm.endDate,
        yearId: currentTerm.schoolYear.id,
      },
      source: "date_range" as const,
    }
  }

  // Priority 3: Most recent term
  const recentTerm = await db.term.findFirst({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      termNumber: true,
      startDate: true,
      endDate: true,
      schoolYear: { select: { id: true, yearName: true } },
    },
  })

  if (recentTerm) {
    return {
      term: {
        id: recentTerm.id,
        termNumber: recentTerm.termNumber,
        label: `${recentTerm.schoolYear.yearName} - Term ${recentTerm.termNumber}`,
        startDate: recentTerm.startDate,
        endDate: recentTerm.endDate,
        yearId: recentTerm.schoolYear.id,
      },
      source: "most_recent" as const,
    }
  }

  return { term: null, source: "none" as const }
}

/**
 * Set a term as active (admin only)
 */
export async function setActiveTerm(input: { termId: string }) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Deactivate all terms for this school
  await db.term.updateMany({
    where: { schoolId },
    data: { isActive: false },
  })

  // Activate the selected term
  await db.term.update({
    where: { id: input.termId },
    data: { isActive: true },
  })

  await logTimetableAction("configure_settings", {
    entityType: "term",
    entityId: input.termId,
    changes: { isActive: true },
  })

  return { success: true }
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
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("Not authenticated")

  // Determine view type based on role
  let viewType: ViewType = "admin"
  let filterData: {
    teacherId?: string
    classId?: string
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
      // Get student record and their class
      const student = await db.student.findFirst({
        where: { userId, schoolId },
        select: { id: true },
      })
      if (student) {
        // Get current class enrollment
        const enrollment = await db.studentClass.findFirst({
          where: { studentId: student.id, schoolId },
          orderBy: { createdAt: "desc" },
          select: { classId: true },
        })
        if (enrollment) {
          filterData.classId = enrollment.classId
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
                givenName: true,
                surname: true,
              },
            },
          },
        })
        filterData.childrenIds = studentGuardians.map((sg) => sg.student.id)
      }
      break
    }

    default:
      viewType = "student" // Default to most restricted view
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
  if (!term) throw new Error("Invalid term")

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  return {
    viewType,
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
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("Not authenticated")

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
              givenName: true,
              surname: true,
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
                      subject: { select: { subjectName: true } },
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
      name: `${sg.student.givenName} ${sg.student.surname}`,
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
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role

  if (!userId) throw new Error("Not authenticated")

  // Verify guardian has access to this child (unless admin)
  if (role !== "DEVELOPER" && role !== "ADMIN") {
    const guardian = await db.guardian.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    if (guardian) {
      const hasAccess = await db.studentGuardian.findFirst({
        where: {
          guardianId: guardian.id,
          studentId: input.childId,
          schoolId,
        },
      })

      if (!hasAccess) {
        throw new Error("Access denied to this student")
      }
    }
  }

  // Get student's class
  const enrollment = await db.studentClass.findFirst({
    where: { studentId: input.childId, schoolId },
    orderBy: { createdAt: "desc" },
    select: { classId: true },
  })

  if (!enrollment) {
    return {
      studentInfo: null,
      slots: [],
      workingDays: [],
      periods: [],
      lunchAfterPeriod: null,
    }
  }

  // Get student info
  const student = await db.student.findFirst({
    where: { id: input.childId, schoolId },
    select: { id: true, givenName: true, surname: true },
  })

  // Use existing getTimetableByClass
  const timetableData = await getTimetableByClass({
    termId: input.termId,
    classId: enrollment.classId,
    weekOffset: input.weekOffset,
  })

  return {
    studentInfo: student
      ? {
          id: student.id,
          name: `${student.givenName} ${student.surname}`,
        }
      : null,
    ...timetableData,
  }
}

/**
 * Get today's schedule for the authenticated user
 */
export async function getTodaySchedule(input?: { date?: Date }) {
  await requireReadAccess()

  const { schoolId, role } = await getPermissionContext()
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("Not authenticated")

  const targetDate = input?.date || new Date()
  const dayOfWeek = targetDate.getDay() // 0 = Sunday

  // Get active term
  const { term } = await getActiveTerm()
  if (!term) {
    return { schedule: [], dayOfWeek, message: "No active term" }
  }

  // Get periods for this term
  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: "asc" },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  // Build filter based on role
  const where: {
    schoolId: string
    termId: string
    dayOfWeek: number
    weekOffset: number
    teacherId?: string
    classId?: string
  } = {
    schoolId,
    termId: term.id,
    dayOfWeek,
    weekOffset: 0,
  }

  if (role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (teacher) where.teacherId = teacher.id
  } else if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (student) {
      const enrollment = await db.studentClass.findFirst({
        where: { studentId: student.id, schoolId },
        orderBy: { createdAt: "desc" },
        select: { classId: true },
      })
      if (enrollment) where.classId = enrollment.classId
    }
  }

  const slots = await db.timetable.findMany({
    where,
    include: {
      class: {
        select: { name: true, subject: { select: { subjectName: true } } },
      },
      teacher: { select: { givenName: true, surname: true } },
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
    subject: slot.class?.subject?.subjectName || slot.class?.name || "",
    className: slot.class?.name || "",
    teacher: slot.teacher
      ? `${slot.teacher.givenName} ${slot.teacher.surname}`
      : "",
    room: slot.classroom?.roomName || "",
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
      isBreak,
    }
  })

  return {
    schedule: fullSchedule,
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
  if (!schoolId) throw new Error("Missing school context")

  const constraint = await db.teacherConstraint.findFirst({
    where: {
      schoolId,
      teacherId: input.teacherId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
    include: {
      unavailableBlocks: true,
      teacher: { select: { givenName: true, surname: true } },
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
      teacherName: `${constraint.teacher.givenName} ${constraint.teacher.surname}`,
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
export async function upsertTeacherConstraints(input: {
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

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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

  const constraint = existing
    ? await db.teacherConstraint.update({
        where: { id: existing.id },
        data,
      })
    : await db.teacherConstraint.create({ data })

  await logTimetableAction("configure_settings", {
    entityType: "teacher_constraint",
    entityId: constraint.id,
    changes: input,
  })

  return { id: constraint.id }
}

/**
 * Add unavailable block for a teacher
 */
export async function addTeacherUnavailableBlock(input: {
  teacherConstraintId: string
  dayOfWeek: number
  periodId: string
  reason?: string
  isRecurring?: boolean
  specificDate?: Date
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

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

  const constraint = existing
    ? await db.roomConstraint.update({
        where: { id: existing.id },
        data,
      })
    : await db.roomConstraint.create({ data })

  await logTimetableAction("configure_settings", {
    entityType: "room_constraint",
    entityId: constraint.id,
    changes: input,
  })

  return { id: constraint.id }
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
  if (!schoolId) throw new Error("Missing school context")

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
export async function createTemplateFromTerm(input: {
  name: string
  description?: string
  sourceTermId: string
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
export async function applyTemplateToTerm(input: {
  templateId: string
  targetTermId: string
  clearExisting?: boolean
  teacherMapping?: Record<string, string>
  roomMapping?: Record<string, string>
}) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id

  // Get template
  const template = await db.timetableTemplate.findUnique({
    where: { id: input.templateId },
    select: { slotPatterns: true, workingDays: true },
  })

  if (!template) throw new Error("Template not found")

  // Clear existing slots if requested
  if (input.clearExisting) {
    await db.timetable.deleteMany({
      where: { schoolId, termId: input.targetTermId },
    })
  }

  const slotPatterns = template.slotPatterns as Array<{
    dayOfWeek: number
    periodId: string
    classId: string
    teacherId: string
    classroomId: string
    rotationWeek: number
  }>

  // Apply slots with optional mapping
  let slotsCreated = 0
  let conflictsFound = 0

  for (const pattern of slotPatterns) {
    const teacherId =
      input.teacherMapping?.[pattern.teacherId] || pattern.teacherId
    const classroomId =
      input.roomMapping?.[pattern.classroomId] || pattern.classroomId

    try {
      await db.timetable.create({
        data: {
          schoolId,
          termId: input.targetTermId,
          dayOfWeek: pattern.dayOfWeek,
          periodId: pattern.periodId,
          classId: pattern.classId,
          teacherId,
          classroomId,
          weekOffset: 0,
          rotationWeek: pattern.rotationWeek,
        },
      })
      slotsCreated++
    } catch {
      // Likely a conflict
      conflictsFound++
    }
  }

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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

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
}> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Get term info
  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true },
  })
  if (!term) throw new Error("Invalid term")

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

  // Get class requirements (classes to schedule)
  const classes = await db.class.findMany({
    where: { schoolId, termId: input.termId },
    select: {
      id: true,
      name: true,
      subjectId: true,
      subject: {
        select: {
          id: true,
          subjectName: true,
        },
      },
      _count: { select: { studentClasses: true } },
    },
  })

  // Get teacher expertise mapping
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

  const requirements: ClassRequirement[] = classes.map((c) => ({
    classId: c.id,
    className: c.name,
    subjectId: c.subjectId || "",
    subjectName: c.subject?.subjectName || c.name,
    hoursPerWeek: 3, // Default to 3 periods per week (can be enhanced with subject metadata)
    preferredTeacherIds: subjectTeachers.get(c.subjectId || "") || [],
    requiresLab:
      c.subject?.subjectName?.toLowerCase().includes("lab") ||
      c.subject?.subjectName?.toLowerCase().includes("science") ||
      false,
    yearLevelId: "", // Year level not directly on Class, extracted from related data if needed
    studentCount: c._count.studentClasses,
  }))

  // Get teachers with constraints
  const teachersData = await db.teacher.findMany({
    where: { schoolId, employmentStatus: "ACTIVE" },
    select: {
      id: true,
      givenName: true,
      surname: true,
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
      teacherName: `${t.givenName} ${t.surname}`,
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

  // Run generation algorithm
  const result = runGenerationAlgorithm(requirements, teachers, rooms, {
    schoolId,
    termId: input.termId,
    yearId: term.yearId,
    config: generationConfig,
  })

  await logTimetableAction("generate_preview", {
    entityType: "generation",
    metadata: {
      termId: input.termId,
      totalSlots: result.stats.totalSlots,
      placedSlots: result.stats.placedSlots,
      success: result.success,
    },
  })

  return {
    success: result.success,
    preview: result.slots,
    stats: result.stats,
    unplacedClasses: result.unplacedClasses,
    warnings: result.warnings,
    errors: result.errors,
  }
}

/**
 * Apply generated timetable preview to the database
 */
export async function applyGeneratedTimetable(input: {
  termId: string
  slots: GeneratedSlot[]
  clearExisting?: boolean
}): Promise<{ success: boolean; createdCount: number; errors: string[] }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const errors: string[] = []
  let createdCount = 0

  try {
    await db.$transaction(async (tx) => {
      // Clear existing slots if requested
      if (input.clearExisting) {
        await tx.timetable.deleteMany({
          where: { schoolId, termId: input.termId },
        })
      }

      // Insert new slots
      for (const slot of input.slots) {
        try {
          await tx.timetable.create({
            data: {
              schoolId,
              termId: input.termId,
              dayOfWeek: slot.dayOfWeek,
              periodId: slot.periodId,
              classId: slot.classId,
              teacherId: slot.teacherId,
              classroomId: slot.classroomId,
              weekOffset: 0,
              constraintViolations: slot.violations,
            },
          })
          createdCount++
        } catch (error) {
          // Handle unique constraint violation (slot already exists)
          if (
            error instanceof Error &&
            error.message.includes("Unique constraint")
          ) {
            // Update existing slot instead
            await tx.timetable.updateMany({
              where: {
                schoolId,
                termId: input.termId,
                dayOfWeek: slot.dayOfWeek,
                periodId: slot.periodId,
                classId: slot.classId,
                weekOffset: 0,
              },
              data: {
                teacherId: slot.teacherId,
                classroomId: slot.classroomId,
                constraintViolations: slot.violations,
              },
            })
            createdCount++
          } else {
            throw error
          }
        }
      }
    })

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
export async function importTimetableSlots(input: {
  termId: string
  slots: ImportSlot[]
  options: {
    overwrite: boolean
    validateOnly: boolean
  }
}): Promise<ImportResult> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
export async function createPeriod(input: {
  yearId: string
  name: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}): Promise<{ id: string }> {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
    throw new Error("Invalid time format. Use HH:MM")
  }

  // Parse times to Date objects (using UTC for consistency)
  const [startHour, startMin] = input.startTime.split(":").map(Number)
  const [endHour, endMin] = input.endTime.split(":").map(Number)

  const startTime = new Date(Date.UTC(1970, 0, 1, startHour, startMin))
  const endTime = new Date(Date.UTC(1970, 0, 1, endHour, endMin))

  if (startTime >= endTime) {
    throw new Error("Start time must be before end time")
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
      throw new Error(
        `Time overlaps with existing period "${existing.name}" (${formatTimeOnly(existStart)}-${formatTimeOnly(existEnd)})`
      )
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
  if (!schoolId) throw new Error("Missing school context")

  // Get existing period
  const existing = await db.period.findFirst({
    where: { id: input.periodId, schoolId },
    select: { id: true, yearId: true, startTime: true, endTime: true },
  })
  if (!existing) throw new Error("Period not found")

  const updateData: { name?: string; startTime?: Date; endTime?: Date } = {}

  if (input.name) {
    updateData.name = input.name
  }

  if (input.startTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(input.startTime)) {
      throw new Error("Invalid start time format. Use HH:MM")
    }
    const [hour, min] = input.startTime.split(":").map(Number)
    updateData.startTime = new Date(Date.UTC(1970, 0, 1, hour, min))
  }

  if (input.endTime) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(input.endTime)) {
      throw new Error("Invalid end time format. Use HH:MM")
    }
    const [hour, min] = input.endTime.split(":").map(Number)
    updateData.endTime = new Date(Date.UTC(1970, 0, 1, hour, min))
  }

  // Validate times if both are being updated
  const newStart = updateData.startTime || new Date(existing.startTime)
  const newEnd = updateData.endTime || new Date(existing.endTime)

  if (newStart >= newEnd) {
    throw new Error("Start time must be before end time")
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
      throw new Error(
        `Time overlaps with period "${other.name}" (${formatTimeOnly(existStart)}-${formatTimeOnly(existEnd)})`
      )
    }
  }

  await db.period.update({
    where: { id: input.periodId },
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
  if (!schoolId) throw new Error("Missing school context")

  // Check if period is used in any timetable slots
  const usageCount = await db.timetable.count({
    where: { schoolId, periodId: input.periodId },
  })

  if (usageCount > 0) {
    throw new Error(
      `Cannot delete period - it is used in ${usageCount} timetable slots. Remove or reassign slots first.`
    )
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
  if (!schoolId) throw new Error("Missing school context")

  // Get source periods
  const sourcePeriods = await db.period.findMany({
    where: { schoolId, yearId: input.sourceYearId },
    orderBy: { startTime: "asc" },
  })

  if (sourcePeriods.length === 0) {
    throw new Error("No periods found in source year")
  }

  // Check target year exists
  const targetYear = await db.schoolYear.findFirst({
    where: { id: input.targetYearId, schoolId },
  })
  if (!targetYear) throw new Error("Target school year not found")

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
      throw new Error(
        `Cannot overwrite - ${usedPeriods.length} periods are used in timetable slots`
      )
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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

  // Check if periods already exist
  const existing = await db.period.count({
    where: { schoolId, yearId: input.yearId },
  })

  if (existing > 0) {
    throw new Error(
      "Periods already exist for this year. Delete existing periods first."
    )
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
    throw new Error("Invalid template")
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
  if (!schoolId) throw new Error("Missing school context")

  // Import dynamically to avoid circular dependency with "use server"
  const { getStructureBySlug, LEGACY_TEMPLATE_MAP } =
    await import("./structures")

  // Support legacy template names
  const slug = LEGACY_TEMPLATE_MAP[input.structureSlug] || input.structureSlug
  const structure = getStructureBySlug(slug)
  if (!structure) throw new Error("Unknown timetable structure: " + slug)

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
      throw new Error(
        "Periods already exist for this year. Set replaceExisting to replace them."
      )
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
  if (!schoolId) throw new Error("Missing school context")

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

  if (!term) throw new Error("Term not found")

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
  if (!schoolId) throw new Error("Missing school context")

  // Validate dates
  if (input.startDate >= input.endDate) {
    throw new Error("Start date must be before end date")
  }

  const term = await db.term.update({
    where: { id: input.termId },
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

  return term
}

/**
 * Get all schedule exceptions (holidays, events) for a term
 */
export async function getScheduleExceptions(input: { termId: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

  // Validate dates
  if (input.startDate > input.endDate) {
    throw new Error("Start date must be before or equal to end date")
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
  if (!schoolId) throw new Error("Missing school context")

  // Verify ownership
  const existing = await db.scheduleException.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!existing) throw new Error("Schedule exception not found")

  // Validate dates if provided
  const startDate = input.startDate ?? existing.startDate
  const endDate = input.endDate ?? existing.endDate
  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date")
  }

  const exception = await db.scheduleException.update({
    where: { id: input.id },
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
    metadata: { title: exception.title },
  })

  return exception
}

/**
 * Delete a schedule exception
 */
export async function deleteScheduleException(input: { id: string }) {
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Verify ownership
  const existing = await db.scheduleException.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!existing) throw new Error("Schedule exception not found")

  await db.scheduleException.delete({
    where: { id: input.id },
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
  if (!schoolId) throw new Error("Missing school context")

  // Get source config
  const sourceConfig = await db.schoolWeekConfig.findFirst({
    where: { schoolId, termId: input.sourceTermId },
  })

  if (!sourceConfig) {
    throw new Error("Source term has no schedule configuration")
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
  if (!schoolId) throw new Error("Missing school context")

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
  if (!schoolId) throw new Error("Missing school context")

  // Verify teacher exists in this school
  const teacher = await db.teacher.findFirst({
    where: { id: input.teacherId, schoolId },
    select: { id: true, givenName: true, surname: true },
  })

  if (!teacher) throw new Error("Teacher not found")

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
    throw new Error("Overlapping absence already exists for this teacher")
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
      teacher: { select: { givenName: true, surname: true } },
    },
  })

  await logTimetableAction("create_schedule_exception", {
    entityType: "scheduleException",
    entityId: absence.id,
    metadata: {
      teacherId: input.teacherId,
      teacherName: `${teacher.givenName} ${teacher.surname}`,
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
  if (!schoolId) throw new Error("Missing school context")

  const session = await auth()
  const userId = session?.user?.id

  const existing = await db.teacherAbsence.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!existing) throw new Error("Absence not found")

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

  const absence = await db.teacherAbsence.update({
    where: { id: input.id },
    data: updateData,
    include: {
      teacher: { select: { givenName: true, surname: true } },
    },
  })

  await logTimetableAction("update_schedule_exception", {
    entityType: "scheduleException",
    entityId: input.id,
    metadata: { changes: updateData },
  })

  return { success: true, absence }
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
  if (!schoolId) throw new Error("Missing school context")

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
        teacher: { select: { id: true, givenName: true, surname: true } },
        substitutionRecords: {
          include: {
            substituteTeacher: {
              select: { id: true, givenName: true, surname: true },
            },
            originalSlot: {
              include: {
                period: {
                  select: { name: true, startTime: true, endTime: true },
                },
                class: {
                  select: {
                    name: true,
                    subject: { select: { subjectName: true } },
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
      teacherName: `${a.teacher.givenName} ${a.teacher.surname}`,
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
        substituteName: `${s.substituteTeacher.givenName} ${s.substituteTeacher.surname}`,
        periodName: s.originalSlot.period.name,
        className: s.originalSlot.class?.name,
        subjectName: s.originalSlot.class?.subject?.subjectName,
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
  if (!schoolId) throw new Error("Missing school context")

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
      name: `${teacher.givenName} ${teacher.surname}`,
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
  if (!schoolId) throw new Error("Missing school context")

  // Verify absence exists
  const absence = await db.teacherAbsence.findFirst({
    where: { id: input.absenceId, schoolId },
    include: { teacher: { select: { givenName: true, surname: true } } },
  })

  if (!absence) throw new Error("Absence not found")

  // Verify original slot
  const originalSlot = await db.timetable.findFirst({
    where: { id: input.originalSlotId, schoolId },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      class: {
        select: { name: true, subject: { select: { subjectName: true } } },
      },
      period: { select: { name: true } },
    },
  })

  if (!originalSlot) throw new Error("Timetable slot not found")

  // Verify substitute teacher
  const substitute = await db.teacher.findFirst({
    where: { id: input.substituteTeacherId, schoolId },
    select: { id: true, givenName: true, surname: true },
  })

  if (!substitute) throw new Error("Substitute teacher not found")

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
    throw new Error("A substitution already exists for this slot on this date")
  }

  // Create substitution record
  const substitution = await db.substitutionRecord.create({
    data: {
      schoolId,
      absenceId: input.absenceId,
      originalSlotId: input.originalSlotId,
      originalTeacherId: originalSlot.teacherId,
      substituteTeacherId: input.substituteTeacherId,
      slotDate: input.slotDate,
      status: "PENDING",
      notes: input.notes,
    },
    include: {
      substituteTeacher: { select: { givenName: true, surname: true } },
      originalTeacher: { select: { givenName: true, surname: true } },
    },
  })

  await logTimetableAction("create_schedule_exception", {
    entityType: "scheduleException",
    entityId: substitution.id,
    metadata: {
      type: "substitution",
      originalTeacher: `${originalSlot.teacher?.givenName} ${originalSlot.teacher?.surname}`,
      substituteTeacher: `${substitute.givenName} ${substitute.surname}`,
      slotDate: input.slotDate.toISOString(),
      periodName: originalSlot.period?.name,
      className: originalSlot.class?.name,
    },
  })

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
  if (!schoolId) throw new Error("Missing school context")

  const record = await db.substitutionRecord.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!record) throw new Error("Substitution record not found")
  if (record.status !== "PENDING") {
    throw new Error("Can only respond to pending substitutions")
  }

  const updateData: Record<string, unknown> = {
    status: input.response,
  }

  if (input.response === "CONFIRMED") {
    updateData.confirmedAt = new Date()
  } else if (input.response === "DECLINED") {
    updateData.declineReason = input.declineReason
  }

  const substitution = await db.substitutionRecord.update({
    where: { id: input.id },
    data: updateData,
    include: {
      substituteTeacher: { select: { givenName: true, surname: true } },
      originalTeacher: { select: { givenName: true, surname: true } },
    },
  })

  await logTimetableAction("update_schedule_exception", {
    entityType: "scheduleException",
    entityId: input.id,
    metadata: {
      action: input.response.toLowerCase(),
      declineReason: input.declineReason,
    },
  })

  return { success: true, substitution }
}

/**
 * Get substitution records with filters
 */
export async function getSubstitutionRecords(input: {
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

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
          select: { id: true, givenName: true, surname: true },
        },
        substituteTeacher: {
          select: { id: true, givenName: true, surname: true },
        },
        originalSlot: {
          include: {
            period: { select: { name: true, startTime: true, endTime: true } },
            class: {
              select: {
                name: true,
                subject: { select: { subjectName: true } },
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
        name: `${r.originalTeacher.givenName} ${r.originalTeacher.surname}`,
      },
      substituteTeacher: {
        id: r.substituteTeacher.id,
        name: `${r.substituteTeacher.givenName} ${r.substituteTeacher.surname}`,
      },
      slot: {
        id: r.originalSlotId,
        dayOfWeek: r.originalSlot.dayOfWeek,
        periodName: r.originalSlot.period.name,
        periodTime: `${r.originalSlot.period.startTime} - ${r.originalSlot.period.endTime}`,
        className: r.originalSlot.class?.name,
        subjectName: r.originalSlot.class?.subject?.subjectName,
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
  if (!schoolId) throw new Error("Missing school context")

  const record = await db.substitutionRecord.findFirst({
    where: { id: input.id, schoolId },
  })

  if (!record) throw new Error("Substitution record not found")
  if (record.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed substitution")
  }

  const substitution = await db.substitutionRecord.update({
    where: { id: input.id },
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

  return { success: true, substitution }
}

/**
 * Get upcoming substitutions for a teacher (as substitute)
 */
export async function getMyUpcomingSubstitutions(input: { limit?: number }) {
  await requireReadAccess()

  const session = await auth()
  const userId = session?.user?.id

  if (!userId) throw new Error("Not authenticated")

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

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
      originalTeacher: { select: { givenName: true, surname: true } },
      originalSlot: {
        include: {
          period: { select: { name: true, startTime: true, endTime: true } },
          class: {
            select: { name: true, subject: { select: { subjectName: true } } },
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
      originalTeacher: `${r.originalTeacher.givenName} ${r.originalTeacher.surname}`,
      periodName: r.originalSlot.period.name,
      periodTime: `${r.originalSlot.period.startTime} - ${r.originalSlot.period.endTime}`,
      className: r.originalSlot.class?.name,
      subjectName: r.originalSlot.class?.subject?.subjectName,
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
  if (!schoolId) throw new Error("Missing school context")

  // Get the absence details
  const absence = await db.teacherAbsence.findFirst({
    where: { id: input.absenceId, schoolId },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      substitutionRecords: {
        select: { originalSlotId: true, slotDate: true, status: true },
      },
    },
  })

  if (!absence) throw new Error("Absence not found")

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
          subject: { select: { id: true, subjectName: true } },
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
    subjectName: string | undefined
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
        subjectName: slot.class?.subject?.subjectName,
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
      name: `${absence.teacher.givenName} ${absence.teacher.surname}`,
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
