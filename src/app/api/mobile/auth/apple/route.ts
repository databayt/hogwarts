// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { db } from "@/lib/db"
import { buildAuthResponse } from "@/app/api/mobile/auth/jwt"

/**
 * Mobile Apple Sign-In API
 *
 * Decodes an Apple identity token (JWT), finds or creates the user,
 * and returns JWT tokens for the mobile client.
 *
 * Apple only sends the user's name on the FIRST sign-in, so given_name
 * and family_name are accepted from the request body.
 *
 * POST /api/mobile/auth/apple
 * Body: { identity_token: string, authorization_code?: string, given_name?: string, family_name?: string }
 * Returns: { access_token, refresh_token, expires_at, user }
 */

const AppleAuthSchema = z.object({
  identity_token: z.string().min(1, "Apple identity token is required"),
  authorization_code: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
})

interface AppleTokenPayload {
  sub: string // Apple user ID (stable across sign-ins)
  email?: string
  email_verified?: string | boolean
}

/**
 * Decode an Apple identity_token JWT payload without verification.
 *
 * Apple identity tokens are JWTs signed with Apple's private key.
 * We decode the payload segment (base64url) to extract claims.
 */
function decodeAppleToken(identityToken: string): AppleTokenPayload {
  const parts = identityToken.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format")
  }

  // Base64url decode the payload (second segment)
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
  const decoded = Buffer.from(payload, "base64").toString("utf-8")
  return JSON.parse(decoded)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = AppleAuthSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const {
      identity_token: identityToken,
      given_name,
      family_name,
    } = validated.data

    // Decode the Apple identity token
    let applePayload: AppleTokenPayload
    try {
      applePayload = decodeAppleToken(identityToken)
    } catch {
      return NextResponse.json(
        { error: "Invalid Apple identity token" },
        { status: 401 }
      )
    }

    if (!applePayload.sub) {
      return NextResponse.json(
        { error: "Apple token missing subject claim" },
        { status: 401 }
      )
    }

    // Apple may not always include email (e.g., "Hide My Email" relay)
    const email = applePayload.email?.toLowerCase() || null

    // Build display name from request body (Apple only sends name on first sign-in)
    const displayName =
      [given_name, family_name].filter(Boolean).join(" ") ||
      (email ? email.split("@")[0] : `Apple User`)

    // First, try to find user by Apple account link (most reliable)
    const existingAccount = await db.account.findFirst({
      where: {
        provider: "apple",
        providerAccountId: applePayload.sub,
      },
      include: { user: true },
    })

    let user: {
      id: string
      email: string | null
      schoolId: string | null
      role: string
      username: string | null
      image: string | null
      isSuspended?: boolean | null
    }

    if (existingAccount) {
      // Found via Apple account link
      if (existingAccount.user.isSuspended) {
        return NextResponse.json(
          { error: "Account is suspended" },
          { status: 403 }
        )
      }

      user = existingAccount.user
    } else if (email) {
      // Try to find by email (platform-level, schoolId = null)
      const existingUser = await db.user.findFirst({
        where: { email, schoolId: null },
      })

      if (existingUser) {
        // Block suspended accounts
        if (existingUser.isSuspended) {
          return NextResponse.json(
            { error: "Account is suspended" },
            { status: 403 }
          )
        }

        // Link Apple account to existing user
        await db.account.create({
          data: {
            userId: existingUser.id,
            type: "oauth",
            provider: "apple",
            providerAccountId: applePayload.sub,
            id_token: identityToken,
          },
        })

        user = existingUser
      } else {
        // Create new platform-level user
        user = await db.user.create({
          data: {
            email,
            username: displayName,
            image: null,
            emailVerified: new Date(),
            role: "USER",
            // schoolId is null for new Apple sign-in users
          },
        })

        // Link Apple account
        await db.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: "apple",
            providerAccountId: applePayload.sub,
            id_token: identityToken,
          },
        })
      }
    } else {
      // No email and no existing account link — create new user without email
      user = await db.user.create({
        data: {
          email: null,
          username: displayName,
          image: null,
          emailVerified: new Date(),
          role: "USER",
        },
      })

      // Link Apple account
      await db.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "apple",
          providerAccountId: applePayload.sub,
          id_token: identityToken,
        },
      })
    }

    // Generate JWT pair and return AuthResponse
    const authResponse = await buildAuthResponse(user)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Mobile Apple auth error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
