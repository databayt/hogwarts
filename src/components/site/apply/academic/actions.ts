"use server"

import { academicSchema, type AcademicSchemaType } from "./validation"

export interface SaveAcademicResult {
  success: boolean
  data?: AcademicSchemaType
  error?: string
}

export async function saveAcademicStep(
  data: AcademicSchemaType
): Promise<SaveAcademicResult> {
  try {
    // Validate data
    const validatedData = academicSchema.parse(data)

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
