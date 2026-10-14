// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { isBruteForceBlocked, logLoginAttempt } from "@/lib/audit-log"
import { db } from "@/lib/db"
import { getSchoolIdFromSubdomain } from "@/lib/tenant-context"
import { getUserByIdentifier } from "@/components/auth/user"
import { LoginSchema } from "@/components/auth/validation"
import {
  buildAuthResponse,
  tokenVersionOf,
  verifyToken,
} from "@/app/api/mobile/auth/jwt"

/**
 * Mobile Authentication API
 *
 * This endpoint provides JWT-based authentication for mobile apps.
 * Unlike NextAuth's web-based flow (which uses cookies/sessions),
 * this returns access and refresh tokens for mobile clients.
 *
 * POST /api/mobile/auth
 * Body: { identifier: string, password: string, school?: subdomain | schoolId }
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

    // The school the app is signed into: a subdomain ("alabidae") or an id.
    // Six-digit login codes repeat across schools (260001 exists in every
    // one), so a username login is only resolved inside a known school.
    const schoolHint =
      typeof body?.school === "string"
        ? body.school.trim()
        : typeof body?.schoolId === "string"
          ? body.schoolId.trim()
          : ""
    const schoolId = schoolHint
      ? ((await getSchoolIdFromSubdomain(schoolHint)) ??
        (await db.school
          .findUnique({ where: { id: schoolHint }, select: { id: true } })
          .then((s) => s?.id ?? null)))
      : null

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null
    if (await isBruteForceBlocked(trimmedIdentifier, { schoolId, ip })) {
      return NextResponse.json(
        { error: "Too many failed attempts", code: "TOO_MANY_ATTEMPTS" },
        { status: 429 }
      )
    }
    const fail = async (reason: string, userSchoolId?: string | null) =>
      logLoginAttempt({
        email: trimmedIdentifier,
        success: false,
        failureReason: reason,
        schoolId: userSchoolId ?? schoolId,
        ip: ip ?? undefined,
      })

    let user
    if (identifierIsEmail) {
      user = await getUserByIdentifier(trimmedIdentifier, schoolId ?? undefined)
    } else if (schoolId) {
      user = await getUserByIdentifier(trimmedIdentifier, schoolId)
    } else {
      // No school hint (older app builds): only an unambiguous username
      // resolves — never guess between two schools' 260001.
      const matches = await db.user.findMany({
        where: { username: trimmedIdentifier, schoolId: { not: null } },
        take: 2,
      })
      if (matches.length > 1) {
        return NextResponse.json(
          { error: "School required", code: "SCHOOL_REQUIRED" },
          { status: 400 }
        )
      }
      user = matches[0] ?? null
    }

    if (user && identifierIsEmail && !user.schoolId) {
      // Platform user found but has no school — check for a school-scoped version
      const schoolUser = await db.user.findFirst({
        where: { email: trimmedIdentifier, schoolId: { not: null } },
        orderBy: { updatedAt: "desc" },
      })
      if (schoolUser) user = schoolUser
    }

    if (!user) {
      await fail("USER_NOT_FOUND")
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
      await fail("CredentialsSignin", user.schoolId)
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
          isSuspended: true,
          tokenVersion: true,
        },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      if (user.isSuspended) {
        return NextResponse.json({ error: "suspended" }, { status: 403 })
      }

      // A logout (or any revocation) bumps tokenVersion; refresh tokens minted
      // before it can no longer mint new access tokens.
      if (tokenVersionOf(payload) !== user.tokenVersion) {
        return NextResponse.json({ error: "Token revoked" }, { status: 401 })
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
