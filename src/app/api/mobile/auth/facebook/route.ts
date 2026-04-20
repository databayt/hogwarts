// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { db } from "@/lib/db"
import { buildAuthResponse } from "@/app/api/mobile/auth/jwt"

/**
 * Mobile Facebook Sign-In API
 *
 * Validates a Facebook access token server-side, finds or creates the user,
 * and returns JWT tokens for the mobile client.
 *
 * POST /api/mobile/auth/facebook
 * Body: { access_token: string }
 * Returns: { access_token, refresh_token, expires_at, user }
 */

const FacebookAuthSchema = z.object({
  access_token: z.string().min(1, "Facebook access token is required"),
})

interface FacebookUserPayload {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  picture?: {
    data?: {
      url?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = FacebookAuthSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { access_token: accessToken } = validated.data

    // Verify Facebook access token server-side
    const fbResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
    )

    if (!fbResponse.ok) {
      return NextResponse.json(
        { error: "Invalid Facebook access token" },
        { status: 401 }
      )
    }

    const fbPayload: FacebookUserPayload = await fbResponse.json()

    if (!fbPayload.email) {
      return NextResponse.json(
        { error: "Facebook token missing email claim" },
        { status: 401 }
      )
    }

    const email = fbPayload.email.toLowerCase()
    const displayName =
      [fbPayload.first_name, fbPayload.last_name].filter(Boolean).join(" ") ||
      email.split("@")[0]
    const pictureUrl = fbPayload.picture?.data?.url || null

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
      isSuspended?: boolean | null
    }

    if (existingUser) {
      // Block suspended accounts
      if (existingUser.isSuspended) {
        return NextResponse.json(
          { error: "Account is suspended" },
          { status: 403 }
        )
      }

      // Update avatar if changed
      if (pictureUrl && pictureUrl !== existingUser.image) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { image: pictureUrl },
        })
      }

      user = existingUser
    } else {
      // Create new platform-level user
      user = await db.user.create({
        data: {
          email,
          username: displayName,
          image: pictureUrl,
          emailVerified: new Date(),
          role: "USER",
          // schoolId is null for new Facebook sign-in users
        },
      })
    }

    // Ensure the Facebook account is linked in the Account table
    const existingAccount = await db.account.findFirst({
      where: {
        userId: user.id,
        provider: "facebook",
      },
    })

    if (!existingAccount) {
      await db.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "facebook",
          providerAccountId: fbPayload.id,
          access_token: accessToken,
        },
      })
    }

    // Generate JWT pair and return AuthResponse
    const authResponse = await buildAuthResponse(user)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Mobile Facebook auth error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
