"use server"

import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { studentIdentifierSchema } from "../shared/validation"

// Add student identifier (barcode, RFID, etc.)
export async function addStudentIdentifier(
  input: z.infer<typeof studentIdentifierSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
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
    },
  })

  return { success: true, identifier }
}

// Get student identifiers
export async function getStudentIdentifiers(studentId?: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.StudentIdentifierWhereInput = { schoolId }
  if (studentId) where.studentId = studentId

  const identifiers = await db.studentIdentifier.findMany({
    where,
    include: {
      student: {
        select: { givenName: true, surname: true },
      },
    },
    orderBy: { issuedAt: "desc" },
  })

  return {
    identifiers: identifiers.map((i) => ({
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
    })),
  }
}

// Find student by identifier (for scanning)
export async function findStudentByIdentifier(input: {
  type: string
  value: string
}): Promise<
  | { found: false; error: string }
  | { found: true; student: { id: string; name: string } }
> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { found: false, error: "Missing school context" }
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
          givenName: true,
          surname: true,
        },
      },
    },
  })

  if (!identifier) {
    return { found: false, error: "Identifier not found or expired" }
  }

  // Update usage stats
  await db.studentIdentifier.update({
    where: { id: identifier.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  })

  return {
    found: true,
    student: {
      id: identifier.student.id,
      name: `${identifier.student.givenName} ${identifier.student.surname}`,
    },
  }
}
