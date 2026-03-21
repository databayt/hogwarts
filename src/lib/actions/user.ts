"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

/**
 * Delete the currently authenticated user account
 */
export async function deleteCurrentUser() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const userId = session.user.id

    // TODO: Implement complete user deletion logic
    // This should include:
    // - Deleting user's invoices
    // - Canceling subscriptions
    // - Removing all related data
    // - Soft delete or hard delete based on requirements

    // For now, just mark user as inactive or delete from DB
    await db.user.delete({
      where: { id: userId },
    })

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user account" }
  }
}
