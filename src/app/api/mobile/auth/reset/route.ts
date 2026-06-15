// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { db } from "@/lib/db"
import {
  checkRateLimitAsync,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit"
import { sendPasswordResetCodeEmail } from "@/components/auth/mail"
import { getUserByEmail } from "@/components/auth/user"

/**
 * Mobile Password Reset — Request OTP
 *
 * Generates a 6-digit OTP, stores it as a VerificationToken with
 * a 10-minute expiry. In dev mode the OTP is logged to console;
 * in production it should be sent via email (stubbed for now).
 *
 * POST /api/mobile/auth/reset
 * Body: { email: string }
 * Returns: 200 with { message } (always succeeds to prevent email enumeration)
 */

const ResetSchema = z.object({
  email: z.string().email("Valid email is required"),
})

function generateOTP(): string {
  // Cryptographically random 6-digit code
  return crypto.randomInt(100000, 999999).toString()
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by client IP — caps reset-request spam and enumeration.
    const rl = await checkRateLimitAsync(
      request,
      RATE_LIMITS.AUTH,
      "mobile-reset"
    )
    if (!rl.allowed) {
      return createRateLimitResponse(rl.resetTime)
    }

    const body = await request.json()

    // Validate input
    const validated = ResetSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { email } = validated.data
    const normalizedEmail = email.toLowerCase()

    // Check if user exists (but always return 200 to prevent email enumeration)
    const user = await getUserByEmail(normalizedEmail)

    if (user) {
      const otp = generateOTP()
      const token = crypto.randomUUID()
      const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Delete any existing verification tokens for this email
      await db.verificationToken.deleteMany({
        where: { email: normalizedEmail },
      })

      // Create new verification token with OTP code
      await db.verificationToken.create({
        data: {
          email: normalizedEmail,
          token,
          code: otp,
          expires,
        },
      })

      // Log OTP in development only
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[MOBILE RESET] OTP for ${normalizedEmail}: ${otp} (expires: ${expires.toISOString()})`
        )
      }

      // Deliver the code by email (fire-and-forget — failures are logged inside
      // the helper; the response stays neutral to avoid enumeration).
      await sendPasswordResetCodeEmail(normalizedEmail, otp)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        "If an account with that email exists, a verification code has been sent.",
    })
  } catch (error) {
    console.error("Mobile password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
