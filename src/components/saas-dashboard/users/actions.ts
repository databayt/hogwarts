"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  logOperatorAudit,
  requireNotImpersonating,
  requireOperator,
} from "@/components/saas-dashboard/lib/operator-auth"

// ============= Type Definitions =============

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error }

// ============= Validation Schemas =============

const deleteUserSchema = z.object({
  userId: z.string().min(1),
  confirmEmail: z.string().min(1),
  reason: z.string().min(1, "Reason is required for deletion"),
})

const suspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
})

const resetUserSchoolSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().optional(),
})

// ============= User Actions =============

/**
 * Delete a user account and all associated data.
 *
 * Safety:
 * - Cannot delete DEVELOPER accounts
 * - Cannot delete yourself
 * - Type email to confirm
 * - Required reason for audit trail
 * - Deletes role records (Teacher, Student, etc.) in transaction
 * - Account/TwoFactorConfirmation cascade automatically
 */
export async function userDelete(input: {
  userId: string
  confirmEmail: string
  reason: string
}): Promise<ActionResult<{ deletedEmail: string }>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = deleteUserSchema.parse(input)

    // Guard: cannot delete yourself
    if (validated.userId === operator.userId) {
      return {
        success: false,
        error: new Error("Cannot delete your own account"),
      }
    }

    // Fetch user
    const user = await db.user.findUnique({
      where: { id: validated.userId },
      select: {
        id: true,
        email: true,
        role: true,
        schoolId: true,
      },
    })

    if (!user) {
      return { success: false, error: new Error("User not found") }
    }

    // Guard: cannot delete DEVELOPER accounts
    if (user.role === "DEVELOPER") {
      return {
        success: false,
        error: new Error("Cannot delete DEVELOPER accounts"),
      }
    }

    // Guard: email confirmation
    if (validated.confirmEmail !== user.email) {
      return {
        success: false,
        error: new Error("Email does not match"),
      }
    }

    const userEmail = user.email || "unknown"

    // Delete in transaction: role records first, then user
    await db.$transaction(
      async (tx) => {
        // Delete role records that reference this user (RESTRICT FKs)
        await tx.teacher.deleteMany({ where: { userId: user.id } })
        await tx.student.deleteMany({ where: { userId: user.id } })
        await tx.guardian.deleteMany({ where: { userId: user.id } })
        await tx.staffMember.deleteMany({ where: { userId: user.id } })

        // Delete membership requests (userId is optional/SetNull but clean up)
        await tx.membershipRequest.deleteMany({ where: { userId: user.id } })

        // Delete the user — Account, TwoFactorConfirmation cascade automatically
        await tx.user.delete({ where: { id: user.id } })
      },
      { timeout: 30000 }
    )

    // Audit log
    await logOperatorAudit({
      userId: operator.userId,
      schoolId: null,
      action: "USER_DELETED",
      reason: `Deleted user "${userEmail}". Reason: ${validated.reason}`,
    })

    revalidatePath("/users")

    return {
      success: true,
      data: { deletedEmail: userEmail },
    }
  } catch (error) {
    console.error("Failed to delete user:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to delete user"),
    }
  }
}

/**
 * Toggle user suspension status.
 */
export async function userToggleSuspend(input: {
  userId: string
  reason?: string
}): Promise<ActionResult<{ isSuspended: boolean }>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = suspendUserSchema.parse(input)

    // Guard: cannot suspend yourself
    if (validated.userId === operator.userId) {
      return {
        success: false,
        error: new Error("Cannot suspend your own account"),
      }
    }

    const user = await db.user.findUnique({
      where: { id: validated.userId },
      select: { id: true, email: true, role: true, isSuspended: true },
    })

    if (!user) {
      return { success: false, error: new Error("User not found") }
    }

    // Guard: cannot suspend DEVELOPER accounts
    if (user.role === "DEVELOPER") {
      return {
        success: false,
        error: new Error("Cannot suspend DEVELOPER accounts"),
      }
    }

    const updated = await db.user.update({
      where: { id: validated.userId },
      data: { isSuspended: !user.isSuspended },
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: null,
      action: updated.isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
      reason:
        `${updated.isSuspended ? "Suspended" : "Unsuspended"} user "${user.email}". ${validated.reason || ""}`.trim(),
    })

    revalidatePath("/users")

    return {
      success: true,
      data: { isSuspended: updated.isSuspended },
    }
  } catch (error) {
    console.error("Failed to toggle user suspension:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to toggle suspension"),
    }
  }
}

/**
 * Detach user from school (set schoolId=null, role=USER).
 */
export async function userResetSchool(input: {
  userId: string
  reason?: string
}): Promise<ActionResult<{ email: string }>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = resetUserSchoolSchema.parse(input)

    const user = await db.user.findUnique({
      where: { id: validated.userId },
      select: { id: true, email: true, role: true, schoolId: true },
    })

    if (!user) {
      return { success: false, error: new Error("User not found") }
    }

    if (!user.schoolId) {
      return {
        success: false,
        error: new Error("User is not associated with any school"),
      }
    }

    await db.user.update({
      where: { id: validated.userId },
      data: { schoolId: null, role: "USER" },
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: user.schoolId,
      action: "USER_SCHOOL_RESET",
      reason:
        `Detached user "${user.email}" from school. ${validated.reason || ""}`.trim(),
    })

    revalidatePath("/users")

    return {
      success: true,
      data: { email: user.email || "unknown" },
    }
  } catch (error) {
    console.error("Failed to reset user school:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to reset user school"),
    }
  }
}

/**
 * Fetch users with pagination (callable from client components).
 */
export async function fetchUsers(input: {
  page: number
  perPage: number
}): Promise<{ data: UserRow[]; total: number }> {
  try {
    await requireOperator()

    const offset = (input.page - 1) * input.perPage

    const [users, total] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          schoolId: true,
          isSuspended: true,
          emailVerified: true,
          createdAt: true,
          school: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: input.perPage,
      }),
      db.user.count(),
    ])

    const data: UserRow[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      schoolId: u.schoolId,
      schoolName: u.school?.name ?? null,
      isSuspended: u.isSuspended,
      emailVerified: !!u.emailVerified,
      createdAt: u.createdAt.toISOString(),
    }))

    return { data, total }
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return { data: [], total: 0 }
  }
}

// Row type used by columns and table
export type UserRow = {
  id: string
  email: string | null
  username: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  isSuspended: boolean
  emailVerified: boolean
  createdAt: string
}
