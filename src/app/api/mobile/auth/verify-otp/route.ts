// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { db } from "@/lib/db"
import {
  checkRateLimitAsync,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit"

/**
 * Mobile OTP Verification
 *
 * Validates a 6-digit OTP against the VerificationToken table without
 * consuming it: the app checks the code here, then sends the same code to
 * /api/mobile/auth/new-password, which deletes the token once the password
 * changes. Deleting it here made every reset fail at the last step.
 *
 * POST /api/mobile/auth/verify-otp
 * Body: { email: string, otp: string }
 * Returns: 200 on success, 400/401 on failure
 */

const VerifyOTPSchema = z.object({
  email: z.string().email("Valid email is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
})

export async function POST(request: NextRequest) {
  try {
    // Same limit as new-password: a non-consuming check must not become a
    // free oracle for brute-forcing the 6-digit code.
    const rl = await checkRateLimitAsync(
      request,
      RATE_LIMITS.AUTH,
      "mobile-verify-otp"
    )
    if (!rl.allowed) {
      return createRateLimitResponse(rl.resetTime)
    }

    const body = await request.json()

    // Validate input
    const validated = VerifyOTPSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.issues },
        { status: 400 }
      )
    }

    const { email, otp } = validated.data
    const normalizedEmail = email.toLowerCase()

    // Find matching verification token
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        email: normalizedEmail,
        code: otp,
      },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      )
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Clean up expired token
      await db.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 401 }
      )
    }

    // Valid. Leave the token in place — new-password consumes it.
    return NextResponse.json({
      message: "Verification successful",
    })
  } catch (error) {
    console.error("Mobile OTP verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
