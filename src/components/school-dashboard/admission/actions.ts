"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type {
  AdmissionApplicationStatus,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"
import { nanoid } from "nanoid"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { ensureInvoicesForAssignment } from "@/lib/fee-invoice-sync"
import { extractGradeNumber } from "@/lib/grade-utils"
import { generateStudentUsername } from "@/lib/student-username"
import { sendNotificationEmail } from "@/components/school-dashboard/notifications/email-service"
import { detectLanguage } from "@/components/translation/util"

import { assertAdmissionPermission } from "./authorization"
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

// Bilingual notification messages (keyed by lang)
const NOTIF = {
  statusUpdate: {
    title: { ar: "تحديث حالة الطلب", en: "Application Status Update" },
    SHORTLISTED: {
      ar: "تم إدراجك في القائمة المختصرة",
      en: "You have been shortlisted",
    },
    SELECTED: {
      ar: "تهانينا! تم قبولك. يرجى إكمال عملية الدفع لتأكيد التسجيل",
      en: "Congratulations! You have been accepted. Please complete payment to confirm enrollment.",
    },
    REJECTED: {
      ar: "نأسف، لم يتم قبول طلبك",
      en: "We regret to inform you that your application was not accepted",
    },
    WAITLISTED: {
      ar: "تم وضعك في قائمة الانتظار",
      en: "You have been placed on the waiting list",
    },
    UNDER_REVIEW: {
      ar: "طلبك قيد المراجعة حالياً",
      en: "Your application is currently under review",
    },
    WITHDRAWN: {
      ar: "تم سحب الطلب",
      en: "Your application has been withdrawn",
    },
    SUBMITTED: {
      ar: "تم تقديم طلبك بنجاح",
      en: "Your application has been submitted successfully",
    },
    fallback: (status: string) => ({
      ar: `تم تحديث حالة الطلب`,
      en: `Application status has been updated`,
    }),
  },
  enrollment: {
    title: { ar: "تم تأكيد القبول", en: "Enrollment Confirmed" },
    body: (enrollmentNumber: string) => ({
      ar: `تهانينا! تم تأكيد تسجيلك بالمدرسة. رقم التسجيل: ${enrollmentNumber}`,
      en: `Congratulations! Your enrollment has been confirmed. Enrollment #: ${enrollmentNumber}`,
    }),
  },
  feeDue: {
    title: { ar: "رسوم دراسية جديدة", en: "New Tuition Fees" },
    body: (count: number, total: string) => ({
      ar: `تم تعيين ${count} رسوم بقيمة ${total} لحسابك`,
      en: `${count} fee(s) totaling ${total} have been assigned to your account`,
    }),
  },
  guardianEnrollment: {
    title: { ar: "تم تأكيد القبول", en: "Enrollment Confirmed" },
    body: (name: string) => ({
      ar: `تم تأكيد تسجيل ${name} في المدرسة`,
      en: `${name} has been enrolled in the school`,
    }),
  },
  sectionPlacement: {
    title: { ar: "تعيين القسم", en: "Section Placement" },
    body: (sectionName: string) => ({
      ar: `تم تعيينك في قسم "${sectionName}"`,
      en: `You have been placed in section "${sectionName}"`,
    }),
  },
} as const

const t = (msg: { ar: string; en: string }, lang: string) =>
  lang === "en" ? msg.en : msg.ar

/**
 * Dispatch in-app notification AND send email immediately.
 * Replaces the pattern of dispatchNotification() + daily cron for admission.
 */
async function dispatchAdmissionNotification(params: {
  schoolId: string
  userId: string
  type: NotificationType
  title: string
  body: string
  lang: string
  priority?: NotificationPriority
  channels?: ("in_app" | "email")[]
  metadata?: Record<string, unknown>
  actorId?: string
}): Promise<void> {
  const channels = params.channels ?? ["in_app", "email"]
  const notificationId = await dispatchNotification({
    ...params,
    channels,
    priority: params.priority ?? "normal",
  })

  if (!notificationId || !channels.includes("email")) return

  // Send email immediately instead of waiting for daily cron
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { email: true, username: true },
  })
  if (!user?.email) return

  await sendNotificationEmail({
    notificationId,
    to: user.email,
    locale: (params.lang === "en" ? "en" : "ar") as "ar" | "en",
    type: params.type,
    priority: params.priority ?? "normal",
    title: params.title,
    body: params.body,
    metadata: params.metadata,
  })
}

// ============================================================================
// Campaign Actions
// ============================================================================

export async function getCampaigns(params: {
  page?: number
  perPage?: number
  name?: string
  status?: string
  academicYear?: string
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role

    if (!schoolId || !role) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(role, "viewApplications")

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
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export async function getCampaign(params: { id: string }): Promise<
  ActionResponse<{
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
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const campaign = await db.admissionCampaign.findUnique({
      where: { id: params.id, schoolId },
    })

    if (!campaign) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
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
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export async function createCampaign(
  data: CampaignFormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "manageCampaigns")

    // Validate input
    const validated = campaignSchemaWithValidation.safeParse(data)
    if (!validated.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Fall back to school's default application fee if none specified
    let applicationFee = validated.data.applicationFee ?? null
    if (applicationFee === null || applicationFee === 0) {
      const settings = await db.admissionSettings.findUnique({
        where: { schoolId },
        select: { defaultApplicationFee: true },
      })
      if (settings?.defaultApplicationFee) {
        applicationFee = Number(settings.defaultApplicationFee)
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
        applicationFee,
      },
    })

    revalidatePath("/admission")
    return { success: true, data: { id: campaign.id } }
  } catch (error) {
    console.error("[createCampaign]", error)
    // Check for unique constraint violation
    if ((error as { code?: string })?.code === "P2002") {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

export async function updateCampaign(
  data: CampaignFormData & { id: string }
): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "manageCampaigns")

    // Validate input
    const validated = campaignSchemaWithValidation.safeParse(data)
    if (!validated.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
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
    if ((error as { code?: string })?.code === "P2002") {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function deleteCampaign(params: {
  id: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "manageCampaigns")

    // Check if campaign has applications
    const campaign = await db.admissionCampaign.findUnique({
      where: { id: params.id, schoolId },
      include: { _count: { select: { applications: true } } },
    })

    if (!campaign) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    }

    if (campaign._count.applications > 0) {
      return actionError(ACTION_ERRORS.CAMPAIGN_HAS_APPLICATIONS)
    }

    await db.admissionCampaign.delete({
      where: { id: params.id, schoolId },
    })

    revalidatePath("/admission")
    return { success: true, data: null }
  } catch (error) {
    console.error("[deleteCampaign]", error)
    return actionError(ACTION_ERRORS.DELETE_FAILED)
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
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role

    if (!schoolId || !role) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(role, "viewApplications")

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
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// All valid statuses for the dropdown (ADMITTED only via confirmEnrollment)
const VALID_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "SELECTED",
  "WAITLISTED",
  "REJECTED",
  "WITHDRAWN",
]

export async function updateApplicationStatus(params: {
  id: string
  status: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "updateStatus")

    // Validate target status is a known status
    if (!VALID_STATUSES.includes(params.status)) {
      return actionError(ACTION_ERRORS.APPLICATION_STATUS_INVALID)
    }

    // Verify application exists and belongs to this school
    const current = await db.application.findUnique({
      where: { id: params.id, schoolId },
      select: { status: true },
    })
    if (!current) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    }

    const data: Record<string, unknown> = {
      status: params.status as AdmissionApplicationStatus,
      reviewedAt: new Date(),
      reviewedBy: session.user?.id,
    }

    // Auto-offer admission when selecting a student
    if (params.status === "SELECTED") {
      data.admissionOffered = true
      data.offerDate = new Date()
      const settings = await db.admissionSettings.findUnique({
        where: { schoolId },
        select: { offerExpiryDays: true },
      })
      const expiryDays = settings?.offerExpiryDays ?? 14
      data.offerExpiryDate = new Date(
        Date.now() + expiryDays * 24 * 60 * 60 * 1000
      )
      const existing = await db.application.findUnique({
        where: { id: params.id, schoolId },
        select: { accessToken: true },
      })
      if (!existing?.accessToken) {
        data.accessToken = nanoid(32)
        data.accessTokenExpiry = new Date(
          Date.now() + expiryDays * 24 * 60 * 60 * 1000
        )
      }
    }

    await db.application.update({
      where: { id: params.id, schoolId },
      data,
    })

    // Notify applicant about status change (non-blocking)
    const application = await db.application.findFirst({
      where: { id: params.id, schoolId },
      select: {
        userId: true,
        firstName: true,
        lastName: true,
        campaignId: true,
        accessToken: true,
      },
    })
    if (application?.userId) {
      const school = await db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const notifLang = school?.preferredLanguage ?? "ar"
      const statusMsgMap: Record<string, { ar: string; en: string }> = {
        SHORTLISTED: NOTIF.statusUpdate.SHORTLISTED,
        SELECTED: NOTIF.statusUpdate.SELECTED,
        REJECTED: NOTIF.statusUpdate.REJECTED,
        WAITLISTED: NOTIF.statusUpdate.WAITLISTED,
        UNDER_REVIEW: NOTIF.statusUpdate.UNDER_REVIEW,
        WITHDRAWN: NOTIF.statusUpdate.WITHDRAWN,
        SUBMITTED: NOTIF.statusUpdate.SUBMITTED,
      }
      const statusMessage = t(
        statusMsgMap[params.status] ||
          NOTIF.statusUpdate.fallback(params.status),
        notifLang
      )
      dispatchAdmissionNotification({
        schoolId,
        userId: application.userId,
        type: "system_alert",
        title: t(NOTIF.statusUpdate.title, notifLang),
        body: statusMessage,
        lang: notifLang,
        priority: params.status === "SELECTED" ? "high" : "normal",
        channels: ["in_app", "email"],
        metadata: {
          applicationId: params.id,
          status: params.status,
          url:
            params.status === "SELECTED" && application.accessToken
              ? `/application/${params.id}/offer?token=${encodeURIComponent(application.accessToken)}`
              : "/admission",
        },
        actorId: session.user?.id,
      }).catch((err) =>
        console.error("[updateApplicationStatus] Notification error:", err)
      )
    }

    revalidatePath("/admission")
    return { success: true, data: null }
  } catch (error) {
    console.error("[updateApplicationStatus]", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
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
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role

    if (!schoolId || !role) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(role, "viewApplications")

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
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export async function generateMeritList(params: {
  campaignId: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "generateMeritList")

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

    // Update merit ranks in parallel
    await Promise.all(
      applications.map((app, i) =>
        db.application.update({
          where: { id: app.id, schoolId },
          data: { meritRank: i + 1 },
        })
      )
    )

    revalidatePath("/admission/merit")
    return { success: true, data: null }
  } catch (error) {
    console.error("[generateMeritList]", error)
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
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
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role

    if (!schoolId || !role) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(role, "viewApplications")

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
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export type EnrollmentWarningCode =
  | "FEE_AUTO_ASSIGN_FAILED"
  | "INVOICE_GENERATION_FAILED"
  | "GUARDIAN_CREATE_FAILED"
  | "NO_FEE_STRUCTURE_MATCH"
  | "APPLICATION_FEE_UNPAID"

export interface EnrollmentWarning {
  code: EnrollmentWarningCode
  meta?: Record<string, unknown>
}

export interface ConfirmEnrollmentResult {
  suggestedSectionId: string | null
  suggestedSectionName: string | null
  studentId: string | null
  warnings?: EnrollmentWarning[]
}

export async function confirmEnrollment(params: {
  id: string
}): Promise<ActionResponse<ConfirmEnrollmentResult>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "confirmEnrollment")

    // 1. Fetch the application with fields needed for Student creation
    const application = await db.application.findUnique({
      where: { id: params.id, schoolId },
      include: {
        campaign: { select: { academicYear: true, applicationFee: true } },
      },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    }

    if (application.status === "ADMITTED") {
      return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
    }

    if (
      application.offerExpiryDate &&
      new Date(application.offerExpiryDate) < new Date()
    ) {
      return actionError(ACTION_ERRORS.OFFER_EXPIRED)
    }

    const enrollmentNumber = `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    let enrolledStudentId: string | null = null
    const warnings: EnrollmentWarning[] = []

    // Warn (do not block) when the application fee is unpaid — admin can still enroll
    const campaignFee = application.campaign?.applicationFee
    const hasFeeRequirement = campaignFee && Number(campaignFee) > 0
    if (hasFeeRequirement && !application.applicationFeePaid) {
      const schoolCurrency = await db.school.findUnique({
        where: { id: schoolId },
        select: { currency: true },
      })
      warnings.push({
        code: "APPLICATION_FEE_UNPAID",
        meta: {
          amount: Number(campaignFee),
          currency: schoolCurrency?.currency ?? "USD",
        },
      })
    }

    // Warn (do not block) when no fee structure exists for the campaign's academic year —
    // the auto-assign loop in step 6 will find nothing and skip, so no invoice is generated
    if (application.campaign?.academicYear) {
      const feeStructureCount = await db.feeStructure.count({
        where: {
          schoolId,
          academicYear: application.campaign.academicYear,
          isActive: true,
        },
      })
      if (feeStructureCount === 0) {
        warnings.push({ code: "NO_FEE_STRUCTURE_MATCH" })
      }
    }

    const txUserId = await db.$transaction(
      async (tx) => {
        // 2. Update application status to ADMITTED
        await tx.application.update({
          where: { id: params.id, schoolId },
          data: {
            status: "ADMITTED",
            admissionConfirmed: true,
            confirmationDate: new Date(),
            enrollmentNumber,
          },
        })

        // Resolve the target AcademicGrade so the student code can be
        // year+grade scoped. Mirrors the cascade used further down for YearLevel.
        const applyingGradeNumber = extractGradeNumber(
          application.applyingForClass ?? ""
        )
        const resolvedAcademicGrade = applyingGradeNumber
          ? await tx.academicGrade.findFirst({
              where: { schoolId, gradeNumber: applyingGradeNumber },
              select: { id: true },
            })
          : null

        // Per-school student code (YYGGGNNNN). Generated inside the tx so
        // concurrent enrollments see each other's increments.
        const studentCode = await generateStudentUsername({
          schoolId,
          academicGradeId: resolvedAcademicGrade?.id ?? null,
          tx,
        })

        // 3. Resolve userId — create a User for guest applications
        let userId = application.userId
        if (!userId) {
          // Find existing user by email to avoid unique constraint violation
          const existingUser = await tx.user.findFirst({
            where: { email: application.email },
            select: { id: true },
          })

          if (existingUser) {
            userId = existingUser.id
            // Stamp the code onto the existing user's username if they don't
            // already have one (e.g., an applicant who self-registered).
            await tx.user.updateMany({
              where: { id: existingUser.id, username: null },
              data: { username: studentCode },
            })
          } else {
            const guestUser = await tx.user.create({
              data: {
                email: application.email,
                username: studentCode,
                role: "STUDENT",
                schoolId,
                emailVerified: new Date(),
              },
            })
            userId = guestUser.id
          }

          // Link the application to the new user
          await tx.application.update({
            where: { id: params.id, schoolId },
            data: { userId },
          })
        }

        {
          // Check if student already exists and belongs to a different school
          const existingStudent = await tx.student.findUnique({
            where: { userId },
            select: { id: true, schoolId: true },
          })

          if (existingStudent && existingStudent.schoolId !== schoolId) {
            throw new Error("Student is already enrolled in another school")
          }

          // Build previous academic record from application marks
          const previousAcademicParts: string[] = []
          if (application.previousMarks)
            previousAcademicParts.push(`Marks: ${application.previousMarks}`)
          if (application.previousPercentage)
            previousAcademicParts.push(
              `Percentage: ${application.previousPercentage}%`
            )
          if (application.achievements)
            previousAcademicParts.push(
              `Achievements: ${application.achievements}`
            )

          const student = existingStudent
            ? existingStudent
            : await tx.student.create({
                data: {
                  schoolId,
                  userId,
                  studentId: studentCode,
                  firstName: application.firstName,
                  middleName: application.middleName,
                  lastName: application.lastName,
                  dateOfBirth:
                    application.dateOfBirth ?? new Date("2000-01-01"),
                  gender: application.gender ?? "MALE",
                  nationality: application.nationality ?? undefined,
                  email: application.email,
                  mobileNumber: application.phone,
                  alternatePhone: application.alternatePhone ?? undefined,
                  currentAddress: application.address,
                  city: application.city,
                  state: application.state,
                  postalCode: application.postalCode,
                  country: application.country,
                  applicationId: application.id,
                  admissionNumber: enrollmentNumber,
                  admissionDate: new Date(),
                  enrollmentDate: new Date(),
                  status: "ACTIVE",
                  category: application.category ?? undefined,
                  profilePhotoUrl: application.photoUrl ?? undefined,
                  previousSchoolName: application.previousSchool ?? undefined,
                  previousGrade: application.previousClass ?? undefined,
                  previousAcademicRecord:
                    previousAcademicParts.length > 0
                      ? previousAcademicParts.join("; ")
                      : undefined,
                  // Map guardian/parent info to emergency contact
                  emergencyContactName:
                    application.guardianName ||
                    application.fatherName ||
                    undefined,
                  emergencyContactPhone:
                    application.guardianPhone ||
                    application.fatherPhone ||
                    undefined,
                  emergencyContactRelation:
                    application.guardianRelation || "Parent",
                  // Detect language from the applicant's name
                  lang: detectLanguage(
                    [application.firstName, application.lastName]
                      .filter(Boolean)
                      .join(" ")
                  ),
                  // Application provides all required fields — wizard is complete
                  wizardStep: null,
                },
              })

          // 4. Try to match applyingForClass to a YearLevel and create StudentYearLevel
          let matchedYearLevelId: string | null = null
          try {
            // Cascading search: exact -> case-insensitive -> grade number
            let yearLevel = await tx.yearLevel.findFirst({
              where: {
                schoolId,
                levelName: application.applyingForClass,
              },
            })

            if (!yearLevel) {
              yearLevel = await tx.yearLevel.findFirst({
                where: {
                  schoolId,
                  levelName: {
                    equals: application.applyingForClass,
                    mode: "insensitive",
                  },
                },
              })
            }

            if (!yearLevel) {
              const gradeNum = extractGradeNumber(
                application.applyingForClass ?? ""
              )
              if (gradeNum) {
                // Match via AcademicGrade.gradeNumber (not levelOrder, which
                // includes KG levels and shifts the numbering)
                const academicGrade = await tx.academicGrade.findFirst({
                  where: { schoolId, gradeNumber: gradeNum },
                  select: { yearLevelId: true },
                })
                if (academicGrade?.yearLevelId) {
                  yearLevel = await tx.yearLevel.findFirst({
                    where: { id: academicGrade.yearLevelId, schoolId },
                  })
                }
                // Fallback to levelOrder if no AcademicGrade match
                if (!yearLevel) {
                  yearLevel = await tx.yearLevel.findFirst({
                    where: { schoolId, levelOrder: gradeNum },
                  })
                }
              }
            }

            if (yearLevel) {
              matchedYearLevelId = yearLevel.id

              // Find the school year matching the campaign's academic year
              const schoolYear = await tx.schoolYear.findFirst({
                where: {
                  schoolId,
                  yearName: application.campaign.academicYear,
                },
              })

              if (schoolYear) {
                // Upsert to be idempotent (unique on [schoolId, studentId, yearId])
                await tx.studentYearLevel.upsert({
                  where: {
                    schoolId_studentId_yearId: {
                      schoolId,
                      studentId: student.id,
                      yearId: schoolYear.id,
                    },
                  },
                  create: {
                    schoolId,
                    studentId: student.id,
                    levelId: yearLevel.id,
                    yearId: schoolYear.id,
                  },
                  update: {
                    levelId: yearLevel.id,
                  },
                })
              } else {
                console.warn(
                  `[confirmEnrollment] No SchoolYear found for academicYear="${application.campaign.academicYear}" in school=${schoolId}`
                )
              }

              // 4b. Set academicGradeId from the matched YearLevel
              const academicGrade = await tx.academicGrade.findFirst({
                where: { schoolId, yearLevelId: yearLevel.id },
              })
              if (academicGrade) {
                await tx.student.update({
                  where: { id: student.id },
                  data: { academicGradeId: academicGrade.id },
                })
              }
            } else {
              console.warn(
                `[confirmEnrollment] No YearLevel found matching applyingForClass="${application.applyingForClass}" in school=${schoolId}. Available levels should be checked in Year Level settings.`
              )
            }
          } catch (ylError) {
            // Don't break enrollment if year level matching fails
            console.warn(
              "[confirmEnrollment] Failed to create StudentYearLevel:",
              ylError
            )
          }

          // 5. Update user role to STUDENT if not already a higher role
          try {
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { role: true, schoolId: true },
            })

            if (user && user.role === "USER") {
              await tx.user.update({
                where: { id: userId },
                data: { role: "STUDENT", schoolId },
              })
            }
          } catch (roleError) {
            console.warn(
              "[confirmEnrollment] Failed to update user role:",
              roleError
            )
          }

          // 6. Auto-assign fees if matching FeeStructure exists
          // Only assign school-wide (classId=null) or grade-matching fee structures
          try {
            const studentGrade = await tx.student.findUnique({
              where: { id: student.id },
              select: { academicGradeId: true },
            })

            const gradeClassIds: string[] = []
            if (studentGrade?.academicGradeId) {
              const matchingClasses = await tx.class.findMany({
                where: { schoolId, gradeId: studentGrade.academicGradeId },
                select: { id: true },
              })
              gradeClassIds.push(...matchingClasses.map((c) => c.id))
            }

            const feeStructures = await tx.feeStructure.findMany({
              where: {
                schoolId,
                academicYear: application.campaign.academicYear,
                isActive: true,
                OR: [
                  { classId: null }, // School-wide fee structures
                  ...(gradeClassIds.length > 0
                    ? [{ classId: { in: gradeClassIds } }]
                    : []),
                ],
              },
            })

            await Promise.all(
              feeStructures.map((fs) =>
                tx.feeAssignment.upsert({
                  where: {
                    studentId_feeStructureId_academicYear: {
                      studentId: student.id,
                      feeStructureId: fs.id,
                      academicYear: application.campaign.academicYear,
                    },
                  },
                  create: {
                    schoolId,
                    studentId: student.id,
                    feeStructureId: fs.id,
                    academicYear: application.campaign.academicYear,
                    finalAmount: fs.totalAmount,
                    status: "PENDING",
                  },
                  update: {}, // Don't overwrite existing
                })
              )
            )
          } catch (feeError) {
            console.warn(
              "[confirmEnrollment] Fee auto-assignment failed:",
              feeError
            )
            warnings.push({ code: "FEE_AUTO_ASSIGN_FAILED" })
          }

          // 7. Create Guardian records from application parent/guardian data
          try {
            const { createOrLinkGuardian, fromFullName } =
              await import("@/lib/guardian-utils")

            const guardianEntries: Array<{
              typeName: string
              fullName: string
              email: string | null
              phone: string | null
              occupation: string | null
              isPrimary: boolean
            }> = []

            if (application.fatherName) {
              guardianEntries.push({
                typeName: "father",
                fullName: application.fatherName,
                email: application.fatherEmail,
                phone: application.fatherPhone,
                occupation: application.fatherOccupation,
                isPrimary: true,
              })
            }
            if (application.motherName) {
              guardianEntries.push({
                typeName: "mother",
                fullName: application.motherName,
                email: application.motherEmail,
                phone: application.motherPhone,
                occupation: application.motherOccupation,
                isPrimary: !application.fatherName,
              })
            }
            if (
              application.guardianName &&
              application.guardianName !== application.fatherName &&
              application.guardianName !== application.motherName
            ) {
              guardianEntries.push({
                typeName:
                  application.guardianRelation?.toLowerCase() || "guardian",
                fullName: application.guardianName,
                email: application.guardianEmail,
                phone: application.guardianPhone,
                occupation: null,
                isPrimary: false,
              })
            }

            for (const entry of guardianEntries) {
              await createOrLinkGuardian(tx, {
                schoolId,
                studentId: student.id,
                ...fromFullName(entry),
              })
            }
          } catch (guardianError) {
            console.warn(
              "[confirmEnrollment] Guardian creation failed:",
              guardianError
            )
            warnings.push({ code: "GUARDIAN_CREATE_FAILED" })
          }

          // 8. Copy application documents to StudentDocument records
          try {
            const appDocs = application.documents as Array<{
              type?: string
              name?: string
              url?: string
              uploadedAt?: string
            }> | null

            if (appDocs && Array.isArray(appDocs)) {
              for (const doc of appDocs) {
                if (!doc.url) continue
                await tx.studentDocument.create({
                  data: {
                    schoolId,
                    studentId: student.id,
                    documentType: doc.type || "Other",
                    documentName: doc.name || doc.type || "Document",
                    fileUrl: doc.url,
                    uploadedAt: doc.uploadedAt
                      ? new Date(doc.uploadedAt)
                      : new Date(),
                  },
                })
              }
            }
          } catch (docError) {
            console.warn("[confirmEnrollment] Document copy failed:", docError)
          }

          // 6b. Auto-generate invoice(s) per fee assignment.
          // ensureInvoicesForAssignment respects FeeStructure.installments + paymentSchedule,
          // producing one invoice per installment when applicable.
          try {
            const feeAssignments = await tx.feeAssignment.findMany({
              where: {
                schoolId,
                studentId: student.id,
                academicYear: application.campaign.academicYear,
                status: "PENDING",
              },
              select: { id: true },
            })

            for (const fa of feeAssignments) {
              await ensureInvoicesForAssignment(schoolId, fa.id, tx)
            }
          } catch (invoiceError) {
            console.warn(
              "[confirmEnrollment] Invoice auto-generation failed:",
              invoiceError
            )
            warnings.push({ code: "INVOICE_GENERATION_FAILED" })
          }

          enrolledStudentId = student.id
        }

        return userId
      },
      { timeout: 30000 }
    )

    // Check for suggested section placement (auto-suggest when a matching section has capacity)
    let suggestedSectionId: string | null = null
    let suggestedSectionName: string | null = null
    try {
      if (application.applyingForClass) {
        const gradeNum = extractGradeNumber(application.applyingForClass)
        const gradeWhere = gradeNum
          ? {
              OR: [
                {
                  grade: {
                    name: {
                      contains: application.applyingForClass,
                      mode: "insensitive" as const,
                    },
                  },
                },
                { grade: { gradeNumber: gradeNum } },
              ],
            }
          : {
              grade: {
                name: {
                  contains: application.applyingForClass,
                  mode: "insensitive" as const,
                },
              },
            }

        const sections = await db.section.findMany({
          where: { schoolId, ...gradeWhere },
          select: {
            id: true,
            name: true,
            maxCapacity: true,
            _count: { select: { students: true } },
          },
          orderBy: { name: "asc" },
        })

        const available = sections.filter(
          (s) => s._count.students < s.maxCapacity
        )
        if (available.length === 1) {
          suggestedSectionId = available[0].id
          suggestedSectionName = available[0].name
        }
      }
    } catch {
      // Non-critical: suggestion is best-effort
    }

    // Notify student about enrollment confirmation (non-blocking)
    const schoolLang =
      (
        await db.school.findFirst({
          where: { id: schoolId },
          select: { preferredLanguage: true },
        })
      )?.preferredLanguage ?? "ar"

    const effectiveUserId = txUserId || application.userId
    if (effectiveUserId) {
      dispatchAdmissionNotification({
        schoolId,
        userId: effectiveUserId,
        type: "account_created",
        title: t(NOTIF.enrollment.title, schoolLang),
        body: t(NOTIF.enrollment.body(enrollmentNumber), schoolLang),
        lang: schoolLang,
        priority: "high",
        channels: ["in_app", "email"],
        metadata: {
          applicationId: params.id,
          enrollmentNumber,
          url: "/",
        },
      }).catch((err) =>
        console.error("[confirmEnrollment] Notification error:", err)
      )
    }

    // Dispatch fee_due notifications for auto-assigned fees (non-fatal)
    try {
      if (enrolledStudentId && effectiveUserId) {
        const pendingFees = await db.feeAssignment.findMany({
          where: {
            schoolId,
            studentId: enrolledStudentId,
            status: "PENDING",
          },
          select: { finalAmount: true },
        })
        if (pendingFees.length > 0) {
          const totalAmount = pendingFees.reduce(
            (sum, fa) => sum + Number(fa.finalAmount),
            0
          )
          dispatchAdmissionNotification({
            schoolId,
            userId: effectiveUserId,
            type: "fee_due",
            title: t(NOTIF.feeDue.title, schoolLang),
            body: t(
              NOTIF.feeDue.body(
                pendingFees.length,
                totalAmount.toLocaleString()
              ),
              schoolLang
            ),
            lang: schoolLang,
            priority: "high",
            channels: ["in_app", "email"],
            metadata: {
              studentId: enrolledStudentId,
              feeCount: pendingFees.length,
              totalAmount,
              url: "/finance/fees",
            },
            actorId: session.user?.id,
          }).catch((err) =>
            console.error("[confirmEnrollment] Fee notification error:", err)
          )
        }
      }
    } catch {
      // Non-critical: fee notification is best-effort
    }

    // Notify guardians about enrollment (non-blocking)
    try {
      if (enrolledStudentId) {
        const guardianLinks = await db.studentGuardian.findMany({
          where: { studentId: enrolledStudentId, schoolId },
          select: { guardian: { select: { userId: true } } },
        })
        for (const link of guardianLinks) {
          if (link.guardian?.userId) {
            const studentFullName = `${application.firstName} ${application.lastName}`
            dispatchAdmissionNotification({
              schoolId,
              userId: link.guardian.userId,
              type: "account_created",
              title: t(NOTIF.guardianEnrollment.title, schoolLang),
              body: t(
                NOTIF.guardianEnrollment.body(studentFullName),
                schoolLang
              ),
              lang: schoolLang,
              priority: "high",
              channels: ["in_app", "email"],
              metadata: {
                applicationId: params.id,
                enrollmentNumber,
                studentName: `${application.firstName} ${application.lastName}`,
                url: "/",
              },
            }).catch((err) =>
              console.error(
                "[confirmEnrollment] Guardian notification error:",
                err
              )
            )
          }
        }
      }
    } catch {
      // Non-critical: guardian notification is best-effort
    }

    revalidatePath("/admission/enrollment")
    revalidatePath("/students")
    return {
      success: true,
      data: {
        suggestedSectionId,
        suggestedSectionName,
        studentId: enrolledStudentId,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    }
  } catch (error) {
    console.error("[confirmEnrollment]", error)
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export async function recordPayment(params: {
  id: string
  paymentId: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "recordPayment")

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
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// ============================================================================
// Placement Actions
// ============================================================================

export async function getAvailableSectionsForPlacement(params: {
  applyingForClass: string
}): Promise<
  ActionResponse<
    Array<{
      id: string
      name: string
      enrolledStudents: number
      maxCapacity: number
    }>
  >
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role
    if (!schoolId || !role) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    assertAdmissionPermission(role, "viewApplications")

    // Cascading match: text contains OR grade number
    const gradeNum = extractGradeNumber(params.applyingForClass)
    const gradeWhere = gradeNum
      ? {
          OR: [
            {
              grade: {
                name: {
                  contains: params.applyingForClass,
                  mode: "insensitive" as const,
                },
              },
            },
            { grade: { gradeNumber: gradeNum } },
          ],
        }
      : {
          grade: {
            name: {
              contains: params.applyingForClass,
              mode: "insensitive" as const,
            },
          },
        }

    const sections = await db.section.findMany({
      where: {
        schoolId,
        ...gradeWhere,
      },
      select: {
        id: true,
        name: true,
        maxCapacity: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: sections.map((s) => ({
        id: s.id,
        name: s.name,
        enrolledStudents: s._count.students,
        maxCapacity: s.maxCapacity,
      })),
    }
  } catch (error) {
    console.error("[getAvailableSectionsForPlacement]", error)
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

/** @deprecated Use getAvailableSectionsForPlacement instead */
export const getAvailableClassesForPlacement = getAvailableSectionsForPlacement

export async function placeStudentInSection(params: {
  applicationId: string
  sectionId: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role
    if (!schoolId || !role) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    assertAdmissionPermission(role, "placeStudents")

    // Get the application and verify it's ADMITTED
    const application = await db.application.findUnique({
      where: { id: params.applicationId, schoolId },
      select: { status: true, userId: true, firstName: true, lastName: true },
    })

    if (!application) return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    if (application.status !== "ADMITTED") {
      return actionError(ACTION_ERRORS.PLACEMENT_INVALID_STATUS)
    }

    // Find the student record via userId
    if (!application.userId) {
      return actionError(ACTION_ERRORS.PLACEMENT_NO_USER)
    }

    const student = await db.student.findFirst({
      where: { userId: application.userId, schoolId },
      select: { id: true, sectionId: true },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.ENROLLMENT_FAILED)
    }

    // Check section capacity and assign atomically
    const sectionData = await db.$transaction(async (tx) => {
      const section = await tx.section.findFirst({
        where: { id: params.sectionId, schoolId },
        select: {
          id: true,
          name: true,
          gradeId: true,
          maxCapacity: true,
          _count: { select: { students: true } },
        },
      })

      if (!section) return null

      if (section._count.students >= section.maxCapacity) {
        return { ...section, full: true as const }
      }

      // Check if already in this section
      if (student.sectionId === params.sectionId) {
        return { ...section, alreadyPlaced: true as const }
      }

      // Assign student to section atomically with capacity check
      await tx.student.update({
        where: { id: student.id },
        data: { sectionId: params.sectionId },
      })

      return { ...section, full: false as const, alreadyPlaced: false as const }
    })

    if (!sectionData) return actionError(ACTION_ERRORS.NOT_FOUND)

    if ("full" in sectionData && sectionData.full) {
      return actionError(ACTION_ERRORS.SECTION_AT_CAPACITY)
    }

    if ("alreadyPlaced" in sectionData && sectionData.alreadyPlaced) {
      return actionError(ACTION_ERRORS.STUDENT_ALREADY_IN_SECTION)
    }

    // Create StudentClass entries
    let noClassesForGrade = false

    if (sectionData.gradeId) {
      const result = await enrollStudentInGradeClasses(
        schoolId,
        student.id,
        sectionData.gradeId
      )
      noClassesForGrade = result.classIds.length === 0
    }

    // Notify student about section placement (non-blocking)
    if (application.userId) {
      const schoolLang2 = await db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const lang = schoolLang2?.preferredLanguage ?? "ar"
      dispatchAdmissionNotification({
        schoolId,
        userId: application.userId,
        type: "system_alert",
        title: t(NOTIF.sectionPlacement.title, lang),
        body: t(NOTIF.sectionPlacement.body(sectionData.name), lang),
        lang,
        priority: "normal",
        channels: ["in_app", "email"],
        metadata: {
          applicationId: params.applicationId,
          sectionId: params.sectionId,
          sectionName: sectionData.name,
          url: "/",
        },
      }).catch((err) =>
        console.error("[placeStudentInSection] Notification error:", err)
      )
    }

    revalidatePath("/admission/enrollment")
    revalidatePath("/students")
    revalidatePath("/classrooms")

    if (noClassesForGrade) {
      return {
        success: true,
        data: null,
        warning: ACTION_ERRORS.NO_CLASSES_FOR_GRADE,
      }
    }

    return { success: true, data: null }
  } catch (error) {
    console.error("[placeStudentInSection]", error)
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

/** @deprecated Use placeStudentInSection instead */
export const placeStudentInClass =
  placeStudentInSection as unknown as (params: {
    applicationId: string
    classId: string
  }) => Promise<ActionResponse>

// ============================================================================
// Helper Actions
// ============================================================================

export async function fetchCampaignOptions(): Promise<
  ActionResponse<{ value: string; label: string }[]>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const options = await getCampaignOptions(schoolId)
    return { success: true, data: options }
  } catch (error) {
    console.error("[fetchCampaignOptions]", error)
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}
