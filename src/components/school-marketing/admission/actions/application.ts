"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { nanoid } from "nanoid"
import { Resend } from "resend"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import {
  buildApplicationReceivedEmail,
  buildNewApplicationAdminNotification,
  buildResumeApplicationEmail,
} from "@/lib/email-templates/admission"
import {
  resolveDefaultCurrency,
  resolvePaymentGateways,
} from "@/lib/payment/gateway-config"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

import type {
  ActionResult,
  ApplicationFormData,
  PublicCampaign,
  SubmitApplicationResult,
} from "../types"
import { sessionDataSchema } from "../validation"

// Initialize Resend for email
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// ============================================
// Campaign Actions
// ============================================

/**
 * Get active campaigns for a school (public)
 */
export async function getActiveCampaigns(
  subdomain: string
): Promise<ActionResult<PublicCampaign[]>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id
    const now = new Date()

    const campaigns = await db.admissionCampaign.findMany({
      where: {
        schoolId,
        status: "OPEN",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        id: true,
        name: true,
        academicYear: true,
        startDate: true,
        endDate: true,
        description: true,
        applicationFee: true,
        totalSeats: true,
        requiredDocuments: true,
        eligibilityCriteria: true,
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "SHORTLISTED",
                    "SELECTED",
                    "ADMITTED",
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
    })

    const publicCampaigns: PublicCampaign[] = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      academicYear: campaign.academicYear,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      description: campaign.description ?? undefined,
      applicationFee: campaign.applicationFee
        ? Number(campaign.applicationFee)
        : undefined,
      totalSeats: campaign.totalSeats,
      availableSeats: campaign.totalSeats - campaign._count.applications,
      requiredDocuments:
        campaign.requiredDocuments as unknown as PublicCampaign["requiredDocuments"],
      eligibilityCriteria:
        campaign.eligibilityCriteria as unknown as PublicCampaign["eligibilityCriteria"],
    }))

    return { success: true, data: publicCampaigns }
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return { success: false, error: "Failed to fetch campaigns" }
  }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaignById(
  subdomain: string,
  campaignId: string
): Promise<ActionResult<PublicCampaign>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    const campaign = await db.admissionCampaign.findFirst({
      where: {
        id: campaignId,
        schoolId,
        status: "OPEN",
      },
      select: {
        id: true,
        name: true,
        academicYear: true,
        startDate: true,
        endDate: true,
        description: true,
        applicationFee: true,
        totalSeats: true,
        requiredDocuments: true,
        eligibilityCriteria: true,
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "SHORTLISTED",
                    "SELECTED",
                    "ADMITTED",
                  ],
                },
              },
            },
          },
        },
      },
    })

    if (!campaign) {
      return {
        success: false,
        error: "Campaign not found or not accepting applications",
      }
    }

    const publicCampaign: PublicCampaign = {
      id: campaign.id,
      name: campaign.name,
      academicYear: campaign.academicYear,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      description: campaign.description ?? undefined,
      applicationFee: campaign.applicationFee
        ? Number(campaign.applicationFee)
        : undefined,
      totalSeats: campaign.totalSeats,
      availableSeats: campaign.totalSeats - campaign._count.applications,
      requiredDocuments:
        campaign.requiredDocuments as unknown as PublicCampaign["requiredDocuments"],
      eligibilityCriteria:
        campaign.eligibilityCriteria as unknown as PublicCampaign["eligibilityCriteria"],
    }

    return { success: true, data: publicCampaign }
  } catch (error) {
    console.error("Error fetching campaign:", error)
    return { success: false, error: "Failed to fetch campaign" }
  }
}

// ============================================
// Session Actions (Save/Resume)
// ============================================

/**
 * Save application session (for save/resume without login)
 */
export async function saveApplicationSession(
  subdomain: string,
  data: {
    formData: Partial<ApplicationFormData>
    currentStep: number
    email: string
    campaignId?: string
  },
  sessionToken?: string
): Promise<ActionResult<{ sessionToken: string }>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    // Get authenticated user ID
    const session = await auth()
    const userId = session?.user?.id ?? undefined

    // Validate session data
    const validated = sessionDataSchema.parse(data)

    // Session expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    if (sessionToken) {
      // Update existing session
      const existingSession = await db.applicationSession.findUnique({
        where: { sessionToken },
      })

      if (!existingSession || existingSession.schoolId !== schoolId) {
        return { success: false, error: "Session not found" }
      }

      // Keep the original userId if already set (don't overwrite with a
      // different session, e.g. admin logged into the same browser)
      const resolvedUserId = existingSession.userId ?? userId

      await db.applicationSession.update({
        where: { sessionToken },
        data: {
          formData: validated.formData as unknown as object,
          currentStep: validated.currentStep,
          userId: resolvedUserId,
          expiresAt,
        },
      })

      return { success: true, data: { sessionToken } }
    } else {
      // Create new session
      const newToken = nanoid(32)

      await db.applicationSession.create({
        data: {
          schoolId,
          sessionToken: newToken,
          formData: validated.formData as unknown as object,
          currentStep: validated.currentStep,
          email: validated.email,
          campaignId: validated.campaignId,
          userId,
          expiresAt,
        },
      })

      // Send email with resume link (fire-and-forget — don't block the response)
      if (resend) {
        const resumeEmail = buildResumeApplicationEmail({
          school: schoolResult.data,
          resumeUrl: `https://${subdomain}.databayt.org/application/continue?token=${newToken}`,
        })
        resend.emails
          .send({
            from: "noreply@databayt.org",
            to: validated.email,
            subject: resumeEmail.subject,
            html: resumeEmail.html,
          })
          .catch((err: unknown) =>
            console.error("[saveApplicationSession] resume email error:", err)
          )
      }

      return { success: true, data: { sessionToken: newToken } }
    }
  } catch (error) {
    console.error("Error saving session:", error)
    return { success: false, error: "Failed to save application session" }
  }
}

/**
 * Get draft applications by email (for showing saved drafts)
 */
export async function getDraftApplications(
  subdomain: string,
  email: string
): Promise<
  ActionResult<
    Array<{
      sessionToken: string
      campaignId: string | null
      campaignName: string | null
      currentStep: number
      totalSteps: number
      studentName: string | null
      updatedAt: Date
      expiresAt: Date
    }>
  >
> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id
    const now = new Date()

    // Get all non-expired, non-converted sessions for this email
    const sessions = await db.applicationSession.findMany({
      where: {
        schoolId,
        email,
        expiresAt: { gt: now },
        convertedToApplicationId: null,
      },
      include: {
        campaign: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const drafts = sessions.map((session) => {
      const formData = session.formData as Record<string, unknown>
      const firstName = (formData?.firstName as string) || null
      const lastName = (formData?.lastName as string) || null
      const studentName =
        firstName && lastName ? `${firstName} ${lastName}` : firstName || null

      return {
        sessionToken: session.sessionToken,
        campaignId: session.campaign?.id || null,
        campaignName: session.campaign?.name || null,
        currentStep: session.currentStep,
        totalSteps: 6, // Standard application has 6 steps
        studentName,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      }
    })

    return { success: true, data: drafts }
  } catch (error) {
    console.error("Error fetching draft applications:", error)
    return { success: false, error: "Failed to fetch draft applications" }
  }
}

/**
 * Get draft applications by authenticated user ID
 */
export async function getDraftApplicationsByUser(
  subdomain: string,
  userId: string
): Promise<
  ActionResult<
    Array<{
      sessionToken: string
      campaignId: string | null
      campaignName: string | null
      currentStep: number
      totalSteps: number
      studentName: string | null
      updatedAt: Date
      expiresAt: Date
    }>
  >
> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id
    const now = new Date()

    const sessions = await db.applicationSession.findMany({
      where: {
        schoolId,
        userId,
        expiresAt: { gt: now },
        convertedToApplicationId: null,
      },
      include: {
        campaign: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const drafts = sessions.map((session) => {
      const formData = session.formData as Record<string, unknown>
      const firstName = (formData?.firstName as string) || null
      const lastName = (formData?.lastName as string) || null
      const studentName =
        firstName && lastName ? `${firstName} ${lastName}` : firstName || null

      return {
        sessionToken: session.sessionToken,
        campaignId: session.campaign?.id || null,
        campaignName: session.campaign?.name || null,
        currentStep: session.currentStep,
        totalSteps: 6,
        studentName,
        updatedAt: session.updatedAt,
        expiresAt: session.expiresAt,
      }
    })

    return { success: true, data: drafts }
  } catch (error) {
    console.error("Error fetching draft applications by user:", error)
    return { success: false, error: "Failed to fetch draft applications" }
  }
}

/**
 * Resume application from session token
 */
export async function resumeApplicationSession(
  sessionToken: string,
  subdomain?: string
): Promise<
  ActionResult<{
    formData: Partial<ApplicationFormData>
    currentStep: number
    email: string
    campaignId?: string
  }>
> {
  try {
    const session = await db.applicationSession.findUnique({
      where: { sessionToken },
      include: {
        school: {
          select: { id: true, domain: true },
        },
      },
    })

    if (!session) {
      return { success: false, error: "Session not found" }
    }

    // Verify tenant isolation — session must belong to the requested school
    if (subdomain) {
      const schoolResult = await getSchoolBySubdomain(subdomain)
      if (
        schoolResult.success &&
        schoolResult.data &&
        session.schoolId !== schoolResult.data.id
      ) {
        return { success: false, error: "Session not found" }
      }
    }

    // Identity check — if the draft is already bound to a userId AND the
    // caller is authenticated as a different user, refuse. Anonymous callers
    // (e.g., clicking the resume link from email in another browser) still
    // work because they have no auth userId to mismatch against.
    const authSession = await auth()
    const authUserId = authSession?.user?.id
    if (session.userId && authUserId && session.userId !== authUserId) {
      return { success: false, error: "Session not found" }
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await db.applicationSession.delete({ where: { sessionToken } })
      return {
        success: false,
        error: "Session has expired. Please start a new application.",
      }
    }

    if (session.convertedToApplicationId) {
      return {
        success: false,
        error: "This application has already been submitted.",
      }
    }

    return {
      success: true,
      data: {
        formData: session.formData as Partial<ApplicationFormData>,
        currentStep: session.currentStep,
        email: session.email,
        campaignId: session.campaignId ?? undefined,
      },
    }
  } catch (error) {
    console.error("Error resuming session:", error)
    return { success: false, error: "Failed to resume application" }
  }
}

// ============================================
// Application Submission
// ============================================

/**
 * Generate unique application number
 */
function generateApplicationNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `APP-${year}-${random}`
}

/**
 * Submit final application
 */
export async function submitApplication(
  subdomain: string,
  sessionToken: string,
  data: ApplicationFormData
): Promise<ActionResult<SubmitApplicationResult>> {
  try {
    const schoolResult = await getSchoolBySubdomain(subdomain)
    if (!schoolResult.success || !schoolResult.data) {
      return { success: false, error: "School not found" }
    }

    const schoolId = schoolResult.data.id

    // Data is pre-validated by submit-action.ts before reaching here
    const validated = data

    // Run independent queries in parallel
    const [appSession, authSession, campaign, admissionSettings] =
      await Promise.all([
        db.applicationSession.findUnique({
          where: { sessionToken },
        }),
        auth(),
        db.admissionCampaign.findFirst({
          where: {
            id: validated.campaignId,
            schoolId,
            status: "OPEN",
            endDate: { gte: new Date() },
          },
        }),
        db.admissionSettings.findUnique({
          where: { schoolId },
          select: { allowMultipleApplications: true },
        }),
      ])

    if (appSession && appSession.schoolId !== schoolId) {
      return { success: false, error: "Invalid session" }
    }

    // Resolve userId: prefer the session's original userId (set when applicant
    // started the application) over the current auth() session, since an admin
    // could be logged into the same browser on the school domain.
    const userId = appSession?.userId ?? authSession?.user?.id ?? undefined

    if (!campaign) {
      return {
        success: false,
        error: "This admission campaign is no longer accepting applications",
      }
    }

    if (admissionSettings && !admissionSettings.allowMultipleApplications) {
      const existingApplication = await db.application.findFirst({
        where: {
          schoolId,
          campaignId: validated.campaignId,
          email: validated.email,
          status: { not: "DRAFT" },
        },
      })

      if (existingApplication) {
        return {
          success: false,
          error:
            "An application with this email already exists for this campaign",
        }
      }
    }

    // Generate unique application number
    let applicationNumber: string
    let attempts = 0
    do {
      applicationNumber = generateApplicationNumber()
      const exists = await db.application.findUnique({
        where: { applicationNumber },
      })
      if (!exists) break
      attempts++
    } while (attempts < 10)

    if (attempts >= 10) {
      return {
        success: false,
        error: "Failed to generate application number. Please try again.",
      }
    }

    // Generate access token for status tracker
    const accessToken = nanoid(32)
    const accessTokenExpiry = new Date()
    accessTokenExpiry.setMonth(accessTokenExpiry.getMonth() + 6) // 6 months

    // Create the application
    const application = await db.application.create({
      data: {
        schoolId,
        campaignId: validated.campaignId,
        applicationNumber,
        userId,
        // Personal
        firstName: validated.firstName,
        middleName: validated.middleName || null,
        lastName: validated.lastName,
        dateOfBirth: validated.dateOfBirth
          ? new Date(validated.dateOfBirth)
          : null,
        gender: validated.gender || null,
        nationality: validated.nationality,
        religion: validated.religion || null,
        category: validated.category || null,
        // Contact
        email: validated.email,
        phone: validated.phone,
        alternatePhone: validated.alternatePhone || null,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        postalCode: validated.postalCode || "",
        country: validated.country,
        // Guardian
        fatherName: validated.fatherName || null,
        fatherOccupation: validated.fatherOccupation || null,
        fatherPhone: validated.fatherPhone || null,
        fatherEmail: validated.fatherEmail || null,
        motherName: validated.motherName || null,
        motherOccupation: validated.motherOccupation || null,
        motherPhone: validated.motherPhone || null,
        motherEmail: validated.motherEmail || null,
        guardianName: validated.guardianName || null,
        guardianRelation: validated.guardianRelation || null,
        guardianPhone: validated.guardianPhone || null,
        guardianEmail: validated.guardianEmail || null,
        // Academic
        previousSchool: validated.previousSchool || null,
        previousClass: validated.previousClass || null,
        previousMarks: validated.previousMarks || null,
        previousPercentage: validated.previousPercentage || null,
        achievements: validated.achievements || null,
        applyingForClass: validated.applyingForClass,
        preferredStream: validated.preferredStream || null,
        secondLanguage: validated.secondLanguage || null,
        thirdLanguage: validated.thirdLanguage || null,
        // Documents
        photoUrl: validated.photoUrl || null,
        documents: validated.documents
          ? (validated.documents as unknown as object[])
          : undefined,
        // Status
        status: "SUBMITTED",
        submittedAt: new Date(),
        // Access
        accessToken,
        accessTokenExpiry,
      },
    })

    // Mark session as converted
    if (appSession) {
      await db.applicationSession.update({
        where: { sessionToken },
        data: { convertedToApplicationId: application.id },
      })
    }

    // Notify admins about new application (fire-and-forget). Uses the school's
    // preferred language so admins see the alert in the language they set up.
    const adminNotification = buildNewApplicationAdminNotification({
      school: schoolResult.data,
      studentName: `${validated.firstName} ${validated.lastName}`,
      applicationNumber,
    })
    dispatchNotificationsToAudience({
      schoolId,
      type: "system_alert",
      title: adminNotification.title,
      body: adminNotification.body,
      priority: "normal",
      channels: ["in_app", "email"],
      targetScope: "role",
      targetRole: "ADMIN",
      metadata: {
        applicationId: application.id,
        applicationNumber,
        url: `/admission/applications/${application.id}`,
      },
    }).catch((err) =>
      console.error("[submitApplication] notification error:", err)
    )

    // Send confirmation email (fire-and-forget — don't block the response)
    if (resend) {
      const confirmationEmail = buildApplicationReceivedEmail({
        school: schoolResult.data,
        parentName:
          validated.fatherName ||
          validated.motherName ||
          `${validated.firstName} ${validated.lastName}`,
        studentName: `${validated.firstName} ${validated.lastName}`,
        applicationNumber,
        trackUrl: `https://${subdomain}.databayt.org/application/status?token=${accessToken}`,
      })
      resend.emails
        .send({
          from: "noreply@databayt.org",
          to: validated.email,
          subject: confirmationEmail.subject,
          html: confirmationEmail.html,
        })
        .catch((err: unknown) =>
          console.error("[submitApplication] confirmation email error:", err)
        )
    }

    // Check if payment is required
    const requiresPayment =
      campaign.applicationFee && Number(campaign.applicationFee) > 0

    // Resolve available payment methods for this school's region
    let paymentMethods: string[] | undefined
    let currency: string | undefined
    let applicationFee: number | undefined
    if (requiresPayment) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { country: true, timezone: true },
      })
      paymentMethods = resolvePaymentGateways(school?.country, school?.timezone)
      currency = resolveDefaultCurrency(school?.country, school?.timezone)
      applicationFee = Number(campaign.applicationFee)
    }

    revalidatePath(`/application`)

    return {
      success: true,
      data: {
        applicationNumber,
        applicationId: application.id,
        status: "SUBMITTED",
        accessToken,
        requiresPayment: !!requiresPayment,
        applicationFee,
        currency,
        paymentMethods,
      },
    }
  } catch (error) {
    console.error("Error submitting application:", error)
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        success: false,
        error: "An application with this information already exists",
      }
    }
    return {
      success: false,
      error: "Failed to submit application. Please try again.",
    }
  }
}
