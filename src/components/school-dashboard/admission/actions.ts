"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AdmissionApplicationStatus } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import {
  getApplicationsList,
  getCampaignOptions,
  getCampaignsList,
  getEnrollmentList,
  getMeritList,
} from "./queries"
import {
  campaignSchemaWithValidation,
  type CampaignFormData,
} from "./validation"

type ActionResult<T = unknown> = ActionResponse<T>

// ============================================================================
// Campaign Actions
// ============================================================================

export async function getCampaigns(params: {
  page?: number
  perPage?: number
  name?: string
  status?: string
  academicYear?: string
}): Promise<ActionResult<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await getCampaignsList(schoolId, params)

    return {
      success: true,
      data: {
        rows: result.rows.map((c) => ({
          id: c.id,
          name: c.name,
          academicYear: c.academicYear,
          startDate: c.startDate?.toISOString(),
          endDate: c.endDate?.toISOString(),
          status: c.status,
          totalSeats: c.totalSeats,
          applicationFee: c.applicationFee?.toString() ?? null,
          applicationsCount: c._count.applications,
          createdAt: c.createdAt?.toISOString(),
        })),
        total: result.count,
      },
    }
  } catch (error) {
    console.error("[getCampaigns]", error)
    return { success: false, error: "Failed to fetch campaigns" }
  }
}

export async function getCampaign(params: { id: string }): Promise<
  ActionResult<{
    id: string
    name: string
    academicYear: string
    startDate: string
    endDate: string
    status: string
    description: string | null
    totalSeats: number
    applicationFee: string | null
  }>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const campaign = await db.admissionCampaign.findUnique({
      where: { id: params.id, schoolId },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found" }
    }

    return {
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        academicYear: campaign.academicYear,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        status: campaign.status,
        description: campaign.description,
        totalSeats: campaign.totalSeats,
        applicationFee: campaign.applicationFee?.toString() ?? null,
      },
    }
  } catch (error) {
    console.error("[getCampaign]", error)
    return { success: false, error: "Failed to fetch campaign" }
  }
}

export async function createCampaign(
  data: CampaignFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validated = campaignSchemaWithValidation.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message ?? "Invalid data",
      }
    }

    const campaign = await db.admissionCampaign.create({
      data: {
        schoolId,
        name: validated.data.name,
        academicYear: validated.data.academicYear,
        startDate: validated.data.startDate,
        endDate: validated.data.endDate,
        status: validated.data.status,
        description: validated.data.description ?? null,
        totalSeats: validated.data.totalSeats,
        applicationFee: validated.data.applicationFee ?? null,
      },
    })

    revalidatePath("/admission")
    return { success: true, data: { id: campaign.id } }
  } catch (error) {
    console.error("[createCampaign]", error)
    // Check for unique constraint violation
    if ((error as any)?.code === "P2002") {
      return {
        success: false,
        error: "A campaign with this name already exists",
      }
    }
    return { success: false, error: "Failed to create campaign" }
  }
}

export async function updateCampaign(
  data: CampaignFormData & { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validated = campaignSchemaWithValidation.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message ?? "Invalid data",
      }
    }

    await db.admissionCampaign.update({
      where: { id: data.id, schoolId },
      data: {
        name: validated.data.name,
        academicYear: validated.data.academicYear,
        startDate: validated.data.startDate,
        endDate: validated.data.endDate,
        status: validated.data.status,
        description: validated.data.description ?? null,
        totalSeats: validated.data.totalSeats,
        applicationFee: validated.data.applicationFee ?? null,
      },
    })

    revalidatePath("/admission")
    return { success: true, data: null }
  } catch (error) {
    console.error("[updateCampaign]", error)
    // Check for unique constraint violation
    if ((error as any)?.code === "P2002") {
      return {
        success: false,
        error: "A campaign with this name already exists",
      }
    }
    return { success: false, error: "Failed to update campaign" }
  }
}

export async function deleteCampaign(params: {
  id: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if campaign has applications
    const campaign = await db.admissionCampaign.findUnique({
      where: { id: params.id, schoolId },
      include: { _count: { select: { applications: true } } },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found" }
    }

    if (campaign._count.applications > 0) {
      return {
        success: false,
        error: "Cannot delete campaign with existing applications",
      }
    }

    await db.admissionCampaign.delete({
      where: { id: params.id, schoolId },
    })

    revalidatePath("/admission")
    return { success: true, data: null }
  } catch (error) {
    console.error("[deleteCampaign]", error)
    return { success: false, error: "Failed to delete campaign" }
  }
}

// ============================================================================
// Application Actions
// ============================================================================

export async function getApplications(params: {
  page?: number
  perPage?: number
  search?: string
  campaignId?: string
  status?: string
  applyingForClass?: string
}): Promise<ActionResult<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await getApplicationsList(schoolId, params)

    return {
      success: true,
      data: {
        rows: result.rows.map((a) => ({
          id: a.id,
          applicationNumber: a.applicationNumber,
          applicantName: `${a.firstName} ${a.lastName}`,
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          phone: a.phone,
          applyingForClass: a.applyingForClass,
          status: a.status,
          meritScore: a.meritScore?.toString() ?? null,
          meritRank: a.meritRank,
          campaignName: a.campaign.name,
          campaignId: a.campaign.id,
          submittedAt: a.submittedAt?.toISOString() ?? null,
          createdAt: a.createdAt?.toISOString(),
        })),
        total: result.count,
      },
    }
  } catch (error) {
    console.error("[getApplications]", error)
    return { success: false, error: "Failed to fetch applications" }
  }
}

export async function updateApplicationStatus(params: {
  id: string
  status: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    await db.application.update({
      where: { id: params.id, schoolId },
      data: {
        status: params.status as AdmissionApplicationStatus,
        reviewedAt: new Date(),
        reviewedBy: session.user?.id,
      },
    })

    revalidatePath("/admission")
    return { success: true, data: null }
  } catch (error) {
    console.error("[updateApplicationStatus]", error)
    return { success: false, error: "Failed to update status" }
  }
}

// ============================================================================
// Merit List Actions
// ============================================================================

export async function getMeritListData(params: {
  page?: number
  perPage?: number
  campaignId?: string
  category?: string
  status?: string
}): Promise<ActionResult<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await getMeritList(schoolId, params)

    return {
      success: true,
      data: {
        rows: result.rows.map((a) => ({
          id: a.id,
          applicationNumber: a.applicationNumber,
          applicantName: `${a.firstName} ${a.lastName}`,
          firstName: a.firstName,
          lastName: a.lastName,
          applyingForClass: a.applyingForClass,
          category: a.category,
          status: a.status,
          meritScore: a.meritScore?.toString() ?? null,
          meritRank: a.meritRank,
          entranceScore: a.entranceScore?.toString() ?? null,
          interviewScore: a.interviewScore?.toString() ?? null,
          campaignName: a.campaign.name,
          campaignId: a.campaign.id,
        })),
        total: result.count,
      },
    }
  } catch (error) {
    console.error("[getMeritListData]", error)
    return { success: false, error: "Failed to fetch merit list" }
  }
}

export async function generateMeritList(params: {
  campaignId: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get all applications for the campaign that are eligible for ranking
    const applications = await db.application.findMany({
      where: {
        schoolId,
        campaignId: params.campaignId,
        status: { in: ["SHORTLISTED", "SELECTED", "WAITLISTED"] },
      },
      orderBy: [
        { meritScore: "desc" },
        { entranceScore: "desc" },
        { interviewScore: "desc" },
      ],
    })

    // Update merit ranks
    for (let i = 0; i < applications.length; i++) {
      await db.application.update({
        where: { id: applications[i].id },
        data: { meritRank: i + 1 },
      })
    }

    revalidatePath("/admission/merit")
    return { success: true, data: null }
  } catch (error) {
    console.error("[generateMeritList]", error)
    return { success: false, error: "Failed to generate merit list" }
  }
}

// ============================================================================
// Enrollment Actions
// ============================================================================

export async function getEnrollmentData(params: {
  page?: number
  perPage?: number
  campaignId?: string
  offerStatus?: string
  feeStatus?: string
  documentStatus?: string
}): Promise<ActionResult<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const result = await getEnrollmentList(schoolId, params)

    return {
      success: true,
      data: {
        rows: result.rows.map((a) => ({
          id: a.id,
          applicationNumber: a.applicationNumber,
          applicantName: `${a.firstName} ${a.lastName}`,
          firstName: a.firstName,
          lastName: a.lastName,
          applyingForClass: a.applyingForClass,
          status: a.status,
          meritRank: a.meritRank,
          admissionOffered: a.admissionOffered,
          offerDate: a.offerDate?.toISOString() ?? null,
          offerExpiryDate: a.offerExpiryDate?.toISOString() ?? null,
          admissionConfirmed: a.admissionConfirmed,
          confirmationDate: a.confirmationDate?.toISOString() ?? null,
          applicationFeePaid: a.applicationFeePaid,
          paymentDate: a.paymentDate?.toISOString() ?? null,
          hasDocuments:
            a.documents != null &&
            (Array.isArray(a.documents) ? a.documents.length > 0 : true),
          campaignName: a.campaign.name,
          campaignId: a.campaign.id,
        })),
        total: result.count,
      },
    }
  } catch (error) {
    console.error("[getEnrollmentData]", error)
    return { success: false, error: "Failed to fetch enrollment data" }
  }
}

export async function confirmEnrollment(params: {
  id: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const enrollmentNumber = `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    await db.application.update({
      where: { id: params.id, schoolId },
      data: {
        status: "ADMITTED",
        admissionConfirmed: true,
        confirmationDate: new Date(),
        enrollmentNumber,
      },
    })

    revalidatePath("/admission/enrollment")
    return { success: true, data: null }
  } catch (error) {
    console.error("[confirmEnrollment]", error)
    return { success: false, error: "Failed to confirm enrollment" }
  }
}

export async function recordPayment(params: {
  id: string
  paymentId: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    await db.application.update({
      where: { id: params.id, schoolId },
      data: {
        applicationFeePaid: true,
        paymentId: params.paymentId,
        paymentDate: new Date(),
      },
    })

    revalidatePath("/admission/enrollment")
    return { success: true, data: null }
  } catch (error) {
    console.error("[recordPayment]", error)
    return { success: false, error: "Failed to record payment" }
  }
}

// ============================================================================
// Helper Actions
// ============================================================================

export async function fetchCampaignOptions(): Promise<
  ActionResult<{ value: string; label: string }[]>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const options = await getCampaignOptions(schoolId)
    return { success: true, data: options }
  } catch (error) {
    console.error("[fetchCampaignOptions]", error)
    return { success: false, error: "Failed to fetch campaign options" }
  }
}
