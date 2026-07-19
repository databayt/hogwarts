"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type {
  AdmissionApplicationStatus,
  NotificationPriority,
  NotificationType,
  PaymentMethod,
} from "@prisma/client"
import { nanoid } from "nanoid"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { enrollStudentInGradeClasses } from "@/lib/enrollment-sync"
import { extractGradeNumber } from "@/lib/grade-utils"
import type { ProvisionGuardianInput } from "@/lib/student-provisioning"
import { provisionStudent } from "@/lib/student-provisioning"
import { sendNotificationEmail } from "@/components/school-dashboard/notifications/email-service"

import { assertAdmissionPermission, isPermissionDenied } from "./authorization"
import {
  getApplicationsList,
  getCampaignOptions,
  getCampaignsList,
  getEnrollmentList,
  getMeritList,
} from "./queries"
import { isTransitionAllowed, isValidTargetStatus } from "./status-machine"
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
    // New guest accounts have no password — this variant links to the
    // password-set page so the student can actually log in for the first time.
    bodyWithSetup: (enrollmentNumber: string, setupUrl: string) => ({
      ar: `تهانينا! تم تأكيد تسجيلك بالمدرسة. رقم التسجيل: ${enrollmentNumber}. لإنشاء كلمة المرور وتسجيل الدخول لأول مرة، يرجى زيارة: ${setupUrl}`,
      en: `Congratulations! Your enrollment has been confirmed. Enrollment #: ${enrollmentNumber}. To set your password and log in for the first time, visit: ${setupUrl}`,
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
  feePaid: {
    title: { ar: "تأكيد الدفع", en: "Payment Confirmed" },
    body: {
      ar: "تم تأكيد دفع رسوم التسجيل بنجاح.",
      en: "Your registration fee payment has been confirmed.",
    },
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
  userId?: string
  // Guest applicants (no userId) receive the email channel directly here.
  directEmail?: string
  type: NotificationType
  title: string
  body: string
  lang: string
  priority?: NotificationPriority
  channels?: ("in_app" | "email")[]
  metadata?: Record<string, unknown>
  actorId?: string
}): Promise<void> {
  let channels = params.channels ?? ["in_app", "email"]

  // Honor the school's "Automatic Email Notifications" toggle
  // (AdmissionSettings.autoEmailNotifications). Previously never read here,
  // so every caller's hardcoded `channels: ["in_app", "email"]` sent email
  // unconditionally even when an admin had disabled it in Settings. Applies
  // to explicit AND default channel lists alike — in_app is never affected.
  if (channels.includes("email")) {
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId: params.schoolId },
      select: { autoEmailNotifications: true },
    })
    // Column defaults to true; only a persisted `false` turns email off.
    if (settings?.autoEmailNotifications === false) {
      channels = channels.filter((c) => c !== "email")
    }
  }

  const notificationId = await dispatchNotification({
    ...params,
    channels,
    priority: params.priority ?? "normal",
  })

  // Guest path: dispatchNotification already delivered to directEmail and
  // returned null (no in-app row). Nothing further to do.
  if (!params.userId) return
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
          applicationsCount: c._count.applications,
          createdAt: c.createdAt?.toISOString(),
        })),
        total: result.count,
      },
    }
  } catch (error) {
    console.error("[getCampaigns]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
  }>
> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const role = session?.user?.role

    if (!schoolId || !role) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(role, "manageCampaigns")

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
      },
    }
  } catch (error) {
    console.error("[getCampaign]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
          applicationFeePaid: a.applicationFeePaid,
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

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
    if (!isValidTargetStatus(params.status)) {
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

    // Enforce the status state machine. Same-status is a permitted no-op; any
    // other move must be in the allowed-transitions map for the current status.
    // Blocks illegal jumps (e.g. REJECTED/WITHDRAWN → SELECTED re-issuing an
    // offer) that the previous "any valid status → any valid status" check let
    // through.
    if (params.status !== current.status) {
      if (!isTransitionAllowed(current.status, params.status)) {
        return actionError(ACTION_ERRORS.APPLICATION_STATUS_INVALID)
      }
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
        email: true,
        applicationNumber: true,
        fatherName: true,
        motherName: true,
        offerExpiryDate: true,
      },
    })
    if (application) {
      const school = await db.school.findFirst({
        where: { id: schoolId },
        select: {
          preferredLanguage: true,
          name: true,
          nameEn: true,
          domain: true,
        },
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
      const notifMetadata = {
        applicationId: params.id,
        status: params.status,
        url:
          params.status === "SELECTED" && application.accessToken
            ? `/application/${params.id}/offer?token=${encodeURIComponent(application.accessToken)}`
            : "/admission",
      }

      // Guest applicants (no userId) have no in-app inbox — fall back to
      // directEmail so they still hear about the status change. Previously
      // this whole block (including the dedicated offer email below) was
      // gated on `application.userId`, so a guest selected for admission
      // silently received nothing.
      if (application.userId) {
        dispatchAdmissionNotification({
          schoolId,
          userId: application.userId,
          type: "system_alert",
          title: t(NOTIF.statusUpdate.title, notifLang),
          body: statusMessage,
          lang: notifLang,
          priority: params.status === "SELECTED" ? "high" : "normal",
          channels: ["in_app", "email"],
          metadata: notifMetadata,
          actorId: session.user?.id,
        }).catch((err) =>
          console.error("[updateApplicationStatus] Notification error:", err)
        )
      } else if (application.email) {
        dispatchAdmissionNotification({
          schoolId,
          directEmail: application.email,
          type: "system_alert",
          title: t(NOTIF.statusUpdate.title, notifLang),
          body: statusMessage,
          lang: notifLang,
          priority: params.status === "SELECTED" ? "high" : "normal",
          channels: ["email"],
          metadata: notifMetadata,
          actorId: session.user?.id,
        }).catch((err) =>
          console.error(
            "[updateApplicationStatus] Guest notification error:",
            err
          )
        )
      }

      // Dedicated offer email with the registration link on SELECTED, so the
      // guardian actually receives it (the in-app notification's metadata.url
      // may never be opened). Runs for BOTH guest and registered applicants —
      // only needs email + accessToken, not userId. Non-blocking — failure
      // must not fail the action.
      if (
        params.status === "SELECTED" &&
        application.email &&
        application.accessToken
      ) {
        try {
          const [{ buildOfferEmail }, { sendRawEmail }] = await Promise.all([
            import("@/lib/email-templates/admission"),
            import("@/components/school-dashboard/notifications/email-service"),
          ])
          // BUG-6: guard against null/empty domain — skip URL when unresolvable
          const schoolDomain = school?.domain || null
          if (!schoolDomain) {
            console.warn(
              "[updateApplicationStatus] school.domain is null/empty — offer URL will be skipped"
            )
            throw new Error("SKIP_OFFER_EMAIL")
          }
          const isProd = process.env.NODE_ENV === "production"
          const baseUrl = isProd
            ? `https://${schoolDomain}.databayt.org`
            : `http://${schoolDomain}.localhost:3000`
          const offerUrl = `${baseUrl}/${notifLang}/application/${params.id}/offer?token=${encodeURIComponent(application.accessToken)}`
          const parentName =
            application.fatherName ||
            application.motherName ||
            `${application.firstName} ${application.lastName}`
          const { subject, html } = buildOfferEmail({
            school: {
              name: school?.name,
              nameEn: school?.nameEn,
              preferredLanguage: school?.preferredLanguage,
            },
            parentName,
            studentName: `${application.firstName} ${application.lastName}`,
            applicationNumber: application.applicationNumber,
            offerUrl,
            expiryDate: application.offerExpiryDate
              ? application.offerExpiryDate.toISOString().slice(0, 10)
              : undefined,
          })
          await sendRawEmail({ to: application.email, subject, html })
        } catch (err) {
          console.error("[updateApplicationStatus] Offer email failed:", err)
        }
      }
    }

    revalidatePath("/admission")
    return { success: true, data: null }
  } catch (error) {
    console.error("[updateApplicationStatus]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

// Zod schema for score updates (0-100 nullable floats)
const updateScoresSchema = z.object({
  entranceScore: z.number().min(0).max(100).nullable().optional(),
  interviewScore: z.number().min(0).max(100).nullable().optional(),
})

/**
 * Update entrance/interview scores for a single application.
 * Scores are 0-100 (nullable). meritScore is NOT recomputed here —
 * call generateMeritList to recompute and rank the whole campaign.
 */
export async function updateApplicationScores(params: {
  id: string
  entranceScore?: number | null
  interviewScore?: number | null
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "updateStatus")

    const validated = updateScoresSchema.safeParse({
      entranceScore: params.entranceScore,
      interviewScore: params.interviewScore,
    })
    if (!validated.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Verify application belongs to this school
    const existing = await db.application.findUnique({
      where: { id: params.id, schoolId },
      select: { id: true },
    })
    if (!existing) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    }

    const updateData: Record<string, unknown> = {}
    if (validated.data.entranceScore !== undefined) {
      updateData.entranceScore = validated.data.entranceScore
    }
    if (validated.data.interviewScore !== undefined) {
      updateData.interviewScore = validated.data.interviewScore
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true, data: null }
    }

    await db.application.update({
      where: { id: params.id, schoolId },
      data: updateData,
    })

    revalidatePath("/admission/merit")
    return { success: true, data: null }
  } catch (error) {
    console.error("[updateApplicationScores]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

/** Default weights used when AdmissionSettings has no entranceWeight/interviewWeight */
const DEFAULT_ENTRANCE_WEIGHT = 60
const DEFAULT_INTERVIEW_WEIGHT = 40

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

    // Read score weights from AdmissionSettings (or use constants)
    const settings = await db.admissionSettings.findUnique({
      where: { schoolId },
      select: { entranceWeight: true, interviewWeight: true },
    })
    // Normalize weights so they sum to 100. If only one score is configured,
    // the entire merit comes from that score.
    const rawEntrance = settings?.entranceWeight ?? DEFAULT_ENTRANCE_WEIGHT
    const rawInterview = settings?.interviewWeight ?? DEFAULT_INTERVIEW_WEIGHT
    const weightSum = rawEntrance + rawInterview
    const entranceW = weightSum > 0 ? rawEntrance / weightSum : 0.6
    const interviewW = weightSum > 0 ? rawInterview / weightSum : 0.4

    // Clear stale ranks first: an application that was previously ranked but
    // has since moved to REJECTED/WITHDRAWN/ADMITTED (or any status outside
    // the eligible set below) must drop off the merit list on regenerate —
    // otherwise it keeps displaying its last computed meritScore/meritRank
    // forever. Scoped to this campaign only.
    const ELIGIBLE_STATUSES = ["SHORTLISTED", "SELECTED", "WAITLISTED"] as const
    const staleRanked = await db.application.findMany({
      where: {
        schoolId,
        campaignId: params.campaignId,
        meritRank: { not: null },
        status: { notIn: [...ELIGIBLE_STATUSES] },
      },
      select: { id: true },
    })

    if (staleRanked.length > 0) {
      const STALE_CHUNK_SIZE = 50
      const staleChunks: { id: string }[][] = []
      for (let i = 0; i < staleRanked.length; i += STALE_CHUNK_SIZE) {
        staleChunks.push(staleRanked.slice(i, i + STALE_CHUNK_SIZE))
      }
      for (const chunk of staleChunks) {
        await db.$transaction(
          chunk.map((app) =>
            db.application.update({
              where: { id: app.id, schoolId },
              data: { meritScore: null, meritRank: null },
            })
          )
        )
      }
    }

    // Fetch all eligible applications for the campaign
    const applications = await db.application.findMany({
      where: {
        schoolId,
        campaignId: params.campaignId,
        status: { in: [...ELIGIBLE_STATUSES] },
      },
      select: {
        id: true,
        entranceScore: true,
        interviewScore: true,
      },
    })

    // Compute meritScore for each application that has at least one score.
    // Applications with no scores at all get meritScore = null and rank last.
    type ScoredApp = { id: string; meritScore: number | null }
    const scored: ScoredApp[] = applications.map((app) => {
      const entrance = app.entranceScore ? Number(app.entranceScore) : null
      const interview = app.interviewScore ? Number(app.interviewScore) : null

      if (entrance === null && interview === null) {
        return { id: app.id, meritScore: null }
      }

      // Weighted combination — if only one score present, use full weight
      const hasEntrance = entrance !== null
      const hasInterview = interview !== null
      let merit: number

      if (hasEntrance && hasInterview) {
        merit = entrance * entranceW + interview * interviewW
      } else if (hasEntrance) {
        merit = entrance
      } else {
        merit = interview as number
      }

      return { id: app.id, meritScore: Math.round(merit * 100) / 100 }
    })

    // Sort: scored desc first, nulls last
    scored.sort((a, b) => {
      if (a.meritScore === null && b.meritScore === null) return 0
      if (a.meritScore === null) return 1
      if (b.meritScore === null) return -1
      return b.meritScore - a.meritScore
    })

    // Batch rank writes in a single transaction to minimize round-trips.
    // Pre-compute the rank map so chunk.map is O(1) per item (not O(n²) indexOf).
    const rankMap = new Map<string, number>(
      scored.map((app, i) => [app.id, i + 1])
    )

    const CHUNK_SIZE = 50
    const chunks: ScoredApp[][] = []
    for (let i = 0; i < scored.length; i += CHUNK_SIZE) {
      chunks.push(scored.slice(i, i + CHUNK_SIZE))
    }

    for (const chunk of chunks) {
      await db.$transaction(
        chunk.map((app) =>
          db.application.update({
            where: { id: app.id, schoolId },
            data: {
              meritScore: app.meritScore,
              meritRank: rankMap.get(app.id) ?? null,
            },
          })
        )
      )
    }

    revalidatePath("/admission/merit")
    return { success: true, data: null }
  } catch (error) {
    console.error("[generateMeritList]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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

    // registrationFeeMethod is not in getEnrollmentList's select (queries.ts,
    // not owned here) — fetch it in one extra batched query keyed by id so
    // the "Confirm Reg. Payment" row action can gate on cash/bank_transfer
    // intents. TODO(queries.ts owner): fold registrationFeeMethod into
    // applicationListSelect/getEnrollmentList's select to drop this query.
    const ids = result.rows.map((a) => a.id)
    const methodRows =
      ids.length > 0
        ? await db.application.findMany({
            where: { id: { in: ids }, schoolId },
            select: { id: true, registrationFeeMethod: true },
          })
        : []
    const methodById = new Map(
      methodRows.map((r) => [r.id, r.registrationFeeMethod])
    )

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
          // BUG: previously omitted, so the offer-accepted badge and Reg Fee
          // column always rendered their falsy default regardless of the
          // real value — both fields ARE already in getEnrollmentList's
          // select (queries.ts), just never threaded through this mapping.
          offerAccepted: a.offerAccepted,
          registrationFeePaid: a.registrationFeePaid,
          registrationFeeMethod: methodById.get(a.id) ?? null,
        })),
        total: result.count,
      },
    }
  } catch (error) {
    console.error("[getEnrollmentData]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

export type EnrollmentWarningCode =
  | "FEE_AUTO_ASSIGN_FAILED"
  | "INVOICE_GENERATION_FAILED"
  | "GUARDIAN_CREATE_FAILED"
  | "NO_FEE_STRUCTURE_MATCH"
  | "REGISTRATION_FEE_NO_STRUCTURE"

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
        campaign: { select: { academicYear: true } },
      },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    }

    // Enrollment may only be confirmed for a live, selected offer. ADMITTED is
    // already enrolled; a declined offer sets status WITHDRAWN, so this gate is
    // what stops a withdrawn/rejected applicant being turned into a Student.
    if (application.status === "ADMITTED") {
      return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
    }
    if (application.status !== "SELECTED") {
      return actionError(ACTION_ERRORS.APPLICATION_STATUS_INVALID)
    }

    if (
      application.offerExpiryDate &&
      new Date(application.offerExpiryDate) < new Date()
    ) {
      return actionError(ACTION_ERRORS.OFFER_EXPIRED)
    }

    // Generate collision-safe enrollmentNumber using a retry-on-unique-violation
    // loop. We count existing students for this school to get the next seq, then
    // retry (up to 10 times) if another concurrent enrollment claimed it first.
    const academicYearShort = (
      application.campaign?.academicYear ?? String(new Date().getFullYear())
    )
      .replace(/[^0-9]/g, "")
      .slice(-4)
      .slice(0, 2)

    let enrollmentNumber = ""
    const MAX_RETRIES = 10
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const existingCount = await db.student.count({ where: { schoolId } })
      const seq = String(existingCount + 1 + attempt).padStart(4, "0")
      const candidate = `ENR-${academicYearShort}-${seq}`
      // Check uniqueness against Student.admissionNumber
      const conflict = await db.student.findFirst({
        where: { schoolId, admissionNumber: candidate },
        select: { id: true },
      })
      if (!conflict) {
        enrollmentNumber = candidate
        break
      }
    }
    if (!enrollmentNumber) {
      // Ultimate fallback: timestamp suffix — guaranteed unique
      enrollmentNumber = `ENR-${Date.now()}`
    }
    let enrolledStudentId: string | null = null
    const warnings: EnrollmentWarning[] = []

    // (No application-fee warning here: applying is always free — the
    // 2026-06-12 product decision. The registration fee on the offer leg is
    // the only pre-enrollment payment, checked by the offer actions.)

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

    const { userId: txUserId, isNewGuestUser } = await db.$transaction(
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

        // Build the guardian inputs from the application's father/mother/
        // other fields (typed entries with fullName split into first/last),
        // then delegate every user/student/yearLevel/role/fee/guardian/
        // document create to the shared provisioning core. confirmEnrollment
        // always reuses THIS existing Application (never mints a shadow one)
        // and keeps ownership of the registration-fee ledger entry below,
        // which reads the FeeAssignment provisionStudent creates.
        let guardianInputs: ProvisionGuardianInput[] = []
        try {
          const { fromFullName } = await import("@/lib/guardian-utils")

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

          guardianInputs = guardianEntries.map((entry) => fromFullName(entry))
        } catch (guardianBuildError) {
          console.warn(
            "[confirmEnrollment] Guardian entry construction failed:",
            guardianBuildError
          )
          warnings.push({ code: "GUARDIAN_CREATE_FAILED" })
        }

        const provisionResult = await provisionStudent(
          {
            schoolId,
            firstName: application.firstName,
            middleName: application.middleName,
            lastName: application.lastName,
            dateOfBirth: application.dateOfBirth,
            gender: application.gender,
            nationality: application.nationality,
            category: application.category,
            photoUrl: application.photoUrl,
            email: application.email,
            phone: application.phone,
            alternatePhone: application.alternatePhone,
            address: application.address,
            city: application.city,
            state: application.state,
            postalCode: application.postalCode,
            country: application.country,
            applyingForClass: application.applyingForClass,
            academicYear: application.campaign.academicYear,
            previousSchool: application.previousSchool,
            previousGrade: application.previousClass,
            previousMarks: application.previousMarks,
            previousPercentage: application.previousPercentage,
            achievements: application.achievements,
            guardians: guardianInputs,
            documents:
              (application.documents as Array<{
                type?: string
                name?: string
                url?: string
                uploadedAt?: string
              }> | null) ?? undefined,
            applicationId: params.id,
            admissionNumber: enrollmentNumber,
            userId: application.userId,
            emergencyContactName:
              application.guardianName || application.fatherName || undefined,
            emergencyContactPhone:
              application.guardianPhone || application.fatherPhone || undefined,
            emergencyContactRelation: application.guardianRelation || "Parent",
          },
          { notify: false, credentialDelivery: "reset-link", origin: "PORTAL" },
          tx
        )

        warnings.push(
          ...provisionResult.warnings.map((w) => ({
            code: w.code as EnrollmentWarningCode,
            meta: w.meta,
          }))
        )

        {
          const studentId = provisionResult.studentId

          // Registration-fee materialization (ADMISSION-FEE-NO-LEDGER).
          // If the application captured a registration-fee payment at offer
          // time, we must create a Payment + journal entry so the books reflect
          // the money already collected.  Idempotent: if a Payment for this
          // student's REGISTRATION FeeAssignment already exists, skip.
          if (
            application.registrationFeePaid &&
            application.registrationFeeAmount
          ) {
            try {
              // Find the registration-type FeeAssignment just created by
              // provisionStudent's ensureStudentFeeAssignments call (or a
              // pre-existing one).
              const regAssignment = await tx.feeAssignment.findFirst({
                where: {
                  schoolId,
                  studentId,
                  feeStructure: {
                    OR: [
                      {
                        name: { contains: "registration", mode: "insensitive" },
                      },
                      {
                        name: { contains: "Registration", mode: "insensitive" },
                      },
                      { registrationFee: { gt: 0 } },
                    ],
                  },
                },
                select: { id: true, status: true },
              })

              if (regAssignment) {
                // Idempotency: skip if a payment for this assignment already exists
                const existingPayment = await tx.payment.findFirst({
                  where: {
                    schoolId,
                    feeAssignmentId: regAssignment.id,
                  },
                  select: { id: true },
                })

                if (!existingPayment) {
                  // Map application.registrationFeeMethod string to PaymentMethod enum
                  const methodMap: Record<string, PaymentMethod> = {
                    cash: "CASH",
                    stripe: "CREDIT_CARD",
                    credit_card: "CREDIT_CARD",
                    bank_transfer: "BANK_TRANSFER",
                    cheque: "CHEQUE",
                    online: "CREDIT_CARD",
                    wallet: "WALLET",
                    apple_pay: "APPLE_PAY",
                    google_pay: "GOOGLE_PAY",
                    mada: "MADA",
                    knet: "KNET",
                  }
                  const rawMethod = (
                    application.registrationFeeMethod ?? "cash"
                  ).toLowerCase()
                  const paymentMethod: PaymentMethod =
                    methodMap[rawMethod] ?? "OTHER"

                  // Collision-safe paymentNumber/receiptNumber
                  const timestamp = Date.now()
                  const suffix = nanoid(6).toUpperCase()
                  const paymentNumber = `PAY-REG-${timestamp}-${suffix}`
                  const receiptNumber = `REC-REG-${timestamp}-${suffix}`

                  const regPaymentDate =
                    application.registrationFeeDate ?? new Date()
                  const regAmount = Number(application.registrationFeeAmount)

                  const newPayment = await tx.payment.create({
                    data: {
                      schoolId,
                      feeAssignmentId: regAssignment.id,
                      studentId,
                      paymentNumber,
                      receiptNumber,
                      amount: regAmount,
                      paymentMethod,
                      paymentDate: regPaymentDate,
                      status: "SUCCESS",
                      transactionId:
                        application.registrationFeeReference ?? null,
                      remarks: "Registration fee collected at offer acceptance",
                    },
                    select: { id: true },
                  })

                  // Mark the fee assignment as PAID
                  await tx.feeAssignment.update({
                    where: { id: regAssignment.id },
                    data: { status: "PAID" },
                  })

                  // Post the ledger entry (non-blocking — failure must not
                  // roll back enrollment; we log and continue)
                  try {
                    const { createFeePaymentEntry } =
                      await import("@/components/school-dashboard/finance/lib/accounting/posting-rules")
                    const { createJournalEntry } =
                      await import("@/components/school-dashboard/finance/lib/accounting/utils")
                    const entryInput = await createFeePaymentEntry(
                      schoolId,
                      {
                        paymentId: newPayment.id,
                        studentId,
                        amount: regAmount,
                        paymentMethod: paymentMethod,
                        paymentDate: regPaymentDate,
                        feeType: "registration",
                      },
                      tx
                    )
                    // Use a system actor ID ("system") for automated entries
                    const postResult = await createJournalEntry(
                      schoolId,
                      entryInput,
                      session.user?.id ?? "system"
                    )
                    if (postResult.success && postResult.journalEntryId) {
                      await tx.payment.update({
                        where: { id: newPayment.id },
                        data: { journalEntryId: postResult.journalEntryId },
                      })
                    }
                  } catch (ledgerErr) {
                    console.warn(
                      "[confirmEnrollment] Registration fee ledger entry failed:",
                      ledgerErr
                    )
                  }

                  // Sync the payment onto the auto-generated UserInvoice(s) for
                  // this assignment (created moments ago by provisionStudent →
                  // ensureInvoicesForAssignment inside this same transaction).
                  // Without this the invoice stays UNPAID forever while the
                  // Payment/ledger say collected. `tx` is load-bearing: the
                  // invoices are uncommitted, so the plain db client can't see
                  // them.
                  try {
                    const { allocatePaymentToInvoices } =
                      await import("@/components/school-dashboard/finance/lib/invoice-allocation")
                    await allocatePaymentToInvoices(
                      schoolId,
                      regAssignment.id,
                      regAmount,
                      tx
                    )
                  } catch (allocErr) {
                    console.warn(
                      "[confirmEnrollment] Registration fee invoice allocation failed:",
                      allocErr
                    )
                  }
                }
              } else {
                // No matching registration FeeStructure was found — warn admin
                warnings.push({ code: "REGISTRATION_FEE_NO_STRUCTURE" })
              }
            } catch (regFeeErr) {
              console.warn(
                "[confirmEnrollment] Registration fee materialization failed:",
                regFeeErr
              )
            }
          }

          enrolledStudentId = studentId
        }

        return {
          userId: provisionResult.userId,
          isNewGuestUser: provisionResult.isNewUser,
        }
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
      // A brand-new guest User (created above because the applicant had no
      // existing login) has NO password set — without a way to authenticate,
      // the account is unusable. Mint a password-reset token and link to the
      // root-domain /new-password page (there is no per-subdomain route;
      // cross-subdomain SSO shares the session once a password is set).
      let passwordSetupUrl: string | null = null
      if (isNewGuestUser) {
        try {
          const { generatePasswordResetToken } =
            await import("@/components/auth/tokens")
          const reset = await generatePasswordResetToken(application.email)
          const rootUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "https://ed.databayt.org"
          passwordSetupUrl = `${rootUrl}/${schoolLang}/new-password?token=${encodeURIComponent(reset.token)}`
        } catch (err) {
          console.warn(
            "[confirmEnrollment] Failed to mint password-setup link:",
            err
          )
        }
      }

      dispatchAdmissionNotification({
        schoolId,
        userId: effectiveUserId,
        type: "account_created",
        title: t(NOTIF.enrollment.title, schoolLang),
        body: passwordSetupUrl
          ? t(
              NOTIF.enrollment.bodyWithSetup(
                enrollmentNumber,
                passwordSetupUrl
              ),
              schoolLang
            )
          : t(NOTIF.enrollment.body(enrollmentNumber), schoolLang),
        lang: schoolLang,
        priority: "high",
        channels: ["in_app", "email"],
        metadata: {
          applicationId: params.id,
          enrollmentNumber,
          url: passwordSetupUrl ?? "/",
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
          select: {
            guardian: { select: { userId: true, emailAddress: true } },
          },
        })
        for (const link of guardianLinks) {
          const guardianUserId = link.guardian?.userId
          const guardianEmail = link.guardian?.emailAddress
          // Guardians created by confirmEnrollment (via createOrLinkGuardian)
          // never have a userId — they're contact records, not accounts —
          // so this previously never fired for admission-created guardians.
          // Fall back to directEmail when there's no linked account.
          if (!guardianUserId && !guardianEmail) continue
          const studentFullName = `${application.firstName} ${application.lastName}`
          dispatchAdmissionNotification({
            schoolId,
            ...(guardianUserId
              ? { userId: guardianUserId }
              : { directEmail: guardianEmail! }),
            type: "account_created",
            title: t(NOTIF.guardianEnrollment.title, schoolLang),
            body: t(NOTIF.guardianEnrollment.body(studentFullName), schoolLang),
            lang: schoolLang,
            priority: "high",
            channels: guardianUserId ? ["in_app", "email"] : ["email"],
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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

    // BUG-9: notify the applicant about their registration-fee payment being
    // confirmed. Non-blocking — failure must not fail the action.
    try {
      const application = await db.application.findUnique({
        where: { id: params.id, schoolId },
        select: { userId: true, email: true, firstName: true, lastName: true },
      })
      if (application?.userId) {
        const school = await db.school.findFirst({
          where: { id: schoolId },
          select: { preferredLanguage: true },
        })
        const notifLang = school?.preferredLanguage ?? "ar"
        dispatchAdmissionNotification({
          schoolId,
          userId: application.userId,
          type: "fee_paid",
          title: t(NOTIF.feePaid.title, notifLang),
          body: t(NOTIF.feePaid.body, notifLang),
          lang: notifLang,
          priority: "normal",
          channels: ["in_app", "email"],
          metadata: {
            applicationId: params.id,
            paymentId: params.paymentId,
            url: "/admission",
          },
          actorId: session.user?.id,
        }).catch((err) =>
          console.error("[recordPayment] Notification error:", err)
        )
      } else if (application?.email) {
        // Guest applicant (no userId): deliver the confirmation email directly.
        const school = await db.school.findFirst({
          where: { id: schoolId },
          select: { preferredLanguage: true },
        })
        const notifLang = school?.preferredLanguage ?? "ar"
        dispatchAdmissionNotification({
          schoolId,
          directEmail: application.email,
          type: "fee_paid",
          title: t(NOTIF.feePaid.title, notifLang),
          body: t(NOTIF.feePaid.body, notifLang),
          lang: notifLang,
          priority: "normal",
          channels: ["email"],
          metadata: {
            applicationId: params.id,
            paymentId: params.paymentId,
            url: "/admission",
          },
          actorId: session.user?.id,
        }).catch((err) =>
          console.error("[recordPayment] Guest notification error:", err)
        )
      }
    } catch (notifErr) {
      console.warn("[recordPayment] Notification setup failed:", notifErr)
    }

    revalidatePath("/admission/enrollment")
    return { success: true, data: null }
  } catch (error) {
    console.error("[recordPayment]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}

/**
 * Manual payment methods an admin can confirm here. "stripe"/"tap" (card/
 * online) are confirmed automatically by their payment webhook — never
 * manually, since only the webhook has proof the charge actually settled.
 */
const MANUALLY_CONFIRMABLE_REGISTRATION_METHODS = new Set([
  "cash",
  "bank_transfer",
])

/**
 * Admin confirms a cash or bank-transfer registration-fee payment intent.
 *
 * The public offer portal (school-marketing/application/offer/actions.ts)
 * only ever RECORDS the parent's intent to pay in cash/by bank transfer
 * (method + reference + amount) — it has no way to know the money actually
 * changed hands, so it never sets registrationFeePaid. Only the Stripe/Tap
 * webhooks do that automatically for card payments. Cash/bank intents were
 * consequently stuck unpaid forever with no admin path to mark them settled.
 */
export async function confirmRegistrationPayment(params: {
  applicationId: string
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "recordPayment")

    const application = await db.application.findUnique({
      where: { id: params.applicationId, schoolId },
      select: {
        registrationFeeMethod: true,
        registrationFeePaid: true,
        userId: true,
        email: true,
      },
    })

    if (!application) {
      return actionError(ACTION_ERRORS.ADMISSION_NOT_FOUND)
    }

    if (application.registrationFeePaid) {
      return actionError(ACTION_ERRORS.REGISTRATION_FEE_ALREADY_PAID)
    }

    if (!application.registrationFeeMethod) {
      return actionError(ACTION_ERRORS.REGISTRATION_FEE_METHOD_MISSING)
    }

    if (
      !MANUALLY_CONFIRMABLE_REGISTRATION_METHODS.has(
        application.registrationFeeMethod
      )
    ) {
      return actionError(ACTION_ERRORS.REGISTRATION_FEE_METHOD_INVALID)
    }

    await db.application.update({
      where: { id: params.applicationId, schoolId },
      data: {
        registrationFeePaid: true,
        registrationFeeDate: new Date(),
      },
    })

    // Notify the applicant, mirroring recordPayment's userId/directEmail
    // branch. Non-blocking — failure must not fail the action.
    try {
      const school = await db.school.findFirst({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const notifLang = school?.preferredLanguage ?? "ar"
      if (application.userId) {
        dispatchAdmissionNotification({
          schoolId,
          userId: application.userId,
          type: "fee_paid",
          title: t(NOTIF.feePaid.title, notifLang),
          body: t(NOTIF.feePaid.body, notifLang),
          lang: notifLang,
          priority: "normal",
          channels: ["in_app", "email"],
          metadata: {
            applicationId: params.applicationId,
            url: "/admission",
          },
          actorId: session.user?.id,
        }).catch((err) =>
          console.error("[confirmRegistrationPayment] Notification error:", err)
        )
      } else if (application.email) {
        dispatchAdmissionNotification({
          schoolId,
          directEmail: application.email,
          type: "fee_paid",
          title: t(NOTIF.feePaid.title, notifLang),
          body: t(NOTIF.feePaid.body, notifLang),
          lang: notifLang,
          priority: "normal",
          channels: ["email"],
          metadata: {
            applicationId: params.applicationId,
            url: "/admission",
          },
          actorId: session.user?.id,
        }).catch((err) =>
          console.error(
            "[confirmRegistrationPayment] Guest notification error:",
            err
          )
        )
      }
    } catch (notifErr) {
      console.warn(
        "[confirmRegistrationPayment] Notification setup failed:",
        notifErr
      )
    }

    revalidatePath("/admission/enrollment")
    return { success: true, data: null }
  } catch (error) {
    console.error("[confirmRegistrationPayment]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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
      // Row-lock the target section for the life of this transaction. Without
      // this, two concurrent placements can both read "1 seat left" under
      // Postgres's default Read Committed isolation (plain SELECTs never
      // block each other) and both proceed to write, overselling the
      // section. FOR UPDATE forces the second transaction's SELECT to block
      // until the first commits, so it re-reads the now-updated count.
      // No-ops harmlessly if the id doesn't exist — the findFirst below
      // still returns null and the existing NOT_FOUND path handles it.
      await tx.$queryRaw`SELECT id FROM "sections" WHERE id = ${params.sectionId} AND "schoolId" = ${schoolId} FOR UPDATE`

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
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
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

    assertAdmissionPermission(session.user.role ?? "", "viewApplications")

    const options = await getCampaignOptions(schoolId)
    return { success: true, data: options }
  } catch (error) {
    console.error("[fetchCampaignOptions]", error)
    if (isPermissionDenied(error)) {
      return actionError(ACTION_ERRORS.FORBIDDEN)
    }
    return actionError(ACTION_ERRORS.ADMISSION_UPDATE_FAILED)
  }
}
