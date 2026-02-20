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

    // 1. Fetch the application with fields needed for Student creation
    const application = await db.application.findUnique({
      where: { id: params.id, schoolId },
      include: { campaign: { select: { academicYear: true } } },
    })

    if (!application) {
      return { success: false, error: "Application not found" }
    }

    const enrollmentNumber = `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // 2. Update application status to ADMITTED
    await db.application.update({
      where: { id: params.id, schoolId },
      data: {
        status: "ADMITTED",
        admissionConfirmed: true,
        confirmationDate: new Date(),
        enrollmentNumber,
      },
    })

    // 3. Create or find Student record if the application is linked to a user
    if (application.userId) {
      // Check if student already exists and belongs to a different school
      const existingStudent = await db.student.findUnique({
        where: { userId: application.userId },
        select: { id: true, schoolId: true },
      })

      if (existingStudent && existingStudent.schoolId !== schoolId) {
        return {
          success: false,
          error: "Student is already enrolled in another school",
        }
      }

      const student = existingStudent
        ? existingStudent
        : await db.student.create({
            data: {
              schoolId,
              userId: application.userId,
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
            },
          })

      // 4. Try to match applyingForClass to a YearLevel and create StudentYearLevel
      try {
        const yearLevel = await db.yearLevel.findFirst({
          where: {
            schoolId,
            levelName: application.applyingForClass,
          },
        })

        if (yearLevel) {
          // Find the school year matching the campaign's academic year
          const schoolYear = await db.schoolYear.findFirst({
            where: {
              schoolId,
              yearName: application.campaign.academicYear,
            },
          })

          if (schoolYear) {
            // Upsert to be idempotent (unique on [schoolId, studentId, yearId])
            await db.studentYearLevel.upsert({
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
            `[confirmEnrollment] No YearLevel found matching applyingForClass="${application.applyingForClass}" in school=${schoolId}`
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
        const user = await db.user.findUnique({
          where: { id: application.userId },
          select: { role: true },
        })

        if (user && user.role === "USER") {
          await db.user.update({
            where: { id: application.userId },
            data: { role: "STUDENT" },
          })
        }
      } catch (roleError) {
        console.warn(
          "[confirmEnrollment] Failed to update user role:",
          roleError
        )
      }
    }

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
// Placement Actions
// ============================================================================

export async function getAvailableClassesForPlacement(params: {
  applyingForClass: string
}): Promise<
  ActionResult<
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
    if (!schoolId) return { success: false, error: "Unauthorized" }

    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        maxCapacity: true,
        _count: { select: { studentClasses: true } },
      },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: classes.map((c) => ({
        id: c.id,
        name: c.name,
        enrolledStudents: c._count.studentClasses,
        maxCapacity: c.maxCapacity ?? 50,
      })),
    }
  } catch (error) {
    console.error("[getAvailableClassesForPlacement]", error)
    return { success: false, error: "Failed to fetch classes" }
  }
}

export async function placeStudentInClass(params: {
  applicationId: string
  classId: string
}): Promise<ActionResult> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    if (!schoolId) return { success: false, error: "Unauthorized" }

    // Get the application and verify it's ADMITTED
    const application = await db.application.findUnique({
      where: { id: params.applicationId, schoolId },
      select: { status: true, userId: true, firstName: true, lastName: true },
    })

    if (!application) return { success: false, error: "Application not found" }
    if (application.status !== "ADMITTED") {
      return {
        success: false,
        error: "Only admitted students can be placed in classes",
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
      select: { id: true },
    })

    if (!student) {
      return {
        success: false,
        error:
          "Student record not found. Ensure enrollment is confirmed first.",
      }
    }

    // Check class capacity
    const classData = await db.class.findFirst({
      where: { id: params.classId, schoolId },
      select: {
        id: true,
        name: true,
        maxCapacity: true,
        _count: { select: { studentClasses: true } },
      },
    })

    if (!classData) return { success: false, error: "Class not found" }

    const maxCapacity = classData.maxCapacity ?? 50
    if (classData._count.studentClasses >= maxCapacity) {
      return {
        success: false,
        error: `Class "${classData.name}" is at full capacity (${classData._count.studentClasses}/${maxCapacity})`,
      }
    }

    // Check for duplicate enrollment
    const existing = await db.studentClass.findFirst({
      where: { studentId: student.id, classId: params.classId, schoolId },
    })

    if (existing) {
      return {
        success: false,
        error: `${application.firstName} ${application.lastName} is already enrolled in "${classData.name}"`,
      }
    }

    // Create enrollment
    await db.studentClass.create({
      data: {
        schoolId,
        studentId: student.id,
        classId: params.classId,
      },
    })

    revalidatePath("/admission/enrollment")
    revalidatePath("/classes")
    return { success: true, data: null }
  } catch (error) {
    console.error("[placeStudentInClass]", error)
    return { success: false, error: "Failed to place student" }
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
