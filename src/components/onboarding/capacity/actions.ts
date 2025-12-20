"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

import { capacitySchema, type CapacityFormData } from "./validation"

// TEMPORARILY: Local ActionResponse to bypass auth-security import chain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  errors?: Record<string, string>
}

function createActionResponse<T>(data?: T, error?: unknown): ActionResponse<T> {
  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred"
    return { success: false, error: errorMessage, code: "ERROR" }
  }
  return { success: true, data }
}

// Lazy auth import - only load when needed
async function requireSchoolOwnershipLazy(schoolId: string) {
  const { requireSchoolOwnership } = await import("@/lib/auth-security")
  return requireSchoolOwnership(schoolId)
}

export async function updateSchoolCapacity(
  schoolId: string,
  data: CapacityFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    const validatedData = capacitySchema.parse(data)

    // Update school capacity in database
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        maxStudents: validatedData.studentCount,
        maxTeachers: validatedData.teachers,
        // Note: facilityCount is not in schema, storing in description for now
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/onboarding/${schoolId}/capacity`)

    return createActionResponse(updatedSchool)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
        issues: error.issues,
      })
    }

    return createActionResponse(undefined, error)
  }
}

export async function getSchoolCapacity(
  schoolId: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        maxStudents: true,
        maxTeachers: true,
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    return createActionResponse({
      studentCount: school.maxStudents || 400,
      teachers: school.maxTeachers || 10,
      classrooms: 10, // Default since not in schema
      facilities: 5, // Default since not in schema
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function proceedToNextStep(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    // Validate that capacity data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { maxStudents: true },
    })

    if (!school?.maxStudents) {
      throw new Error("Please set school capacity before proceeding")
    }

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to next step:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/location`)
}
