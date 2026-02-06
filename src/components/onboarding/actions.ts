"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { getAuthContext, requireSchoolOwnership } from "./auth-helpers"

export async function getListing(id: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(id)
    const school = await db.school.findUnique({ where: { id } })
    if (!school) {
      return createActionResponse(undefined, new Error("School not found"))
    }
    return createActionResponse(school)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getCurrentUserSchool(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext()

    if (authContext.schoolId) {
      return createActionResponse({ schoolId: authContext.schoolId })
    }

    const user = await db.user.findUnique({
      where: { id: authContext.userId },
      select: { id: true, schoolId: true },
    })

    if (user?.schoolId) {
      return createActionResponse({ schoolId: user.schoolId })
    }

    return createActionResponse(null, {
      message: "No school found for user",
      code: "NO_SCHOOL",
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getUserSchools(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext()

    const where = authContext.schoolId
      ? { id: authContext.schoolId }
      : { users: { some: { id: authContext.userId } } }

    const [schools, totalCount] = await Promise.all([
      db.school.findMany({
        where,
        select: {
          id: true,
          name: true,
          domain: true,
          createdAt: true,
          updatedAt: true,
          maxStudents: true,
          maxTeachers: true,
          planType: true,
          schoolType: true,
          address: true,
          isPublished: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 2,
      }),
      db.school.count({ where }),
    ])

    return createActionResponse({ schools, totalCount })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

/**
 * Initialize school setup for onboarding.
 * Atomic school-user linking with session refresh.
 */
export async function initializeSchoolSetup(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext()

    const { ensureUserSchool } = await import("@/lib/school-access")
    const schoolResult = await ensureUserSchool(authContext.userId)

    if (!schoolResult.success) {
      return createActionResponse(undefined, {
        message: schoolResult.error || "Failed to initialize school",
        code: "SCHOOL_CREATION_FAILED",
      })
    }

    revalidatePath("/onboarding")

    return createActionResponse({
      ...schoolResult.school,
      _redirect: `/onboarding/${schoolResult.schoolId}/about-school`,
      _sessionRefreshRequired: true,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function reserveSubdomainForSchool(
  schoolId: string,
  subdomain: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const { reserveSubdomain } = await import("@/lib/subdomain-actions")
    const result = await reserveSubdomain(subdomain, schoolId)

    if (result.success) {
      revalidatePath("/onboarding")
    }

    return createActionResponse(result)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getSchoolSetupStatus(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        address: true,
        schoolType: true,
        schoolLevel: true,
        city: true,
        state: true,
        country: true,
        maxStudents: true,
        maxTeachers: true,
        maxClasses: true,
        tuitionFee: true,
        domain: true,
        isPublished: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    const checks = [
      !!school.name && school.name !== "New School",
      !!school.schoolType,
      !!school.address,
      !!school.maxStudents,
      !!school.tuitionFee,
      !!school.domain,
    ]

    const completionPercentage = Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    )

    return createActionResponse({
      ...school,
      tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
      completionPercentage,
      nextStep: getNextStep(school),
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

function getNextStep(school: {
  name: string
  schoolType: string | null
  address: string | null
  maxStudents: number
  tuitionFee: unknown
  domain: string
}) {
  if (!school.name || school.name === "New School") return "title"
  if (!school.schoolType) return "description"
  if (!school.address) return "location"
  if (!school.maxStudents) return "capacity"
  if (!school.tuitionFee) return "price"
  return "finish-setup"
}

export async function proceedToTitle(schoolId: string) {
  try {
    await requireSchoolOwnership(schoolId)
    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    throw error
  }

  redirect(`/onboarding/${schoolId}/about-school`)
}
