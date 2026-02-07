"use server"

import { randomBytes } from "crypto"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { qrCodeGenerationSchema } from "../shared/validation"

// Generate QR code session for a class
export async function generateQRSession(
  input: z.infer<typeof qrCodeGenerationSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const session = await auth()
  const parsed = qrCodeGenerationSchema.parse(input)

  // Generate unique code
  const code = randomBytes(16).toString("hex")
  const expiresAt = new Date(Date.now() + parsed.validFor * 1000)

  // Invalidate previous active sessions for this class
  await db.qRCodeSession.updateMany({
    where: { schoolId, classId: parsed.classId, isActive: true },
    data: { isActive: false, invalidatedAt: new Date() },
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
      generatedBy: session?.user?.id || "system",
      expiresAt,
      isActive: true,
      configuration: {
        validFor: parsed.validFor,
        includeLocation: parsed.includeLocation,
      },
    },
  })

  return {
    success: true,
    sessionId: qrSession.id,
    code: qrSession.code,
    expiresAt: qrSession.expiresAt.toISOString(),
  }
}

// Validate and process QR code scan
export async function processQRScan(input: {
  code: string
  studentId: string
  location?: { lat: number; lon: number; accuracy?: number }
  deviceId?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  // Find and validate session
  const qrSession = await db.qRCodeSession.findFirst({
    where: {
      schoolId,
      code: input.code,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  })

  if (!qrSession) {
    return { success: false, error: "Invalid or expired QR code" }
  }

  // Check if student already scanned
  const scannedBy = qrSession.scannedBy as string[]
  if (scannedBy.includes(input.studentId)) {
    return { success: false, error: "Already checked in" }
  }

  // Mark attendance
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find existing daily attendance (where periodId is null)
  const existing = await db.attendance.findFirst({
    where: {
      schoolId,
      studentId: input.studentId,
      classId: qrSession.classId,
      date: today,
      periodId: null,
    },
  })

  if (existing) {
    await db.attendance.update({
      where: { id: existing.id },
      data: {
        status: "PRESENT",
        method: "QR_CODE",
        checkInTime: new Date(),
        location: input.location,
      },
    })
  } else {
    await db.attendance.create({
      data: {
        schoolId,
        studentId: input.studentId,
        classId: qrSession.classId,
        date: today,
        status: "PRESENT",
        method: "QR_CODE",
        checkInTime: new Date(),
        location: input.location,
        deviceId: input.deviceId,
      },
    })
  }

  // Update session
  await db.qRCodeSession.update({
    where: { id: qrSession.id },
    data: {
      scanCount: { increment: 1 },
      scannedBy: [...scannedBy, input.studentId],
    },
  })

  return { success: true, message: "Attendance marked successfully" }
}

// Get active QR sessions
export async function getActiveQRSessions(classId?: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.QRCodeSessionWhereInput = {
    schoolId,
    isActive: true,
    expiresAt: { gt: new Date() },
  }

  if (classId) where.classId = classId

  const sessions = await db.qRCodeSession.findMany({
    where,
    include: {
      class: { select: { name: true } },
    },
    orderBy: { generatedAt: "desc" },
  })

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      code: s.code,
      classId: s.classId,
      className: s.class.name,
      expiresAt: s.expiresAt.toISOString(),
      scanCount: s.scanCount,
      scannedBy: s.scannedBy as string[],
    })),
  }
}
