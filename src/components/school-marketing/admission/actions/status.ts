"use server"

import type { AdmissionApplicationStatus } from "@prisma/client"
import { nanoid } from "nanoid"
import { Resend } from "resend"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

import type {
  ActionResult,
  ApplicationStatus,
  ChecklistItem,
  StatusTimelineEntry,
} from "../types"

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

const STATUS_LABELS: Record<
  AdmissionApplicationStatus,
  { en: string; ar: string }
> = {
  DRAFT: { en: "Draft", ar: "مسودة" },
  SUBMITTED: { en: "Submitted", ar: "تم التقديم" },
  UNDER_REVIEW: { en: "Under Review", ar: "قيد المراجعة" },
  SHORTLISTED: { en: "Shortlisted", ar: "في القائمة المختصرة" },
  ENTRANCE_SCHEDULED: { en: "Entrance Scheduled", ar: "موعد الاختبار" },
  INTERVIEW_SCHEDULED: { en: "Interview Scheduled", ar: "موعد المقابلة" },
  SELECTED: { en: "Selected", ar: "تم الاختيار" },
  WAITLISTED: { en: "Waitlisted", ar: "قائمة الانتظار" },
  REJECTED: { en: "Rejected", ar: "مرفوض" },
  ADMITTED: { en: "Admitted", ar: "تم القبول" },
  WITHDRAWN: { en: "Withdrawn", ar: "منسحب" },
}

// ============================================
// OTP Actions
// ============================================

/**
 * Request OTP for status check
 */
export async function requestStatusOTP(
  subdomain: string,
  applicationNumber: string,
  email: string
): Promise<ActionResult<{ message: string }>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    // Find the application
    const application = await db.application.findFirst({
      where: {
        schoolId,
        applicationNumber,
        email,
      },
    })

    if (!application) {
      return {
        success: false,
        error:
          "Application not found. Please check your application number and email.",
      }
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes expiry

    // Check for rate limiting (max 3 OTPs per hour)
    const recentOTPs = await db.admissionOTP.count({
      where: {
        schoolId,
        email,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    })

    if (recentOTPs >= 3) {
      return {
        success: false,
        error: "Too many OTP requests. Please try again later.",
      }
    }

    // Save OTP
    await db.admissionOTP.create({
      data: {
        schoolId,
        email,
        applicationNumber,
        otp,
        expiresAt,
      },
    })

    // Send OTP via email
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
        return {
          success: false,
          error: "Failed to send verification code. Please try again.",
        }
      }
    } else {
      // For development without Resend
      console.log(`[DEV] OTP for ${email}: ${otp}`)
    }

    return {
      success: true,
      data: { message: "Verification code sent to your email" },
    }
  } catch (error) {
    console.error("Error requesting OTP:", error)
    return { success: false, error: "Failed to send verification code" }
  }
}

/**
 * Verify OTP and get application status
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

    // Find the OTP
    const otpRecord = await db.admissionOTP.findFirst({
      where: {
        schoolId,
        applicationNumber,
        otp,
        expiresAt: { gte: new Date() },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otpRecord) {
      // Check if there's an OTP with wrong attempts
      const existingOTP = await db.admissionOTP.findFirst({
        where: {
          schoolId,
          applicationNumber,
          expiresAt: { gte: new Date() },
          verified: false,
        },
        orderBy: { createdAt: "desc" },
      })

      if (existingOTP) {
        // Increment attempts
        await db.admissionOTP.update({
          where: { id: existingOTP.id },
          data: { attempts: { increment: 1 } },
        })

        if (existingOTP.attempts >= 4) {
          // Invalidate OTP after 5 attempts
          await db.admissionOTP.update({
            where: { id: existingOTP.id },
            data: { expiresAt: new Date() },
          })
          return {
            success: false,
            error: "Too many invalid attempts. Please request a new code.",
          }
        }
      }

      return { success: false, error: "Invalid or expired verification code" }
    }

    // Mark OTP as verified
    await db.admissionOTP.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    // Get application and generate/update access token
    const application = await db.application.findFirst({
      where: {
        schoolId,
        applicationNumber,
      },
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
  accessToken: string
): Promise<ActionResult<ApplicationStatus>> {
  try {
    const application = await db.application.findFirst({
      where: {
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
        label: STATUS_LABELS[status].en,
        labelAr: STATUS_LABELS[status].ar,
        completed: index < currentStatusIndex,
        current: status === application.status,
        date: status === application.status ? application.updatedAt : undefined,
      })
    )

    // Handle special statuses (waitlisted, rejected, withdrawn)
    if (["WAITLISTED", "REJECTED", "WITHDRAWN"].includes(application.status)) {
      const specialStatus: StatusTimelineEntry = {
        status: application.status,
        label: STATUS_LABELS[application.status].en,
        labelAr: STATUS_LABELS[application.status].ar,
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
      label: "Application Submitted",
      labelAr: "تم تقديم الطلب",
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
        label: "Application Fee Paid",
        labelAr: "دفع رسوم التقديم",
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
          labelAr: doc.name,
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
        label: "Campus Tour",
        labelAr: "جولة الحرم الجامعي",
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
        label: "Interview",
        labelAr: "المقابلة",
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
        label: STATUS_LABELS[application.status].en,
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

/**
 * Get application status by application number (requires OTP verification first)
 */
export async function getApplicationByNumber(
  subdomain: string,
  applicationNumber: string
): Promise<ActionResult<{ hasApplication: boolean; email?: string }>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    const application = await db.application.findFirst({
      where: {
        schoolId,
        applicationNumber,
      },
      select: {
        email: true,
      },
    })

    if (!application) {
      return { success: true, data: { hasApplication: false } }
    }

    // Mask email for privacy
    const [localPart, domain] = application.email.split("@")
    const maskedLocal = localPart.substring(0, 2) + "***"
    const maskedEmail = `${maskedLocal}@${domain}`

    return { success: true, data: { hasApplication: true, email: maskedEmail } }
  } catch (error) {
    console.error("Error checking application:", error)
    return { success: false, error: "Failed to check application" }
  }
}
