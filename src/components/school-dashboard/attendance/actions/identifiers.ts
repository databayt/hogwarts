"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { Prisma, UserRole } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { studentIdentifierSchema } from "../shared/validation"

// Identifier mutations are admin-only — assigning, listing, or revoking
// barcodes/RFID exposes a complete student-name ↔ scan-token mapping.
// The previous version had no auth at all on read paths.
const ADMIN_ROLES: UserRole[] = ["DEVELOPER", "ADMIN"]

// The live scan-time lookup widens to staff because teachers/STAFF
// need it during a roll call to resolve a card to a student.
const SCANNER_ROLES: UserRole[] = ["DEVELOPER", "ADMIN", "TEACHER", "STAFF"]

async function requireAdmin(): Promise<
  | { ok: true; userId: string; schoolId: string }
  | { ok: false; result: { success: false; error: string } }
> {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const userId = session?.user?.id
  const role = session?.user?.role as UserRole | undefined
  if (!userId || !role || !schoolId) {
    return { ok: false, result: { success: false, error: "Unauthorized" } }
  }
  if (!ADMIN_ROLES.includes(role)) {
    return {
      ok: false,
      result: { success: false, error: "Insufficient permissions" },
    }
  }
  return { ok: true, userId, schoolId }
}

// Add student identifier (barcode, RFID, etc.)
export async function addStudentIdentifier(
  input: z.infer<typeof studentIdentifierSchema>
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.result
  const { schoolId, userId } = guard

  try {
    const parsed = studentIdentifierSchema.parse(input)

    // Verify the target student belongs to this school before assigning
    // an identifier — otherwise an admin in school A could attach a
    // tracker to a student record from school B.
    const student = await db.student.findFirst({
      where: { id: parsed.studentId, schoolId },
      select: { id: true },
    })
    if (!student) {
      return { success: false, error: "Student not found in this school" }
    }

    const identifier = await db.studentIdentifier.create({
      data: {
        schoolId,
        studentId: parsed.studentId,
        type: parsed.type,
        value: parsed.value,
        isActive: parsed.isActive,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
        issuedBy: userId,
      },
    })

    return { success: true, identifier }
  } catch (error) {
    console.error("[addStudentIdentifier] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add student identifier",
    }
  }
}

// Get student identifiers (admin-only — full PII map of cards-to-names)
export async function getStudentIdentifiers(studentId?: string) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.result
  const { schoolId } = guard

  try {
    const where: Prisma.StudentIdentifierWhereInput = { schoolId }
    if (studentId) where.studentId = studentId

    const identifiers = await db.studentIdentifier.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { issuedAt: "desc" },
    })

    return {
      identifiers: identifiers.map((i) => ({
        id: i.id,
        studentId: i.studentId,
        studentName: `${i.student.firstName} ${i.student.lastName}`,
        type: i.type,
        value: i.value,
        isActive: i.isActive,
        isPrimary: i.isPrimary,
        issuedAt: i.issuedAt.toISOString(),
        expiresAt: i.expiresAt?.toISOString(),
        lastUsedAt: i.lastUsedAt?.toISOString(),
        usageCount: i.usageCount,
      })),
    }
  } catch (error) {
    console.error("[getStudentIdentifiers] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get student identifiers",
    }
  }
}

// Find student by identifier (for scanning) — staff-callable, used by
// scanner UI during a roll call. Wider than admin so a teacher with a
// barcode reader can resolve a tap to a student name.
export async function findStudentByIdentifier(input: {
  type: string
  value: string
}): Promise<
  | { found: false; error: string }
  | { found: true; student: { id: string; name: string } }
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()
    const role = session?.user?.role as UserRole | undefined
    if (!session?.user?.id || !role || !schoolId) {
      return { found: false, error: "Unauthorized" }
    }
    if (!SCANNER_ROLES.includes(role)) {
      return { found: false, error: "Insufficient permissions" }
    }

    const identifier = await db.studentIdentifier.findFirst({
      where: {
        schoolId,
        type: input.type as
          | "BARCODE"
          | "QR_CODE"
          | "RFID_CARD"
          | "NFC_TAG"
          | "FINGERPRINT"
          | "FACE_ID"
          | "BLUETOOTH_MAC",
        value: input.value,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
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

    if (!identifier) {
      return { found: false, error: "Identifier not found or expired" }
    }

    // Compound where keeps the usage update bound to this tenant even
    // though id is globally unique — defense in depth across tenants.
    await db.studentIdentifier.updateMany({
      where: { id: identifier.id, schoolId },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    })

    return {
      found: true,
      student: {
        id: identifier.student.id,
        name: `${identifier.student.firstName} ${identifier.student.lastName}`,
      },
    }
  } catch (error) {
    console.error("[findStudentByIdentifier] Error:", error)
    return {
      found: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to find student by identifier",
    }
  }
}

// Delete student identifier (admin-only)
export async function deleteStudentIdentifier(identifierId: string) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.result
  const { schoolId } = guard

  try {
    const identifier = await db.studentIdentifier.findFirst({
      where: { id: identifierId, schoolId },
    })

    if (!identifier) {
      return { success: false, error: "Identifier not found" }
    }

    // Compound where keeps the delete bound to this tenant for
    // defense-in-depth even though id is globally unique.
    await db.studentIdentifier.deleteMany({
      where: { id: identifierId, schoolId },
    })

    return { success: true }
  } catch (error) {
    console.error("[deleteStudentIdentifier] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete student identifier",
    }
  }
}
