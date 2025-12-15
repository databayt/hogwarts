import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { User as PrismaUser } from "@prisma/client"

import { db } from "@/lib/db"

export const getUserByEmail = async (email: string) => {
  try {
    // In multi-tenant setup, we need to find users by email
    // We'll get the first user with this email (for OAuth, this is usually what we want)
    const users = await db.user.findMany({
      where: { email },
      orderBy: { createdAt: "desc" }, // Get the most recent user with this email
    })

    return users[0] || null // Return the first user or null
  } catch {
    return null
  }
}

export type ExtendedUser = PrismaUser & {
  firstName?: string | null
  lastName?: string | null
  currency?: string | null
}

export const getUserById = async (id: string): Promise<ExtendedUser | null> => {
  try {
    const user = await db.user.findUnique({ where: { id } })
    return (user as unknown as ExtendedUser) ?? null
  } catch {
    return null
  }
}

// New function to handle OAuth user creation/linking
export const getOrCreateOAuthUser = async (
  email: string,
  provider: string,
  profile: { name?: string; username?: string; image?: string }
) => {
  try {
    // First, try to find an existing user with this email
    const users = await db.user.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
    })

    let user = users[0]

    if (!user) {
      // Create a new user for OAuth (without schoolId initially)
      user = await db.user.create({
        data: {
          email,
          username: profile.name || profile.username || email.split("@")[0],
          image: profile.image,
          emailVerified: new Date(),
          role: "USER", // Default role for OAuth users
        },
      })
    }

    return user
  } catch (error) {
    console.error("Error in getOrCreateOAuthUser:", error)
    return null
  }
}

/**
 * Delete the currently authenticated user account
 * NOTE: This is a destructive operation. Use with caution.
 * Recommended: Implement soft delete or archive instead of hard delete
 */
export async function deleteCurrentUser() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // CRITICAL: Multi-tenant safety - only delete if user has proper context
    // For production, consider:
    // 1. Soft delete (isActive: false) instead of hard delete
    // 2. Archive user data before deletion
    // 3. Cancel subscriptions via Stripe API
    // 4. Remove from external services (Plaid, Dwolla, etc.)
    // 5. Cascade delete or nullify related records

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
