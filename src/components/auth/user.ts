// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { User as PrismaUser } from "@prisma/client"

import { db } from "@/lib/db"

/**
 * Tenant-aware user lookup by email.
 *
 * Priority:
 * 1. If schoolId provided → exact match for that school
 * 2. Platform user (schoolId = null) with a password
 * 3. Any platform user (schoolId = null)
 * 4. Fallback: most recently updated user with that email (backward compat)
 */
export const getUserByEmail = async (
  email: string,
  schoolId?: string | null
) => {
  try {
    // When schoolId is provided, look for user in that specific school
    if (schoolId) {
      const schoolUser = await db.user.findFirst({
        where: { email, schoolId },
      })
      if (schoolUser) return schoolUser
    }

    // Look for platform user (no school association)
    const platformUsers = await db.user.findMany({
      where: { email, schoolId: null },
      orderBy: { updatedAt: "desc" },
    })

    // Prefer platform user with a password (credential login)
    const withPassword = platformUsers.find((u) => u.password)
    if (withPassword) return withPassword
    if (platformUsers[0]) return platformUsers[0]

    // Fallback: any user with this email (backward compat for existing accounts)
    // Only used when no schoolId hint and no platform user exists
    if (!schoolId) {
      const anyUser = await db.user.findFirst({
        where: { email },
        orderBy: { updatedAt: "desc" },
      })
      return anyUser
    }

    return null
  } catch (error) {
    console.error("[getUserByEmail] Database lookup failed:", error)
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
  } catch (error) {
    console.error("[getUserById] Database lookup failed:", error)
    return null
  }
}

/**
 * OAuth user creation/linking — always uses platform-level users (schoolId = null).
 */
export const getOrCreateOAuthUser = async (
  email: string,
  provider: string,
  profile: { name?: string; username?: string; image?: string }
) => {
  try {
    // Look for platform-level user first (schoolId = null)
    const platformUsers = await db.user.findMany({
      where: { email, schoolId: null },
      orderBy: { createdAt: "desc" },
    })

    let user = platformUsers[0]

    if (!user) {
      // Create a new platform-level user for OAuth
      user = await db.user.create({
        data: {
          email,
          username: profile.name || profile.username || email.split("@")[0],
          image: profile.image,
          emailVerified: new Date(),
          role: "USER",
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
 */
export async function deleteCurrentUser() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

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
