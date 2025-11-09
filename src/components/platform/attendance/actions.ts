"use server";

import { z } from 'zod'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getTenantContext } from '@/lib/tenant-context'
import { revalidatePath } from 'next/cache'
import { markAttendanceSchema } from '@/components/platform/attendance/validation'

export async function markAttendance(input: z.infer<typeof markAttendanceSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = markAttendanceSchema.parse(input)
  const statusMap: Record<'present' | 'absent' | 'late', 'PRESENT' | 'ABSENT' | 'LATE'> = {
    present: 'PRESENT',
    absent: 'ABSENT',
    late: 'LATE',
  }
  for (const rec of parsed.records) {
    await db.attendance.upsert({
      where: { schoolId_studentId_classId_date: { schoolId, studentId: rec.studentId, classId: parsed.classId, date: new Date(parsed.date) } },
      create: { schoolId, studentId: rec.studentId, classId: parsed.classId, date: new Date(parsed.date), status: statusMap[rec.status] },
      update: { status: statusMap[rec.status] },
    })
  }
  revalidatePath('/lab/attendance')
  return { success: true as const }
}

// List class roster with current attendance marks for a given date
export async function getAttendanceList(input: { classId: string; date: string }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')
  const parsed = z.object({ classId: z.string().min(1), date: z.string().min(1) }).parse(input)

  const [enrollments, marks] = await Promise.all([
    db.studentClass.findMany({
      where: { schoolId, classId: parsed.classId },
      include: { student: { select: { id: true, givenName: true, surname: true } } },
    }),
    db.attendance.findMany({
      where: { schoolId, classId: parsed.classId, date: new Date(parsed.date) }
    }),
  ])

  const statusByStudent: Record<string, string> = Object.fromEntries(
    marks.map((m) => [m.studentId, String(m.status).toLowerCase()])
  )

  const rows = enrollments.map((e) => ({
    studentId: e.studentId,
    name: [e.student?.givenName, e.student?.surname].filter(Boolean).join(' '),
    status: (statusByStudent[e.studentId] as 'present' | 'absent' | 'late') || 'present',
  }))

  return { rows }
}

// List minimal classes for selector
export async function getClassesForSelection() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const classes = await db.class.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true }
  })

  return { classes }
}

// Build CSV for attendance reports
export async function getAttendanceReportCsv(input: { classId?: string; studentId?: string; status?: string; from?: string; to?: string; limit?: number }) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error('Missing school context')

  const schema = z.object({
    classId: z.string().optional(),
    studentId: z.string().optional(),
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().positive().max(5000).default(1000).optional(),
  })
  const sp = schema.parse(input ?? {})

  const where: Prisma.AttendanceWhereInput = { schoolId }
  if (sp.classId) where.classId = sp.classId
  if (sp.studentId) where.studentId = sp.studentId
  if (sp.status) where.status = sp.status.toUpperCase() as Prisma.AttendanceWhereInput['status']
  if (sp.from || sp.to) {
    where.date = {}
    if (sp.from) where.date.gte = new Date(sp.from)
    if (sp.to) where.date.lte = new Date(sp.to)
  }

  const rows = await db.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    take: sp.limit ?? 1000,
    select: { date: true, studentId: true, classId: true, status: true }
  })

  const header = 'date,studentId,classId,status\n'
  const body = rows
    .map((r) => [
      new Date(r.date).toISOString().slice(0, 10),
      r.studentId,
      r.classId,
      String(r.status),
    ].join(','))
    .join('\n')

  return header + body
}


