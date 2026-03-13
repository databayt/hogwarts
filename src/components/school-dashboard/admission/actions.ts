"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AdmissionApplicationStatus } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { syncStudentClassToEnrollment } from "@/lib/enrollment-sync"
import { extractGradeNumber } from "@/lib/grade-utils"

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

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
}): Promise<ActionResponse> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    assertAdmissionPermission(session.user.role, "updateStatus")

    const data: Record<string, unknown> = {
      status: params.status as AdmissionApplicationStatus,
      reviewedAt: new Date(),
      reviewedBy: session.user?.id,
    }

    // Auto-offer admission when selecting a student
    if (params.status === "SELECTED") {
      data.admissionOffered = true
      data.offerDate = new Date()
      data.offerExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }

    await db.application.update({
      where: { id: params.id, schoolId },
      data,
    })

    // Notify applicant about status change (non-blocking)
    const application = await db.application.findFirst({
      where: { id: params.id, schoolId },
      select: { userId: true, firstName: true, lastName: true },
    })
    if (application?.userId) {
      const statusMessages: Record<string, string> = {
        SHORTLISTED: "تم إدراجك في القائمة المختصرة",
        SELECTED: "تهانينا! تم قبولك",
        REJECTED: "نأسف، لم يتم قبول طلبك",
        WAITLISTED: "تم وضعك في قائمة الانتظار",
      }
      const statusMessage =
        statusMessages[params.status] || `حالة الطلب: ${params.status}`
      dispatchNotification({
        schoolId,
        userId: application.userId,
        type: "system_alert",
        title: "تحديث حالة الطلب",
        body: statusMessage,
        priority: params.status === "SELECTED" ? "high" : "normal",
        channels: ["in_app", "email"],
        metadata: {
          applicationId: params.id,
          status: params.status,
          url: "/admission",
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
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
          where: { id: app.id },
          data: { meritRank: i + 1 },
        })
      )
    )

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
}): Promise<ActionResponse<{ rows: unknown[]; total: number }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
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
}): Promise<ActionResponse> {
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
      include: { campaign: { select: { academicYear: true } } },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const enrollmentNumber = `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    await db.$transaction(async (tx) => {
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

      // 3. Resolve userId — create a User for guest applications
      let userId = application.userId
      if (!userId) {
        const guestUser = await tx.user.create({
          data: {
            email: application.email,
            username: `${application.firstName} ${application.lastName}`,
            role: "STUDENT",
            schoolId,
            emailVerified: new Date(),
          },
        })
        userId = guestUser.id

        // Link the application to the new user
        await tx.application.update({
          where: { id: params.id },
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

        const student = existingStudent
          ? existingStudent
          : await tx.student.create({
              data: {
                schoolId,
                userId,
                givenName: application.firstName,
                middleName: application.middleName,
                surname: application.lastName,
                dateOfBirth: application.dateOfBirth,
                gender: application.gender,
                nationality: application.nationality ?? undefined,
                email: application.email,
                mobileNumber: application.phone,
                currentAddress: application.address,
                city: application.city,
                state: application.state,
                postalCode: application.postalCode,
                country: application.country,
                admissionNumber: enrollmentNumber,
                admissionDate: new Date(),
                enrollmentDate: new Date(),
                status: "ACTIVE",
                category: application.category ?? undefined,
                previousSchoolName: application.previousSchool ?? undefined,
                previousGrade: application.previousClass ?? undefined,
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
                // Mark incomplete — contact/location not collected by application
                wizardStep: "contact",
              },
            })

        // 4. Try to match applyingForClass to a YearLevel and create StudentYearLevel
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
              yearLevel = await tx.yearLevel.findFirst({
                where: { schoolId, levelOrder: gradeNum },
              })
            }
          }

          if (yearLevel) {
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
            select: { role: true },
          })

          if (user && user.role === "USER") {
            await tx.user.update({
              where: { id: userId },
              data: { role: "STUDENT" },
            })
          }
        } catch (roleError) {
          console.warn(
            "[confirmEnrollment] Failed to update user role:",
            roleError
          )
        }

        // 6. Auto-assign fees if matching FeeStructure exists
        try {
          const feeStructures = await tx.feeStructure.findMany({
            where: {
              schoolId,
              academicYear: application.campaign.academicYear,
              isActive: true,
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
        }
      }
    })

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
    if (application.userId) {
      dispatchNotification({
        schoolId,
        userId: application.userId,
        type: "account_created",
        title: "تم تأكيد القبول",
        body: `تهانينا! تم تأكيد تسجيلك بالمدرسة. رقم التسجيل: ${enrollmentNumber}`,
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

    revalidatePath("/admission/enrollment")
    return {
      success: true,
      data: { suggestedSectionId, suggestedSectionName },
    }
  } catch (error) {
    console.error("[confirmEnrollment]", error)
    return { success: false, error: "Failed to confirm enrollment" }
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
    return { success: false, error: "Failed to record payment" }
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
    if (!schoolId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

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
    return { success: false, error: "Failed to fetch sections" }
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
    if (!schoolId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

    // Get the application and verify it's ADMITTED
    const application = await db.application.findUnique({
      where: { id: params.applicationId, schoolId },
      select: { status: true, userId: true, firstName: true, lastName: true },
    })

    if (!application) return { success: false, error: "Application not found" }
    if (application.status !== "ADMITTED") {
      return {
        success: false,
        error: "Only admitted students can be placed in sections",
      }
    }

    // Find the student record via userId
    if (!application.userId) {
      return {
        success: false,
        error: "No user account linked to this application",
      }
    }

    const student = await db.student.findFirst({
      where: { userId: application.userId, schoolId },
      select: { id: true, sectionId: true },
    })

    if (!student) {
      return {
        success: false,
        error:
          "Student record not found. Ensure enrollment is confirmed first.",
      }
    }

    // Check section capacity
    const sectionData = await db.section.findFirst({
      where: { id: params.sectionId, schoolId },
      select: {
        id: true,
        name: true,
        gradeId: true,
        maxCapacity: true,
        _count: { select: { students: true } },
      },
    })

    if (!sectionData) return { success: false, error: "Section not found" }

    if (sectionData._count.students >= sectionData.maxCapacity) {
      return {
        success: false,
        error: `Section "${sectionData.name}" is at full capacity (${sectionData._count.students}/${sectionData.maxCapacity})`,
      }
    }

    // Check if already in this section
    if (student.sectionId === params.sectionId) {
      return {
        success: false,
        error: `${application.firstName} ${application.lastName} is already in "${sectionData.name}"`,
      }
    }

    // Assign student to section and create StudentClass entries
    let noClassesForGrade = false
    const createdClassIds: string[] = []

    await db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: { sectionId: params.sectionId },
      })

      // Find all classes for this section's grade and enroll the student
      if (sectionData.gradeId) {
        const gradeClasses = await tx.class.findMany({
          where: { schoolId, gradeId: sectionData.gradeId },
          select: { id: true },
        })

        if (gradeClasses.length > 0) {
          await Promise.all(
            gradeClasses.map((cls) =>
              tx.studentClass.upsert({
                where: {
                  schoolId_studentId_classId: {
                    schoolId,
                    studentId: student.id,
                    classId: cls.id,
                  },
                },
                create: {
                  schoolId,
                  studentId: student.id,
                  classId: cls.id,
                },
                update: {},
              })
            )
          )
          createdClassIds.push(...gradeClasses.map((cls) => cls.id))
        } else {
          noClassesForGrade = true
        }
      }
    })

    // Sync LMS enrollments (non-blocking, outside transaction)
    if (createdClassIds.length > 0) {
      for (const classId of createdClassIds) {
        try {
          await syncStudentClassToEnrollment(schoolId, student.id, classId)
        } catch {
          // Non-blocking: logged inside syncStudentClassToEnrollment
        }
      }
    }

    // Notify student about section placement (non-blocking)
    if (application.userId) {
      dispatchNotification({
        schoolId,
        userId: application.userId,
        type: "system_alert",
        title: "تعيين القسم",
        body: `تم تعيينك في قسم "${sectionData.name}"`,
        priority: "normal",
        channels: ["in_app"],
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
        warning:
          "No classes found for this grade. Student was placed in section but has no class enrollments. Create classes first in Classrooms > Configure.",
      }
    }

    return { success: true, data: null }
  } catch (error) {
    console.error("[placeStudentInSection]", error)
    return { success: false, error: "Failed to place student" }
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
    return { success: false, error: "Failed to fetch campaign options" }
  }
}
