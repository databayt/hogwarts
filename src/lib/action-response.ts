"use server"

/**
 * Shared ActionResponse type for all server actions.
 *
 * Provides a consistent response format across onboarding, admission, and
 * all other server action modules. Eliminates 12+ duplicated definitions.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  errors?: Record<string, string>
}

export async function createActionResponse<T>(
  data?: T,
  error?: unknown
): Promise<ActionResponse<T>> {
  if (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred"
    return { success: false, error: errorMessage, code: "ERROR" }
  }
  return { success: true, data }
}

export async function createValidationErrorResponse(
  errors: Record<string, string>
): Promise<ActionResponse> {
  return {
    success: false,
    error: "Validation failed",
    code: "VALIDATION_ERROR",
    errors,
  }
}
