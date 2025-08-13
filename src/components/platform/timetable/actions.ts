"use server";

import { db } from '@/lib/db'
import { getTenantContext } from '@/components/platform/operator/lib/tenant'

type Conflict = {
  type: 'TEACHER' | 'ROOM'
  classA: { id: string; name: string }
  classB: { id: string; name: string }
  teacher?: { id: string; name: string } | null
  room?: { id: string; name: string } | null
}

export async function detectTimetableConflicts(input?: { termId?: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  // If new Timetable model exists, perform slot-based conflict checks first
  if ((db as any).timetable) {
    const where: any = { schoolId }
    if (input?.termId) where.termId = input.termId

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
  if (input?.termId) where.termId = input.termId

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
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  if (!(db as any).term) return { terms: [] as Array<{ id: string; label: string }> }
  const rows = await (db as any).term.findMany({ where: { schoolId }, orderBy: { startDate: 'desc' }, select: { id: true, termNumber: true } })
  return { terms: rows.map((t: any) => ({ id: t.id, label: `Term ${t.termNumber}` })) }
}

export async function getClassesForSelection(input: { termId: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  if ((db as any).timetable) {
    const rows = await (db as any).timetable.findMany({
      where: { schoolId, termId: input.termId },
      select: { class: { select: { id: true, name: true } } },
      distinct: ['classId'],
    })
    return { classes: rows.map((r: any) => ({ id: r.class.id, label: r.class.name })) }
  }
  // Fallback: list classes by term
  if ((db as any).class) {
    const rows = await (db as any).class.findMany({ where: { schoolId, termId: input.termId }, select: { id: true, name: true } })
    return { classes: rows.map((c: any) => ({ id: c.id, label: c.name })) }
  }
  return { classes: [] as Array<{ id: string, label: string }> }
}

export async function getTeachersForSelection(input: { termId: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  if ((db as any).timetable) {
    const rows = await (db as any).timetable.findMany({
      where: { schoolId, termId: input.termId },
      select: { teacher: { select: { id: true, givenName: true, surname: true } } },
      distinct: ['teacherId'],
    })
    return { teachers: rows.map((r: any) => ({ id: r.teacher.id, label: [r.teacher.givenName, r.teacher.surname].filter(Boolean).join(' ') })) }
  }
  if ((db as any).teacher) {
    const rows = await (db as any).teacher.findMany({ where: { schoolId }, select: { id: true, givenName: true, surname: true } })
    return { teachers: rows.map((t: any) => ({ id: t.id, label: [t.givenName, t.surname].filter(Boolean).join(' ') })) }
  }
  return { teachers: [] as Array<{ id: string, label: string }> }
}

export async function upsertTimetableSlot(input: {
  termId: string
  dayOfWeek: number
  periodId: string
  classId: string
  teacherId: string
  classroomId: string
  weekOffset?: 0 | 1
}) {
  const { schoolId, role } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  if (!role || (role !== 'ADMIN' && role !== 'DEVELOPER')) {
    return new Response('Forbidden', { status: 403 })
  }
  const data = {
    schoolId,
    termId: input.termId,
    dayOfWeek: input.dayOfWeek,
    periodId: input.periodId,
    classId: input.classId,
    teacherId: input.teacherId,
    classroomId: input.classroomId,
    weekOffset: input.weekOffset ?? 0,
  }
  // Upsert by unique composite (class at day/period)
  const row = await (db as any).timetable.upsert({
    where: {
      schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
        schoolId,
        termId: input.termId,
        dayOfWeek: input.dayOfWeek,
        periodId: input.periodId,
        classId: input.classId,
        weekOffset: input.weekOffset ?? 0,
      }
    },
    update: {
      teacherId: input.teacherId,
      classroomId: input.classroomId,
    },
    create: data,
  })
  return { id: row.id }
}

export async function upsertSchoolWeekConfig(input: {
  termId?: string | null
  workingDays: number[]
  defaultLunchAfterPeriod?: number | null
}) {
  const { schoolId, role } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  if (!role || (role !== 'ADMIN' && role !== 'DEVELOPER')) {
    return new Response('Forbidden', { status: 403 })
  }
  const row = await (db as any).schoolWeekConfig.upsert({
    where: { schoolId_termId: { schoolId, termId: input.termId ?? null } },
    update: { workingDays: input.workingDays, defaultLunchAfterPeriod: input.defaultLunchAfterPeriod ?? null },
    create: { schoolId, termId: input.termId ?? null, workingDays: input.workingDays, defaultLunchAfterPeriod: input.defaultLunchAfterPeriod ?? null },
  })
  return { id: row.id }
}

export async function suggestFreeSlots(input: { termId: string; teacherId?: string; classroomId?: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  if (!input.teacherId && !input.classroomId) return { suggestions: [] as Array<{ dayOfWeek: number; periodId: string; periodName: string }> }

  const { config } = await getScheduleConfig({ termId: input.termId })
  const term = await (db as any).term.findFirst({ where: { id: input.termId, schoolId }, select: { yearId: true } })
  if (!term) return { suggestions: [] }
  const periods = await (db as any).period.findMany({ where: { schoolId, yearId: term.yearId }, orderBy: { startTime: 'asc' }, select: { id: true, name: true } })

  const where: any = { schoolId, termId: input.termId }
  if (input.teacherId) where.teacherId = input.teacherId
  if (input.classroomId) where.classroomId = input.classroomId
  const occupied = await (db as any).timetable.findMany({ where, select: { dayOfWeek: true, periodId: true } })
  const occupiedSet = new Set(occupied.map((o: any) => `${o.dayOfWeek}:${o.periodId}`))

  const suggestions: Array<{ dayOfWeek: number; periodId: string; periodName: string }> = []
  for (const d of config.workingDays) {
    for (const p of periods) {
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

export async function getScheduleConfig(input: { termId: string }): Promise<{ config: ScheduleConfig }>{
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  // Try per-term config then school default
  const cfg = await (db as any).schoolWeekConfig?.findFirst({
    where: { schoolId, OR: [{ termId: input.termId }, { termId: null }] },
    orderBy: { termId: 'desc' },
    select: { workingDays: true, defaultLunchAfterPeriod: true },
  })

  const workingDays: number[] = Array.isArray(cfg?.workingDays) && cfg!.workingDays.length > 0
    ? cfg!.workingDays
    : [0,1,2,3,4] // Default Sun–Thu
  const defaultLunchAfterPeriod = cfg?.defaultLunchAfterPeriod ?? null

  return { config: { workingDays, defaultLunchAfterPeriod } }
}

type GetWeeklyTimetableInput = {
  termId: string
  weekOffset?: 0 | 1
  view?: { classId?: string; teacherId?: string }
}

type TimetableCell = {
  period: number
  subject: string
  teacher: string
  replaced: boolean
  original: { period: number; subject: string; teacher: string } | null
}

export async function getWeeklyTimetable(input: GetWeeklyTimetableInput): Promise<{
  days: number[]
  day_time: string[]
  timetable: TimetableCell[][]
  update_date: string
  lunchAfterPeriod: number | null
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const weekOffset = input.weekOffset ?? 0

  // Resolve schedule config (days + lunch rules)
  const { config } = await getScheduleConfig({ termId: input.termId })
  const days = config.workingDays

  // Determine yearId to fetch periods
  const term = await (db as any).term.findFirst({ where: { id: input.termId, schoolId }, select: { yearId: true } })
  if (!term) throw new Error('Invalid term')

  const periods = await (db as any).period.findMany({
    where: { schoolId, yearId: term.yearId },
    orderBy: { startTime: 'asc' },
    select: { id: true, name: true, startTime: true, endTime: true },
  })

  const day_time = periods.map((p: any, idx: number) => `${idx + 1}(${formatTimeRange(new Date(p.startTime as Date), new Date(p.endTime as Date))})`)

  // Build timetable grid for selected view
  const whereBase: any = { schoolId, termId: input.termId, weekOffset }
  if (input.view?.classId) whereBase.classId = input.view.classId
  if (input.view?.teacherId) whereBase.teacherId = input.view.teacherId

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


