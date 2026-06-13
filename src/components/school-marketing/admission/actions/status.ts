"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createHash } from "crypto"
import type { AdmissionApplicationStatus } from "@prisma/client"
import { nanoid } from "nanoid"
import { Resend } from "resend"

import { db } from "@/lib/db"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

import type {
  ActionResult,
  ApplicationStatus,
  ChecklistItem,
  StatusTimelineEntry,
} from "../types"

/** sha256 hash of an OTP so we never store plaintext */
function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

// Initialize Resend for email
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Status order for timeline
const STATUS_ORDER: AdmissionApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ENTRANCE_SCHEDULED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "ADMITTED",
]

const STATUS_LABELS: Record<AdmissionApplicationStatus, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "تم التقديم",
  UNDER_REVIEW: "قيد المراجعة",
  SHORTLISTED: "في القائمة المختصرة",
  ENTRANCE_SCHEDULED: "موعد الاختبار",
  INTERVIEW_SCHEDULED: "موعد المقابلة",
  SELECTED: "تم الاختيار",
  WAITLISTED: "قائمة الانتظار",
  REJECTED: "مرفوض",
  ADMITTED: "تم القبول",
  WITHDRAWN: "منسحب",
}

// ============================================
// OTP Actions
// ============================================

// Generic response used for all OTP-request failures — prevents enumeration
// oracle: callers cannot distinguish "not found", "rate limited", or any other
// failure condition from the outside.
const OTP_GENERIC_RESPONSE: ActionResult<{ message: string }> = {
  success: true,
  data: { message: "Verification code sent to your email" },
}

/**
 * Request OTP for status check.
 *
 * Security invariants:
 * - Always returns the same generic success response on failure so callers
 *   cannot enumerate valid (applicationNumber, email) pairs (P1-2).
 * - Stores only the sha256 hash of the OTP, never plaintext (P1-4).
 * - Rate-limited via checkUserRateLimit (P1-5).
 */
export async function requestStatusOTP(
  subdomain: string,
  applicationNumber: string,
  email: string
): Promise<ActionResult<{ message: string }>> {
  try {
    // Rate-limit per (subdomain, email) — use checkUserRateLimit so it works
    // in serverless environments without a NextRequest.
    const rlResult = await checkUserRateLimit(
      `otp:${subdomain}:${email}`,
      RATE_LIMITS.AUTH,
      "otp_request"
    )
    if (!rlResult.allowed) {
      // Return generic response — do not reveal rate-limit status to caller
      return OTP_GENERIC_RESPONSE
    }

    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      // Generic — do not leak "school not found"
      return OTP_GENERIC_RESPONSE
    }

    const schoolId = schoolResult.data.id

    // Find the application — if not found, return generic (not an oracle)
    const application = await db.application.findFirst({
      where: { schoolId, applicationNumber, email },
    })

    if (!application) {
      return OTP_GENERIC_RESPONSE
    }

    // Generate OTP (6 digits) and store only its sha256 hash
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = hashOtp(otp)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes expiry

    // DB-level rate limit: max 3 OTPs per email per hour
    const recentOTPs = await db.admissionOTP.count({
      where: {
        schoolId,
        email,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })

    if (recentOTPs >= 3) {
      return OTP_GENERIC_RESPONSE
    }

    // Save hashed OTP — the `otp` column now stores the hash
    await db.admissionOTP.create({
      data: {
        schoolId,
        email,
        applicationNumber,
        otp: otpHash,
        expiresAt,
      },
    })

    // Send plaintext OTP via email (the only place it ever appears unmasked)
    if (resend) {
      try {
        await resend.emails.send({
          from: "noreply@databayt.org",
          to: email,
          subject: `Your Verification Code - ${applicationNumber}`,
          html: `
            <h2>Verification Code</h2>
            <p>Your verification code to check application status is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #3B82F6;">${otp}</h1>
            <p>This code expires in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br>${schoolResult.data.name}</p>
          `,
        })
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError)
        return OTP_GENERIC_RESPONSE
      }
    } else if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      // For development/test without Resend — NEVER log OTP in production
      console.log(`[DEV] OTP for ${email}: ${otp}`)
    } else {
      console.error(
        "[requestStatusOTP] No RESEND_API_KEY configured in production"
      )
      return OTP_GENERIC_RESPONSE
    }

    return OTP_GENERIC_RESPONSE
  } catch (error) {
    console.error("Error requesting OTP:", error)
    return OTP_GENERIC_RESPONSE
  }
}

/**
 * Verify OTP and get application status.
 *
 * Security invariants:
 * - Compares sha256(input) against stored hash — plaintext never compared (P1-4).
 * - Atomic increment-then-check: updateMany returns count so we never read
 *   stale `attempts` before deciding to lock (P1-10 / read-then-write race).
 * - After 5 failed attempts the record is invalidated in the same update.
 */
export async function verifyStatusOTP(
  subdomain: string,
  applicationNumber: string,
  otp: string
): Promise<ActionResult<{ accessToken: string }>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id
    const otpHash = hashOtp(otp)

    // Find the most-recent active (non-expired, unverified) OTP record for
    // this application, regardless of hash — we need the record to atomically
    // increment attempts even on a wrong guess.
    const existingOTP = await db.admissionOTP.findFirst({
      where: {
        schoolId,
        applicationNumber,
        expiresAt: { gte: new Date() },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!existingOTP) {
      return { success: false, error: "Invalid or expired verification code" }
    }

    // Atomic increment-then-check: bump attempts first, then read the new
    // count from the update result. This avoids the read-then-write TOCTOU
    // where two concurrent requests both read attempts=3 and both proceed.
    const MAX_ATTEMPTS = 5
    const afterIncrement = await db.admissionOTP.updateMany({
      where: {
        id: existingOTP.id,
        // Only increment while still under the limit — prevents wrap-around
        attempts: { lt: MAX_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    })

    // If updateMany matched 0 rows the record was already at the limit
    if (afterIncrement.count === 0) {
      // Ensure it is invalidated (idempotent)
      await db.admissionOTP.update({
        where: { id: existingOTP.id },
        data: { expiresAt: new Date() },
      })
      return {
        success: false,
        error: "Too many invalid attempts. Please request a new code.",
      }
    }

    // The new attempts value after increment
    const newAttempts = existingOTP.attempts + 1

    // Compare hashes — constant-time enough for a 6-digit OTP
    if (existingOTP.otp !== otpHash) {
      if (newAttempts >= MAX_ATTEMPTS) {
        // Invalidate immediately on the 5th wrong guess
        await db.admissionOTP.update({
          where: { id: existingOTP.id },
          data: { expiresAt: new Date() },
        })
        return {
          success: false,
          error: "Too many invalid attempts. Please request a new code.",
        }
      }
      return { success: false, error: "Invalid or expired verification code" }
    }

    // Correct OTP — mark as verified
    await db.admissionOTP.update({
      where: { id: existingOTP.id },
      data: { verified: true },
    })

    // Get application and generate/update access token
    const application = await db.application.findFirst({
      where: { schoolId, applicationNumber },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    // Generate new access token if expired or doesn't exist
    let accessToken = application.accessToken
    if (
      !accessToken ||
      (application.accessTokenExpiry &&
        application.accessTokenExpiry < new Date())
    ) {
      accessToken = nanoid(32)
      const accessTokenExpiry = new Date()
      accessTokenExpiry.setMonth(accessTokenExpiry.getMonth() + 6)

      await db.application.update({
        where: { id: application.id },
        data: { accessToken, accessTokenExpiry },
      })
    }

    return { success: true, data: { accessToken } }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error: "Failed to verify code" }
  }
}

// ============================================
// Status Actions
// ============================================

/**
 * Get application status with access token
 */
export async function getApplicationStatus(
  subdomain: string,
  accessToken: string
): Promise<ActionResult<ApplicationStatus>> {
  try {
    // Resolve schoolId for tenant isolation
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const application = await db.application.findFirst({
      where: {
        schoolId: schoolResult.data.id,
        accessToken,
        accessTokenExpiry: { gte: new Date() },
      },
      include: {
        campaign: {
          select: {
            name: true,
            requiredDocuments: true,
            applicationFee: true,
          },
        },
        communications: {
          orderBy: { sentAt: "desc" },
          take: 5,
        },
        tourBookings: {
          include: {
            slot: true,
          },
        },
      },
    })

    if (!application) {
      return {
        success: false,
        error: "Application not found or access expired",
      }
    }

    // Build timeline
    const currentStatusIndex = STATUS_ORDER.indexOf(application.status)
    const timeline: StatusTimelineEntry[] = STATUS_ORDER.map(
      (status, index) => ({
        status,
        label: STATUS_LABELS[status],
        completed: index < currentStatusIndex,
        current: status === application.status,
        date: status === application.status ? application.updatedAt : undefined,
      })
    )

    // Handle special statuses (waitlisted, rejected, withdrawn)
    if (["WAITLISTED", "REJECTED", "WITHDRAWN"].includes(application.status)) {
      const specialStatus: StatusTimelineEntry = {
        status: application.status,
        label: STATUS_LABELS[application.status],
        completed: false,
        current: true,
        date: application.updatedAt,
      }
      timeline.push(specialStatus)
    }

    // Build checklist
    const checklist: ChecklistItem[] = []

    // Application submitted
    checklist.push({
      id: "application",
      label: "تم تقديم الطلب",
      completed: application.submittedAt !== null,
      required: true,
      type: "other",
    })

    // Payment
    if (
      application.campaign.applicationFee &&
      Number(application.campaign.applicationFee) > 0
    ) {
      checklist.push({
        id: "payment",
        label: "دفع رسوم التقديم",
        completed: application.applicationFeePaid,
        required: true,
        type: "payment",
      })
    }

    // Documents
    const requiredDocs =
      (application.campaign.requiredDocuments as {
        type: string
        name: string
        required: boolean
      }[]) || []
    const uploadedDocs = (application.documents as { type: string }[]) || []
    for (const doc of requiredDocs) {
      if (doc.required) {
        checklist.push({
          id: `doc-${doc.type}`,
          label: doc.name,
          completed: uploadedDocs.some((d) => d.type === doc.type),
          required: true,
          type: "document",
        })
      }
    }

    // Tour booking
    if (application.tourBookings.length > 0) {
      const latestBooking = application.tourBookings[0]
      checklist.push({
        id: "tour",
        label: "جولة الحرم الجامعي",
        completed: latestBooking.status === "COMPLETED",
        required: false,
        type: "tour",
      })
    }

    // Interview (if scheduled)
    if (
      ["INTERVIEW_SCHEDULED", "SELECTED", "ADMITTED"].includes(
        application.status
      )
    ) {
      checklist.push({
        id: "interview",
        label: "المقابلة",
        completed: ["SELECTED", "ADMITTED"].includes(application.status),
        required: true,
        type: "interview",
      })
    }

    const status: ApplicationStatus = {
      applicationNumber: application.applicationNumber,
      status: application.status,
      submittedAt: application.submittedAt ?? undefined,
      currentStep: {
        current: currentStatusIndex + 1,
        total: STATUS_ORDER.length,
        label: STATUS_LABELS[application.status],
      },
      timeline,
      checklist,
    }

    return { success: true, data: status }
  } catch (error) {
    console.error("Error fetching status:", error)
    return { success: false, error: "Failed to fetch application status" }
  }
}

// NOTE: getApplicationByNumber was removed (2026-05-21 audit, P1-3). It was an
// unauthenticated lookup that returned {hasApplication, maskedEmail} for any
// (subdomain, applicationNumber) — an enumeration + partial-email oracle with no
// callers. Status lookups must go through requestStatusOTP → verifyStatusOTP.
