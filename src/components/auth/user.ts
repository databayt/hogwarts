// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { User as PrismaUser } from "@prisma/client"

import { db } from "@/lib/db"

/** The login key form of an email: trimmed and lowercased. Emails are
 *  stored as typed by whoever entered them, so every lookup goes through
 *  this plus a case-insensitive match. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const emailMatch = (email: string) => ({
  equals: normalizeEmail(email),
  mode: "insensitive" as const,
})

/**
 * Every user an email could mean, best first — case-insensitive, so
 * `Ahmed@Gmail.com` on file matches `ahmed@gmail.com` typed (and the
 * reverse). A school can hold two rows with the same address (an admin
 * adding a teacher twice), so callers that hold a password pick the row it
 * opens via {@link resolveLoginUser} instead of trusting the first.
 *
 * Order:
 * 1. If schoolId provided → that school's rows, most recently updated first
 * 2. Platform users (schoolId = null), those with a password first
 * 3. Fallback (no schoolId hint, no platform user): any row with the email
 */
export const getUsersByEmail = async (
  email: string,
  schoolId?: string | null
): Promise<PrismaUser[]> => {
  try {
    const match = emailMatch(email)
    if (schoolId) {
      const schoolUsers = await db.user.findMany({
        where: { email: match, schoolId },
        orderBy: { updatedAt: "desc" },
      })
      if (schoolUsers.length) return schoolUsers
    }

    const platformUsers = await db.user.findMany({
      where: { email: match, schoolId: null },
      orderBy: { updatedAt: "desc" },
    })
    if (platformUsers.length) {
      return [
        ...platformUsers.filter((u) => u.password),
        ...platformUsers.filter((u) => !u.password),
      ]
    }

    // Backward compat for existing accounts — only without a school hint.
    if (!schoolId) {
      return await db.user.findMany({
        where: { email: match },
        orderBy: { updatedAt: "desc" },
      })
    }
    return []
  } catch (error) {
    console.error("[getUsersByEmail] Database lookup failed:", error)
    return []
  }
}

/** Tenant-aware user lookup by email — the best candidate from {@link getUsersByEmail}. */
export const getUserByEmail = async (
  email: string,
  schoolId?: string | null
) => (await getUsersByEmail(email, schoolId))[0] ?? null

/**
 * Every user an identifier (email OR username) could mean, best first.
 *
 * - Email (contains `@`): {@link getUsersByEmail}.
 * - Username: scoped by schoolId (students/teachers/guardians/staff all live
 *   under a school; login codes are per-school unique). The platform
 *   (schoolId = null) does not accept username login — DEVELOPER accounts
 *   and SaaS users sign in with their email.
 */
export const getUsersByIdentifier = async (
  identifier: string,
  schoolId?: string | null
): Promise<PrismaUser[]> => {
  try {
    const trimmed = identifier.trim()
    if (trimmed.includes("@")) return await getUsersByEmail(trimmed, schoolId)
    if (!schoolId) return []
    return await db.user.findMany({
      where: { username: trimmed, schoolId },
      orderBy: { updatedAt: "desc" },
    })
  } catch (error) {
    console.error("[getUsersByIdentifier] Database lookup failed:", error)
    return []
  }
}

/** Tenant-aware user lookup that accepts either an email OR a username. */
export const getUserByIdentifier = async (
  identifier: string,
  schoolId?: string | null
) => (await getUsersByIdentifier(identifier, schoolId))[0] ?? null

/**
 * The user a sign-in means: the first candidate whose password matches, or —
 * when none does — the best candidate, so the caller's own password check
 * fails exactly as before (wrong password, suspended, OAuth-only). One
 * candidate costs one bcrypt compare, same as before.
 */
export const resolveLoginUser = async (
  identifier: string,
  password: string,
  schoolId?: string | null
): Promise<PrismaUser | null> => {
  const candidates = await getUsersByIdentifier(identifier, schoolId)
  if (candidates.length <= 1) return candidates[0] ?? null
  const { compare } = await import("bcryptjs")
  for (const user of candidates) {
    if (user.password && (await compare(password, user.password))) return user
  }
  return candidates[0]
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
