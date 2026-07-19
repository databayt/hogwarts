"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  checkRateLimit,
  clearRateLimit,
  createAuditLog,
  recordScanFailure,
} from "../security"
import {
  barcodeScanSchema,
  studentIdentifierSchema,
} from "../shared/validation"

/**
 * Process barcode scan for attendance
 * Includes rate limiting protection against brute-force attacks
 */
export async function processBarcodeScan(
  data: z.infer<typeof barcodeScanSchema>
) {
  try {
    const session = await auth()
    if (!session?.user?.role) {
      throw new Error("Unauthorized")
    }

    // Barcode scanning is initiated by school staff (teacher at the door,
    // admin at the front desk). Students/guardians do not scan others'
    // cards — the previous code allowed any authenticated user to call
    // this and indirectly mark another student PRESENT.
    const role = session.user.role
    const SCANNER_ROLES = ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"]
    if (!SCANNER_ROLES.includes(role)) {
      throw new Error("Insufficient permissions to scan barcodes")
    }

    const { barcode, classId, format, scannedAt, deviceId } = data
    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      throw new Error("School ID is required")
    }

    // Rate limit check (by device ID or user ID as fallback)
    const rateLimitId = deviceId || session.user.id
    const rateLimitStatus = checkRateLimit(rateLimitId)

    if (rateLimitStatus.isBlocked) {
      const minutesRemaining = Math.ceil(rateLimitStatus.remainingSeconds / 60)
      return {
        success: false,
        error: `Too many failed scan attempts. Please wait ${minutesRemaining} minute(s) before trying again.`,
        rateLimited: true,
      }
    }

    // Validate that the class exists and belongs to the school
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    })

    if (!classExists) {
      throw new Error("Invalid class ID or class not found")
    }

    // Find student by barcode
    const studentIdentifier = await db.studentIdentifier.findFirst({
      where: {
        schoolId,
        type: "BARCODE",
        value: barcode,
        isActive: true,
      },
      include: {
        student: true,
      },
    })

    if (!studentIdentifier) {
      // Record rate limit failure
      const failureResult = recordScanFailure(rateLimitId)

      // We can't write an `AttendanceEvent` here because we have no
      // resolved Student.id (the barcode is unknown), and
      // `AttendanceEvent.studentId` is FK-constrained to `Student.id`.
      // Previously this branch wrote `session.user.id` (the scanner
      // staff's User PK) into the studentId column, which is a different
      // namespace and corrupted audit data. Log to console until a
      // dedicated scan-failure log model exists.
      console.warn(
        "[processBarcodeScan] Unknown barcode; skipping AttendanceEvent log",
        {
          schoolId,
          barcode,
          format,
          classId,
          scannerUserId: session.user.id,
          remainingAttempts: failureResult.remainingAttempts,
        }
      )

      if (failureResult.isBlocked) {
        return {
          success: false,
          error: "Too many failed attempts. Device blocked for 5 minutes.",
          rateLimited: true,
        }
      }

      throw new Error(
        `Barcode not found in system. ${failureResult.remainingAttempts} attempts remaining.`
      )
    }

    // Check if expired
    if (
      studentIdentifier.expiresAt &&
      new Date(studentIdentifier.expiresAt) < new Date()
    ) {
      throw new Error("Card has expired")
    }

    // Check if attendance already marked today. Find soft-deleted rows too: the
    // unique tuple still reserves their key, so a create() would collide — we
    // revive the row instead of falsely reporting "already marked".
    const today = new Date(new Date().toDateString()) // midnight, no time
    const existingAttendance = await db.attendance.findFirst({
      where: {
        schoolId,
        studentId: studentIdentifier.studentId,
        classId,
        date: today,
      },
      select: { id: true, deletedAt: true },
    })

    if (existingAttendance && existingAttendance.deletedAt === null) {
      throw new Error("Attendance already marked for this student today")
    }

    const scanNotes = `Scanned via BARCODE at ${new Date(scannedAt).toISOString()}`

    // Revive a soft-deleted record, otherwise create a fresh one. Record the
    // BARCODE method (the old create omitted it, so scans logged as MANUAL).
    const attendance = existingAttendance
      ? await db.attendance.update({
          where: { id: existingAttendance.id, schoolId },
          data: {
            status: "PRESENT",
            method: "BARCODE",
            notes: scanNotes,
            markedAt: new Date(),
            checkInTime: new Date(),
            deletedAt: null,
          },
        })
      : await db.attendance.create({
          data: {
            schoolId,
            studentId: studentIdentifier.studentId,
            classId,
            date: today,
            status: "PRESENT",
            method: "BARCODE",
            notes: scanNotes,
            markedAt: new Date(),
            checkInTime: new Date(),
          },
        })

    // Update identifier usage
    await db.studentIdentifier.update({
      where: { id: studentIdentifier.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    })

    // Clear rate limit on successful scan
    clearRateLimit(rateLimitId)

    // Log successful scan
    await db.attendanceEvent.create({
      data: {
        schoolId,
        studentId: studentIdentifier.studentId,
        eventType: "SCAN_SUCCESS",
        method: "BARCODE",
        deviceId,
        success: true,
        metadata: {
          barcode,
          format,
          attendanceId: attendance.id,
        },
        timestamp: new Date(scannedAt),
      },
    })

    // Create audit log
    await createAuditLog({
      schoolId,
      userId: session.user.id,
      action: "ATTENDANCE_CREATED",
      entityType: "Attendance",
      entityId: attendance.id,
      newValue: {
        studentId: studentIdentifier.studentId,
        classId,
        status: "PRESENT",
        method: "BARCODE",
      },
      metadata: { deviceId, barcode: barcode.substring(0, 4) + "****" },
    })

    revalidatePath("/attendance/barcode")

    return {
      success: true,
      attendanceId: attendance.id,
      studentId: studentIdentifier.studentId,
      studentName:
        studentIdentifier.student.firstName +
        " " +
        studentIdentifier.student.lastName,
      status: attendance.status,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to process barcode scan",
    }
  }
}

/**
 * Assign barcode to student
 */
export async function assignBarcodeToStudent(
  data: z.infer<typeof studentIdentifierSchema>
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      throw new Error("Insufficient permissions")
    }

    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      throw new Error("School ID is required")
    }

    // Check if barcode already exists
    const existing = await db.studentIdentifier.findFirst({
      where: {
        schoolId,
        type: "BARCODE",
        value: data.value,
      },
    })

    if (existing) {
      throw new Error("Barcode already assigned to another student")
    }

    // Check if student exists
    const student = await db.student.findFirst({
      where: {
        id: data.studentId,
        schoolId,
      },
    })

    if (!student) {
      throw new Error("Student not found")
    }

    // Create identifier
    const identifier = await db.studentIdentifier.create({
      data: {
        schoolId,
        studentId: data.studentId,
        type: "BARCODE",
        value: data.value,
        isActive: data.isActive ?? true,
        issuedBy: session.user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: {
        student: true,
      },
    })

    // Create audit log
    await createAuditLog({
      schoolId,
      userId: session.user.id,
      action: "BARCODE_ASSIGNED",
      entityType: "Barcode",
      entityId: identifier.id,
      newValue: {
        studentId: data.studentId,
        studentName:
          identifier.student.firstName + " " + identifier.student.lastName,
        isActive: data.isActive ?? true,
        expiresAt: data.expiresAt,
      },
    })

    revalidatePath("/attendance/barcode")

    return {
      success: true,
      data: identifier,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to assign barcode",
    }
  }
}

/**
 * Get student barcodes
 */
export async function getStudentBarcodes(studentId?: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // SECURITY: barcode values are scan credentials — a full cards-to-names
    // PII map. Admin-only, matching getStudentIdentifiers in
    // actions/identifiers.ts. Previously any authenticated role (incl.
    // STUDENT/GUARDIAN) could enumerate every student's identifier.
    const role = session.user.role
    if (role !== "ADMIN" && role !== "DEVELOPER") {
      throw new Error("Unauthorized")
    }

    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      throw new Error("School ID is required")
    }

    const barcodes = await db.studentIdentifier.findMany({
      where: {
        schoolId,
        type: "BARCODE",
        ...(studentId && { studentId }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      data: barcodes,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch barcodes",
    }
  }
}

/**
 * Update barcode status
 */
export async function updateBarcodeStatus(
  identifierId: string,
  isActive: boolean
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      throw new Error("Insufficient permissions")
    }

    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      throw new Error("School ID is required")
    }

    const identifier = await db.studentIdentifier.findFirst({
      where: {
        id: identifierId,
        schoolId,
        type: "BARCODE",
      },
    })

    if (!identifier) {
      throw new Error("Barcode not found")
    }

    await db.studentIdentifier.update({
      where: { id: identifierId },
      data: { isActive },
    })

    revalidatePath("/attendance/barcode")

    return {
      success: true,
      message: `Barcode ${isActive ? "activated" : "deactivated"} successfully`,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update barcode status",
    }
  }
}

/**
 * Delete barcode
 */
export async function deleteBarcode(identifierId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Check permissions
    if (session.user.role !== "ADMIN") {
      throw new Error("Only administrators can delete barcodes")
    }

    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      throw new Error("School ID is required")
    }

    const identifier = await db.studentIdentifier.findFirst({
      where: {
        id: identifierId,
        schoolId,
        type: "BARCODE",
      },
    })

    if (!identifier) {
      throw new Error("Barcode not found")
    }

    await db.studentIdentifier.delete({
      where: { id: identifierId },
    })

    revalidatePath("/attendance/barcode")

    return {
      success: true,
      message: "Barcode deleted successfully",
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete barcode",
    }
  }
}

/**
 * Bulk import barcodes from CSV
 */
export async function bulkImportBarcodes(csvData: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      throw new Error("Insufficient permissions")
    }

    const { schoolId } = await getTenantContext()

    if (!schoolId) {
      throw new Error("School ID is required")
    }
    const rows = csvData.split("\n").slice(1) // Skip header
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const row of rows) {
      const [studentId, barcode, expiryDate] = row
        .split(",")
        .map((s) => s.trim())

      if (!studentId || !barcode) continue

      try {
        // Check if student exists
        const student = await db.student.findFirst({
          where: { id: studentId, schoolId },
        })

        if (!student) {
          results.failed++
          results.errors.push(`Student ${studentId} not found`)
          continue
        }

        // Check if barcode already exists
        const existing = await db.studentIdentifier.findFirst({
          where: { schoolId, type: "BARCODE", value: barcode },
        })

        if (existing) {
          results.failed++
          results.errors.push(`Barcode ${barcode} already exists`)
          continue
        }

        // Create identifier
        await db.studentIdentifier.create({
          data: {
            schoolId,
            studentId,
            type: "BARCODE",
            value: barcode,
            isActive: true,
            issuedBy: session.user.id,
            expiresAt: expiryDate ? new Date(expiryDate) : undefined,
          },
        })

        results.successful++
      } catch (error) {
        results.failed++
        results.errors.push(`Failed to import ${studentId}: ${error}`)
      }
    }

    revalidatePath("/attendance/barcode")

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to import barcodes",
    }
  }
}
