// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
import { getUserByIdentifier } from "@/components/auth/user"
import { LoginSchema } from "@/components/auth/validation"
import { buildAuthResponse, verifyToken } from "@/app/api/mobile/auth/jwt"

/**
 * Mobile Authentication API
 *
 * This endpoint provides JWT-based authentication for mobile apps.
 * Unlike NextAuth's web-based flow (which uses cookies/sessions),
 * this returns access and refresh tokens for mobile clients.
 *
 * POST /api/mobile/auth
 * Body: { email: string, password: string }
 * Returns: { access_token, refresh_token, expires_at, user }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedFields = LoginSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validatedFields.error.issues,
        },
        { status: 400 }
      )
    }

    const { identifier, password } = validatedFields.data
    const trimmedIdentifier = identifier.trim()
    const identifierIsEmail = trimmedIdentifier.includes("@")

    // Find user. Mobile clients may send either an email or a generated
    // student username — getUserByIdentifier branches on the `@` sign. Without
    // a subdomain context, username lookups aren't tenant-scoped here; we fall
    // back to cross-school search for email only (preserves prior behavior).
    let user = identifierIsEmail
      ? await getUserByIdentifier(trimmedIdentifier)
      : // Cross-school username search for mobile — scan schools to find the
        // matching student handle. Usernames are per-school unique but mobile
        // has no subdomain hint, so findFirst picks the most recent match.
        await db.user.findFirst({
          where: { username: trimmedIdentifier, schoolId: { not: null } },
          orderBy: { updatedAt: "desc" },
        })

    if (user && identifierIsEmail && !user.schoolId) {
      // Platform user found but has no school — check for a school-scoped version
      const schoolUser = await db.user.findFirst({
        where: { email: trimmedIdentifier, schoolId: { not: null } },
        orderBy: { updatedAt: "desc" },
      })
      if (schoolUser) user = schoolUser
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      return NextResponse.json(
        { error: "Please login with your OAuth provider (Google/Facebook)" },
        { status: 401 }
      )
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, user.password)

    if (!passwordsMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Block suspended accounts
    if ((user as any).isSuspended) {
      return NextResponse.json(
        { error: "Account is suspended" },
        { status: 403 }
      )
    }

    // Returns tokens + user info (including student grade for STUDENT-role users)
    const authResponse = await buildAuthResponse(user)
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("Mobile auth error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Token Refresh Endpoint
 *
 * POST /api/mobile/auth with X-Refresh-Token header
 * Returns: new access_token and refresh_token
 */
export async function PUT(request: NextRequest) {
  try {
    const refreshToken = request.headers.get("X-Refresh-Token")

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 401 }
      )
    }

    // Verify refresh token
    try {
      const { payload } = await verifyToken(refreshToken)

      if (payload.type !== "refresh") {
        return NextResponse.json(
          { error: "Invalid token type" },
          { status: 401 }
        )
      }

      const userId = payload.sub as string

      // Fetch fresh user data
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          schoolId: true,
          role: true,
          username: true,
          image: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      const authResponse = await buildAuthResponse(user)

      return NextResponse.json(authResponse)
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
