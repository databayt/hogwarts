import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

import { db } from "@/lib/db"
import { getUserByEmail } from "@/components/auth/user"
import { LoginSchema } from "@/components/auth/validation"

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

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "your-secret-key"
)

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "24h" // 24 hours
const REFRESH_TOKEN_EXPIRY = "7d" // 7 days

async function generateAccessToken(user: {
  id: string
  email: string
  schoolId: string | null
  role: string
}) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    schoolId: user.schoolId,
    role: user.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)

  return token
}

async function generateRefreshToken(userId: string) {
  const token = await new SignJWT({
    sub: userId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)

  return token
}

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

    const { email, password } = validatedFields.data

    // Find user by email
    const user = await getUserByEmail(email)

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

    // Generate tokens
    const accessToken = await generateAccessToken({
      id: user.id,
      email: user.email || "",
      schoolId: user.schoolId,
      role: user.role,
    })

    const refreshToken = await generateRefreshToken(user.id)

    // Calculate expiry timestamp (24 hours from now)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000

    // Return tokens and user info
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user: {
        id: user.id,
        email: user.email,
        school_id: user.schoolId,
        role: user.role,
        given_name: user.username?.split(" ")[0] || null,
        family_name: user.username?.split(" ").slice(1).join(" ") || null,
        avatar_url: user.image,
      },
    })
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
    const { jwtVerify } = await import("jose")

    try {
      const { payload } = await jwtVerify(refreshToken, JWT_SECRET)

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

      // Generate new tokens
      const newAccessToken = await generateAccessToken({
        id: user.id,
        email: user.email || "",
        schoolId: user.schoolId,
        role: user.role,
      })

      const newRefreshToken = await generateRefreshToken(user.id)

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000

      return NextResponse.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: expiresAt,
        user: {
          id: user.id,
          email: user.email,
          school_id: user.schoolId,
          role: user.role,
          given_name: user.username?.split(" ")[0] || null,
          family_name: user.username?.split(" ").slice(1).join(" ") || null,
          avatar_url: user.image,
        },
      })
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
