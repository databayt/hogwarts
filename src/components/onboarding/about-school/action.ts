"use server"

import { revalidatePath } from "next/cache"

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

// About School step - informational only, no data to update
export async function markAboutSchoolViewed(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnershipLazy(schoolId)

    // This is just an informational step, so we just validate access
    // and mark it as viewed for analytics if needed

    revalidatePath(`/onboarding/${schoolId}`)
    return createActionResponse({ viewed: true })
  } catch (error) {
    console.error("Failed to mark about school viewed:", error)
    return createActionResponse(undefined, error)
  }
}

export async function getOnboardingWelcomeData(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnershipLazy(schoolId)

    // Return welcome data and stats if needed
    const welcomeData = {
      totalSteps: 10,
      estimatedTime: "10-15 minutes",
      completionRate: 85, // percentage of users who complete
    }

    return createActionResponse(welcomeData)
  } catch (error) {
    console.error("Failed to get welcome data:", error)
    return createActionResponse(undefined, error)
  }
}
