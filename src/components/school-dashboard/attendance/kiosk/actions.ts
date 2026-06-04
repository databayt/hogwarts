// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Kiosk Server Actions
 *
 * Server actions for kiosk check-in/out operations.
 */
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { KioskAction, KioskMethod } from "./validation"

/**
 * Kiosk operations run inside a staff/admin-supervised session (the kiosk page
 * is ADMIN/DEVELOPER-gated). These actions previously checked only
 * getTenantContext() — which resolves the tenant from the host, not the user —
 * so any tenant-resolvable caller could enumerate student PII and write
 * attendance. Gate every action on an authenticated classroom-staff role.
 */
const KIOSK_OPERATOR_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STAFF",
]

async function requireKioskOperator(): Promise<
  | { ok: true; userId: string; schoolId: string; role: UserRole }
  | { ok: false; result: ReturnType<typeof actionError> }
> {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const userId = session?.user?.id
  const role = session?.user?.role as UserRole | undefined
  if (!userId || !role || !schoolId || !KIOSK_OPERATOR_ROLES.includes(role)) {
    return { ok: false, result: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return { ok: true, userId, schoolId, role }
}

interface LookupStudentInput {
  identifierValue: string
  method: KioskMethod
}

interface LookupStudentResult {
  success: boolean
  error?: string
  student?: {
    id: string
    name: string
    photoUrl?: string | null
    grNumber?: string | null
    yearLevel?: string
    lastAction?: string
  }
  isLate?: boolean
  isEarlyDeparture?: boolean
}

/**
 * Look up a student by identifier (barcode, QR code, manual entry)
 */
export async function lookupStudent(
  input: LookupStudentInput
): Promise<LookupStudentResult> {
  try {
    const guard = await requireKioskOperator()
    if (!guard.ok) return guard.result
    const { schoolId } = guard
    const { identifierValue, method } = input

    let student = null

    // Try to find by StudentIdentifier first (for barcode/QR)
    if (method === "BARCODE" || method === "QR_CODE") {
      const identifier = await db.studentIdentifier.findFirst({
        where: {
          schoolId,
          value: identifierValue,
          isActive: true,
        },
        include: {
          student: {
            include: {
              studentYearLevels: {
                include: { yearLevel: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      })
      if (identifier) {
        student = identifier.student
      }
    }

    // Fallback: try to find by student ID fields
    if (!student) {
      student = await db.student.findFirst({
        where: {
          schoolId,
          OR: [
            { grNumber: identifierValue },
            { studentId: identifierValue },
            { idCardBarcode: identifierValue },
          ],
        },
        include: {
          studentYearLevels: {
            include: { yearLevel: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      })
    }

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get last kiosk log to determine next action
    const lastLog = await db.kioskLog.findFirst({
      where: {
        studentId: student.id,
        schoolId,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { timestamp: "desc" },
    })

    // Check if late (simplified - should use school schedule)
    const now = new Date()
    const schoolStartHour = 7 // 7:30 AM
    const schoolStartMinute = 30
    const lateThresholdMinutes = 15

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const schoolStartMinutes = schoolStartHour * 60 + schoolStartMinute
    const isLate = currentMinutes > schoolStartMinutes + lateThresholdMinutes

    // Check if early departure (simplified - should use school schedule)
    const schoolEndHour = 14 // 2:00 PM
    const schoolEndMinutes = schoolEndHour * 60
    const isEarlyDeparture = currentMinutes < schoolEndMinutes - 30

    return {
      success: true,
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        photoUrl: student.profilePhotoUrl,
        grNumber: student.grNumber,
        yearLevel: student.studentYearLevels[0]?.yearLevel?.levelName,
        lastAction: lastLog?.action,
      },
      isLate,
      isEarlyDeparture,
    }
  } catch (error) {
    console.error("Error looking up student:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}

interface ProcessKioskCheckInput {
  kioskId: string
  studentId: string
  action: KioskAction
  method: KioskMethod
  reasonCode?: string
  reasonNote?: string
  photoUrl?: string
}

interface ProcessKioskCheckResult {
  success: boolean
  error?: string
  attendanceId?: string
}

/**
 * Process a kiosk check-in or check-out
 */
export async function processKioskCheck(
  input: ProcessKioskCheckInput
): Promise<ProcessKioskCheckResult> {
  try {
    const guard = await requireKioskOperator()
    if (!guard.ok) return guard.result
    const { schoolId } = guard
    const {
      kioskId,
      studentId,
      action,
      method,
      reasonCode,
      reasonNote,
      photoUrl,
    } = input

    const now = new Date()

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get student with their current class (scoped by schoolId)
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        studentClasses: {
          where: { schoolId },
          include: { class: true },
          take: 1,
        },
      },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    const classId = student.studentClasses[0]?.classId

    if (!classId) {
      return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
    }

    // Determine attendance status
    let status: "PRESENT" | "LATE" = "PRESENT"
    if (action === "CHECK_IN") {
      const schoolStartMinutes = 7 * 60 + 30 // 7:30 AM
      const lateThresholdMinutes = 15
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (currentMinutes > schoolStartMinutes + lateThresholdMinutes) {
        status = "LATE"
      }
    }

    // Create or update attendance record
    let attendance = await db.attendance.findFirst({
      where: {
        schoolId,
        studentId,
        classId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    if (action === "CHECK_IN") {
      if (attendance) {
        // Update existing with check-in time
        attendance = await db.attendance.update({
          where: { id: attendance.id },
          data: {
            status,
            checkInTime: now,
            method: "KIOSK",
            notes: reasonNote
              ? `${attendance.notes || ""}\nKiosk: ${reasonNote}`.trim()
              : attendance.notes,
          },
        })
      } else {
        // Create new attendance record
        attendance = await db.attendance.create({
          data: {
            schoolId,
            studentId,
            classId,
            date: today,
            status,
            method: "KIOSK",
            checkInTime: now,
            notes: reasonNote ? `Kiosk check-in: ${reasonNote}` : null,
          },
        })
      }
    } else {
      // CHECK_OUT
      if (attendance) {
        attendance = await db.attendance.update({
          where: { id: attendance.id },
          data: {
            checkOutTime: now,
            notes: reasonNote
              ? `${attendance.notes || ""}\nKiosk check-out: ${reasonNote}`.trim()
              : attendance.notes,
          },
        })
      }
    }

    // Create kiosk log entry
    await db.kioskLog.create({
      data: {
        schoolId,
        kioskId,
        studentId,
        action,
        method,
        identifierValue: null,
        photoUrl,
        reasonCode,
        reasonNote,
        syncedToAttendance: true,
        attendanceId: attendance?.id,
      },
    })

    // Update kiosk session stats
    await db.kioskSession.updateMany({
      where: { schoolId, kioskId },
      data: {
        lastPingAt: now,
        ...(action === "CHECK_IN"
          ? { checkInsToday: { increment: 1 } }
          : { checkOutsToday: { increment: 1 } }),
      },
    })

    revalidatePath("/attendance")

    return { success: true, attendanceId: attendance?.id }
  } catch (error) {
    console.error("Error processing kiosk check:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}

interface RegisterKioskInput {
  kioskId: string
  kioskName: string
  location?: string
}

interface RegisterKioskResult {
  success: boolean
  error?: string
  sessionId?: string
}

/**
 * Register a new kiosk session
 */
export async function registerKiosk(
  input: RegisterKioskInput
): Promise<RegisterKioskResult> {
  try {
    const guard = await requireKioskOperator()
    if (!guard.ok) return guard.result
    const { schoolId } = guard
    const { kioskId, kioskName, location } = input

    // Check if kiosk already registered (use unique constraint)
    const existingSession = await db.kioskSession.findUnique({
      where: {
        schoolId_kioskId: { schoolId, kioskId },
      },
    })

    if (existingSession) {
      // Reactivate if needed
      if (!existingSession.isActive) {
        await db.kioskSession.update({
          where: { id: existingSession.id },
          data: {
            isActive: true,
            kioskName,
            location,
            lastPingAt: new Date(),
          },
        })
      }
      return { success: true, sessionId: existingSession.id }
    }

    // Create new kiosk session
    const session = await db.kioskSession.create({
      data: {
        schoolId,
        kioskId,
        kioskName,
        location,
        isActive: true,
        config: {
          cameraEnabled: false,
          receiptPrintingEnabled: false,
          requireReasonForLate: true,
          lateThresholdMinutes: 15,
          requireReasonForEarlyDeparture: true,
          offlineModeEnabled: true,
        },
      },
    })

    return { success: true, sessionId: session.id }
  } catch (error) {
    console.error("Error registering kiosk:", error)
    return actionError(ACTION_ERRORS.ATTENDANCE_MARK_FAILED)
  }
}
