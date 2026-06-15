// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import * as z from "zod"

import { db } from "@/lib/db"
import {
  checkRateLimitAsync,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit"
import { getUserByEmail } from "@/components/auth/user"

/**
 * Mobile New Password API
 *
 * Resets a user's password after OTP verification.
 * Requires the OTP to be validated again (defense-in-depth) so that
 * a direct call to this endpoint without prior verify-otp still works
 * securely. The OTP is consumed (deleted) after use.
 *
 * CRITICAL: dev@databayt.org is protected from password changes
 * via this endpoint to prevent accidental lockout of the developer account.
 *
 * POST /api/mobile/auth/new-password
 * Body: { email: string, otp: string, newPassword: string }
 * Returns: 200 on success
 */

const NewPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  new_password: z.string().min(6, "Password must be at least 6 characters"),
})

// Protected developer account — cannot be modified via mobile reset
const PROTECTED_EMAIL = "dev@databayt.org"

export async function POST(request: NextRequest) {
  try {
    // Rate limit by client IP — without this a 6-digit OTP (1M combinations)
    // could be brute-forced within its 10-minute window.
    const rl = await checkRateLimitAsync(
      request,
      RATE_LIMITS.AUTH,
      "mobile-new-password"
    )
    if (!rl.allowed) {
      return createRateLimitResponse(rl.resetTime)
    }

    const body = await request.json()

    // Validate input
    const validated = NewPasswordSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { email, otp, new_password: newPassword } = validated.data
    const normalizedEmail = email.toLowerCase()

    // Protect developer account
    if (normalizedEmail === PROTECTED_EMAIL) {
      return NextResponse.json(
        { error: "This account cannot be modified via mobile reset" },
        { status: 403 }
      )
    }

    // Verify OTP (defense-in-depth — even if verify-otp was called before)
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        email: normalizedEmail,
        code: otp,
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 401 }
      )
    }

    // Check expiry
    if (new Date() > verificationToken.expires) {
      await db.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 401 }
      )
    }

    // Find the user
    const user = await getUserByEmail(normalizedEmail)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    })

    // Delete the verification token (consumed)
    await db.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    return NextResponse.json({
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Mobile new password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
