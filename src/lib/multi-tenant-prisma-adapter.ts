/**
 * Multi-Tenant Prisma Adapter for AuthJS v5
 *
 * PROBLEM: The standard Prisma adapter uses `findUnique({ where: { email } })`
 * but our User model has `@@unique([email, schoolId])` instead of `@unique email`.
 * This causes AdapterError during OAuth because Prisma can't find users by email alone.
 *
 * SOLUTION: Override the adapter methods to query with `{ email, schoolId: null }`
 * for OAuth users who haven't been assigned to a school yet.
 *
 * @see https://github.com/nextauthjs/next-auth/discussions/4405
 * @see https://github.com/nextauthjs/next-auth/pull/12521
 */

import { PrismaAdapter } from "@auth/prisma-adapter"
import type { PrismaClient } from "@prisma/client"
import type { Adapter, AdapterUser } from "next-auth/adapters"

/**
 * Creates a multi-tenant Prisma adapter that handles the composite
 * unique constraint `@@unique([email, schoolId])` on the User model.
 *
 * OAuth users are stored with `schoolId = null` until they join a school.
 */
export function MultiTenantPrismaAdapter(prisma: PrismaClient): Adapter {
  // Get the base adapter
  const baseAdapter = PrismaAdapter(prisma)

  return {
    ...baseAdapter,

    /**
     * Override: Get user by email for OAuth scenarios
     *
     * The standard adapter uses `findUnique({ where: { email } })` which fails
     * with our composite unique constraint. We query for users with null schoolId
     * (OAuth users not yet assigned to a school).
     */
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      if (!email) return null

      try {
        // First, try to find a user with this email and null schoolId (OAuth user)
        const user = await prisma.user.findFirst({
          where: {
            email,
            schoolId: null,
          },
        })

        if (!user) return null

        return {
          id: user.id,
          email: user.email!,
          emailVerified: user.emailVerified,
          name: user.username,
          image: user.image,
        }
      } catch (error) {
        console.error("[ADAPTER] getUserByEmail error:", error)
        return null
      }
    },

    /**
     * Override: Create user for OAuth scenarios
     *
     * Ensure the user is created with schoolId = null for OAuth users.
     * They will be assigned to a school later during onboarding.
     */
    async createUser(data: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      try {
        const user = await prisma.user.create({
          data: {
            email: data.email,
            emailVerified: data.emailVerified,
            username: data.name,
            image: data.image,
            schoolId: null, // OAuth users start without a school
          },
        })

        console.log("[ADAPTER] Created OAuth user:", {
          id: user.id,
          email: user.email,
        })

        return {
          id: user.id,
          email: user.email!,
          emailVerified: user.emailVerified,
          name: user.username,
          image: user.image,
        }
      } catch (error) {
        console.error("[ADAPTER] createUser error:", error)
        throw error
      }
    },

    /**
     * Override: Get user by account for linking OAuth accounts
     *
     * This finds the user associated with an OAuth account (provider + providerAccountId).
     */
    async getUserByAccount(
      account: Pick<
        { provider: string; providerAccountId: string },
        "provider" | "providerAccountId"
      >
    ): Promise<AdapterUser | null> {
      try {
        const dbAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          include: {
            user: true,
          },
        })

        if (!dbAccount?.user) return null

        return {
          id: dbAccount.user.id,
          email: dbAccount.user.email!,
          emailVerified: dbAccount.user.emailVerified,
          name: dbAccount.user.username,
          image: dbAccount.user.image,
        }
      } catch (error) {
        console.error("[ADAPTER] getUserByAccount error:", error)
        return null
      }
    },

    /**
     * Override: Link account to user
     *
     * Creates the Account record linking an OAuth provider to a User.
     */
    async linkAccount(account: {
      userId: string
      type: string
      provider: string
      providerAccountId: string
      refresh_token?: string | null
      access_token?: string | null
      expires_at?: number | null
      token_type?: string | null
      scope?: string | null
      id_token?: string | null
      session_state?: string | null
    }): Promise<void> {
      try {
        await prisma.account.create({
          data: {
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        })

        console.log("[ADAPTER] Linked account:", {
          userId: account.userId,
          provider: account.provider,
        })
      } catch (error) {
        console.error("[ADAPTER] linkAccount error:", error)
        throw error
      }
    },
  }
}
