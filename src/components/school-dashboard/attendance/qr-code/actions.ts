"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { getOwnedStudentIds } from "../actions/helpers"
import {
  canMarkAttendance,
  canViewSchoolAnalytics,
  isStaffRole,
} from "../authorization"
import {
  checkRateLimit,
  clearRateLimit,
  createAuditLog,
  generateSecureQRPayload,
  parseSecureQRPayload,
  recordScanFailure,
} from "../security"
import type { AttendanceRecord, QRCodeScanPayload } from "../shared/types"
import {
  attendanceRecordSchema,
  qrCodeGenerationSchema,
  qrCodeScanSchema,
} from "../shared/validation"

/**
 * Generate a new QR code for attendance
 */
export async function generateAttendanceQR(
  data: z.infer<typeof qrCodeGenerationSchema>
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // SECURITY: only marking-capable staff may mint QR attendance sessions.
    // Previously any authenticated tenant user could create sessions for any class.
    if (!canMarkAttendance(session.user.role as UserRole)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { classId, validFor = 60, includeLocation = false, secret } = data
    const schoolId = session.user.schoolId

    if (!schoolId) {
      throw new Error("School ID not found in session")
    }

    // Validate that the class exists and belongs to the school
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    })

    if (!classExists) {
      throw new Error("Class not found")
    }

    // Generate unique QR code payload with HMAC signature
    const sessionId = `${classId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const expiresAt = new Date(Date.now() + validFor * 1000)

    // Generate secure payload with HMAC signature
    const securePayload = generateSecureQRPayload(
      sessionId,
      schoolId,
      classId,
      expiresAt.getTime()
    )

    // Create QR session in database
    const qrSession = await db.qRCodeSession.create({
      data: {
        schoolId,
        classId,
        code: sessionId,
        payload: {
          classId,
          timestamp: Date.now(),
          expiresAt: expiresAt.getTime(),
          includeLocation,
          secret: secret || null,
          secured: true, // Mark as using HMAC
        },
        generatedBy: session.user.id,
        expiresAt,
        configuration: {
          validFor,
          includeLocation,
          requireAuth: true,
        },
      },
    })

    // Create audit log
    await createAuditLog({
      schoolId,
      userId: session.user.id,
      action: "QR_SESSION_CREATED",
      entityType: "QRSession",
      entityId: qrSession.id,
      newValue: {
        classId,
        validFor,
        expiresAt: expiresAt.toISOString(),
      },
    })

    revalidatePath("/attendance/qr-code")

    return {
      success: true,
      data: {
        code: securePayload, // Return signed payload
        sessionId: qrSession.code,
        expiresAt: qrSession.expiresAt,
        payload: securePayload,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate QR code",
    }
  }
}

/**
 * Process QR code scan for attendance
 *
 * Includes HMAC signature verification and rate limiting.
 *
 * Resolves the scanning user (`User.id`) to their `Student` record.
 * `Attendance.studentId` is FK-constrained to `Student.id`, **not**
 * `User.id` — storing `session.user.id` directly (as the previous
 * version did) either throws an FK violation or, if the cuids happen
 * to collide, silently corrupts another student's attendance ledger.
 *
 * Only callers with a Student record in this school may scan.
 */
export async function processQRScan(data: z.infer<typeof qrCodeScanSchema>) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    const { code, scannedAt, deviceId, location } = data
    const schoolId = session.user.schoolId

    if (!schoolId) {
      throw new Error("School ID not found in session")
    }

    // Resolve User.id → Student.id within this tenant.
    const student = await db.student.findFirst({
      where: { userId: session.user.id, schoolId },
      select: { id: true },
    })

    if (!student) {
      throw new Error("Only students can scan QR codes for attendance")
    }

    const studentId = student.id

    // Rate limit check
    const rateLimitId = deviceId || studentId
    const rateLimitStatus = checkRateLimit(rateLimitId)

    if (rateLimitStatus.isBlocked) {
      const minutesRemaining = Math.ceil(rateLimitStatus.remainingSeconds / 60)
      return {
        success: false,
        error: `Too many failed scan attempts. Please wait ${minutesRemaining} minute(s).`,
        rateLimited: true,
      }
    }

    // First, try to parse as secure payload with HMAC
    const secureData = parseSecureQRPayload(code)
    let sessionCode: string
    let verifiedSchoolId: string | undefined

    if (secureData) {
      // Secure QR code - verify school ID matches
      sessionCode = secureData.sessionId
      verifiedSchoolId = secureData.schoolId

      if (verifiedSchoolId !== schoolId) {
        // Record failure for cross-school attempt
        recordScanFailure(rateLimitId)
        throw new Error("QR code is not valid for this school")
      }
    } else {
      // Fallback to legacy QR code format
      try {
        const qrData = JSON.parse(code)
        sessionCode = qrData.code || qrData.sessionId || code
      } catch {
        sessionCode = code
      }
    }

    // Find the QR session
    const qrSession = await db.qRCodeSession.findFirst({
      where: {
        code: sessionCode,
        schoolId,
        isActive: true,
        expiresAt: {
          gte: new Date(),
        },
      },
    })

    if (!qrSession) {
      // Record failure
      const failureResult = recordScanFailure(rateLimitId)
      if (failureResult.isBlocked) {
        return {
          success: false,
          error: "Too many failed attempts. Device blocked for 5 minutes.",
          rateLimited: true,
        }
      }
      throw new Error(
        `Invalid or expired QR code. ${failureResult.remainingAttempts} attempts remaining.`
      )
    }

    // Check if student already scanned this QR
    const scannedBy = (qrSession.scannedBy as string[]) || []
    if (scannedBy.includes(studentId)) {
      throw new Error("You have already marked attendance")
    }

    // Check max scans limit if configured
    if (qrSession.maxScans && qrSession.scanCount >= qrSession.maxScans) {
      throw new Error("QR code scan limit reached")
    }

    // CORRECTNESS: normalize the attendance date to midnight (matching manual
    // marking) so QR records collate with daily attendance and dashboards that
    // filter on the day boundary find them. Also idempotent on re-scan: if a
    // daily record already exists for this student/class/day, update it instead
    // of creating a duplicate row (the [schoolId,studentId,classId,date,periodId]
    // tuple is not DB-unique for NULL periodId in Postgres, so dedupe in code).
    const attendanceDate = new Date()
    attendanceDate.setHours(0, 0, 0, 0)
    const scanNotes = `Scanned via QR_CODE at ${new Date(scannedAt).toISOString()}${location ? ` (${location.lat},${location.lon})` : ""}`

    const existingDaily = await db.attendance.findFirst({
      where: {
        schoolId,
        studentId,
        classId: qrSession.classId,
        date: attendanceDate,
        periodId: null,
        deletedAt: null,
      },
      select: { id: true },
    })

    const attendance = existingDaily
      ? await db.attendance.update({
          where: { id: existingDaily.id, schoolId },
          data: {
            status: "PRESENT",
            method: "QR_CODE",
            notes: scanNotes,
            markedBy: session.user.id,
            markedAt: new Date(),
          },
        })
      : await db.attendance.create({
          data: {
            schoolId,
            studentId,
            classId: qrSession.classId,
            date: attendanceDate,
            status: "PRESENT",
            method: "QR_CODE",
            notes: scanNotes,
            markedBy: session.user.id,
            markedAt: new Date(),
          },
        })

    // Update QR session
    await db.qRCodeSession.update({
      where: { id: qrSession.id },
      data: {
        scanCount: qrSession.scanCount + 1,
        scannedBy: [...scannedBy, studentId],
      },
    })

    // Clear rate limit on success
    clearRateLimit(rateLimitId)

    // Log the event
    await db.attendanceEvent.create({
      data: {
        schoolId,
        studentId,
        eventType: "SCAN_SUCCESS",
        method: "QR_CODE",
        deviceId,
        location: location
          ? {
              lat: location.lat,
              lon: location.lon,
            }
          : undefined,
        metadata: {
          qrSessionId: qrSession.id,
          classId: qrSession.classId,
          secureQR: !!secureData, // Track if secure QR was used
        },
        success: true,
        userAgent: deviceId,
        timestamp: new Date(scannedAt),
      },
    })

    // Create audit log
    await createAuditLog({
      schoolId,
      userId: studentId,
      action: "ATTENDANCE_CREATED",
      entityType: "Attendance",
      entityId: attendance.id,
      newValue: {
        classId: qrSession.classId,
        status: "PRESENT",
        method: "QR_CODE",
        qrSessionId: qrSession.id,
      },
      metadata: { deviceId },
    })

    revalidatePath("/attendance/qr-code")

    return {
      success: true,
      data: {
        attendanceId: attendance.id,
        status: attendance.status,
        checkInTime: attendance.markedAt,
      },
    }
  } catch (error) {
    // Log failed scan attempt — but only if the caller is actually a Student.
    // `AttendanceEvent.studentId` is FK to `Student.id`, so we cannot write
    // the session `User.id` directly. If the failing scan came from a
    // non-student (e.g. a teacher who pointed the kiosk camera at a QR by
    // accident), we log to console and skip the DB write rather than
    // corrupt the audit trail with a User PK in a Student column.
    const session = await auth()
    if (session?.user?.schoolId) {
      const student = await db.student.findFirst({
        where: { userId: session.user.id, schoolId: session.user.schoolId },
        select: { id: true },
      })
      if (!student) {
        console.warn(
          "[processQRScan] Failed scan by non-student user; skipping AttendanceEvent log",
          { userId: session.user.id }
        )
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to process scan",
        }
      }
      await db.attendanceEvent.create({
        data: {
          schoolId: session.user.schoolId,
          studentId: student.id,
          eventType: "SCAN_FAILURE",
          method: "QR_CODE",
          deviceId: data.deviceId,
          success: false,
          errorMessage: error instanceof Error ? error.message : "Scan failed",
          timestamp: new Date(data.scannedAt),
        },
      })
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process QR scan",
    }
  }
}

/**
 * Get active QR sessions for a class
 */
export async function getActiveQRSessions(classId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // SECURITY: active session codes can be reused to mark attendance — staff only.
    if (!isStaffRole(session.user.role as UserRole)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const qrSessions = await db.qRCodeSession.findMany({
      where: {
        classId,
        schoolId,
        isActive: true,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        generatedAt: "desc",
      },
      take: 5,
    })

    return {
      success: true,
      data: qrSessions,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch QR sessions",
    }
  }
}

/**
 * Invalidate a QR code session
 */
export async function invalidateQRSession(sessionId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // SECURITY: invalidating a session is a staff moderation action.
    if (!isStaffRole(session.user.role as UserRole)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const qrSession = await db.qRCodeSession.findFirst({
      where: {
        id: sessionId,
        schoolId,
      },
    })

    if (!qrSession) {
      throw new Error("QR session not found")
    }

    await db.qRCodeSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        invalidatedAt: new Date(),
        invalidatedBy: session.user.id,
      },
    })

    // Create audit log
    await createAuditLog({
      schoolId: schoolId!,
      userId: session.user.id,
      action: "QR_SESSION_INVALIDATED",
      entityType: "QRSession",
      entityId: sessionId,
      oldValue: { isActive: true },
      newValue: { isActive: false, invalidatedAt: new Date().toISOString() },
    })

    revalidatePath("/attendance/qr-code")

    return {
      success: true,
      message: "QR session invalidated successfully",
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to invalidate QR session",
    }
  }
}

/**
 * Get QR scan history for a student
 */
export async function getStudentQRScans(studentId?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }
    const role = session.user.role as UserRole
    const isStaff = isStaffRole(role)

    // IDOR FIX: `studentId` is a Student.id, never a User.id. Resolve the
    // target correctly and enforce ownership for non-staff callers.
    let targetStudentId: string
    if (studentId) {
      if (!isStaff) {
        const owned = await getOwnedStudentIds(schoolId, session.user.id, role)
        if (!owned || !owned.includes(studentId)) {
          return actionError(ACTION_ERRORS.UNAUTHORIZED)
        }
      }
      targetStudentId = studentId
    } else {
      // No id supplied: staff must specify one; students/guardians resolve to self/child.
      if (isStaff) {
        return actionError(ACTION_ERRORS.VALIDATION_ERROR)
      }
      const owned = await getOwnedStudentIds(schoolId, session.user.id, role)
      if (!owned || owned.length === 0) {
        return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
      }
      targetStudentId = owned[0]
    }

    const events = await db.attendanceEvent.findMany({
      where: {
        studentId: targetStudentId,
        schoolId,
        method: "QR_CODE",
        eventType: {
          in: ["SCAN_SUCCESS", "SCAN_FAILURE"],
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: events,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch QR scan history",
    }
  }
}

/**
 * Get QR code statistics for a class
 */
export async function getQRCodeStats(
  classId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // SECURITY: school-wide QR statistics are analytics — staff only.
    if (!canViewSchoolAnalytics(session.user.role as UserRole)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const stats = await db.attendance.groupBy({
      by: ["status"],
      where: {
        classId,
        schoolId,
        date: {
          gte: dateFrom || new Date(new Date().setHours(0, 0, 0, 0)),
          lte: dateTo || new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      _count: {
        id: true,
      },
    })

    const totalScans = await db.attendanceEvent.count({
      where: {
        schoolId,
        method: "QR_CODE",
        eventType: "SCAN_SUCCESS",
        timestamp: {
          gte: dateFrom || new Date(new Date().setHours(0, 0, 0, 0)),
          lte: dateTo || new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    })

    const failedScans = await db.attendanceEvent.count({
      where: {
        schoolId,
        method: "QR_CODE",
        eventType: "SCAN_FAILURE",
        timestamp: {
          gte: dateFrom || new Date(new Date().setHours(0, 0, 0, 0)),
          lte: dateTo || new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    })

    return {
      success: true,
      data: {
        stats,
        totalScans,
        failedScans,
        successRate:
          totalScans > 0 ? ((totalScans - failedScans) / totalScans) * 100 : 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch QR code statistics",
    }
  }
}
