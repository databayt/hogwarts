"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"

import { academicSchema, type AcademicSchemaType } from "./validation"

export async function saveAcademicStep(
  data: AcademicSchemaType
): Promise<ActionResponse<AcademicSchemaType>> {
  try {
    const validatedData = academicSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
