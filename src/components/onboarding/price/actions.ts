"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { db } from "@/lib/db"

// TEMPORARILY: Local ActionResponse to bypass auth-security import chain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
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

// Update price schema for school context
export const schoolPriceSchema = z.object({
  tuitionFee: z
    .number()
    .min(0, "Tuition fee cannot be negative")
    .max(50000, "Tuition fee cannot exceed $50,000"),
  registrationFee: z
    .number()
    .min(0, "Registration fee cannot be negative")
    .max(5000, "Registration fee cannot exceed $5,000")
    .optional(),
  applicationFee: z
    .number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee cannot exceed $1,000")
    .optional(),
  currency: z
    .enum(["USD", "EUR", "GBP", "CAD", "AUD"])
    .describe("Please select a currency")
    .default("USD"),
  paymentSchedule: z
    .enum(["monthly", "quarterly", "semester", "annual"])
    .describe("Please select a payment schedule")
    .default("monthly"),
})

export type SchoolPriceFormData = z.infer<typeof schoolPriceSchema>

export async function updateSchoolPricing(
  schoolId: string,
  data: SchoolPriceFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    const validatedData = schoolPriceSchema.parse(data)

    // Update school pricing in database
    // Note: tuitionFee, registrationFee, etc. are not in current schema
    // For now, we'll just mark the school as having pricing set
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        // Store basic pricing info in available fields
        website: `pricing-set-${validatedData.tuitionFee}`, // Temporary solution
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/onboarding/${schoolId}/price`)

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

export async function getSchoolPricing(
  schoolId: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        website: true, // Temporary field for pricing info
      },
    })

    if (!school) {
      throw new Error("School not found")
    }

    // Parse pricing info from website field (temporary solution)
    const tuitionFee = school.website?.startsWith("pricing-set-")
      ? parseInt(school.website.replace("pricing-set-", "")) || 0
      : 0

    return createActionResponse({
      tuitionFee,
      registrationFee: 0, // Default values since not stored
      applicationFee: 0,
      currency: "USD" as const,
      paymentSchedule: "monthly" as const,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function proceedToFinishSetup(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnershipLazy(schoolId)

    // Validate that pricing data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { website: true },
    })

    if (!school?.website?.startsWith("pricing-set-")) {
      throw new Error("Please set tuition fee before proceeding")
    }

    revalidatePath(`/onboarding/${schoolId}`)
  } catch (error) {
    console.error("Error proceeding to finish setup:", error)
    throw error
  }

  redirect(`/onboarding/${schoolId}/finish-setup`)
}
