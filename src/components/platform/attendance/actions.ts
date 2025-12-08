"use server"

import { z } from 'zod'
import { db } from '@/lib/db'
import type { Prisma, AttendanceStatus, AttendanceMethod } from '@prisma/client'
import { getTenantContext } from '@/lib/tenant-context'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { markAttendanceSchema } from '@/components/platform/attendance/validation'
import {
  manualAttendanceSchema,
  attendanceFilterSchema,
  bulkUploadSchema,
  qrCodeGenerationSchema,
  studentIdentifierSchema,
} from './shared/validation'
import { randomBytes } from 'crypto'

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================================
// CORE ATTENDANCE ACTIONS
// ============================================================================

/**
 * Mark attendance for multiple students in a class
 */
export async function markAttendance(input: z.infer<typeof markAttendanceSchema>): Promise<ActionResponse<{ count: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

    const session = await auth()
    const parsed = markAttendanceSchema.parse(input)

    const statusMap: Record<'present' | 'absent' | 'late', AttendanceStatus> = {
      present: 'PRESENT',
      absent: 'ABSENT',
      late: 'LATE',
    }

    const results = []
    for (const rec of parsed.records) {
      const result = await db.attendance.upsert({
        where: {
          schoolId_studentId_classId_date: {
            schoolId,
            studentId: rec.studentId,
            classId: parsed.classId,
            date: new Date(parsed.date)
          }
        },
        create: {
          schoolId,
          studentId: rec.studentId,
          classId: parsed.classId,
          date: new Date(parsed.date),
          status: statusMap[rec.status],
          method: 'MANUAL',
          markedBy: session?.user?.id,
          markedAt: new Date(),
          checkInTime: new Date(),
        },
        update: {
          status: statusMap[rec.status],
          markedBy: session?.user?.id,
          markedAt: new Date(),
        },
      })
      results.push(result)
    }

    revalidatePath('/attendance')
    return { success: true, data: { count: results.length } }
  } catch (error) {
    console.error('[markAttendance] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark attendance'
    }
  }
}

/**
 * Mark single attendance with full options
 */
export async function markSingleAttendance(input: {
  studentId: string
  classId: string
  date: string
  status: AttendanceStatus
  method: AttendanceMethod
  checkInTime?: string
  checkOutTime?: string
  location?: { lat: number; lon: number; accuracy?: number }
  notes?: string
  confidence?: number
  deviceId?: string
}): Promise<ActionResponse<{ attendance: unknown }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

    const session = await auth()

    const result = await db.attendance.upsert({
      where: {
        schoolId_studentId_classId_date: {
          schoolId,
          studentId: input.studentId,
          classId: input.classId,
          date: new Date(input.date)
        }
      },
      create: {
        schoolId,
        studentId: input.studentId,
        classId: input.classId,
        date: new Date(input.date),
        status: input.status,
        method: input.method,
        markedBy: session?.user?.id,
        markedAt: new Date(),
        checkInTime: input.checkInTime ? new Date(input.checkInTime) : new Date(),
        checkOutTime: input.checkOutTime ? new Date(input.checkOutTime) : undefined,
        location: input.location ? input.location : undefined,
        notes: input.notes,
        confidence: input.confidence,
        deviceId: input.deviceId,
      },
      update: {
        status: input.status,
        method: input.method,
        markedBy: session?.user?.id,
        markedAt: new Date(),
        checkOutTime: input.checkOutTime ? new Date(input.checkOutTime) : undefined,
        notes: input.notes,
      },
    })

    revalidatePath('/attendance')
    return { success: true, data: { attendance: result } }
  } catch (error) {
    console.error('[markSingleAttendance] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark single attendance'
    }
  }
}

/**
 * Get attendance list for a class on a specific date
 */
export async function getAttendanceList(input: { classId: string; date: string }): Promise<ActionResponse<{
  rows: Array<{
    studentId: string
    name: string
    status: 'present' | 'absent' | 'late'
    checkInTime?: Date
    method?: string
  }>
}>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

    const parsed = z.object({
      classId: z.string().min(1),
      date: z.string().min(1)
    }).parse(input)

    const [enrollments, marks] = await Promise.all([
      db.studentClass.findMany({
        where: { schoolId, classId: parsed.classId },
        include: {
          student: {
            select: {
              id: true,
              givenName: true,
              surname: true,
              userId: true,
            }
          }
        },
      }),
      db.attendance.findMany({
        where: {
          schoolId,
          classId: parsed.classId,
          date: new Date(parsed.date)
        }
      }),
    ])

    const statusByStudent: Record<string, { status: string; checkInTime?: Date; method?: string }> = {}
    marks.forEach((m) => {
      statusByStudent[m.studentId] = {
        status: String(m.status).toLowerCase(),
        checkInTime: m.checkInTime || undefined,
        method: m.method || undefined,
      }
    })

    const rows = enrollments.map((e) => ({
      studentId: e.studentId,
      name: [e.student?.givenName, e.student?.surname].filter(Boolean).join(' '),
      status: (statusByStudent[e.studentId]?.status as 'present' | 'absent' | 'late') || 'present',
      checkInTime: statusByStudent[e.studentId]?.checkInTime,
      method: statusByStudent[e.studentId]?.method,
    }))

    return { success: true, data: { rows } }
  } catch (error) {
    console.error('[getAttendanceList] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get attendance list'
    }
  }
}

/**
 * Get classes for selection dropdown
 */
export async function getClassesForSelection(): Promise<ActionResponse<{
  classes: Array<{
    id: string
    name: string
    teacher: string | null
  }>
}>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

    const classes = await db.class.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        teacher: {
          select: { givenName: true, surname: true }
        }
      }
    })

    return {
      success: true,
      data: {
        classes: classes.map(c => ({
          id: c.id,
          name: c.name,
          teacher: c.teacher ? `${c.teacher.givenName} ${c.teacher.surname}` : null
        }))
      }
    }
  } catch (error) {
    console.error('[getClassesForSelection] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get classes for selection'
    }
  }
}

// ============================================================================
// ATTENDANCE ANALYTICS
// ============================================================================

/**
 * Get attendance statistics for a period
 */
export async function getAttendanceStats(input?: {
  classId?: string
  dateFrom?: string
  dateTo?: string
  studentId?: string
}): Promise<{
  total: number
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  holiday: number
  attendanceRate: number
  lastUpdated: string
}> {
  const { schoolId } = await getTenantContext()

  // Return default data if no school context (e.g., during SSR or unauthenticated)
  if (!schoolId) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick: 0,
      holiday: 0,
      attendanceRate: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  const where: Prisma.AttendanceWhereInput = { schoolId }

  if (input?.classId) where.classId = input.classId
  if (input?.studentId) where.studentId = input.studentId
  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const [total, present, absent, late, excused, sick] = await Promise.all([
    db.attendance.count({ where }),
    db.attendance.count({ where: { ...where, status: 'PRESENT' } }),
    db.attendance.count({ where: { ...where, status: 'ABSENT' } }),
    db.attendance.count({ where: { ...where, status: 'LATE' } }),
    db.attendance.count({ where: { ...where, status: 'EXCUSED' } }),
    db.attendance.count({ where: { ...where, status: 'SICK' } }),
  ])

  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0

  return {
    total,
    present,
    absent,
    late,
    excused,
    sick,
    holiday: 0,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get attendance trends over time
 */
export async function getAttendanceTrends(input: {
  dateFrom: string
  dateTo: string
  classId?: string
  groupBy?: 'day' | 'week' | 'month'
}): Promise<ActionResponse<{ trends: Array<{ date: string; present: number; absent: number; late: number; total: number; rate: number }> }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    date: {
      gte: new Date(input.dateFrom),
      lte: new Date(input.dateTo),
    }
  }

  if (input.classId) where.classId = input.classId

  const attendance = await db.attendance.findMany({
    where,
    select: {
      date: true,
      status: true,
    },
    orderBy: { date: 'asc' }
  })

  // Group by date
  const byDate: Record<string, { present: number; absent: number; late: number; total: number }> = {}

  attendance.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0]
    if (!byDate[dateKey]) {
      byDate[dateKey] = { present: 0, absent: 0, late: 0, total: 0 }
    }
    byDate[dateKey].total++
    if (record.status === 'PRESENT') byDate[dateKey].present++
    else if (record.status === 'ABSENT') byDate[dateKey].absent++
    else if (record.status === 'LATE') byDate[dateKey].late++
  })

  const trends = Object.entries(byDate).map(([date, stats]) => ({
    date,
    ...stats,
    rate: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0
  }))

    return { success: true, data: { trends } }
  } catch (error) {
    console.error('[getAttendanceTrends] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get attendance trends'
    }
  }
}

/**
 * Get method usage statistics
 */
export async function getMethodUsageStats(input?: {
  dateFrom?: string
  dateTo?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const where: Prisma.AttendanceWhereInput = { schoolId }

  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const methodCounts = await db.attendance.groupBy({
    by: ['method'],
    where,
    _count: { method: true }
  })

  const total = methodCounts.reduce((sum, m) => sum + m._count.method, 0)

  const stats = methodCounts.map(m => ({
    method: m.method,
    count: m._count.method,
    percentage: total > 0 ? Math.round((m._count.method / total) * 100) : 0
  }))

  return { stats, total }
}

/**
 * Get day-wise attendance patterns
 */
export async function getDayWisePatterns(input?: {
  dateFrom?: string
  dateTo?: string
  classId?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const where: Prisma.AttendanceWhereInput = { schoolId }

  if (input?.classId) where.classId = input.classId
  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const attendance = await db.attendance.findMany({
    where,
    select: { date: true, status: true }
  })

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const byDay: Record<number, { present: number; absent: number; late: number; total: number }> = {}

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    byDay[i] = { present: 0, absent: 0, late: 0, total: 0 }
  }

  attendance.forEach(record => {
    const day = record.date.getDay()
    byDay[day].total++
    if (record.status === 'PRESENT') byDay[day].present++
    else if (record.status === 'ABSENT') byDay[day].absent++
    else if (record.status === 'LATE') byDay[day].late++
  })

  const patterns = Object.entries(byDay).map(([day, stats]) => ({
    day: dayNames[parseInt(day)],
    dayIndex: parseInt(day),
    ...stats,
    rate: stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0
  }))

  return { patterns }
}

/**
 * Get class comparison stats
 */
export async function getClassComparisonStats(input?: {
  dateFrom?: string
  dateTo?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const where: Prisma.AttendanceWhereInput = { schoolId }

  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const classes = await db.class.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      _count: { select: { studentClasses: true } }
    }
  })

  const stats = await Promise.all(
    classes.map(async (cls) => {
      const [total, present, late] = await Promise.all([
        db.attendance.count({ where: { ...where, classId: cls.id } }),
        db.attendance.count({ where: { ...where, classId: cls.id, status: 'PRESENT' } }),
        db.attendance.count({ where: { ...where, classId: cls.id, status: 'LATE' } }),
      ])

      return {
        classId: cls.id,
        className: cls.name,
        studentCount: cls._count.studentClasses,
        totalRecords: total,
        rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
      }
    })
  )

  return { stats: stats.sort((a, b) => b.rate - a.rate) }
}

/**
 * Get students at risk (below threshold)
 */
export async function getStudentsAtRisk(input?: {
  threshold?: number // default 80%
  dateFrom?: string
  dateTo?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const threshold = input?.threshold ?? 80

  const where: Prisma.AttendanceWhereInput = { schoolId }
  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  // Get all students with their attendance
  const students = await db.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      attendances: {
        where,
        select: { status: true }
      }
    }
  })

  const atRisk = students
    .map(student => {
      const total = student.attendances.length
      const present = student.attendances.filter((a: { status: string }) => a.status === 'PRESENT' || a.status === 'LATE').length
      const rate = total > 0 ? Math.round((present / total) * 100) : 100

      return {
        studentId: student.id,
        name: `${student.givenName} ${student.surname}`,
        totalDays: total,
        presentDays: present,
        absentDays: total - present,
        rate
      }
    })
    .filter(s => s.rate < threshold && s.totalDays > 0)
    .sort((a, b) => a.rate - b.rate)

  return { students: atRisk, threshold }
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

/**
 * Get recent attendance records
 */
export async function getRecentAttendance(input?: {
  limit?: number
  classId?: string
}) {
  const { schoolId } = await getTenantContext()

  // Return empty data if no school context
  if (!schoolId) {
    return { records: [] }
  }

  const limit = input?.limit ?? 50

  const where: Prisma.AttendanceWhereInput = { schoolId }
  if (input?.classId) where.classId = input.classId

  const records = await db.attendance.findMany({
    where,
    orderBy: { markedAt: 'desc' },
    take: limit,
    include: {
      student: {
        select: { givenName: true, surname: true }
      },
      class: {
        select: { name: true }
      }
    }
  })

  return {
    records: records.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: `${r.student.givenName} ${r.student.surname}`,
      classId: r.classId,
      className: r.class.name,
      date: r.date.toISOString(),
      status: r.status,
      method: r.method,
      checkInTime: r.checkInTime?.toISOString(),
      markedAt: r.markedAt.toISOString(),
      markedBy: r.markedBy,
    }))
  }
}

// ============================================================================
// QR CODE SESSION MANAGEMENT
// ============================================================================

/**
 * Generate QR code session for a class
 */
export async function generateQRSession(input: z.infer<typeof qrCodeGenerationSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const session = await auth()
  const parsed = qrCodeGenerationSchema.parse(input)

  // Generate unique code
  const code = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + parsed.validFor * 1000)

  // Invalidate previous active sessions for this class
  await db.qRCodeSession.updateMany({
    where: { schoolId, classId: parsed.classId, isActive: true },
    data: { isActive: false, invalidatedAt: new Date() }
  })

  const qrSession = await db.qRCodeSession.create({
    data: {
      schoolId,
      classId: parsed.classId,
      code,
      payload: {
        classId: parsed.classId,
        schoolId,
        includeLocation: parsed.includeLocation,
        createdAt: new Date().toISOString(),
      },
      generatedBy: session?.user?.id || 'system',
      expiresAt,
      isActive: true,
      configuration: {
        validFor: parsed.validFor,
        includeLocation: parsed.includeLocation,
      }
    }
  })

  return {
    success: true,
    sessionId: qrSession.id,
    code: qrSession.code,
    expiresAt: qrSession.expiresAt.toISOString(),
  }
}

/**
 * Validate and process QR code scan
 */
export async function processQRScan(input: {
  code: string
  studentId: string
  location?: { lat: number; lon: number; accuracy?: number }
  deviceId?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  // Find and validate session
  const qrSession = await db.qRCodeSession.findFirst({
    where: {
      schoolId,
      code: input.code,
      isActive: true,
      expiresAt: { gt: new Date() }
    }
  })

  if (!qrSession) {
    return { success: false, error: 'Invalid or expired QR code' }
  }

  // Check if student already scanned
  const scannedBy = qrSession.scannedBy as string[]
  if (scannedBy.includes(input.studentId)) {
    return { success: false, error: 'Already checked in' }
  }

  // Mark attendance
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await db.attendance.upsert({
    where: {
      schoolId_studentId_classId_date: {
        schoolId,
        studentId: input.studentId,
        classId: qrSession.classId,
        date: today
      }
    },
    create: {
      schoolId,
      studentId: input.studentId,
      classId: qrSession.classId,
      date: today,
      status: 'PRESENT',
      method: 'QR_CODE',
      checkInTime: new Date(),
      location: input.location,
      deviceId: input.deviceId,
    },
    update: {
      status: 'PRESENT',
      method: 'QR_CODE',
      checkInTime: new Date(),
      location: input.location,
    }
  })

  // Update session
  await db.qRCodeSession.update({
    where: { id: qrSession.id },
    data: {
      scanCount: { increment: 1 },
      scannedBy: [...scannedBy, input.studentId]
    }
  })

  return { success: true, message: 'Attendance marked successfully' }
}

/**
 * Get active QR sessions
 */
export async function getActiveQRSessions(classId?: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const where: Prisma.QRCodeSessionWhereInput = {
    schoolId,
    isActive: true,
    expiresAt: { gt: new Date() }
  }

  if (classId) where.classId = classId

  const sessions = await db.qRCodeSession.findMany({
    where,
    include: {
      class: { select: { name: true } }
    },
    orderBy: { generatedAt: 'desc' }
  })

  return {
    sessions: sessions.map(s => ({
      id: s.id,
      code: s.code,
      classId: s.classId,
      className: s.class.name,
      expiresAt: s.expiresAt.toISOString(),
      scanCount: s.scanCount,
      scannedBy: s.scannedBy as string[],
    }))
  }
}

// ============================================================================
// STUDENT IDENTIFIER MANAGEMENT
// ============================================================================

/**
 * Add student identifier (barcode, RFID, etc.)
 */
export async function addStudentIdentifier(input: z.infer<typeof studentIdentifierSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const session = await auth()
  const parsed = studentIdentifierSchema.parse(input)

  const identifier = await db.studentIdentifier.create({
    data: {
      schoolId,
      studentId: parsed.studentId,
      type: parsed.type,
      value: parsed.value,
      isActive: parsed.isActive,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
      issuedBy: session?.user?.id,
    }
  })

  return { success: true, identifier }
}

/**
 * Get student identifiers
 */
export async function getStudentIdentifiers(studentId?: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const where: Prisma.StudentIdentifierWhereInput = { schoolId }
  if (studentId) where.studentId = studentId

  const identifiers = await db.studentIdentifier.findMany({
    where,
    include: {
      student: {
        select: { givenName: true, surname: true }
      }
    },
    orderBy: { issuedAt: 'desc' }
  })

  return {
    identifiers: identifiers.map(i => ({
      id: i.id,
      studentId: i.studentId,
      studentName: `${i.student.givenName} ${i.student.surname}`,
      type: i.type,
      value: i.value,
      isActive: i.isActive,
      isPrimary: i.isPrimary,
      issuedAt: i.issuedAt.toISOString(),
      expiresAt: i.expiresAt?.toISOString(),
      lastUsedAt: i.lastUsedAt?.toISOString(),
      usageCount: i.usageCount,
    }))
  }
}

/**
 * Find student by identifier (for scanning)
 */
export async function findStudentByIdentifier(input: {
  type: string
  value: string
}): Promise<
  | { found: false; error: string }
  | { found: true; student: { id: string; name: string } }
> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { found: false, error: 'Missing school context' }
    }

  const identifier = await db.studentIdentifier.findFirst({
    where: {
      schoolId,
      type: input.type as 'BARCODE' | 'QR_CODE' | 'RFID_CARD' | 'NFC_TAG' | 'FINGERPRINT' | 'FACE_ID' | 'BLUETOOTH_MAC',
      value: input.value,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        }
      }
    }
  })

  if (!identifier) {
    return { found: false, error: 'Identifier not found or expired' }
  }

  // Update usage stats
  await db.studentIdentifier.update({
    where: { id: identifier.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 }
    }
  })

  return {
    found: true,
    student: {
      id: identifier.student.id,
      name: `${identifier.student.givenName} ${identifier.student.surname}`,
    }
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk upload attendance records
 */
export async function bulkUploadAttendance(input: z.infer<typeof bulkUploadSchema>): Promise<{
  successful: number
  failed: number
  errors: Array<{ studentId: string; error: string }>
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { successful: 0, failed: 0, errors: [{ studentId: '', error: 'Missing school context' }] }
    }

  const session = await auth()
  const parsed = bulkUploadSchema.parse(input)

  const results = {
    successful: 0,
    failed: 0,
    errors: [] as { studentId: string; error: string }[]
  }

  for (const record of parsed.records) {
    try {
      await db.attendance.upsert({
        where: {
          schoolId_studentId_classId_date: {
            schoolId,
            studentId: record.studentId,
            classId: parsed.classId,
            date: new Date(parsed.date)
          }
        },
        create: {
          schoolId,
          studentId: record.studentId,
          classId: parsed.classId,
          date: new Date(parsed.date),
          status: record.status,
          method: parsed.method,
          markedBy: session?.user?.id,
          markedAt: new Date(),
          checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
          notes: record.notes,
        },
        update: {
          status: record.status,
          checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
          notes: record.notes,
        }
      })
      results.successful++
    } catch (error) {
      results.failed++
      results.errors.push({
        studentId: record.studentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  revalidatePath('/attendance')
  return results
}

// ============================================================================
// REPORTS & EXPORT
// ============================================================================

/**
 * Get attendance report data
 */
export async function getAttendanceReport(input: z.infer<typeof attendanceFilterSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const parsed = attendanceFilterSchema.parse(input)

  const where: Prisma.AttendanceWhereInput = { schoolId }

  if (parsed.classId) where.classId = parsed.classId
  if (parsed.studentId) where.studentId = parsed.studentId
  if (parsed.status) {
    where.status = Array.isArray(parsed.status)
      ? { in: parsed.status }
      : parsed.status
  }
  if (parsed.method) {
    where.method = Array.isArray(parsed.method)
      ? { in: parsed.method }
      : parsed.method
  }
  if (parsed.dateFrom || parsed.dateTo) {
    where.date = {}
    if (parsed.dateFrom) where.date.gte = new Date(parsed.dateFrom)
    if (parsed.dateTo) where.date.lte = new Date(parsed.dateTo)
  }

  const [records, total] = await Promise.all([
    db.attendance.findMany({
      where,
      include: {
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: parsed.limit,
      skip: parsed.offset,
    }),
    db.attendance.count({ where })
  ])

  return {
    records: records.map(r => ({
      id: r.id,
      date: r.date.toISOString(),
      studentId: r.studentId,
      studentName: `${r.student.givenName} ${r.student.surname}`,
      classId: r.classId,
      className: r.class.name,
      status: r.status,
      method: r.method,
      checkInTime: r.checkInTime?.toISOString(),
      checkOutTime: r.checkOutTime?.toISOString(),
      notes: r.notes,
    })),
    total,
    page: Math.floor(parsed.offset / parsed.limit) + 1,
    pageSize: parsed.limit,
    totalPages: Math.ceil(total / parsed.limit),
  }
}

/**
 * Get CSV export data
 */
export async function getAttendanceReportCsv(input: {
  classId?: string
  studentId?: string
  status?: string
  from?: string
  to?: string
  limit?: number
}): Promise<string> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      throw new Error('Missing school context')
    }

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
  if (sp.status) where.status = sp.status.toUpperCase() as AttendanceStatus
  if (sp.from || sp.to) {
    where.date = {}
    if (sp.from) where.date.gte = new Date(sp.from)
    if (sp.to) where.date.lte = new Date(sp.to)
  }

  const rows = await db.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    take: sp.limit ?? 1000,
    include: {
      student: { select: { givenName: true, surname: true } },
      class: { select: { name: true } },
    }
  })

  const header = 'date,studentId,studentName,classId,className,status,method,checkInTime,checkOutTime,notes\n'
  const body = rows
    .map((r) => [
      new Date(r.date).toISOString().slice(0, 10),
      r.studentId,
      `"${r.student.givenName} ${r.student.surname}"`,
      r.classId,
      `"${r.class.name}"`,
      String(r.status),
      String(r.method),
      r.checkInTime?.toISOString() || '',
      r.checkOutTime?.toISOString() || '',
      `"${r.notes || ''}"`,
    ].join(','))
    .join('\n')

  return header + body
}

// ============================================================================
// CHECK OUT
// ============================================================================

/**
 * Check out student (mark departure time)
 */
export async function checkOutStudent(input: {
  studentId: string
  classId: string
  date: string
}): Promise<{ success: boolean; error?: string }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, error: 'Missing school context' }
    }

  const attendance = await db.attendance.findUnique({
    where: {
      schoolId_studentId_classId_date: {
        schoolId,
        studentId: input.studentId,
        classId: input.classId,
        date: new Date(input.date)
      }
    }
  })

  if (!attendance) {
    return { success: false, error: 'No check-in record found' }
  }

  if (attendance.checkOutTime) {
    return { success: false, error: 'Already checked out' }
  }

  await db.attendance.update({
    where: { id: attendance.id },
    data: { checkOutTime: new Date() }
  })

  revalidatePath('/attendance')
  return { success: true }
}

/**
 * Bulk check out all students for a class
 */
export async function bulkCheckOut(input: {
  classId: string
  date: string
}): Promise<{ success: boolean; count: number }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
      return { success: false, count: 0 }
    }

  const result = await db.attendance.updateMany({
    where: {
      schoolId,
      classId: input.classId,
      date: new Date(input.date),
      checkOutTime: null,
    },
    data: { checkOutTime: new Date() }
  })

  revalidatePath('/attendance')
  return { success: true, count: result.count }
}

// ============================================================================
// BULK UPLOAD HISTORY
// ============================================================================

/**
 * Get recent bulk uploads (grouped by date and method=BULK_UPLOAD)
 */
export async function getRecentBulkUploads(limit = 5): Promise<{
  uploads: Array<{
    date: Date
    classId: string
    className: string
    total: number
    successful: number
    failed: number
  }>
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { uploads: [] }

  // Get unique date+class combinations for BULK_UPLOAD method
  const recentUploads = await db.attendance.groupBy({
    by: ['date', 'classId'],
    where: {
      schoolId,
      method: 'BULK_UPLOAD',
    },
    _count: {
      _all: true,
    },
    orderBy: { date: 'desc' },
    take: limit,
  })

  // Get class names
  const classIds = [...new Set(recentUploads.map(u => u.classId))]
  const classes = await db.class.findMany({
    where: { id: { in: classIds }, schoolId },
    select: { id: true, name: true },
  })
  const classMap = new Map(classes.map(c => [c.id, c.name]))

  // Get success/fail counts for each upload
  const uploads = await Promise.all(
    recentUploads.map(async (upload) => {
      const successCount = await db.attendance.count({
        where: {
          schoolId,
          date: upload.date,
          classId: upload.classId,
          method: 'BULK_UPLOAD',
          status: { not: 'ABSENT' }, // Consider non-absent as successful processing
        },
      })

      return {
        date: upload.date,
        classId: upload.classId,
        className: classMap.get(upload.classId) || 'Unknown Class',
        total: upload._count._all,
        successful: successCount,
        failed: upload._count._all - successCount,
      }
    })
  )

  return { uploads }
}
