// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import * as z from "zod"

import { db } from "@/lib/db"

/**
 * Mobile OTP Verification
 *
 * Validates a 6-digit OTP against the VerificationToken table.
 * On success, deletes the token so it cannot be reused.
 * The mobile app calls this before showing the new-password screen.
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

    // OTP is valid — delete the token so it cannot be reused
    await db.verificationToken.delete({
      where: { id: verificationToken.id },
    })

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
