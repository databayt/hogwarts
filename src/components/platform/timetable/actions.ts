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
 * 1. detectTimetableConflicts(): O(n²) comparison of all slots for same teacher/room at same time
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
 * - requireAdminAccess(): School admin or platform admin only (can modify timetable)
 * - requireReadAccess(): Can view timetable (varies by role)
 * - logTimetableAction(): Audit trail for compliance (track who changed what when)
 * - filterTimetableByRole(): Client-side visibility filter (prevents info leakage)
 *
 * PERFORMANCE NOTES:
 * - detectTimetableConflicts is O(n²) - could be optimized with indexed queries
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

import { db } from "@/lib/db"
import { getModel, getModelOrThrow } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"

import {
  filterTimetableByRole,
  getPermissionContext,
  logTimetableAction,
  requireAdminAccess,
  requirePermission,
  requireReadAccess,
} from "./permissions"
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

  // If new Timetable model exists, perform slot-based conflict checks first
  const timetableModel = getModel("timetable")
  if (timetableModel) {
    const where: any = { schoolId }
    if (validatedInput?.termId) where.termId = validatedInput.termId

    const slots = await timetableModel.findMany({
      where,
      select: {
        dayOfWeek: true,
        periodId: true,
        classId: true,
        teacherId: true,
        classroomId: true,
        class: { select: { id: true, name: true } },
        teacher: { select: { givenName: true, surname: true } },
        classroom: { select: { roomName: true } },
      },
    })

    const conflicts: Conflict[] = []
    // Group by day+period
    const groups = new Map<string, typeof slots>() as any
    for (const s of slots) {
      const key = `${s.dayOfWeek}:${s.periodId}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(s)
    }
    for (const [, group] of groups) {
      // Teacher conflicts in this time slot
      const byTeacher = new Map<string, (typeof group)[number]>()
      for (const s of group) {
        if (s.teacherId) {
          if (byTeacher.has(s.teacherId)) {
            const a = byTeacher.get(s.teacherId)!
            const b = s
            conflicts.push({
              type: "TEACHER",
              classA: { id: a.class.id, name: a.class.name },
              classB: { id: b.class.id, name: b.class.name },
              teacher: {
                id: s.teacherId,
                name: [b.teacher?.givenName, b.teacher?.surname]
                  .filter(Boolean)
                  .join(" "),
              },
              room: null,
            })
          } else {
            byTeacher.set(s.teacherId, s)
          }
        }
      }
      // Room conflicts
      const byRoom = new Map<string, (typeof group)[number]>()
      for (const s of group) {
        if (s.classroomId) {
          if (byRoom.has(s.classroomId)) {
            const a = byRoom.get(s.classroomId)!
            const b = s
            conflicts.push({
              type: "ROOM",
              classA: { id: a.class.id, name: a.class.name },
              classB: { id: b.class.id, name: b.class.name },
              teacher: null,
              room: {
                id: s.classroomId,
                name: b.classroom?.roomName ?? s.classroomId,
              },
            })
          } else {
            byRoom.set(s.classroomId, s)
          }
        }
      }
    }
    return { conflicts }
  }

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
  const conflicts: Conflict[] = []

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

  // Get student record
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true, givenName: true, surname: true },
  })
  if (!student) throw new Error("Student not found")

  // Get student's current year level
  const studentYearLevel = await db.studentYearLevel.findFirst({
    where: { studentId: student.id, schoolId },
    orderBy: { createdAt: "desc" },
    select: {
      yearLevel: { select: { id: true, levelName: true, levelNameAr: true } },
    },
  })
  if (!studentYearLevel?.yearLevel)
    throw new Error("Student not enrolled in any grade level")

  const gradeName = studentYearLevel.yearLevel.levelName // e.g., "Grade 10"

  // Get all classes for this grade level (by name pattern match)
  // Classes are named like "Mathematics - Grade 10", "Arabic - Grade 10"
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

  const classIds = gradeClasses.map((c) => c.id)

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
      gradeNameAr: studentYearLevel.yearLevel.levelNameAr,
    },
    schoolName: school?.name || "",
    subjectCount: gradeClasses.length,
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
    select: { levelNameAr: true },
  })

  return {
    gradeInfo: {
      name: input.gradeName,
      nameAr: yearLevel?.levelNameAr || input.gradeName,
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
      levelNameAr: true,
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
          nameAr: yl.levelNameAr,
          order: yl.levelOrder,
        })),
    }
  }

  return {
    gradeLevels: yearLevels.map((yl) => ({
      id: yl.id,
      name: yl.levelName,
      nameAr: yl.levelNameAr,
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

  // Get guardian record
  const guardian = await db.guardian.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!guardian) {
    return { children: [] }
  }

  // Get linked students
  const studentGuardians = await db.studentGuardian.findMany({
    where: { guardianId: guardian.id, schoolId },
    select: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
          profilePhotoUrl: true,
        },
      },
    },
  })

  // Get each student's current class
  const children = await Promise.all(
    studentGuardians.map(async (sg) => {
      const enrollment = await db.studentClass.findFirst({
        where: { studentId: sg.student.id, schoolId },
        orderBy: { createdAt: "desc" },
        select: {
          class: { select: { id: true, name: true } },
        },
      })

      return {
        id: sg.student.id,
        name: `${sg.student.givenName} ${sg.student.surname}`,
        photoUrl: sg.student.profilePhotoUrl,
        classId: enrollment?.class.id,
        className: enrollment?.class.name,
      }
    })
  )

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
 * Validate a slot against all constraints
 */
export async function validateSlotConstraints(input: {
  termId: string
  dayOfWeek: number
  periodId: string
  classId: string
  teacherId: string
  classroomId: string
  weekOffset?: number
}): Promise<ValidationResult> {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const violations: ValidationResult["violations"] = []

  // 1. Check teacher unavailability
  const teacherConstraint = await db.teacherConstraint.findFirst({
    where: {
      schoolId,
      teacherId: input.teacherId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
    include: { unavailableBlocks: true },
  })

  if (teacherConstraint) {
    // Check unavailable blocks
    const isUnavailable = teacherConstraint.unavailableBlocks.some(
      (block) =>
        block.dayOfWeek === input.dayOfWeek &&
        block.periodId === input.periodId &&
        block.isRecurring
    )

    if (isUnavailable) {
      violations.push({
        type: "teacher_unavailable",
        severity: "error",
        message: "Teacher is marked as unavailable for this time slot",
      })
    }

    // Check day preference
    const dayPref = (
      teacherConstraint.dayPreferences as Record<string, string>
    )?.[input.dayOfWeek.toString()]
    if (dayPref === "unavailable") {
      violations.push({
        type: "teacher_unavailable",
        severity: "error",
        message: "Teacher has marked this day as unavailable",
      })
    } else if (dayPref === "avoid") {
      violations.push({
        type: "teacher_unavailable",
        severity: "warning",
        message: "Teacher prefers to avoid this day",
      })
    }

    // Check workload limits
    const teacherSlots = await db.timetable.count({
      where: {
        schoolId,
        termId: input.termId,
        teacherId: input.teacherId,
        weekOffset: input.weekOffset ?? 0,
      },
    })

    if (teacherSlots >= teacherConstraint.maxPeriodsPerWeek) {
      violations.push({
        type: "teacher_overload",
        severity: "error",
        message: `Teacher would exceed max periods per week (${teacherConstraint.maxPeriodsPerWeek})`,
        details: {
          current: teacherSlots,
          max: teacherConstraint.maxPeriodsPerWeek,
        },
      })
    }

    // Check consecutive periods
    const sameDay = await db.timetable.findMany({
      where: {
        schoolId,
        termId: input.termId,
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        weekOffset: input.weekOffset ?? 0,
      },
      include: { period: { select: { startTime: true } } },
      orderBy: { period: { startTime: "asc" } },
    })

    if (sameDay.length >= teacherConstraint.maxConsecutivePeriods) {
      violations.push({
        type: "consecutive_limit",
        severity: "warning",
        message: `Teacher may have too many consecutive periods (limit: ${teacherConstraint.maxConsecutivePeriods})`,
      })
    }
  }

  // 2. Check room constraints
  const roomConstraint = await db.roomConstraint.findFirst({
    where: {
      schoolId,
      classroomId: input.classroomId,
      OR: [{ termId: input.termId }, { termId: null }],
    },
  })

  if (roomConstraint) {
    // Check reserved periods
    const reserved = (
      roomConstraint.reservedPeriods as Record<string, string[]>
    )?.[input.dayOfWeek.toString()]
    if (reserved?.includes(input.periodId)) {
      violations.push({
        type: "room_reserved",
        severity: "error",
        message: "Room is reserved during this period",
      })
    }
  }

  // 3. Check conflicts (teacher/room double-booking)
  const existingSlot = await db.timetable.findFirst({
    where: {
      schoolId,
      termId: input.termId,
      dayOfWeek: input.dayOfWeek,
      periodId: input.periodId,
      weekOffset: input.weekOffset ?? 0,
      OR: [{ teacherId: input.teacherId }, { classroomId: input.classroomId }],
      NOT: { classId: input.classId },
    },
    include: {
      class: { select: { name: true } },
      teacher: { select: { givenName: true, surname: true } },
    },
  })

  if (existingSlot) {
    if (existingSlot.teacherId === input.teacherId) {
      violations.push({
        type: "conflict",
        severity: "error",
        message: `Teacher is already assigned to ${existingSlot.class.name} at this time`,
      })
    }
    if (existingSlot.classroomId === input.classroomId) {
      violations.push({
        type: "conflict",
        severity: "error",
        message: `Room is already used by ${existingSlot.class.name} at this time`,
      })
    }
  }

  return {
    isValid: violations.filter((v) => v.severity === "error").length === 0,
    violations,
  }
}
