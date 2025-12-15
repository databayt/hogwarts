"use server"

import { guardianSchema, type GuardianSchemaType } from "./validation"

export interface SaveGuardianResult {
  success: boolean
  data?: GuardianSchemaType
  error?: string
}

export async function saveGuardianStep(
  data: GuardianSchemaType
): Promise<SaveGuardianResult> {
  try {
    // Validate data
    const validatedData = guardianSchema.parse(data)

    return {
      success: true,
      data: validatedData,
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: "Validation failed",
    }
  }
}
