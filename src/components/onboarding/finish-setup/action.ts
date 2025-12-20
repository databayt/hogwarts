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

// Finish Setup step - just marks completion
export async function markFinishSetupViewed(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnershipLazy(schoolId)

    // This is just a declaration step for completion
    revalidatePath(`/onboarding/${schoolId}`)
    return createActionResponse({ viewed: true })
  } catch (error) {
    console.error("Failed to mark finish setup viewed:", error)
    return createActionResponse(undefined, error)
  }
}
