"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { redeemAccessCode, validateAccessCode } from "@/lib/student-access-code"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * Validate a link code entered by a guardian.
 * Returns student info if the code is valid.
 */
export async function validateLinkCode(input: { code: string }): Promise<
  | {
      success: true
      data: {
        studentId: string
        studentName: string
        codeId: string
      }
    }
  | { success: false; error: string }
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { code } = z
      .object({ code: z.string().min(1, "Code is required") })
      .parse(input)

    const result = await validateAccessCode(schoolId, code)

    if (!result.valid) {
      return {
        success: false,
        error: result.error || "Invalid access code",
      }
    }

    return {
      success: true,
      data: {
        studentId: result.studentId!,
        studentName: result.studentName!,
        codeId: result.codeId!,
      },
    }
  } catch (error) {
    console.error("[validateLinkCode] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to validate code",
    }
  }
}

/**
 * Confirm linking a child to the current guardian using an access code.
 * Redeems the code and creates the StudentGuardian relationship.
 */
export async function confirmLinkChild(input: {
  code: string
  guardianTypeId: string
}): Promise<
  | {
      success: true
      data: { studentGuardianId: string; studentId: string }
    }
  | { success: false; error: string }
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const parsed = z
      .object({
        code: z.string().min(1, "Code is required"),
        guardianTypeId: z.string().min(1, "Guardian type is required"),
      })
      .parse(input)

    // Find the guardian record for the current user
    const guardian = await db.guardian.findFirst({
      where: {
        schoolId,
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!guardian) {
      return {
        success: false,
        error:
          "No guardian profile found. Please ensure your account is set up as a guardian.",
      }
    }

    const result = await redeemAccessCode(
      schoolId,
      parsed.code,
      guardian.id,
      parsed.guardianTypeId
    )

    revalidatePath("/parents")
    revalidatePath(`/students/${result.studentId}`)

    return {
      success: true,
      data: {
        studentGuardianId: result.studentGuardianId,
        studentId: result.studentId,
      },
    }
  } catch (error) {
    console.error("[confirmLinkChild] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link child",
    }
  }
}

/**
 * Get guardian types for the current school (for the link dialog dropdown).
 */
export async function getGuardianTypesForLink(): Promise<
  | {
      success: true
      data: Array<{ id: string; name: string }>
    }
  | { success: false; error: string }
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    let types = await db.guardianType.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    // Create default types if none exist
    if (types.length === 0) {
      const defaultTypes = ["father", "mother", "guardian", "other"]
      for (const typeName of defaultTypes) {
        await db.guardianType.create({
          data: { schoolId, name: typeName },
        })
      }
      types = await db.guardianType.findMany({
        where: { schoolId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    }

    return { success: true, data: types }
  } catch (error) {
    console.error("[getGuardianTypesForLink] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch guardian types",
    }
  }
}
