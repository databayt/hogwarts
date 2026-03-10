// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Student Access Code Utility
 *
 * Generates, validates, and redeems XXXX-XXXX-XXXX format access codes
 * that allow guardians to link themselves to students.
 *
 * Uses an unambiguous character set (no 0/O/I/L/1) to prevent
 * transcription errors when codes are printed or shared verbally.
 */

import { db } from "@/lib/db"

// Unambiguous characters: excludes 0, O, I, L, 1
const UNAMBIGUOUS_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
const CODE_SEGMENT_LENGTH = 4
const CODE_SEGMENTS = 3
const MAX_COLLISION_RETRIES = 5
const DEFAULT_EXPIRY_DAYS = 90

/**
 * Generate a single access code segment of random characters
 * using crypto.getRandomValues for secure randomness.
 */
function generateSegment(): string {
  const values = new Uint8Array(CODE_SEGMENT_LENGTH)
  crypto.getRandomValues(values)
  let segment = ""
  for (let i = 0; i < CODE_SEGMENT_LENGTH; i++) {
    segment += UNAMBIGUOUS_CHARS[values[i] % UNAMBIGUOUS_CHARS.length]
  }
  return segment
}

/**
 * Generate a formatted access code in XXXX-XXXX-XXXX format.
 */
export function generateStudentAccessCode(): string {
  const segments: string[] = []
  for (let i = 0; i < CODE_SEGMENTS; i++) {
    segments.push(generateSegment())
  }
  return segments.join("-")
}

/**
 * Normalize a code for database lookup.
 * Strips dashes and converts to uppercase.
 */
function normalizeCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase()
}

/**
 * Format a normalized code back into XXXX-XXXX-XXXX format.
 */
function formatCode(normalized: string): string {
  const segments: string[] = []
  for (let i = 0; i < CODE_SEGMENTS; i++) {
    segments.push(
      normalized.slice(i * CODE_SEGMENT_LENGTH, (i + 1) * CODE_SEGMENT_LENGTH)
    )
  }
  return segments.join("-")
}

/**
 * Generate an access code for a specific student and persist it to the database.
 * Retries on collision up to MAX_COLLISION_RETRIES times.
 *
 * @param schoolId - The school tenant ID
 * @param studentId - The student record ID
 * @returns The created access code record
 */
export async function generateAccessCodeForStudent(
  schoolId: string,
  studentId: string
): Promise<{ id: string; code: string; expiresAt: Date }> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_EXPIRY_DAYS)

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = generateStudentAccessCode()
    try {
      const record = await db.studentAccessCode.create({
        data: {
          schoolId,
          studentId,
          code,
          expiresAt,
        },
      })
      return { id: record.id, code: record.code, expiresAt }
    } catch (error: unknown) {
      // Check for unique constraint violation (Prisma P2002)
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        if (attempt === MAX_COLLISION_RETRIES - 1) {
          throw new Error(
            "Failed to generate unique access code after maximum retries"
          )
        }
        continue
      }
      throw error
    }
  }

  throw new Error("Failed to generate access code")
}

/**
 * Generate access codes for multiple students in bulk.
 *
 * @param schoolId - The school tenant ID
 * @param studentIds - Array of student record IDs
 * @returns Array of generated codes with student IDs
 */
export async function generateAccessCodesForStudents(
  schoolId: string,
  studentIds: string[]
): Promise<
  Array<{
    studentId: string
    code: string
    expiresAt: Date
  }>
> {
  const results: Array<{
    studentId: string
    code: string
    expiresAt: Date
  }> = []

  for (const studentId of studentIds) {
    const result = await generateAccessCodeForStudent(schoolId, studentId)
    results.push({
      studentId,
      code: result.code,
      expiresAt: result.expiresAt,
    })
  }

  return results
}

/**
 * Validate an access code and return the associated student info if valid.
 *
 * @param schoolId - The school tenant ID
 * @param code - The access code to validate (with or without dashes)
 * @returns Student info if code is valid, null otherwise
 */
export async function validateAccessCode(
  schoolId: string,
  code: string
): Promise<{
  valid: boolean
  studentId?: string
  studentName?: string
  codeId?: string
  error?: string
}> {
  // Normalize the input code and reformat for DB lookup
  const normalized = normalizeCode(code)
  if (normalized.length !== CODE_SEGMENT_LENGTH * CODE_SEGMENTS) {
    return { valid: false, error: "Invalid code format" }
  }
  const formattedCode = formatCode(normalized)

  const accessCode = await db.studentAccessCode.findFirst({
    where: {
      schoolId,
      code: formattedCode,
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

  if (!accessCode) {
    return { valid: false, error: "Code not found" }
  }

  if (accessCode.usedAt) {
    return { valid: false, error: "Code has already been used" }
  }

  if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
    return { valid: false, error: "Code has expired" }
  }

  return {
    valid: true,
    studentId: accessCode.studentId,
    studentName:
      `${accessCode.student.givenName} ${accessCode.student.surname}`.trim(),
    codeId: accessCode.id,
  }
}

/**
 * Redeem an access code: marks it as used and creates a StudentGuardian link.
 *
 * @param schoolId - The school tenant ID
 * @param code - The access code to redeem
 * @param guardianId - The guardian record ID (not user ID)
 * @param guardianTypeId - The guardian type ID (father, mother, etc.)
 * @returns The created StudentGuardian record ID
 */
export async function redeemAccessCode(
  schoolId: string,
  code: string,
  guardianId: string,
  guardianTypeId: string
): Promise<{ studentGuardianId: string; studentId: string }> {
  const normalized = normalizeCode(code)
  const formattedCode = formatCode(normalized)

  return await db.$transaction(async (tx) => {
    // Lock and validate the code
    const accessCode = await tx.studentAccessCode.findFirst({
      where: {
        schoolId,
        code: formattedCode,
        usedAt: null,
      },
    })

    if (!accessCode) {
      throw new Error("Invalid or already used access code")
    }

    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      throw new Error("Access code has expired")
    }

    // Check if the guardian-student link already exists
    const existingLink = await tx.studentGuardian.findFirst({
      where: {
        schoolId,
        studentId: accessCode.studentId,
        guardianId,
      },
    })

    if (existingLink) {
      throw new Error("Guardian is already linked to this student")
    }

    // Mark the code as used
    await tx.studentAccessCode.update({
      where: { id: accessCode.id },
      data: {
        usedAt: new Date(),
        usedById: guardianId,
      },
    })

    // Create the StudentGuardian link
    const studentGuardian = await tx.studentGuardian.create({
      data: {
        schoolId,
        studentId: accessCode.studentId,
        guardianId,
        guardianTypeId,
        isPrimary: false,
      },
    })

    return {
      studentGuardianId: studentGuardian.id,
      studentId: accessCode.studentId,
    }
  })
}
