"use server"

import { auth } from "@/auth"
import { compare, hash } from "bcryptjs"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { changePasswordSchema, firstPasswordSchema } from "./validation"

export async function changePassword(input: {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = changePasswordSchema.parse(input)

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // If user has an existing password, require current password
    if (user.password) {
      if (
        !parsed.currentPassword ||
        !(await compare(parsed.currentPassword, user.password))
      ) {
        return {
          success: false,
          error: "WRONG_CURRENT",
          code: "WRONG_CURRENT",
        }
      }
    }
    // OAuth users without a password can set one without providing current password

    const hashedPassword = await hash(parsed.newPassword, 10)

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change password",
    }
  }
}

/**
 * First sign-in after an admin shared credentials: the person just proved
 * they hold the school's PIN, so no "current password" — only a new one
 * (4+ characters, and not the PIN the school handed out). Only works while
 * `mustChangePassword` is set; every other change goes through
 * `changePassword`.
 */
export async function setFirstPassword(input: {
  newPassword: string
  confirmPassword: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const parsed = firstPasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: "INVALID", code: "INVALID" }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, mustChangePassword: true },
    })
    if (!user) return actionError(ACTION_ERRORS.NOT_FOUND)
    if (!user.mustChangePassword) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (
      user.password &&
      (await compare(parsed.data.newPassword, user.password))
    ) {
      return { success: false, error: "SAME_AS_OLD", code: "SAME_AS_OLD" }
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        password: await hash(parsed.data.newPassword, 10),
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("[setFirstPassword] Error:", error)
    return { success: false, error: "FAILED", code: "FAILED" }
  }
}
