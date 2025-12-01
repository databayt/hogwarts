"use server";

import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { auth } from '@/auth'
import {
  detectTimetableConflictsSchema,
  getWeeklyTimetableSchema,
  getScheduleConfigSchema,
  getClassesForSelectionSchema,
  getTeachersForSelectionSchema,
  upsertTimetableSlotSchema,
  upsertSchoolWeekConfigSchema,
  suggestFreeSlotsSchema,
  type GetWeeklyTimetableInput as GetWeeklyTimetableValidated
} from './validation'
import {
  requirePermission,
  requireAdminAccess,
  requireReadAccess,
  logTimetableAction,
  filterTimetableByRole,
  getPermissionContext
} from './permissions'

type Conflict = {
  type: 'TEACHER' | 'ROOM'
  classA: { id: string; name: string }
  classB: { id: string; name: string }
  teacher?: { id: string; name: string } | null
  room?: { id: string; name: string } | null
}

export async function detectTimetableConflicts(input?: unknown) {
  // Validate input
  const validatedInput = detectTimetableConflictsSchema.parse(input)

  // Check permissions - only admins can detect conflicts
  await requirePermission('manage_conflicts')

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  // Log action for audit trail
  await logTimetableAction('manage_conflicts', {
    entityType: 'conflict',
    metadata: { termId: validatedInput?.termId }
  })

  // If new Timetable model exists, perform slot-based conflict checks first
  if ((db as any).timetable) {
    const where: any = { schoolId }
    if (validatedInput?.termId) where.termId = validatedInput.termId

    const slots = await (db as any).timetable.findMany({
      where,
      select: { dayOfWeek: true, periodId: true, classId: true, teacherId: true, classroomId: true,
        class: { select: { id: true, name: true } },
        teacher: { select: { givenName: true, surname: true } },
        classroom: { select: { roomName: true } },
      }
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
      const byTeacher = new Map<string, typeof group[number]>()
      for (const s of group) {
        if (s.teacherId) {
          if (byTeacher.has(s.teacherId)) {
            const a = byTeacher.get(s.teacherId)!
            const b = s
            conflicts.push({
              type: 'TEACHER',
              classA: { id: a.class.id, name: a.class.name },
              classB: { id: b.class.id, name: b.class.name },
              teacher: { id: s.teacherId, name: [b.teacher?.givenName, b.teacher?.surname].filter(Boolean).join(' ') },
              room: null,
            })
          } else {
            byTeacher.set(s.teacherId, s)
          }
        }
      }
      // Room conflicts
      const byRoom = new Map<string, typeof group[number]>()
      for (const s of group) {
        if (s.classroomId) {
          if (byRoom.has(s.classroomId)) {
            const a = byRoom.get(s.classroomId)!
            const b = s
            conflicts.push({
              type: 'ROOM',
              classA: { id: a.class.id, name: a.class.name },
              classB: { id: b.class.id, name: b.class.name },
              teacher: null,
              room: { id: s.classroomId, name: b.classroom?.roomName ?? s.classroomId },
            })
          } else {
            byRoom.set(s.classroomId, s)
          }
        }
      }
    }
    return { conflicts }
  }

  if (!(db as any).class || !(db as any).period) return { conflicts: [] as Conflict[] }

  const where: { schoolId: string; termId?: string } = { schoolId }
  if (validatedInput?.termId) where.termId = validatedInput.termId

  const classes = await (db as any).class.findMany({
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

  type Row = typeof classes[number]
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
          type: 'TEACHER',
          classA: { id: a.id, name: a.name },
          classB: { id: b.id, name: b.name },
          teacher: { id: a.teacherId, name: [a.teacher?.givenName, a.teacher?.surname].filter(Boolean).join(' ') },
          room: null,
        })
      }
      if (a.classroomId && b.classroomId && a.classroomId === b.classroomId) {
        conflicts.push({
          type: 'ROOM',
          classA: { id: a.id, name: a.name },
          classB: { id: b.id, name: b.name },
          teacher: null,
          room: { id: a.classroomId, name: a.classroom?.roomName ?? a.classroomId },
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
  if (!schoolId) throw new Error('Missing school context')

  if (!(db as any).term) return { terms: [] as Array<{ id: string; label: string }> }

  const rows = await (db as any).term.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' },
    select: { id: true, termNumber: true }
  })

  return { terms: rows.map((t: any) => ({ id: t.id, label: `Term ${t.termNumber}` })) }
}

export async function getClassesForSelection(input: unknown) {
  // Validate input
  const validatedInput = getClassesForSelectionSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  if ((db as any).timetable && validatedInput?.termId) {
    const rows = await (db as any).timetable.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: { class: { select: { id: true, name: true } } },
      distinct: ['classId'],
    })
    return { classes: rows.map((r: any) => ({ id: r.class.id, label: r.class.name })) }
  }

  // Fallback: list classes by term
  if ((db as any).class && validatedInput?.termId) {
    const rows = await (db as any).class.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: { id: true, name: true }
    })
    return { classes: rows.map((c: any) => ({ id: c.id, label: c.name })) }
  }

  return { classes: [] as Array<{ id: string, label: string }> }
}

export async function getTeachersForSelection(input: unknown) {
  // Validate input
  const validatedInput = getTeachersForSelectionSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  if ((db as any).timetable && validatedInput?.termId) {
    const rows = await (db as any).timetable.findMany({
      where: { schoolId, termId: validatedInput.termId },
      select: { teacher: { select: { id: true, givenName: true, surname: true } } },
      distinct: ['teacherId'],
    })
    return {
      teachers: rows.map((r: any) => ({
        id: r.teacher.id,
        label: [r.teacher.givenName, r.teacher.surname].filter(Boolean).join(' ')
      }))
    }
  }

  if ((db as any).teacher) {
    const rows = await (db as any).teacher.findMany({
      where: { schoolId },
      select: { id: true, givenName: true, surname: true }
    })
    return {
      teachers: rows.map((t: any) => ({
        id: t.id,
        label: [t.givenName, t.surname].filter(Boolean).join(' ')
      }))
    }
  }

  return { teachers: [] as Array<{ id: string, label: string }> }
}

export async function upsertTimetableSlot(input: unknown) {
  // Validate input
  const validatedInput = upsertTimetableSlotSchema.parse(input)

  // Admin access required
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
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
  const row = await (db as any).timetable.upsert({
    where: {
      schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
        schoolId,
        termId: validatedInput.termId,
        dayOfWeek: validatedInput.dayOfWeek,
        periodId: validatedInput.periodId,
        classId: validatedInput.classId,
        weekOffset: validatedInput.weekOffset,
      }
    },
    update: {
      teacherId: validatedInput.teacherId,
      classroomId: validatedInput.classroomId,
    },
    create: data,
  })

  // Log action for audit trail
  await logTimetableAction('edit', {
    entityType: 'slot',
    entityId: row.id,
    changes: data
  })

  return { id: row.id }
}

export async function upsertSchoolWeekConfig(input: unknown) {
  // Validate input
  const validatedInput = upsertSchoolWeekConfigSchema.parse(input)

  // Admin access required
  await requireAdminAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const row = await (db as any).schoolWeekConfig.upsert({
    where: {
      schoolId_termId: {
        schoolId,
        termId: validatedInput.termId ?? null
      }
    },
    update: {
      workingDays: validatedInput.workingDays,
      defaultLunchAfterPeriod: validatedInput.defaultLunchAfterPeriod ?? null
    },
    create: {
      schoolId,
      termId: validatedInput.termId ?? null,
      workingDays: validatedInput.workingDays,
      defaultLunchAfterPeriod: validatedInput.defaultLunchAfterPeriod ?? null
    },
  })

  // Log action for audit trail
  await logTimetableAction('configure_settings', {
    entityType: 'config',
    entityId: row.id,
    changes: validatedInput
  })

  return { id: row.id }
}

export async function suggestFreeSlots(input: unknown) {
  // Validate input
  const validatedInput = suggestFreeSlotsSchema.parse(input)

  // Admin access required for suggestions
  await requirePermission('edit')

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  if (!validatedInput.teacherId && !validatedInput.classId) {
    return { suggestions: [] as Array<{ dayOfWeek: number; periodId: string; periodName: string }> }
  }

  const { config } = await getScheduleConfig({ termId: validatedInput.termId })

  const term = await (db as any).term.findFirst({
    where: { id: validatedInput.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) return { suggestions: [] }

  const periods = await (db as any).period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true }
  })

  const where: any = { schoolId, termId: validatedInput.termId }
  if (validatedInput.teacherId) where.teacherId = validatedInput.teacherId
  if (validatedInput.classId) where.classId = validatedInput.classId

  const occupied = await (db as any).timetable.findMany({
    where,
    select: { dayOfWeek: true, periodId: true }
  })

  const occupiedSet = new Set(occupied.map((o: any) => `${o.dayOfWeek}:${o.periodId}`))

  const suggestions: Array<{ dayOfWeek: number; periodId: string; periodName: string }> = []

  // Use preferred days if provided, otherwise use all working days
  const daysToCheck = validatedInput.preferredDays || config.workingDays

  for (const d of daysToCheck) {
    for (const p of periods) {
      // Skip if preferred periods are specified and this isn't one
      if (validatedInput.preferredPeriods &&
          !validatedInput.preferredPeriods.includes(p.id)) {
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
  const pad = (n: number) => n.toString().padStart(2, '0')
  const sH = start.getUTCHours()
  const sM = start.getUTCMinutes()
  const eH = end.getUTCHours()
  const eM = end.getUTCMinutes()
  return `${pad(sH)}:${pad(sM)}~${pad(eH)}:${pad(eM)}`
}

export async function getScheduleConfig(input: unknown): Promise<{ config: ScheduleConfig }>{
  // Validate input
  const validatedInput = getScheduleConfigSchema.parse(input)

  // Read access required
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  // Try per-term config then school default
  const cfg = await (db as any).schoolWeekConfig?.findFirst({
    where: { schoolId, OR: [{ termId: validatedInput?.termId }, { termId: null }] },
    orderBy: { termId: 'desc' },
    select: { workingDays: true, defaultLunchAfterPeriod: true },
  })

  const workingDays: number[] = Array.isArray(cfg?.workingDays) && cfg!.workingDays.length > 0
    ? cfg!.workingDays
    : [0,1,2,3,4] // Default Sun–Thu
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
  if (!schoolId) throw new Error('Missing school context')

  const weekOffset = validatedInput.weekOffset ?? 0

  // Resolve schedule config (days + lunch rules)
  const { config } = await getScheduleConfig({ termId: validatedInput.termId })
  const days = config.workingDays

  // Determine yearId to fetch periods
  const term = await (db as any).term.findFirst({
    where: { id: validatedInput.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) throw new Error('Invalid term')

  const periods = await (db as any).period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const day_time = periods.map((p: any, idx: number) =>
    `${idx + 1}(${formatTimeRange(new Date(p.startTime as Date), new Date(p.endTime as Date))})`
  )

  // Build timetable grid for selected view
  const whereBase: any = { schoolId, termId: validatedInput.termId, weekOffset }

  // Apply role-based filtering
  if (role === 'TEACHER') {
    // Teacher can only view their own timetable
    const session = await auth()
    const teacherId = session?.user?.id // Assuming user ID maps to teacher ID
    if (teacherId) {
      whereBase.teacherId = teacherId
    }
  } else if (role === 'STUDENT') {
    // Student can only view their class timetable
    const session = await auth()
    const studentId = session?.user?.id
    if (studentId) {
      // Get student's class
      const student = await (db as any).student?.findFirst({
        where: { id: studentId, schoolId },
        select: { classId: true }
      })
      if (student?.classId) {
        whereBase.classId = student.classId
      }
    }
  } else {
    // Admin/Developer can specify view filters
    if (validatedInput.view?.classId) whereBase.classId = validatedInput.view.classId
    if (validatedInput.view?.teacherId) whereBase.teacherId = validatedInput.view.teacherId
  }

  const rows = await (db as any).timetable.findMany({
    where: whereBase,
    select: {
      dayOfWeek: true,
      periodId: true,
      class: { select: { id: true, name: true, subject: { select: { subjectName: true } }, teacher: { select: { givenName: true, surname: true } } } },
      teacher: { select: { givenName: true, surname: true } },
    },
  })

  // Map rows by (day, period) for quick lookup
  const byKey = new Map<string, typeof rows[number]>
  for (const r of rows) {
    byKey.set(`${r.dayOfWeek}:${r.periodId}`, r)
  }

  const timetable: TimetableCell[][] = days.map((day) => {
    return periods.map((p: any, idx: number) => {
      const key = `${day}:${p.id}`
      const row = byKey.get(key)
      if (!row) {
        return { period: idx + 1, subject: '', teacher: '', replaced: false, original: null }
      }
      const teacherName = [row.teacher?.givenName, row.teacher?.surname].filter(Boolean).join(' ') ||
        [row.class?.teacher?.givenName, row.class?.teacher?.surname].filter(Boolean).join(' ')
      const subjectName = row.class?.subject?.subjectName ?? row.class?.name ?? ''
      return { period: idx + 1, subject: subjectName, teacher: teacherName, replaced: false, original: null }
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
  if (!schoolId) throw new Error('Missing school context')

  const rows = await db.classroom.findMany({
    where: { schoolId },
    orderBy: { roomName: 'asc' },
    select: { id: true, roomName: true, capacity: true }
  })

  return {
    rooms: rows.map((r) => ({
      id: r.id,
      label: r.roomName,
      capacity: r.capacity
    }))
  }
}

/**
 * Get timetable filtered by a specific class
 */
export async function getTimetableByClass(input: { termId: string; classId: string; weekOffset?: 0 | 1 }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) throw new Error('Invalid term')

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true, startTime: true, endTime: true }
  })

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      classId: input.classId,
      weekOffset: input.weekOffset ?? 0
    },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true } },
      class: { select: { id: true, name: true, subject: { select: { subjectName: true } } } },
      period: { select: { id: true, name: true, startTime: true, endTime: true } }
    }
  })

  const classInfo = await db.class.findFirst({
    where: { id: input.classId, schoolId },
    select: { id: true, name: true, subject: { select: { subjectName: true } } }
  })

  return {
    classInfo: classInfo ? {
      id: classInfo.id,
      name: classInfo.name,
      subject: classInfo.subject?.subjectName
    } : null,
    workingDays: config.workingDays,
    periods: periods.map(p => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime
    })),
    slots: slots.map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      teacher: s.teacher ? `${s.teacher.givenName} ${s.teacher.surname}` : '',
      teacherId: s.teacherId,
      room: s.classroom?.roomName || '',
      roomId: s.classroomId,
      subject: s.class?.subject?.subjectName || s.class?.name || ''
    })),
    lunchAfterPeriod: config.defaultLunchAfterPeriod
  }
}

/**
 * Get timetable filtered by a specific teacher
 */
export async function getTimetableByTeacher(input: { termId: string; teacherId: string; weekOffset?: 0 | 1 }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) throw new Error('Invalid term')

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true, startTime: true, endTime: true }
  })

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      teacherId: input.teacherId,
      weekOffset: input.weekOffset ?? 0
    },
    include: {
      class: { select: { id: true, name: true, subject: { select: { subjectName: true } } } },
      classroom: { select: { id: true, roomName: true } },
      period: { select: { id: true, name: true, startTime: true, endTime: true } }
    }
  })

  const teacherInfo = await db.teacher.findFirst({
    where: { id: input.teacherId, schoolId },
    select: { id: true, givenName: true, surname: true, emailAddress: true }
  })

  // Calculate workload
  const uniqueDays = new Set(slots.map(s => s.dayOfWeek))
  const totalPeriods = slots.length

  return {
    teacherInfo: teacherInfo ? {
      id: teacherInfo.id,
      name: `${teacherInfo.givenName} ${teacherInfo.surname}`,
      email: teacherInfo.emailAddress
    } : null,
    workingDays: config.workingDays,
    periods: periods.map(p => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime
    })),
    slots: slots.map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      className: s.class?.name || '',
      classId: s.classId,
      room: s.classroom?.roomName || '',
      roomId: s.classroomId,
      subject: s.class?.subject?.subjectName || s.class?.name || ''
    })),
    workload: {
      daysPerWeek: uniqueDays.size,
      periodsPerWeek: totalPeriods,
      classesTeaching: [...new Set(slots.map(s => s.classId))].length
    },
    lunchAfterPeriod: config.defaultLunchAfterPeriod
  }
}

/**
 * Get timetable filtered by a specific room
 */
export async function getTimetableByRoom(input: { termId: string; roomId: string; weekOffset?: 0 | 1 }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) throw new Error('Invalid term')

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true, startTime: true, endTime: true }
  })

  const slots = await db.timetable.findMany({
    where: {
      schoolId,
      termId: input.termId,
      classroomId: input.roomId,
      weekOffset: input.weekOffset ?? 0
    },
    include: {
      class: { select: { id: true, name: true, subject: { select: { subjectName: true } } } },
      teacher: { select: { id: true, givenName: true, surname: true } },
      period: { select: { id: true, name: true, startTime: true, endTime: true } }
    }
  })

  const roomInfo = await db.classroom.findFirst({
    where: { id: input.roomId, schoolId },
    select: { id: true, roomName: true, capacity: true }
  })

  // Calculate utilization
  const totalPossibleSlots = config.workingDays.length * periods.filter(p => !p.name.includes('Break') && !p.name.includes('Lunch')).length
  const utilizationRate = totalPossibleSlots > 0 ? (slots.length / totalPossibleSlots) * 100 : 0

  return {
    roomInfo: roomInfo ? {
      id: roomInfo.id,
      name: roomInfo.roomName,
      capacity: roomInfo.capacity
    } : null,
    workingDays: config.workingDays,
    periods: periods.map(p => ({
      id: p.id,
      name: p.name,
      startTime: p.startTime,
      endTime: p.endTime
    })),
    slots: slots.map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      periodId: s.periodId,
      periodName: s.period.name,
      className: s.class?.name || '',
      classId: s.classId,
      teacher: s.teacher ? `${s.teacher.givenName} ${s.teacher.surname}` : '',
      teacherId: s.teacherId,
      subject: s.class?.subject?.subjectName || s.class?.name || ''
    })),
    utilization: {
      usedSlots: slots.length,
      totalSlots: totalPossibleSlots,
      rate: Math.round(utilizationRate)
    },
    lunchAfterPeriod: config.defaultLunchAfterPeriod
  }
}

/**
 * Get timetable analytics data
 */
export async function getTimetableAnalytics(input: { termId: string }) {
  await requirePermission('view_analytics')

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const { config } = await getScheduleConfig({ termId: input.termId })

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) throw new Error('Invalid term')

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' }
  })

  const slots = await db.timetable.findMany({
    where: { schoolId, termId: input.termId, weekOffset: 0 },
    include: {
      teacher: { select: { id: true, givenName: true, surname: true } },
      classroom: { select: { id: true, roomName: true, capacity: true } },
      class: { select: { id: true, name: true, subject: { select: { subjectName: true } } } }
    }
  })

  // Teacher workload analysis
  const teacherWorkload = new Map<string, { name: string; periods: number; classes: Set<string>; subjects: Set<string> }>()
  for (const slot of slots) {
    if (slot.teacher) {
      const key = slot.teacherId
      const existing = teacherWorkload.get(key) || {
        name: `${slot.teacher.givenName} ${slot.teacher.surname}`,
        periods: 0,
        classes: new Set(),
        subjects: new Set()
      }
      existing.periods++
      existing.classes.add(slot.classId)
      if (slot.class?.subject?.subjectName) existing.subjects.add(slot.class.subject.subjectName)
      teacherWorkload.set(key, existing)
    }
  }

  // Room utilization analysis
  const rooms = await db.classroom.findMany({
    where: { schoolId },
    select: { id: true, roomName: true, capacity: true }
  })

  const teachingPeriods = periods.filter(p => !p.name.includes('Break') && !p.name.includes('Lunch'))
  const maxSlotsPerRoom = config.workingDays.length * teachingPeriods.length

  const roomUtilization = rooms.map(room => {
    const roomSlots = slots.filter(s => s.classroomId === room.id)
    return {
      id: room.id,
      name: room.roomName,
      capacity: room.capacity,
      usedSlots: roomSlots.length,
      totalSlots: maxSlotsPerRoom,
      utilizationRate: maxSlotsPerRoom > 0 ? Math.round((roomSlots.length / maxSlotsPerRoom) * 100) : 0
    }
  })

  // Subject distribution
  const subjectDist = new Map<string, { name: string; periods: number; classes: Set<string> }>()
  for (const slot of slots) {
    const subject = slot.class?.subject?.subjectName || slot.class?.name || 'Unknown'
    const existing = subjectDist.get(subject) || { name: subject, periods: 0, classes: new Set() }
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
      totalClasses: [...new Set(slots.map(s => s.classId))].length,
      conflictCount: conflicts.length
    },
    teacherWorkload: Array.from(teacherWorkload.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      periodsPerWeek: data.periods,
      classesCount: data.classes.size,
      subjects: Array.from(data.subjects)
    })).sort((a, b) => b.periodsPerWeek - a.periodsPerWeek),
    roomUtilization: roomUtilization.sort((a, b) => b.utilizationRate - a.utilizationRate),
    subjectDistribution: Array.from(subjectDist.entries()).map(([name, data]) => ({
      name,
      periodsPerWeek: data.periods,
      classesCount: data.classes.size
    })).sort((a, b) => b.periodsPerWeek - a.periodsPerWeek),
    conflicts
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
  if (!schoolId) throw new Error('Missing school context')

  await db.timetable.delete({
    where: {
      schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
        schoolId,
        termId: input.termId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
        classId: input.classId,
        weekOffset: input.weekOffset
      }
    }
  })

  await logTimetableAction('delete', {
    entityType: 'slot',
    metadata: input
  })

  return { success: true }
}

/**
 * Get all periods for the current term
 */
export async function getPeriodsForTerm(input: { termId: string }) {
  await requireReadAccess()

  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const term = await db.term.findFirst({
    where: { id: input.termId, schoolId },
    select: { yearId: true }
  })
  if (!term) throw new Error('Invalid term')

  const periods = await db.period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true, startTime: true, endTime: true }
  })

  return {
    periods: periods.map((p, idx) => ({
      id: p.id,
      name: p.name,
      order: idx + 1,
      startTime: p.startTime,
      endTime: p.endTime,
      isBreak: p.name.toLowerCase().includes('break') || p.name.toLowerCase().includes('lunch')
    }))
  }
}
