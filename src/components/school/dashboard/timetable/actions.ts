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


