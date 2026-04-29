// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared JWT utilities for mobile API authentication.
 *
 * All mobile auth routes use HS256 JWTs signed with AUTH_SECRET.
 * Access tokens carry user claims (id, email, schoolId, role).
 * Refresh tokens carry only the user ID and are longer-lived.
 */

import { jwtVerify, SignJWT } from "jose"

import { db } from "@/lib/db"

if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required")
}

export const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET)

const ACCESS_TOKEN_EXPIRY = "24h"
const REFRESH_TOKEN_EXPIRY = "7d"

export async function generateAccessToken(user: {
  id: string
  email: string
  schoolId: string | null
  role: string
}) {
  return new SignJWT({
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
}

export async function generateRefreshToken(userId: string) {
  return new SignJWT({
    sub: userId,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string) {
  return jwtVerify(token, JWT_SECRET)
}

/**
 * Resolve the AcademicGrade.gradeNumber for a STUDENT-role user. Other roles
 * have no grade. Returned in the mobile auth response so the Android Stream
 * catalog can auto-filter for the logged-in student.
 */
async function resolveStudentGrade(
  userId: string,
  role: string
): Promise<number | null> {
  if (role !== "STUDENT") return null
  const student = await db.student.findUnique({
    where: { userId },
    select: { academicGrade: { select: { gradeNumber: true } } },
  })
  return student?.academicGrade?.gradeNumber ?? null
}

/**
 * Build the standard AuthResponse user object (snake_case for mobile DTOs).
 */
export async function buildUserResponse(user: {
  id: string
  email: string | null
  schoolId: string | null
  role: string
  username: string | null
  image: string | null
}) {
  const grade = await resolveStudentGrade(user.id, user.role)
  return {
    id: user.id,
    email: user.email,
    school_id: user.schoolId,
    role: user.role,
    given_name: user.username?.split(" ")[0] || null,
    family_name: user.username?.split(" ").slice(1).join(" ") || null,
    avatar_url: user.image,
    grade,
  }
}

/**
 * Generate the full AuthResponse (tokens + user info).
 */
export async function buildAuthResponse(user: {
  id: string
  email: string | null
  schoolId: string | null
  role: string
  username: string | null
  image: string | null
}) {
  const [accessToken, refreshToken, userResponse] = await Promise.all([
    generateAccessToken({
      id: user.id,
      email: user.email || "",
      schoolId: user.schoolId,
      role: user.role,
    }),
    generateRefreshToken(user.id),
    buildUserResponse(user),
  ])

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    user: userResponse,
  }
}
