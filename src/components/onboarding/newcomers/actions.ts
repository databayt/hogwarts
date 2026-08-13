"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { addMinutes } from "date-fns"

import { db } from "@/lib/db"
import { sendVerificationCodeEmail } from "@/lib/email"
import { getTenantContext } from "@/lib/tenant-context"

import type { NewcomerFormData } from "./validation"

/**
 * Generate a secure 6-digit verification code
 */
function generateSecureCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send verification code to email
 */
export async function sendVerificationCode(email: string, schoolId?: string) {
  try {
    // Check if email already exists as a user in this school
    const existingUser = await db.user.findFirst({
      where: schoolId ? { email, schoolId } : { email },
    })

    if (existingUser) {
      return {
        success: false,
        errorCode: "EMAIL_ALREADY_REGISTERED",
      }
    }

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { email },
    })

    // Generate new code
    const code = generateSecureCode()
    const expires = addMinutes(new Date(), 15) // 15 minutes expiry

    // Store token
    await db.verificationToken.create({
      data: {
        email,
        token: code,
        expires,
      },
    })

    // Send email
    await sendVerificationCodeEmail(email, code)

    return { success: true }
  } catch (error) {
    console.error("[Newcomer] Failed to send verification code:", error)
    return {
      success: false,
      errorCode: "SEND_CODE_FAILED",
    }
  }
}

/**
 * Verify email code
 */
export async function verifyEmailCode(email: string, code: string) {
  try {
    const token = await db.verificationToken.findFirst({
      where: {
        email,
        token: code,
        expires: { gt: new Date() },
      },
    })

    if (!token) {
      return {
        success: false,
        errorCode: "INVALID_OR_EXPIRED_CODE",
      }
    }

    // Deliberately does NOT consume the token: this is the wizard's
    // "is that the right code?" step, and the account is not created until
    // submitNewcomerApplication, which re-checks and consumes it there. When
    // this function deleted the token, the proof of ownership was gone by the
    // time it actually mattered, and the submit action -- a public POST
    // endpoint like every "use server" function -- trusted the client's word
    // that verification had happened.
    return { success: true, verified: true }
  } catch (error) {
    console.error("[Newcomer] Failed to verify code:", error)
    return {
      success: false,
      errorCode: "VERIFICATION_FAILED",
    }
  }
}

/**
 * Submit newcomer application
 */
export async function submitNewcomerApplication(
  schoolId: string,
  data: NewcomerFormData
) {
  try {
    // Verify the school exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    })

    if (!school) {
      return { success: false, errorCode: "SCHOOL_NOT_FOUND" }
    }

    // The emailed code IS the credential for this flow (it is open to people
    // with no account yet), so it must be proven HERE, where the account is
    // created -- not left to a separate client-invoked step. Pinning to the
    // request's tenant additionally stops school A's page being used to create
    // an account at school B by naming its id.
    const tenant = await getTenantContext()
    if (!tenant.schoolId || tenant.schoolId !== schoolId) {
      return { success: false, errorCode: "SCHOOL_NOT_FOUND" }
    }

    const verification = await db.verificationToken.findFirst({
      where: {
        email: data.email,
        token: data.verificationCode,
        expires: { gt: new Date() },
      },
      select: { id: true },
    })

    if (!verification) {
      return { success: false, errorCode: "INVALID_OR_EXPIRED_CODE" }
    }

    // Check if email is already registered in this school
    const existingUser = await db.user.findFirst({
      where: { email: data.email, schoolId },
    })

    if (existingUser) {
      return {
        success: false,
        errorCode: "EMAIL_ALREADY_REGISTERED_AT_SCHOOL",
      }
    }

    // Create the application based on role
    const application = await db.$transaction(async (tx) => {
      // Consume the code as part of the same transaction that mints the
      // account, so it is single-use even under concurrent submits: a second
      // caller racing with the same code deletes zero rows and is rejected.
      const consumed = await tx.verificationToken.deleteMany({
        where: { id: verification.id },
      })
      if (consumed.count === 0) {
        throw new Error("INVALID_OR_EXPIRED_CODE")
      }

      // Create user with pending status
      const user = await tx.user.create({
        data: {
          email: data.email,
          username: `${data.firstName} ${data.lastName}`,
          role: mapRoleToUserRole(data.role),
          emailVerified: new Date(), // Email was verified
          schoolId,
        },
      })

      // Create role-specific record
      switch (data.role) {
        case "teacher":
          await tx.teacher.create({
            data: {
              userId: user.id,
              firstName: data.firstName,
              lastName: data.lastName,
              emailAddress: data.email,
              schoolId,
            },
          })
          break

        case "student":
          await tx.student.create({
            data: {
              userId: user.id,
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: data.dateOfBirth
                ? new Date(data.dateOfBirth)
                : new Date("2010-01-01"), // Default placeholder, to be updated
              gender: "Not Specified", // To be updated in profile
              schoolId,
            },
          })
          break

        case "parent":
          await tx.guardian.create({
            data: {
              userId: user.id,
              firstName: data.firstName,
              lastName: data.lastName,
              emailAddress: data.email,
              schoolId,
            },
          })
          break

        case "staff":
          // Staff goes to User table with STAFF role
          // Additional staff details can be stored in a separate table
          break
      }

      return user
    })

    revalidatePath(`/admin/applications`)

    return {
      success: true,
      data: {
        userId: application.id,
        status: "pending_approval",
      },
    }
  } catch (error) {
    // The race-loser of a concurrent same-code submit throws this from inside
    // the transaction; surface it as the code error the UI already maps rather
    // than a generic failure.
    if (error instanceof Error && error.message === "INVALID_OR_EXPIRED_CODE") {
      return { success: false, errorCode: "INVALID_OR_EXPIRED_CODE" }
    }
    console.error("[Newcomer] Failed to submit application:", error)
    return {
      success: false,
      errorCode: "SUBMIT_APPLICATION_FAILED",
    }
  }
}

/**
 * Map newcomer role to User role
 */
function mapRoleToUserRole(
  role: string
): "TEACHER" | "STUDENT" | "GUARDIAN" | "STAFF" {
  switch (role) {
    case "teacher":
      return "TEACHER"
    case "student":
      return "STUDENT"
    case "parent":
      return "GUARDIAN"
    case "staff":
      return "STAFF"
    default:
      return "STAFF"
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(email: string, schoolId?: string) {
  return sendVerificationCode(email, schoolId)
}
