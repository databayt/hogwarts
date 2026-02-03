/**
 * Kiosk Server Actions
 *
 * Server actions for kiosk check-in/out operations.
 */
"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"

import type { KioskAction, KioskMethod } from "./validation"

interface LookupStudentInput {
  identifierValue: string
  method: KioskMethod
  schoolId: string
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
    const { identifierValue, method, schoolId } = input

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
      return { success: false, error: "Student not found" }
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
        name: `${student.givenName} ${student.surname}`,
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
    return { success: false, error: "Failed to look up student" }
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
  schoolId: string
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
    const {
      kioskId,
      studentId,
      action,
      method,
      reasonCode,
      reasonNote,
      photoUrl,
      schoolId,
    } = input

    const now = new Date()

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get student with their current class
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        studentClasses: {
          where: { schoolId },
          include: { class: true },
          take: 1,
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const classId = student.studentClasses[0]?.classId

    if (!classId) {
      return { success: false, error: "Student not enrolled in any class" }
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
    return { success: false, error: "Failed to process check-in/out" }
  }
}

interface RegisterKioskInput {
  kioskId: string
  kioskName: string
  location?: string
  schoolId: string
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
    const { kioskId, kioskName, location, schoolId } = input

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
    return { success: false, error: "Failed to register kiosk" }
  }
}
