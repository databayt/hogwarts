"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { Resend } from "resend"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"

import type {
  ActionResult,
  ApplicationFormData,
  PublicCampaign,
  SubmitApplicationResult,
} from "../types"
import { createFullApplicationSchema, sessionDataSchema } from "../validation"

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

      await db.applicationSession.update({
        where: { sessionToken },
        data: {
          formData: validated.formData as unknown as object,
          currentStep: validated.currentStep,
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
          expiresAt,
        },
      })

      // Send email with resume link
      if (resend) {
        try {
          await resend.emails.send({
            from: "noreply@databayt.org",
            to: validated.email,
            subject: "Your Application in Progress",
            html: `
              <p>Hello,</p>
              <p>Your application has been saved. You can resume it anytime using this link:</p>
              <p><a href="https://${subdomain}.databayt.org/apply/continue?token=${newToken}">Resume Application</a></p>
              <p>This link expires in 7 days.</p>
              <p>Best regards,<br>${schoolResult.data.name}</p>
            `,
          })
        } catch (emailError) {
          console.error("Failed to send resume email:", emailError)
          // Don't fail the action if email fails
        }
      }

      return { success: true, data: { sessionToken: newToken } }
    }
  } catch (error) {
    console.error("Error saving session:", error)
    return { success: false, error: "Failed to save application session" }
  }
}

/**
 * Resume application from session token
 */
export async function resumeApplicationSession(sessionToken: string): Promise<
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
          select: { domain: true },
        },
      },
    })

    if (!session) {
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
function generateApplicationNumber(schoolId: string): string {
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

    // Validate the full application
    const schema = createFullApplicationSchema()
    const validated = schema.parse(data)

    // Verify session exists and belongs to this school
    const session = await db.applicationSession.findUnique({
      where: { sessionToken },
    })

    if (session && session.schoolId !== schoolId) {
      return { success: false, error: "Invalid session" }
    }

    // Check campaign is still open
    const campaign = await db.admissionCampaign.findFirst({
      where: {
        id: validated.campaignId,
        schoolId,
        status: "OPEN",
        endDate: { gte: new Date() },
      },
    })

    if (!campaign) {
      return {
        success: false,
        error: "This admission campaign is no longer accepting applications",
      }
    }

    // Check if email already has an application for this campaign
    const existingApplication = await db.application.findFirst({
      where: {
        schoolId,
        campaignId: validated.campaignId,
        email: validated.email,
      },
    })

    if (existingApplication) {
      return {
        success: false,
        error:
          "An application with this email already exists for this campaign",
      }
    }

    // Generate unique application number
    let applicationNumber: string
    let attempts = 0
    do {
      applicationNumber = generateApplicationNumber(schoolId)
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
        // Personal
        firstName: validated.firstName,
        middleName: validated.middleName || null,
        lastName: validated.lastName,
        dateOfBirth: new Date(validated.dateOfBirth),
        gender: validated.gender,
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
        postalCode: validated.postalCode,
        country: validated.country,
        // Guardian
        fatherName: validated.fatherName,
        fatherOccupation: validated.fatherOccupation || null,
        fatherPhone: validated.fatherPhone || null,
        fatherEmail: validated.fatherEmail || null,
        motherName: validated.motherName,
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
        previousMarks: validated.previousMarks
          ? parseFloat(validated.previousMarks)
          : null,
        previousPercentage: validated.previousPercentage
          ? parseFloat(validated.previousPercentage)
          : null,
        achievements: validated.achievements || null,
        applyingForClass: validated.applyingForClass,
        preferredStream: validated.preferredStream || null,
        secondLanguage: validated.secondLanguage || null,
        thirdLanguage: validated.thirdLanguage || null,
        // Documents
        photoUrl: validated.photoUrl || null,
        signatureUrl: validated.signatureUrl || null,
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
    if (session) {
      await db.applicationSession.update({
        where: { sessionToken },
        data: { convertedToApplicationId: application.id },
      })
    }

    // Send confirmation email
    if (resend) {
      try {
        await resend.emails.send({
          from: "noreply@databayt.org",
          to: validated.email,
          subject: `Application Received - ${applicationNumber}`,
          html: `
            <h2>Application Received Successfully!</h2>
            <p>Dear ${validated.fatherName || validated.motherName},</p>
            <p>Thank you for submitting your application for <strong>${validated.firstName} ${validated.lastName}</strong>.</p>
            <p><strong>Application Number:</strong> ${applicationNumber}</p>
            <p>You can track your application status at any time using this link:</p>
            <p><a href="https://${subdomain}.databayt.org/apply/status?token=${accessToken}">Track Application</a></p>
            <p>We will review your application and get back to you soon.</p>
            <p>Best regards,<br>${schoolResult.data.name}</p>
          `,
        })
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError)
      }
    }

    // Check if payment is required
    const requiresPayment =
      campaign.applicationFee && Number(campaign.applicationFee) > 0

    revalidatePath(`/apply`)

    return {
      success: true,
      data: {
        applicationNumber,
        status: "SUBMITTED",
        accessToken,
        requiresPayment: !!requiresPayment,
        // paymentUrl will be added when Stripe integration is implemented
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
