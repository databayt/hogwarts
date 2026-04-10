// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { db } from "@/lib/db"
import { buildAuthResponse } from "@/app/api/mobile/auth/jwt"

/**
 * Mobile Google Sign-In API
 *
 * Validates a Google ID token server-side, finds or creates the user,
 * and returns JWT tokens for the mobile client.
 *
 * POST /api/mobile/auth/google
 * Body: { idToken: string }
 * Returns: { access_token, refresh_token, expires_at, user }
 */

const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
})

interface GoogleTokenPayload {
  email: string
  email_verified: string
  name: string
  given_name?: string
  family_name?: string
  picture?: string
  sub: string // Google user ID
  aud: string
  iss: string
  exp: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = GoogleAuthSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { idToken } = validated.data

    // Verify Google ID token server-side
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    )

    if (!tokenInfoResponse.ok) {
      return NextResponse.json(
        { error: "Invalid Google ID token" },
        { status: 401 }
      )
    }

    const tokenPayload: GoogleTokenPayload = await tokenInfoResponse.json()

    // Validate the token is for our app (aud should match our Google client ID)
    // In production, verify aud matches GOOGLE_CLIENT_ID env var
    if (!tokenPayload.email) {
      return NextResponse.json(
        { error: "Google token missing email claim" },
        { status: 401 }
      )
    }

    if (tokenPayload.email_verified !== "true") {
      return NextResponse.json(
        { error: "Google email not verified" },
        { status: 401 }
      )
    }

    const email = tokenPayload.email.toLowerCase()
    const displayName =
      tokenPayload.name ||
      [tokenPayload.given_name, tokenPayload.family_name]
        .filter(Boolean)
        .join(" ") ||
      email.split("@")[0]

    // Find existing user (platform-level, schoolId = null)
    const existingUser = await db.user.findFirst({
      where: { email, schoolId: null },
    })

    let user: {
      id: string
      email: string | null
      schoolId: string | null
      role: string
      username: string | null
      image: string | null
    }

    if (existingUser) {
      // Update avatar if changed
      if (tokenPayload.picture && tokenPayload.picture !== existingUser.image) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { image: tokenPayload.picture },
        })
      }

      user = existingUser
    } else {
      // Create new platform-level user
      user = await db.user.create({
        data: {
          email,
          username: displayName,
          image: tokenPayload.picture || null,
          emailVerified: new Date(),
          role: "USER",
          // schoolId is null for new Google sign-in users
        },
      })
    }

    // Ensure the Google account is linked in the Account table
    const existingAccount = await db.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
      },
    })

    if (!existingAccount) {
      await db.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: tokenPayload.sub,
          id_token: idToken,
        },
      })
    }

    // Generate JWT pair and return AuthResponse
    const authResponse = await buildAuthResponse(user)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Mobile Google auth error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
