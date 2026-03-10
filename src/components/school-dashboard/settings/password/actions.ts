"use server"

import { auth } from "@/auth"
import { compare, hash } from "bcryptjs"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { changePasswordSchema } from "./validation"

export async function changePassword(input: {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const parsed = changePasswordSchema.parse(input)

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // If user has an existing password, require current password
    if (user.password) {
      if (!parsed.currentPassword) {
        return { success: false, error: "Current password is required" }
      }

      const isValid = await compare(parsed.currentPassword, user.password)
      if (!isValid) {
        return { success: false, error: "Current password is incorrect" }
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
