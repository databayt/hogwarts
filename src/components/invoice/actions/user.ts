"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Delete the currently authenticated user account
 */
export async function deleteCurrentUser() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // TODO: Implement complete user deletion logic
    // This should include:
    // - Deleting user's invoices
    // - Canceling subscriptions
    // - Removing all related data
    // - Soft delete or hard delete based on requirements

    // For now, just mark user as inactive or delete from DB
    await db.user.delete({
      where: { id: userId },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user account" };
  }
}
