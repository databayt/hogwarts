// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import * as z from "zod"

import { db } from "@/lib/db"
import { buildAuthResponse } from "@/app/api/mobile/auth/jwt"

/**
 * Mobile Registration API
 *
 * Creates a new user account with email/password credentials.
 * Respects the @@unique([email, schoolId]) constraint — the same email
 * can exist in different schools, but not twice in the same school.
 *
 * POST /api/mobile/auth/register
 * Body: { email, password, firstName, lastName, schoolId }
 * Returns: { access_token, refresh_token, expires_at, user }
 */

const RegisterSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  school_id: z.string().min(1, "School ID is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = RegisterSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      school_id: schoolId,
    } = validated.data
    const normalizedEmail = email.toLowerCase()

    // Verify school exists and is active
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, isActive: true },
    })

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    if (!school.isActive) {
      return NextResponse.json(
        { error: "School is not currently accepting registrations" },
        { status: 403 }
      )
    }

    // Check if email already exists for this school (@@unique([email, schoolId]))
    const existingUser = await db.user.findFirst({
      where: { email: normalizedEmail, schoolId },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists for this school" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with role USER
    const username = `${firstName} ${lastName}`
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        username,
        role: "USER",
        schoolId,
      },
    })

    // Generate JWT pair and return AuthResponse
    const authResponse = await buildAuthResponse({
      id: user.id,
      email: user.email,
      schoolId: user.schoolId,
      role: user.role,
      username: user.username,
      image: user.image,
    })

    return NextResponse.json(authResponse, { status: 201 })
  } catch (error) {
    console.error("Mobile registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
