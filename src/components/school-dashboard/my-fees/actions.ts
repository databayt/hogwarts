"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Mirrors the PaymentMethod enum declared in Prisma.
const ALLOWED_METHODS = [
  "CASH",
  "CHEQUE",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "UPI",
  "NET_BANKING",
  "WALLET",
  "OTHER",
] as const
type AllowedMethod = (typeof ALLOWED_METHODS)[number]

async function userOwnsStudent(
  userId: string,
  schoolId: string,
  studentId: string
): Promise<boolean> {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: { userId: true },
  })
  if (!student) return false
  if (student.userId === userId) return true

  const guardianLink = await db.studentGuardian.findFirst({
    where: {
      schoolId,
      studentId,
      guardian: { userId },
    },
    select: { id: true },
  })
  return !!guardianLink
}

export async function setPreferredPaymentMethod(
  studentId: string,
  method: string | null
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    if (method !== null && !ALLOWED_METHODS.includes(method as AllowedMethod)) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    const owns = await userOwnsStudent(session.user.id, schoolId, studentId)
    if (!owns) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    // Tenant-scoped write: enforce schoolId at the query level (not just the
    // ownership pre-check) so isolation holds even if the check ever drifts.
    const updated = await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        preferredPaymentMethod: method as AllowedMethod | null,
      },
    })
    if (updated.count === 0) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    revalidatePath("/my-fees")
    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
