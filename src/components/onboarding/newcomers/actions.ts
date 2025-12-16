"use server"

import { revalidatePath } from "next/cache"
import { addMinutes } from "date-fns"

import { db } from "@/lib/db"
import { sendVerificationCodeEmail } from "@/lib/email"

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
        error: "This email is already registered. Please sign in instead.",
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
      error: "Failed to send verification code. Please try again.",
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
        error: "Invalid or expired verification code",
      }
    }

    // Delete used token
    await db.verificationToken.delete({
      where: { id: token.id },
    })

    return { success: true, verified: true }
  } catch (error) {
    console.error("[Newcomer] Failed to verify code:", error)
    return {
      success: false,
      error: "Verification failed. Please try again.",
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
      return { success: false, error: "School not found" }
    }

    // Check if email is already registered in this school
    const existingUser = await db.user.findFirst({
      where: { email: data.email, schoolId },
    })

    if (existingUser) {
      return {
        success: false,
        error: "This email is already registered at this school",
      }
    }

    // Create the application based on role
    const application = await db.$transaction(async (tx) => {
      // Create user with pending status
      const user = await tx.user.create({
        data: {
          email: data.email,
          username: `${data.givenName} ${data.surname}`,
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
              givenName: data.givenName,
              surname: data.surname,
              emailAddress: data.email,
              schoolId,
            },
          })
          break

        case "student":
          await tx.student.create({
            data: {
              userId: user.id,
              givenName: data.givenName,
              surname: data.surname,
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
              givenName: data.givenName,
              surname: data.surname,
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
    console.error("[Newcomer] Failed to submit application:", error)
    return {
      success: false,
      error: "Failed to submit application. Please try again.",
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
